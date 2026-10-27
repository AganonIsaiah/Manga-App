from sqlalchemy import select

from app.core.security import ACCESS_COOKIE, REFRESH_COOKIE
from app.features.auth.models import Profile


def register_login(client, credentials, remember=False):
    assert client.post("/api/auth/signup", json=credentials).status_code == 201
    response = client.post(
        "/api/auth/login",
        json={
            "identifier": credentials["email"],
            "password": credentials["password"],
            "remember": remember,
        },
    )
    assert response.status_code == 200
    return response


def test_supabase_login_cookies_session_logout(client, credentials):
    response = register_login(client, credentials)
    assert set(response.json()) == {"user", "expiresAt"}
    assert response.json()["user"]["username"] == credentials["username"]
    cookies = response.headers.get_list("set-cookie")
    assert len(cookies) == 3
    assert all("HttpOnly" in cookie and "SameSite=lax" in cookie for cookie in cookies)
    assert all("Max-Age" not in cookie for cookie in cookies)
    refresh = client.cookies[REFRESH_COOKIE]
    assert client.get("/api/auth/session").status_code == 200
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/session").status_code == 401
    client.cookies.set(REFRESH_COOKIE, refresh, path="/api/auth")
    assert client.post("/api/auth/refresh").status_code == 401


def test_refresh_and_remember(client, credentials):
    response = register_login(client, credentials, True)
    assert all("Max-Age=" in cookie for cookie in response.headers.get_list("set-cookie"))
    refresh = client.cookies[REFRESH_COOKIE]
    client.cookies.delete(ACCESS_COOKIE)
    assert client.post("/api/auth/refresh").status_code == 200
    assert client.cookies[REFRESH_COOKIE] != refresh
    assert client.get("/api/auth/session").status_code == 200


def test_validation_normalization_and_duplicate_accounts(client, credentials):
    register_login(client, credentials)
    for changes in [{"email": "other@example.com"}, {"username": "other_user"}]:
        assert client.post("/api/auth/signup", json={**credentials, **changes}).status_code == 409
    for identifier in [credentials["email"], "missing_user"]:
        result = client.post(
            "/api/auth/login", json={"identifier": identifier, "password": "wrong"}
        )
        assert result.status_code == 401
        assert "doesn’t match" in result.json()["detail"]
    assert (
        client.post(
            "/api/auth/login",
            json={"identifier": " TEST_READER ", "password": credentials["password"]},
        ).status_code
        == 200
    )
    for changes in [
        {"password": "secret"},
        {"username": "bad name"},
        {"name": " "},
        {"email": "bad"},
    ]:
        result = client.post("/api/auth/signup", json={**credentials, **changes})
        assert result.status_code == 422
        assert "input" not in result.text
        assert '"secret"' not in result.text


def test_email_confirmation_is_explicit_and_single_use(client, credentials, provider):
    provider.require_confirmation = True
    response = client.post("/api/auth/signup", json=credentials)
    assert "confirm your account" in response.json()["message"]
    assert not client.cookies
    assert (
        client.post(
            "/api/auth/login",
            json={"identifier": credentials["email"], "password": credentials["password"]},
        ).status_code
        == 401
    )
    token = next(iter(provider.links))
    assert client.post("/api/auth/confirm-email", json={"token": token}).status_code == 200
    assert client.get("/api/auth/session").status_code == 200
    assert client.post("/api/auth/confirm-email", json={"token": token}).status_code == 401


def test_password_recovery_uses_supabase_and_revokes_refresh_sessions(
    client, credentials, provider
):
    register_login(client, credentials)
    old_refresh = client.cookies[REFRESH_COOKIE]
    first = client.post("/api/auth/password-reset", json={"email": credentials["email"]})
    unknown = client.post("/api/auth/password-reset", json={"email": "unknown@example.com"})
    assert first.json() == unknown.json()
    token = next(iter(provider.links))
    assert (
        client.post(
            "/api/auth/reset-password", json={"token": token, "password": "a-different-password"}
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/auth/reset-password", json={"token": token, "password": "a-different-password"}
        ).status_code
        == 401
    )
    client.cookies.set(REFRESH_COOKIE, old_refresh, path="/api/auth")
    assert client.post("/api/auth/refresh").status_code == 401
    assert (
        client.post(
            "/api/auth/login",
            json={"identifier": credentials["email"], "password": credentials["password"]},
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/login",
            json={"identifier": credentials["email"], "password": "a-different-password"},
        ).status_code
        == 200
    )


def test_csrf_cors_and_rate_limits(client, credentials, settings):
    for headers in [{"Origin": "https://evil.example"}, {"Origin": ""}, {"X-Manga-Client": ""}]:
        assert client.post("/api/auth/signup", json=credentials, headers=headers).status_code == 403
    result = client.options(
        "/api/auth/login",
        headers={
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "X-Manga-Client,Content-Type",
        },
    )
    assert result.headers["access-control-allow-origin"] == "http://testserver"
    assert result.headers["access-control-allow-credentials"] == "true"
    assert client.get("/api/auth/session").headers["cache-control"] == "no-store"
    settings.rate_limit_multiplier = 1
    for _ in range(20):
        assert (
            client.post(
                "/api/auth/login", json={"identifier": "unknown", "password": "wrong"}
            ).status_code
            == 401
        )
    result = client.post("/api/auth/login", json={"identifier": "other", "password": "wrong"})
    assert result.status_code == 429
    assert int(result.headers["retry-after"]) > 0


def test_authoritative_provider_validation_and_missing_profiles(client, credentials, provider, db):
    register_login(client, credentials)
    client.cookies.set(ACCESS_COOKIE, "forged-token", domain="testserver.local", path="/api")
    assert client.get("/api/auth/session").status_code == 401
    register = client.post(
        "/api/auth/login",
        json={"identifier": credentials["email"], "password": credentials["password"]},
    )
    assert register.status_code == 200
    provider.unavailable = True
    assert client.get("/api/auth/session").status_code == 503
    provider.unavailable = False
    profile = db.scalar(select(Profile))
    db.delete(profile)
    db.commit()
    assert client.get("/api/auth/session").status_code == 503

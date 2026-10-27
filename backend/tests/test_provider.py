import json

import httpx
import pytest
from fastapi import HTTPException

from app.features.auth.provider import SupabaseAuth
from app.features.auth.schemas import SignupRequest


def test_stateless_rest_contract_and_no_global_bearer_state(settings, credentials):
    requests = []

    def respond(request):
        requests.append(request)
        if request.url.path.endswith("/logout"):
            return httpx.Response(204)
        return httpx.Response(200, json={"id": "test-user"})

    provider = SupabaseAuth(settings, transport=httpx.MockTransport(respond))
    provider.signup(SignupRequest(**credentials))
    provider.login(credentials["email"], credentials["password"])
    provider.refresh("a-refresh-secret")
    provider.user("one-user-jwt")
    provider.user("another-user-jwt")
    provider.logout("one-user-jwt", "local")
    provider.recover(credentials["email"])
    provider.verify("token-hash", "recovery")
    provider.update_password("recovery-jwt", "new-long-password")
    assert all(request.headers["apikey"] == "test-publishable-key" for request in requests)
    assert "authorization" not in requests[0].headers
    assert json.loads(requests[0].content)["data"] == {
        "username": credentials["username"],
        "display_name": credentials["name"],
    }
    assert requests[1].url.params["grant_type"] == "password"
    assert requests[2].url.params["grant_type"] == "refresh_token"
    assert requests[3].headers["authorization"] == "Bearer one-user-jwt"
    assert requests[4].headers["authorization"] == "Bearer another-user-jwt"
    assert requests[5].url.params["scope"] == "local"
    assert json.loads(requests[7].content) == {"token_hash": "token-hash", "type": "recovery"}
    assert requests[8].method == "PUT"
    provider.close()


@pytest.mark.parametrize(
    "status,code,expected",
    [
        (400, "invalid_credentials", 401),
        (400, "email_not_confirmed", 401),
        (422, "weak_password", 400),
        (422, "user_already_exists", 409),
        (429, "over_request_rate_limit", 429),
        (500, "unexpected_failure", 503),
        (403, "bad_key", 503),
        (403, "user_banned", 401),
        (403, "session_not_found", 401),
        (400, "signup_disabled", 503),
    ],
)
def test_provider_errors_do_not_leak_supabase_details(settings, status, code, expected):
    provider = SupabaseAuth(
        settings,
        transport=httpx.MockTransport(
            lambda request: httpx.Response(
                status, json={"error_code": code, "msg": "private internal details"}
            )
        ),
    )
    with pytest.raises(HTTPException) as error:
        provider.login("test@example.com", "test-password")
    assert error.value.status_code == expected
    assert "private" not in error.value.detail
    provider.close()


def test_network_errors_fail_closed(settings):
    def offline(request):
        raise httpx.ConnectError("network details", request=request)

    provider = SupabaseAuth(settings, transport=httpx.MockTransport(offline))
    with pytest.raises(HTTPException) as error:
        provider.user("jwt")
    assert error.value.status_code == 503
    provider.close()

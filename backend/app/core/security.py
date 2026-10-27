import hashlib
from datetime import UTC, datetime

import jwt
from fastapi import HTTPException

ACCESS_COOKIE = "manga_access"
REFRESH_COOKIE = "manga_refresh"
REMEMBER_COOKIE = "manga_remember"


def now():
    return datetime.now(UTC)


def digest(value: str):
    return hashlib.sha256(value.encode()).hexdigest()


def verified_expiry(token):
    # Called ONLY after Supabase GET /user has validated this exact token.
    # Decoding here reads display/timer metadata, never establishes authorization.
    try:
        return int(jwt.decode(token, options={"verify_signature": False})["exp"]) * 1000
    except (jwt.InvalidTokenError, ValueError, KeyError, TypeError):
        raise HTTPException(401, "Your session has expired. Please sign in again.") from None


def set_cookies(response, tokens, remember, settings):
    max_age = settings.remember_days * 86400 if remember else None
    options = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
    }
    response.set_cookie(
        ACCESS_COOKIE,
        tokens["access_token"],
        path="/api",
        max_age=(max(1, int(tokens.get("expires_in", 3600))) if remember else None),
        **options,
    )
    response.set_cookie(
        REFRESH_COOKIE, tokens["refresh_token"], path="/api/auth", max_age=max_age, **options
    )
    response.set_cookie(
        REMEMBER_COOKIE, "1" if remember else "0", path="/api/auth", max_age=max_age, **options
    )


def clear_cookies(response, settings):
    for name, path in [
        (ACCESS_COOKIE, "/api"),
        (REFRESH_COOKIE, "/api/auth"),
        (REMEMBER_COOKIE, "/api/auth"),
    ]:
        response.delete_cookie(
            name,
            path=path,
            secure=settings.cookie_secure,
            httponly=True,
            samesite=settings.cookie_samesite,
        )

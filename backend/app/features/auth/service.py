import time
from datetime import timedelta
from uuid import UUID

from fastapi import HTTPException, Request
from sqlalchemy import delete, select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.core.security import digest, now, verified_expiry
from app.features.auth.models import Profile, RateLimit

RESET_MESSAGE = "If an account exists for that email, a password-reset link has been sent."


def throttle(db: Session, request: Request, action: str, limit: int, seconds: int, identifier=""):
    host = request.client.host if request.client else "unknown"
    keys = [digest(f"{action}:ip:{host}")]
    if identifier:
        keys.append(digest(f"{action}:identifier:{identifier.strip().lower()}"))
    bucket = int(time.time()) // seconds
    exceeded = False
    for key in keys:
        stmt = insert(RateLimit).values(key=key, bucket=bucket, hits=1, created_at=now())
        count = db.scalar(
            stmt.on_conflict_do_update(
                index_elements=[RateLimit.key, RateLimit.bucket],
                set_={"hits": RateLimit.hits + 1},
            ).returning(RateLimit.hits)
        )
        exceeded |= count > limit * request.app.state.settings.rate_limit_multiplier
    db.execute(delete(RateLimit).where(RateLimit.created_at < now() - timedelta(days=2)))
    db.commit()
    if exceeded:
        raise HTTPException(
            429,
            "Too many attempts. Please try again later.",
            headers={"Retry-After": str(seconds - int(time.time()) % seconds)},
        )


def session_info(db, provider, token):
    if not token:
        raise HTTPException(401, "Sign in to continue.")
    user = provider.user(
        token
    )  # Authoritative validation by Supabase, not unverified local JWT claims.
    try:
        user_id = UUID(user["id"])
    except (ValueError, KeyError, TypeError):
        raise HTTPException(401, "Sign in to continue.") from None
    profile = db.get(Profile, user_id)
    if not profile:
        raise HTTPException(503, "Your profile is unavailable. Please try again later.")
    return {
        "user": {
            "id": str(profile.id), "name": profile.display_name, "username": profile.username,
            "created_at": profile.created_at,
            "country_code": profile.country_code, "city": profile.city,
            "avatar_url": (f"{provider.settings.supabase_url}/storage/v1/object/public/avatars/"
                           f"{profile.avatar_path}" if profile.avatar_path else None),
        },
        "expiresAt": verified_expiry(token),
    }


def register(db, provider, body):
    if db.scalar(select(Profile.id).where(Profile.username == body.username.lower())):
        raise HTTPException(409, "That email or username is already in use.")
    result = provider.signup(body)
    if result.get("access_token"):
        return {"message": "Account created. You can now sign in."}
    return {"message": "Check your email to confirm your account before signing in."}


def resolve_email(db, identifier):
    value = identifier.strip().lower()
    if "@" in value:
        return value
    # Backend-only canonical lookup. Supabase Auth remains the source of truth for emails.
    email = db.scalar(
        text(
            "select u.email from public.profiles p join auth.users u on u.id = p.id "
            "where p.username = :username"
        ),
        {"username": value},
    )
    return email


def login(db, provider, body, email_resolver=resolve_email):
    email = email_resolver(db, body.identifier)
    if "@" in body.identifier:
        email = body.identifier.strip().lower()
    if not email:
        # Still call the password endpoint to avoid a fast username-existence timing oracle.
        email = "invalid-user@invalid.invalid"
    try:
        return provider.login(email, body.password)
    except HTTPException as error:
        if error.status_code == 401 and "Confirm your email" not in error.detail:
            raise HTTPException(
                401, "That email, username, or password doesn’t match. Please try again."
            ) from None
        raise

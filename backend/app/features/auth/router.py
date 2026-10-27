from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.core.security import (
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    REMEMBER_COOKIE,
    clear_cookies,
    set_cookies,
)
from app.db.session import get_db
from app.features.auth import service
from app.features.auth.schemas import (
    ConfirmEmailRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    ResetRequest,
    SessionResponse,
    SignupRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
DB = Annotated[Session, Depends(get_db)]


def get_current_user(request: Request, db: DB):
    return service.session_info(
        db, request.app.state.auth_provider, request.cookies.get(ACCESS_COOKIE, "")
    )["user"]


def install_session(request, response, db, tokens, remember):
    result = service.session_info(db, request.app.state.auth_provider, tokens["access_token"])
    set_cookies(response, tokens, remember, request.app.state.settings)
    return result


@router.post("/signup", response_model=MessageResponse, status_code=201)
def signup(body: SignupRequest, request: Request, db: DB):
    service.throttle(db, request, "signup", 10, 3600)
    return service.register(db, request.app.state.auth_provider, body)


@router.post("/login", response_model=SessionResponse)
def login(body: LoginRequest, request: Request, response: Response, db: DB):
    service.throttle(db, request, "login", 20, 300, body.identifier)
    tokens = service.login(
        db, request.app.state.auth_provider, body, request.app.state.email_resolver
    )
    return install_session(request, response, db, tokens, body.remember)


@router.get("/session", response_model=SessionResponse)
def session(request: Request, db: DB):
    return service.session_info(
        db, request.app.state.auth_provider, request.cookies.get(ACCESS_COOKIE, "")
    )


@router.post("/refresh", response_model=SessionResponse)
def refresh(request: Request, response: Response, db: DB):
    service.throttle(db, request, "refresh", 120, 300)
    token = request.cookies.get(REFRESH_COOKIE, "")
    if not token:
        raise HTTPException(401, "Your session has expired. Please sign in again.")
    tokens = request.app.state.auth_provider.refresh(token)
    return install_session(
        request, response, db, tokens, request.cookies.get(REMEMBER_COOKIE) == "1"
    )


@router.post("/logout", status_code=204)
def logout(request: Request):
    provider = request.app.state.auth_provider
    access = request.cookies.get(ACCESS_COOKIE, "")
    try:
        if access:
            provider.logout(access, "local")
        elif request.cookies.get(REFRESH_COOKIE):
            tokens = provider.refresh(request.cookies[REFRESH_COOKIE])
            provider.logout(tokens["access_token"], "local")
    except HTTPException as error:
        if error.status_code != 401:
            raise
        # If the access JWT expired, use the refresh cookie to revoke the actual session.
        if request.cookies.get(REFRESH_COOKIE):
            try:
                tokens = provider.refresh(request.cookies[REFRESH_COOKIE])
                provider.logout(tokens["access_token"], "local")
            except HTTPException as refresh_error:
                if refresh_error.status_code != 401:
                    raise
    response = Response(status_code=204)
    clear_cookies(response, request.app.state.settings)
    return response


@router.post("/password-reset", response_model=MessageResponse)
def request_reset(body: ResetRequest, request: Request, db: DB):
    service.throttle(db, request, "reset", 5, 3600, str(body.email))
    request.app.state.auth_provider.recover(body.email)
    return {"message": service.RESET_MESSAGE}


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest, request: Request, response: Response, db: DB):
    service.throttle(db, request, "reset-confirm", 20, 3600)
    provider = request.app.state.auth_provider
    tokens = provider.verify(body.token, "recovery")
    provider.update_password(tokens["access_token"], body.password)
    provider.logout(tokens["access_token"], "global")
    clear_cookies(response, request.app.state.settings)
    return {"message": "Password updated. Please sign in with your new password."}


@router.post("/confirm-email", response_model=SessionResponse)
def confirm_email(body: ConfirmEmailRequest, request: Request, response: Response, db: DB):
    service.throttle(db, request, "confirm", 20, 3600)
    tokens = request.app.state.auth_provider.verify(body.token, "email")
    return install_session(request, response, db, tokens, False)

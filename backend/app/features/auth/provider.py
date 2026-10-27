"""Stateless Supabase Auth REST adapter. Never share a mutable SDK user session."""

import httpx
from fastapi import HTTPException


class SupabaseAuth:
    def __init__(self, settings, transport=None):
        self.settings = settings
        self.http = httpx.Client(
            base_url=f"{settings.supabase_url}/auth/v1/",
            headers={"apikey": settings.supabase_publishable_key.get_secret_value()},
            timeout=15,
            transport=transport,
        )

    def close(self):
        self.http.close()

    def request(self, method, path, *, token=None, body=None, params=None):
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        try:
            response = self.http.request(method, path, json=body, params=params, headers=headers)
        except httpx.HTTPError:
            raise HTTPException(
                503, "Authentication is temporarily unavailable. Please try again."
            ) from None
        if response.is_error:
            try:
                code = response.json().get("error_code", response.json().get("code", ""))
            except (ValueError, AttributeError):
                code = ""
            if response.status_code == 429:
                raise HTTPException(429, "Too many attempts. Please try again later.")
            if code == "email_not_confirmed":
                raise HTTPException(401, "Confirm your email before signing in.")
            if code in {"user_already_exists", "email_exists"}:
                raise HTTPException(409, "That email or username is already in use.")
            if code in {"weak_password", "same_password"}:
                raise HTTPException(
                    400, "Choose a different password that meets the password requirements."
                )
            if code in {"signup_disabled", "email_provider_disabled"}:
                raise HTTPException(503, "Account creation is temporarily unavailable.")
            if code in {
                "bad_jwt",
                "no_authorization",
                "session_not_found",
                "session_expired",
                "refresh_token_not_found",
                "refresh_token_already_used",
                "user_not_found",
                "user_banned",
                "otp_expired",
            }:
                raise HTTPException(401, "Your credentials or link are invalid or have expired.")
            if response.status_code >= 500 or response.status_code == 403:
                raise HTTPException(
                    503, "Authentication is temporarily unavailable. Please try again."
                )
            raise HTTPException(401, "Your credentials or link are invalid or have expired.")
        try:
            result = response.json() if response.content else {}
            if not isinstance(result, dict):
                raise TypeError()
            return result
        except ValueError:
            raise HTTPException(
                503, "Authentication is temporarily unavailable. Please try again."
            ) from None

    def signup(self, body):
        return self.request(
            "POST",
            "signup",
            body={
                "email": str(body.email).lower(),
                "password": body.password,
                "data": {"username": body.username.lower(), "display_name": body.name},
            },
            params={"redirect_to": f"{self.settings.frontend_url}/confirm-email"},
        )

    def login(self, email, password):
        return self.request(
            "POST",
            "token",
            params={"grant_type": "password"},
            body={"email": email, "password": password},
        )

    def refresh(self, refresh_token):
        return self.request(
            "POST",
            "token",
            params={"grant_type": "refresh_token"},
            body={"refresh_token": refresh_token},
        )

    def user(self, token):
        return self.request("GET", "user", token=token)

    def logout(self, token, scope="local"):
        return self.request("POST", "logout", params={"scope": scope}, token=token)

    def recover(self, email):
        return self.request(
            "POST",
            "recover",
            body={"email": str(email).lower()},
            params={"redirect_to": f"{self.settings.frontend_url}/reset-password"},
        )

    def verify(self, token_hash, kind):
        return self.request("POST", "verify", body={"token_hash": token_hash, "type": kind})

    def update_password(self, token, password):
        return self.request("PUT", "user", token=token, body={"password": password})

"""Provider fixture only: production always calls Supabase Auth over HTTPS."""

import secrets
import time
from types import SimpleNamespace
from uuid import UUID, uuid4

import jwt
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import now
from app.features.auth.models import Profile


class SupabaseMock:
    def __init__(self, engine):
        self.settings = SimpleNamespace(supabase_url="https://example.supabase.co")
        self.engine = engine
        self.users = {}
        self.sessions = {}
        self.refresh_tokens = {}
        self.links = {}
        self.require_confirmation = False
        self.unavailable = False
        self.secret = secrets.token_urlsafe(48)

    def close(self):
        pass

    def signup(self, body):
        email = str(body.email).lower()
        if any(user["email"] == email for user in self.users.values()):
            raise HTTPException(409, "That email or username is already in use.")
        uid = str(uuid4())
        self.users[uid] = {
            "id": uid,
            "email": email,
            "password": body.password,
            "confirmed": not self.require_confirmation,
            "active": True,
        }
        with Session(self.engine) as db:
            db.add(
                Profile(
                    id=UUID(uid),
                    username=body.username.lower(),
                    display_name=body.name,
                    country_code=body.country_code, city=body.city,
                    created_at=now(),
                )
            )
            db.commit()
        if self.require_confirmation:
            self.links[secrets.token_urlsafe(32)] = (uid, "email")
            return {"id": uid}
        return self.issue(uid)

    def issue(self, uid, sid=None):
        sid = sid or str(uuid4())
        self.sessions[sid] = uid
        access = jwt.encode(
            {"sub": uid, "session_id": sid, "exp": int(time.time()) + 3600},
            self.secret,
            algorithm="HS256",
        )
        refresh = secrets.token_urlsafe(48)
        self.refresh_tokens[refresh] = sid
        return {"access_token": access, "refresh_token": refresh, "expires_in": 3600}

    def claims(self, token):
        try:
            return jwt.decode(token, self.secret, algorithms=["HS256"])
        except jwt.InvalidTokenError:
            raise HTTPException(401, "Session expired") from None

    def user(self, token):
        if self.unavailable:
            raise HTTPException(503, "Authentication unavailable")
        uid = self.claims(token)["sub"]
        user = self.users.get(uid)
        if not user or not user["active"]:
            raise HTTPException(401, "Invalid session")
        return {"id": uid, "email": user["email"]}

    def resolve_email(self, db, identifier):
        if "@" in identifier:
            return identifier.strip().lower()
        for user in self.users.values():
            profile = db.get(Profile, UUID(user["id"]))
            if profile.username == identifier.strip().lower():
                return user["email"]
        return None

    def login(self, email, password):
        for user in self.users.values():
            if user["email"] == email and user["password"] == password and user["active"]:
                if not user["confirmed"]:
                    raise HTTPException(401, "Confirm your email before signing in.")
                return self.issue(user["id"])
        raise HTTPException(401, "Invalid credentials")

    def refresh(self, token):
        sid = self.refresh_tokens.get(token)
        if not sid or sid not in self.sessions:
            raise HTTPException(401, "Refresh expired")
        return self.issue(self.sessions[sid], sid)

    def logout(self, token, scope="local"):
        claims = self.claims(token)
        if scope == "global":
            self.sessions = {sid: uid for sid, uid in self.sessions.items() if uid != claims["sub"]}
        else:
            self.sessions.pop(claims["session_id"], None)
        return {}

    def recover(self, email):
        for user in self.users.values():
            if user["email"] == str(email).lower():
                self.links[secrets.token_urlsafe(32)] = (user["id"], "recovery")
        return {}

    def verify(self, token, kind):
        value = self.links.get(token)
        if not value or value[1] != kind:
            raise HTTPException(401, "Invalid or expired link")
        del self.links[token]
        uid, _ = value
        if kind == "email":
            self.users[uid]["confirmed"] = True
        return self.issue(uid)

    def update_password(self, token, password):
        user = self.user(token)
        self.users[user["id"]]["password"] = password
        return user

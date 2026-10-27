"""Test-only server with a Supabase provider fixture. Never deploy this entry point."""

from pathlib import Path
from tempfile import TemporaryDirectory

import uvicorn
from sqlalchemy import create_engine

from app.core.config import Settings
from app.db.session import Base
from app.features.auth.schemas import SignupRequest
from app.main import create_app
from tests.supabase_mocks import SupabaseMock


def test_app():
    directory = TemporaryDirectory(prefix="manga-auth-e2e-")
    engine = create_engine(
        f"sqlite:///{Path(directory.name) / 'auth.sqlite3'}",
        connect_args={"check_same_thread": False},
        execution_options={"schema_translate_map": {"manga_private": None, "public": None}},
    )
    Base.metadata.create_all(engine)
    provider = SupabaseMock(engine)
    # Seed only test fixtures; production has no default accounts.
    provider.signup(
        SignupRequest(
            name="Isaiah",
            username="aganon33",
            email="reader@manga.demo",
            password="manga-demo-test",
        )
    )
    next(iter(provider.users.values()))["password"] = "manga-demo"
    settings = Settings(
        database_url="sqlite://",
        supabase_url="https://example.supabase.co",
        supabase_publishable_key="test-only-key",
        environment="test",
        cookie_secure=False,
        rate_limit_multiplier=1000,
        allowed_origins=["http://127.0.0.1:3100"],
        frontend_url="http://127.0.0.1:3100",
    )
    app = create_app(settings, engine, provider, provider.resolve_email)
    app.state.test_directory = directory
    return app


if __name__ == "__main__":
    uvicorn.run(test_app(), host="127.0.0.1", port=8101)

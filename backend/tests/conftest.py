import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.config import Settings
from app.db.session import Base, make_engine
from app.main import create_app
from tests.supabase_mocks import SupabaseMock


@pytest.fixture
def settings():
    return Settings(
        database_url="sqlite://",
        supabase_url="https://example.supabase.co",
        supabase_publishable_key="test-publishable-key",
        environment="test",
        cookie_secure=False,
        allowed_origins=["http://testserver"],
        frontend_url="http://testserver",
        rate_limit_multiplier=100,
    )


@pytest.fixture
def engine(settings):
    url = os.environ.get("TEST_DATABASE_URL")
    if url:
        engine = make_engine(url)
        with engine.begin() as connection:
            connection.exec_driver_sql("create schema if not exists manga_private")
        Base.metadata.drop_all(engine)
    else:
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            execution_options={"schema_translate_map": {"manga_private": None, "public": None}},
        )
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def provider(engine):
    return SupabaseMock(engine)


@pytest.fixture
def client(settings, engine, provider):
    with TestClient(
        create_app(settings, engine, provider, provider.resolve_email),
        headers={
            "Origin": "http://testserver",
            "X-Manga-Client": "web",
        },
    ) as client:
        yield client


@pytest.fixture
def db(engine):
    with Session(engine) as session:
        yield session


@pytest.fixture
def credentials():
    return {
        "name": "Test Reader",
        "username": "test_reader",
        "email": "reader@example.com",
        "password": "a-long-test-password",
    }

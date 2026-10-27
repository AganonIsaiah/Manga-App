import os
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy import text

from app.db.session import Base, make_engine
from app.features.auth.service import resolve_email


@pytest.mark.skipif(not os.environ.get("TEST_DATABASE_URL"), reason="Requires isolated PostgreSQL")
def test_supabase_profile_trigger_policies_and_username_lookup():
    from sqlalchemy.orm import Session

    engine = make_engine(os.environ["TEST_DATABASE_URL"])
    Base.metadata.drop_all(engine)
    with engine.begin() as connection:
        # Fake only the minimal managed auth.users contract in the disposable test database.
        connection.exec_driver_sql("""
            create schema if not exists auth;
            create table if not exists auth.users (
                id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}',
                created_at timestamptz not null default now()
            );
            truncate auth.users cascade;
            drop trigger if exists on_auth_user_created on auth.users;
            do $$ begin
                if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
                if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
            end $$;
        """)
        existing = uuid4()
        connection.execute(
            text("insert into auth.users(id,email) values (:id,'existing@example.com')"),
            {"id": existing},
        )
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql(
                Path(__file__).parents[1].joinpath("migrations/001_auth.sql").read_text()
            )
        with engine.begin() as connection:
            uid = uuid4()
            connection.execute(
                text(
                    "insert into auth.users(id,email,raw_user_meta_data) values "
                    '(:id,\'new@example.com\', \'{"username":"new_reader","display_name":"New Reader"}\')'
                ),
                {"id": uid},
            )
            assert (
                connection.execute(
                    text("select username from public.profiles where id=:id"), {"id": uid}
                ).scalar()
                == "new_reader"
            )
            assert (
                connection.execute(
                    text("select username from public.profiles where id=:id"), {"id": existing}
                )
                .scalar()
                .startswith("reader_")
            )
            assert not connection.exec_driver_sql(
                "select has_schema_privilege('anon','manga_private','USAGE')"
            ).scalar()
            assert connection.exec_driver_sql(
                "select has_column_privilege('anon','public.profiles','username','SELECT')"
            ).scalar()
            assert not connection.exec_driver_sql(
                "select has_table_privilege('authenticated','public.profiles','UPDATE')"
            ).scalar()
        with Session(engine) as db:
            assert resolve_email(db, "NEW_READER") == "new@example.com"
        with engine.begin() as connection:
            connection.execute(text("delete from auth.users where id=:id"), {"id": uid})
            assert (
                connection.execute(
                    text("select id from public.profiles where id=:id"), {"id": uid}
                ).scalar()
                is None
            )
    finally:
        with engine.begin() as connection:
            connection.exec_driver_sql("drop trigger if exists on_auth_user_created on auth.users")
        Base.metadata.drop_all(engine)
        engine.dispose()

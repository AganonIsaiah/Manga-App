from fastapi import Request
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import DeclarativeBase, Session
from sqlalchemy.pool import NullPool

SCHEMA = "manga_private"


class Base(DeclarativeBase):
    metadata = MetaData()


def make_engine(url: str):
    # NullPool and disabled prepared statements also support Supabase transaction pooling.
    kwargs = {"poolclass": NullPool, "pool_pre_ping": True}
    if url.startswith("postgresql"):
        kwargs["connect_args"] = {"prepare_threshold": None}
    return create_engine(url, **kwargs)


def get_db(request: Request):
    with Session(request.app.state.engine) as session:
        yield session

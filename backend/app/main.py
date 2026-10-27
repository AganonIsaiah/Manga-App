from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exception_handlers import http_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import Settings, get_settings
from app.core.security import clear_cookies
from app.db.session import make_engine
from app.features.auth.provider import SupabaseAuth
from app.features.auth.router import router
from app.features.auth.service import resolve_email
from app.features.users.router import router as users_router
from app.integrations.storage.client import AvatarStorage


def create_app(
    settings: Settings | None = None, engine=None, auth_provider=None, email_resolver=resolve_email
):
    settings = settings or get_settings()
    database = engine if engine is not None else make_engine(settings.database_url)

    avatar_storage = AvatarStorage(settings)
    provider = auth_provider if auth_provider is not None else SupabaseAuth(settings)

    @asynccontextmanager
    async def lifespan(app):
        yield
        provider.close()
        avatar_storage.close()
        database.dispose()

    app = FastAPI(title="Manga API", lifespan=lifespan)
    app.state.avatar_storage = avatar_storage
    app.state.settings = settings
    app.state.engine = database
    app.state.auth_provider = provider
    app.state.email_resolver = email_resolver

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, exc):
        # Never echo submitted passwords or reset tokens in validation responses.
        return JSONResponse(
            {
                "detail": [
                    {"loc": error["loc"], "msg": error["msg"], "type": error["type"]}
                    for error in exc.errors()
                ]
            },
            status_code=422,
        )

    @app.exception_handler(HTTPException)
    async def auth_error(request, exc):
        response = await http_exception_handler(request, exc)
        if request.url.path == "/api/auth/refresh" and exc.status_code == 401:
            clear_cookies(response, settings)
        return response

    @app.middleware("http")
    async def browser_security(request: Request, call_next):
        # Exact Origin + a non-simple custom header prevent cookie/login CSRF.
        if request.method not in {"GET", "HEAD", "OPTIONS"} and (
            request.headers.get("origin") not in settings.allowed_origins
            or request.headers.get("x-manga-client") != "web"
        ):
            return JSONResponse({"detail": "Request origin is not allowed."}, status_code=403)
        response = await call_next(request)
        if request.url.path.startswith("/api/auth"):
            response.headers["Cache-Control"] = "no-store"
            response.headers["Pragma"] = "no-cache"
            response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "X-Manga-Client"],
    )
    app.include_router(router)
    app.include_router(users_router)
    return app

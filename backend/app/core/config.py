from functools import lru_cache
from typing import Literal
from urllib.parse import urlsplit

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", hide_input_in_errors=True)
    database_url: str
    supabase_url: str
    supabase_publishable_key: SecretStr
    environment: Literal["development", "production", "test"] = "production"
    cookie_secure: bool = True
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    allowed_origins: list[str] = ["http://localhost:3000"]
    frontend_url: str = "http://localhost:3000"
    remember_days: int = 30
    rate_limit_multiplier: int = 1

    @model_validator(mode="after")
    def validate_security(self):
        for url in [*self.allowed_origins, self.frontend_url, self.supabase_url]:
            parsed = urlsplit(url)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or parsed.path
                or parsed.query
                or parsed.fragment
                or parsed.username
            ):
                raise ValueError("URLs must be exact HTTP(S) origins without trailing slashes")
        if not self.allowed_origins or not self.supabase_publishable_key.get_secret_value():
            raise ValueError("Supabase publishable key and allowed origins are required")
        if self.cookie_samesite == "none" and not self.cookie_secure:
            raise ValueError("SameSite=None requires secure cookies")
        if self.environment == "production" and (
            not self.cookie_secure
            or any(
                not origin.startswith("https://")
                for origin in [*self.allowed_origins, self.frontend_url, self.supabase_url]
            )
        ):
            raise ValueError("Production requires HTTPS and secure cookies")
        if min(self.remember_days, self.rate_limit_multiplier) < 1:
            raise ValueError("Timeouts and rate limits must be positive")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()

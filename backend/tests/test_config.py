import pytest
from pydantic import ValidationError

from app.core.config import Settings


@pytest.mark.parametrize(
    "changes",
    [
        {"supabase_publishable_key": ""},
        {"cookie_samesite": "none", "cookie_secure": False},
        {"environment": "production", "cookie_secure": False},
        {"allowed_origins": ["*"]},
        {"allowed_origins": ["https://example.com/"]},
        {"remember_days": 0},
    ],
)
def test_invalid_security_config_is_rejected(settings, changes):
    with pytest.raises(ValidationError):
        Settings(**{**settings.model_dump(), **changes})

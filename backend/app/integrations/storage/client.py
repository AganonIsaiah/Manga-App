"""Supabase Storage requests use the verified user's token, never an admin key."""
import logging

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)


class AvatarStorage:
    def __init__(self, settings, transport=None):
        self.http = httpx.Client(
            base_url=f"{settings.supabase_url}/storage/v1/",
            headers={"apikey": settings.supabase_publishable_key.get_secret_value()},
            timeout=20, transport=transport,
        )

    def close(self):
        self.http.close()

    def upload(self, path, data, token):
        try:
            response = self.http.post(
                f"object/avatars/{path}", content=data,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "image/webp"},
            )
            response.raise_for_status()
        except httpx.HTTPError:
            raise HTTPException(503, "Unable to save your photo. Please try again.") from None

    def remove(self, path, token):
        try:
            response = self.http.request(
                "DELETE", "object/avatars", json={"prefixes": [path]},
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
        except httpx.HTTPError:
            # The current avatar remains valid; old objects can be cleaned up later.
            logger.warning("Avatar cleanup failed; retry storage cleanup later.")

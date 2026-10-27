import warnings
from io import BytesIO
from uuid import UUID, uuid4

from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import select

from app.features.auth.models import Profile

MAX_AVATAR_BYTES = 5 * 1024 * 1024


def prepare_avatar(data):
    if not data or len(data) > MAX_AVATAR_BYTES:
        raise HTTPException(413, "Choose a photo smaller than 5 MB.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(data)) as image:
                if image.format not in {"JPEG", "PNG", "WEBP"}:
                    raise ValueError()
                if image.width * image.height > 16_000_000:
                    raise ValueError()
                image = ImageOps.exif_transpose(image)
                image = ImageOps.fit(image.convert("RGB"), (512, 512))
                output = BytesIO()
                image.save(output, "WEBP", quality=85)
                return output.getvalue()
    except (UnidentifiedImageError, OSError, ValueError,
            Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(400, "Choose a valid JPEG, PNG or WebP photo up to 16 megapixels.") from None


def save_avatar(db, storage, user_id, data, token):
    processed = prepare_avatar(data)
    # Lock per user so concurrent replacements cannot delete the winning upload.
    profile = db.scalar(select(Profile).where(Profile.id == UUID(user_id)).with_for_update())
    if not profile:
        raise HTTPException(404, "Profile not found.")
    previous = profile.avatar_path
    path = f"{user_id}/{uuid4()}.webp"
    storage.upload(path, processed, token)
    try:
        profile.avatar_path = path
        db.commit()
    except Exception:
        db.rollback()
        storage.remove(path, token)
        raise
    if previous and previous.startswith(f"{user_id}/"):
        storage.remove(previous, token)

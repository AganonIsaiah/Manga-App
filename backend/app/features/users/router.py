from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from starlette.concurrency import run_in_threadpool

from app.core.security import ACCESS_COOKIE
from app.features.auth import service as auth_service
from app.features.auth.router import DB, get_current_user
from app.features.auth.schemas import UserResponse
from app.features.users.service import MAX_AVATAR_BYTES, save_avatar

router = APIRouter(prefix="/api/users", tags=["profiles"])


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(request: Request, db: DB, user: Annotated[dict, Depends(get_current_user)]):
    await run_in_threadpool(auth_service.throttle, db, request, "avatar", 20, 3600)
    data = bytearray()
    async for chunk in request.stream():
        data.extend(chunk)
        if len(data) > MAX_AVATAR_BYTES:
            raise HTTPException(413, "Choose a photo smaller than 5 MB.")
    token = request.cookies.get(ACCESS_COOKIE, "")
    await run_in_threadpool(
        save_avatar, db, request.app.state.avatar_storage, user["id"], bytes(data), token,
    )
    result = await run_in_threadpool(
        auth_service.session_info, db, request.app.state.auth_provider, token,
    )
    return result["user"]

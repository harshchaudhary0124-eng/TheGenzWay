from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.user import User
from ..routes.auth import get_current_user
from ..services.forum_access import require_membership
from ..services import chat
from ..services.ws_manager import manager
from ..services.uploads import (
    ALLOWED_CONTENT_TYPES,
    MAX_UPLOAD_BYTES,
    store_file,
)
from ..schemas.message import (
    MessageResponse,
    ForumDetailResponse,
    MarkReadRequest,
    AttachmentInfo,
)

# Same prefix as forum.py. Registered AFTER forum_router in main.py so the
# literal routes (/forums/mine, /forums/invites) match before /forums/{forum_id}.
router = APIRouter(prefix="/forums", tags=["forum-chat"])


@router.get("/{forum_id}", response_model=ForumDetailResponse)
def get_forum_detail(
    forum_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_membership(db, forum_id, current_user.id)
    try:
        return chat.get_forum_detail(
            db, forum_id, current_user.id, manager.online_user_ids(forum_id)
        )
    except chat.ChatError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.message)


@router.get("/{forum_id}/messages", response_model=List[MessageResponse])
def get_messages(
    forum_id: int,
    before: Optional[int] = Query(None, description="Return messages with id < before"),
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_membership(db, forum_id, current_user.id)
    return chat.list_messages(db, forum_id, before, limit)


@router.post("/{forum_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(
    forum_id: int,
    body: MarkReadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_membership(db, forum_id, current_user.id)
    chat.mark_read(db, forum_id, current_user.id, body.last_read_message_id)


@router.get("/{forum_id}/messages/search", response_model=List[MessageResponse])
def search_messages(
    forum_id: int,
    q: str = Query(..., min_length=1, description="Text to search for"),
    limit: int = Query(25, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_membership(db, forum_id, current_user.id)
    return chat.search_messages(db, forum_id, q, limit)


@router.post("/{forum_id}/attachments", response_model=AttachmentInfo)
async def upload_attachment(
    forum_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_membership(db, forum_id, current_user.id)

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported file type")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File is too large (max 10 MB)")

    filename = (file.filename or "file").strip()[:255]
    stored_path = store_file(forum_id, filename, data)
    return chat.save_attachment(
        db,
        forum_id=forum_id,
        uploader_id=current_user.id,
        filename=filename,
        stored_path=stored_path,
        content_type=content_type,
        size_bytes=len(data),
    )


@router.get("/{forum_id}/attachments", response_model=List[AttachmentInfo])
def list_attachments(
    forum_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_membership(db, forum_id, current_user.id)
    return chat.list_attachments(db, forum_id)

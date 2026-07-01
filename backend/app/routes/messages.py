import logging

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.user import User
from ..routes.auth import get_current_user
from ..security import limiter, UPLOAD_RATE_LIMIT
from ..services.forum_access import require_membership
from ..services import chat
from ..services.ws_manager import manager
from ..services.media import (
    ALLOWED_CONTENT_TYPES,
    MAX_UPLOAD_BYTES,
    validate_extension,
    media_service,
    MediaUploadError,
)
from ..schemas.message import (
    MessageResponse,
    ForumDetailResponse,
    MarkReadRequest,
    AttachmentInfo,
)

logger = logging.getLogger(__name__)

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
@limiter.limit(UPLOAD_RATE_LIMIT)
async def upload_attachment(
    request: Request,
    forum_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_membership(db, forum_id, current_user.id)

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported file type")

    filename = (file.filename or "file").strip()[:255]
    # Extension must be allowlisted AND consistent with the declared MIME type
    # (blocks e.g. a .svg/.html smuggled under an image/png content-type).
    if not validate_extension(filename, content_type):
        raise HTTPException(status_code=415, detail="Unsupported file type")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File is too large (max 10 MB)")

    # Images go to forums/images, everything else (PDFs, docs, zips) to
    # forums/documents. Bytes are uploaded straight to Cloudinary — nothing
    # touches the server filesystem.
    try:
        result = media_service.upload_forum_attachment(
            data, filename=filename, content_type=content_type
        )
    except MediaUploadError:
        # Log the operational failure (no file contents / secrets) for monitoring.
        logger.warning(
            "Upload failed for forum %s (content_type=%s, size=%d bytes)",
            forum_id, content_type, len(data),
        )
        raise HTTPException(status_code=502, detail="File upload failed. Please try again.")

    return chat.save_attachment(
        db,
        forum_id=forum_id,
        uploader_id=current_user.id,
        filename=filename,
        cloudinary_public_id=result.public_id,
        secure_url=result.secure_url,
        content_type=content_type,
        size_bytes=result.bytes,
    )


@router.get("/{forum_id}/attachments", response_model=List[AttachmentInfo])
def list_attachments(
    forum_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_membership(db, forum_id, current_user.id)
    return chat.list_attachments(db, forum_id)

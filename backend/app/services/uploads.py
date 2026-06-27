"""Local-disk storage for forum attachments.

Files live under backend/uploads/forums/{forum_id}/ with a UUID-prefixed name.
The directory is created on import so the StaticFiles mount in main.py always
has something to serve. NOTE: this is local single-node storage; production
would swap this for object storage (S3/GCS) behind the same helper signature.
"""
import uuid
from pathlib import Path

# backend/app/services/uploads.py -> backend/uploads
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

# Allowlisted content types (images + common documents).
ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/zip",
    "application/json",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}


def store_file(forum_id: int, original_name: str, data: bytes) -> str:
    """Write `data` to disk and return the path relative to the /uploads mount."""
    ext = Path(original_name or "").suffix[:16]
    name = f"{uuid.uuid4().hex}{ext}"
    rel_dir = Path("forums") / str(forum_id)
    abs_dir = UPLOAD_DIR / rel_dir
    abs_dir.mkdir(parents=True, exist_ok=True)
    (abs_dir / name).write_bytes(data)
    # Always forward-slashed for use in a URL.
    return str((rel_dir / name).as_posix())

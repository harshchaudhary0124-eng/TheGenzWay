"""Cloudinary media layer — the single upload/delete path for the whole app.

Every uploaded file (forum attachments, and — when those features ship — profile
images and project assets) flows through `MediaService`. Design rules:

* **Cloudinary only.** Bytes are never written to the server filesystem. We
  persist exactly the Cloudinary ``public_id`` (for management/deletion) and the
  delivery ``secure_url``. PostgreSQL stays the single source of truth for app
  data; Cloudinary owns the bytes.
* **Signed, server-side uploads.** Credentials live only on the server (from
  ``settings``); the SDK signs every request with the API secret. The browser
  never receives the API key or secret.
* **Optimised delivery.** Image URLs are generated with ``f_auto`` + ``q_auto``
  transformations so clients get WebP/AVIF at automatic quality instead of the
  original bytes — without losing access to the full-resolution original.
* **Validation stays.** Type allowlist, extension↔MIME consistency and a hard
  size cap are enforced before anything leaves for Cloudinary.
* **Unique names + scalable folders.** Each object gets a fresh UUID ``public_id``
  inside a nested domain folder (``users/profile-images``, ``forums/images``,
  ``forums/documents``, ``projects/images``, ``projects/files``).
* **Deletion + replacement.** ``delete_asset`` / ``replace_asset`` keep Cloudinary
  in sync whenever a stored asset is removed or swapped.
"""
from __future__ import annotations

import io
import re
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cloudinary
import cloudinary.uploader
import cloudinary.utils

from ..config import settings

# ── Scalable, nested folders (one per media domain) ──────────────────────────
FOLDER_PROFILE_IMAGES = "users/profile-images"
FOLDER_FORUM_IMAGES = "forums/images"
FOLDER_FORUM_DOCUMENTS = "forums/documents"
FOLDER_PROJECT_IMAGES = "projects/images"
FOLDER_PROJECT_FILES = "projects/files"

ALL_FOLDERS = {
    FOLDER_PROFILE_IMAGES,
    FOLDER_FORUM_IMAGES,
    FOLDER_FORUM_DOCUMENTS,
    FOLDER_PROJECT_IMAGES,
    FOLDER_PROJECT_FILES,
}

# ── Validation ───────────────────────────────────────────────────────────────
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

# Allowlisted content types (images + common documents).
# NOTE: image/svg+xml is intentionally excluded — SVGs can carry scripts and
# would be a stored-XSS vector if opened directly.
ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
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

# Permitted file extensions for each allowlisted content type. The uploaded
# filename's extension must appear in the set for its declared MIME type, so a
# dangerous extension (.svg, .html, .exe) can't ride in under a benign type.
CONTENT_TYPE_EXTENSIONS: dict[str, set[str]] = {
    "image/png": {".png"},
    "image/jpeg": {".jpg", ".jpeg"},
    "image/gif": {".gif"},
    "image/webp": {".webp"},
    "application/pdf": {".pdf"},
    "text/plain": {".txt"},
    "text/markdown": {".md", ".markdown"},
    "text/csv": {".csv"},
    "application/zip": {".zip"},
    "application/json": {".json"},
    "application/msword": {".doc"},
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {".docx"},
    "application/vnd.ms-excel": {".xls"},
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {".xlsx"},
    "application/vnd.ms-powerpoint": {".ppt"},
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": {".pptx"},
}

# Set of image content types (drives folder routing + optimisation).
IMAGE_CONTENT_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp"}

# Every extension that may ever be uploaded.
ALLOWED_EXTENSIONS = {ext for exts in CONTENT_TYPE_EXTENSIONS.values() for ext in exts}


def validate_extension(filename: str, content_type: str) -> bool:
    """True only if the filename's extension is allowed for this content type."""
    ext = Path(filename or "").suffix.lower()
    return ext in CONTENT_TYPE_EXTENSIONS.get(content_type, set())


def is_image_content_type(content_type: str) -> bool:
    return (content_type or "") in IMAGE_CONTENT_TYPES


class MediaUploadError(Exception):
    """Raised when an upload to Cloudinary fails or is not configured.

    Routes translate this into a clean HTTP error — Cloudinary's internal error
    details never reach the client.
    """


@dataclass(frozen=True)
class UploadResult:
    """Outcome of a successful upload.

    ``public_id`` + ``secure_url`` are what callers persist; the rest is metadata
    Cloudinary returns for free (useful for layout / display and never re-fetched).
    """

    public_id: str
    secure_url: str
    bytes: int
    content_type: str
    resource_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    pages: Optional[int] = None


_configured = False


def _ensure_configured() -> None:
    """Configure the Cloudinary SDK from settings (idempotent)."""
    global _configured
    if not settings.cloudinary_configured:
        raise MediaUploadError("Cloudinary is not configured")
    if _configured:
        return
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    _configured = True


def optimized_url(public_id: str, resource_type: str = "image") -> str:
    """Build an ``f_auto,q_auto`` HTTPS delivery URL for an image public_id.

    Returns the format/quality-optimised URL (WebP/AVIF where supported) while
    still pointing at the full-resolution original — no destructive resize.
    """
    _ensure_configured()
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type=resource_type,
        secure=True,
        fetch_format="auto",
        quality="auto",
    )
    return url


def upload_file(
    data: bytes,
    *,
    folder: str,
    filename: str,
    content_type: str,
) -> UploadResult:
    """Low-level signed upload of raw bytes to Cloudinary.

    Stores the object under ``<folder>/<uuid>`` (unique key; the user-supplied
    filename never becomes the storage key). ``resource_type="auto"`` so images,
    PDFs and raw documents all deliver over HTTPS. For images the returned
    ``secure_url`` is the ``f_auto,q_auto`` optimised URL.

    Raises MediaUploadError on any failure. Callers should validate type/size
    first; this is defensive about empty data + unknown folders too.
    """
    if folder not in ALL_FOLDERS:
        raise MediaUploadError(f"Unknown media folder: {folder!r}")
    if not data:
        raise MediaUploadError("Empty file")

    _ensure_configured()
    public_id = uuid.uuid4().hex

    try:
        result = cloudinary.uploader.upload(
            io.BytesIO(data),
            folder=folder,
            public_id=public_id,
            resource_type="auto",
            use_filename=False,
            unique_filename=False,
            overwrite=False,
        )
    except Exception as exc:  # cloudinary raises various error subclasses
        raise MediaUploadError("Upload to media storage failed") from exc

    stored_public_id = result.get("public_id")
    resource_type = result.get("resource_type", "auto")
    raw_secure_url = result.get("secure_url")
    if not raw_secure_url or not stored_public_id:
        raise MediaUploadError("Media storage returned an incomplete response")

    # Images are delivered through the f_auto/q_auto pipeline; raw docs/PDFs are
    # served as-is (transformations don't apply to non-image resource types).
    if resource_type == "image" and is_image_content_type(content_type):
        secure_url = optimized_url(stored_public_id, resource_type="image")
    else:
        secure_url = raw_secure_url

    return UploadResult(
        public_id=stored_public_id,
        secure_url=secure_url,
        bytes=int(result.get("bytes", len(data))),
        content_type=content_type,
        resource_type=resource_type,
        width=result.get("width"),
        height=result.get("height"),
        pages=result.get("pages"),
    )


def delete_file(public_id: str, resource_type: str = "image") -> bool:
    """Best-effort delete of a Cloudinary object by public_id.

    Never raises (a failed remote delete must not break the caller's flow — the
    DB row is the source of truth and can be reconciled). Returns True on a
    confirmed delete, False otherwise.
    """
    if not public_id:
        return False
    try:
        _ensure_configured()
        res = cloudinary.uploader.destroy(
            public_id, resource_type=resource_type, invalidate=True
        )
        return res.get("result") == "ok"
    except Exception:  # noqa: BLE001 — cleanup is best-effort
        return False


class MediaService:
    """High-level, intention-revealing API over the Cloudinary primitives.

    One shared instance (`media_service`) is used across the app. Each method
    routes to the right folder and resource handling so callers don't repeat
    folder/optimisation logic.
    """

    # ── uploads ──────────────────────────────────────────────────────────────
    def upload_image(self, data: bytes, *, folder: str, filename: str, content_type: str) -> UploadResult:
        if not is_image_content_type(content_type):
            raise MediaUploadError("upload_image requires an image content type")
        return upload_file(data, folder=folder, filename=filename, content_type=content_type)

    def upload_document(self, data: bytes, *, folder: str, filename: str, content_type: str) -> UploadResult:
        return upload_file(data, folder=folder, filename=filename, content_type=content_type)

    def upload_profile_image(self, data: bytes, *, filename: str, content_type: str) -> UploadResult:
        return self.upload_image(
            data, folder=FOLDER_PROFILE_IMAGES, filename=filename, content_type=content_type
        )

    def upload_project_asset(self, data: bytes, *, filename: str, content_type: str) -> UploadResult:
        folder = FOLDER_PROJECT_IMAGES if is_image_content_type(content_type) else FOLDER_PROJECT_FILES
        return upload_file(data, folder=folder, filename=filename, content_type=content_type)

    def upload_forum_attachment(self, data: bytes, *, filename: str, content_type: str) -> UploadResult:
        """Route a forum chat attachment: images → forums/images, else forums/documents."""
        folder = FOLDER_FORUM_IMAGES if is_image_content_type(content_type) else FOLDER_FORUM_DOCUMENTS
        return upload_file(data, folder=folder, filename=filename, content_type=content_type)

    # ── delete / replace ─────────────────────────────────────────────────────
    def delete_asset(self, public_id: str, *, resource_type: str = "image") -> bool:
        """Delete a stored asset from Cloudinary. Best-effort, never raises."""
        return delete_file(public_id, resource_type=resource_type)

    def replace_asset(
        self,
        old_public_id: Optional[str],
        data: bytes,
        *,
        folder: str,
        filename: str,
        content_type: str,
        old_resource_type: str = "image",
    ) -> UploadResult:
        """Upload a new asset, then delete the old one once the new one is safe.

        Order matters: the new upload happens first so a delete failure can never
        leave the caller with no asset. The old delete is best-effort.
        """
        result = upload_file(data, folder=folder, filename=filename, content_type=content_type)
        if old_public_id and old_public_id != result.public_id:
            delete_file(old_public_id, resource_type=old_resource_type)
        return result

    # ── delivery ─────────────────────────────────────────────────────────────
    def optimize_image(self, public_id: str, *, resource_type: str = "image") -> str:
        """Return an f_auto/q_auto optimised delivery URL for an image public_id."""
        return optimized_url(public_id, resource_type=resource_type)


# Shared singleton — import and use `media_service` everywhere.
media_service = MediaService()

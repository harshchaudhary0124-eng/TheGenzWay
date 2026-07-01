# Cloudinary Media Storage — Setup Guide

The GenZ Way stores **all uploaded media in Cloudinary**. Nothing is written to
the server filesystem. PostgreSQL (Neon) remains the single source of truth for
application data; for each upload it stores only two Cloudinary references:
`cloudinary_public_id` and `secure_url`.

Uploads are **signed and performed server-side**: the Cloudinary credentials
live only in the backend environment and the SDK signs every request with the
API secret. The browser never receives the API key or secret.

---

## 1. Account setup

1. Create a free account at <https://cloudinary.com/users/register_free>.
2. Open the **Dashboard** (or **Settings → API Keys**). You need three values:
   - **Cloud name**
   - **API Key**
   - **API Secret**
3. No upload preset is required — uploads are signed, not preset/unsigned.
4. (Optional) Under **Settings → Security** you can keep "Strict transformations"
   on; we only request raw delivery URLs, so no extra allowlisting is needed.

The folders below are created automatically the first time a file is uploaded
into them — you do **not** need to pre-create them in the Media Library.

---

## 2. Environment variables

Add these to `backend/.env` (gitignored — never commit real secrets). The
committed `backend/.env.example` documents them with placeholders.

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Behaviour:

- **Development** (`ENVIRONMENT=development`): if these are unset, the app still
  boots, but any upload returns `502 File upload failed`.
- **Production** (`ENVIRONMENT=production`): the app **refuses to start** unless
  all three are set (fail-fast, see `app/config.py::_enforce_production`).

---

## 3. Folder structure

Every object is stored under a nested domain folder with a UUID key, so names are
always unique and the original filename never becomes the storage key:

| Folder                  | Used for                                      | Status        |
| ----------------------- | --------------------------------------------- | ------------- |
| `users/profile-images/` | User profile / avatar images                  | Ready to use¹ |
| `forums/images/`        | Image attachments posted in forum chat        | **Wired**     |
| `forums/documents/`     | PDFs / docs / zips posted in forum chat       | **Wired**     |
| `projects/images/`      | Project showcase images                       | Ready to use¹ |
| `projects/files/`       | Project documents / files                     | Ready to use¹ |

¹ `MediaService` exposes `upload_profile_image()` and `upload_project_asset()`
today. The forum-chat upload path is the only UI currently wired to uploads;
profile-image and project-asset uploads call the same service when those features
ship — no new storage code needed.

Example stored object: `forums/images/86eb9ea02d3c408ea82375a74921b16b`
→ optimised delivery URL
`https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/v1/forums/images/86eb…`

---

## 4. Upload flow

```
Browser (existing upload button)
   │  multipart POST  /forums/{id}/attachments   (JWT in Authorization header)
   ▼
FastAPI route  app/routes/messages.py
   │  • auth + forum membership check
   │  • validate: MIME allowlist, extension↔MIME match, size ≤ 10 MB, non-empty
   │  • pick folder: image/* → forum-images, else → forum-documents
   ▼
Media service  app/services/media.py  →  cloudinary.uploader.upload(...)
   │  • signed server-side (API secret never leaves the server)
   │  • resource_type="auto" (images, PDFs, raw docs)
   │  • returns { public_id, secure_url, bytes, ... }
   ▼
Persist  app/services/chat.py::save_attachment
   │  forum_attachments row: cloudinary_public_id + secure_url (no disk write)
   ▼
Response  AttachmentInfo { id, url=secure_url, filename, content_type, size_bytes }
   ▼
Browser renders/loads the image directly from the Cloudinary CDN over HTTPS.
```

Validation rules (unchanged from before):

- **Allowed types:** PNG, JPEG, GIF, WebP, PDF, TXT, Markdown, CSV, JSON, ZIP,
  DOC/DOCX, XLS/XLSX, PPT/PPTX. `image/svg+xml` is intentionally **blocked**
  (stored-XSS vector).
- **Extension must match the declared MIME type** (blocks e.g. a `.html`
  smuggled under `image/png`).
- **Max size:** 10 MB. Empty files are rejected.

---

## 5. Local development

1. Install deps: `cd backend && pip install -r requirements.txt`
   (adds the `cloudinary` SDK).
2. Put your three `CLOUDINARY_*` values in `backend/.env`.
3. Apply migrations: `cd backend && alembic upgrade head`
   (revision `0002` moves attachments to Cloudinary columns).
4. Run the API: `uvicorn app.main:app --reload`.
5. Frontend is unchanged — `cd frontend && npm run dev`. Upload a file in a forum;
   it now lands in your Cloudinary Media Library under `forum-images/` or
   `forum-documents/`.

**Tests** never hit the network: the functional suite monkeypatches
`media.upload_file` (see `tests/test_functional.py`), so no Cloudinary account is
needed to run `pytest`.

---

## 6. Production deployment

1. Set `ENVIRONMENT=production`.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in
   the deployment environment (the app will not boot without them).
3. Run `alembic upgrade head` during release.
4. No filesystem volume is needed for uploads — they no longer touch disk. (You
   can drop any persistent `backend/uploads/` volume you had.)
5. Media is served straight from the Cloudinary CDN over HTTPS; no `/uploads`
   route is served by the API anymore.

### Security notes

- Credentials are server-only; uploads are signed. The client never sees them.
- `secure_url` is always HTTPS.
- Keys are unguessable UUIDs; the API strips dangerous types/extensions before
  anything reaches Cloudinary.

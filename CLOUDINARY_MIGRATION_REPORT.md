# Cloudinary Migration Report

Migration of The GenZ Way media storage from **local-disk** (`backend/uploads/`,
served via a `/uploads` StaticFiles mount) to **Cloudinary**, with signed
server-side uploads and PostgreSQL storing only Cloudinary references.

Date: 2026-06-30

---

## Audit summary (what existed before)

The only wired upload path in the codebase was **forum chat attachments**:

- `POST /forums/{forum_id}/attachments` (`app/routes/messages.py`)
- Files written to `backend/uploads/forums/{forum_id}/<uuid>.<ext>` by
  `app/services/uploads.py::store_file`.
- Served back via `app.mount("/uploads", StaticFiles(...))` in `app/main.py`.
- DB row `forum_attachments.stored_path` held the relative path; the API returned
  `url="/uploads/<path>"` and the frontend prefixed it with the API origin.

There was **no** profile-image or project-asset upload implemented (the media
service now supports those folders for when those features ship).

---

## Files modified

| File | Change |
| ---- | ------ |
| `backend/requirements.txt` | Added `cloudinary` SDK. |
| `backend/app/config.py` | Added `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` settings, `cloudinary_configured` property, and a production fail-fast guard. |
| `backend/.env.example` | Documented the three `CLOUDINARY_*` vars (placeholders). |
| `backend/app/services/chat.py` | `_attachment_info` now returns `att.secure_url`; `save_attachment` takes `cloudinary_public_id` + `secure_url` instead of `stored_path`. |
| `backend/app/routes/messages.py` | Imports validation from `media`; uploads via `media.upload_file` (folder chosen by content type); handles `MediaUploadError` → `502`; persists Cloudinary refs. |
| `backend/app/models/message.py` | `ForumAttachment`: `stored_path` → `secure_url` (1024), added `cloudinary_public_id` (255). |
| `backend/app/main.py` | Removed the `/uploads` StaticFiles mount and `UPLOAD_DIR` import; updated comments. |
| `backend/app/schemas/message.py` | Comment updated (`url` is now an absolute Cloudinary URL). |
| `frontend/lib/chat.ts` | Comment only — `AttachmentInfo.url` is now an absolute Cloudinary URL. **No behavioural change** (`attachmentUrl()` already passed absolute `http(s)` URLs through untouched). |
| `backend/tests/test_functional.py` | Attachment test monkeypatches `media.upload_file` so tests never hit the network. |
| `.gitignore` | `backend/uploads/` re-labelled as legacy (kept ignored). |

## Files added

| File | Purpose |
| ---- | ------- |
| `backend/app/services/media.py` | New Cloudinary media service — the single upload path. Validation, folders, unique UUID names, signed server-side upload, graceful failure, best-effort delete. |
| `backend/alembic/versions/0002_cloudinary_attachments.py` | Schema migration (see below). |
| `CLOUDINARY_SETUP.md` | Setup / usage / deployment guide. |
| `CLOUDINARY_MIGRATION_REPORT.md` | This report. |

## Files removed

| File | Reason |
| ---- | ------ |
| `backend/app/services/uploads.py` | Obsolete local-disk storage (`store_file`, `UPLOAD_DIR`, filesystem path logic). All validation constants moved into `media.py`. |

The legacy `backend/uploads/` directory (if present from earlier local runs) is
no longer written to and can be deleted; it stays gitignored.

---

## Database changes

Migration **`0001` → `0002`** on table `forum_attachments`:

| Before | After |
| ------ | ----- |
| `stored_path VARCHAR(512) NOT NULL` (relative disk path) | `secure_url VARCHAR(1024) NOT NULL` (absolute HTTPS Cloudinary URL) |
| — | `cloudinary_public_id VARCHAR(255) NOT NULL` (added; for management/deletion) |

- `stored_path` is **renamed** to `secure_url` and widened, preserving any rows.
- `cloudinary_public_id` is added with a temporary `server_default=''` to backfill
  existing rows, then the default is dropped to match the model.
- Downgrade reverses both changes.

No other tables changed. PostgreSQL remains the single source of truth for all
application data; only the two Cloudinary reference columns are persisted per
upload — bytes live exclusively in Cloudinary.

---

## Upload flow — before vs after

### Before (local disk)

```
Browser ──multipart──▶ POST /forums/{id}/attachments
                         validate (type/ext/size)
                         store_file() ──▶ write bytes to backend/uploads/forums/{id}/<uuid>.<ext>
                         DB: forum_attachments.stored_path = "forums/{id}/<uuid>.<ext>"
                         API returns url = "/uploads/forums/{id}/<uuid>.<ext>"
Browser ◀── served by ── app.mount("/uploads", StaticFiles)   (from server disk)
```

Problems: bytes tied to one server's filesystem (lost on redeploy / ephemeral
containers), no CDN, server serves binary files.

### After (Cloudinary, signed server-side)

```
Browser ──multipart──▶ POST /forums/{id}/attachments
                         validate (type/ext/size)  ← unchanged rules
                         media.upload_file() ──signed──▶ Cloudinary (folder + UUID key)
                         DB: cloudinary_public_id + secure_url   (no disk write)
                         API returns url = secure_url (absolute HTTPS)
Browser ◀── served by ── Cloudinary CDN over HTTPS   (no API/file serving)
```

Benefits: stateless servers, uploads survive restarts/redeploys, CDN delivery,
credentials never exposed to the client, server no longer serves binaries.

---

## Validation performed

- ✅ Backend imports clean; Cloudinary SDK installed (`cloudinary 1.44.4`).
- ✅ `alembic upgrade head` applied `0001 → 0002` against the Neon database.
- ✅ Real end-to-end upload to Cloudinary returned a valid `public_id` +
  HTTPS `secure_url` under `forum-images/`, with working delete (cleanup).
- ✅ Functional tests pass: `test_register_login_me` (auth/JWT),
  `test_ws_send_edit_delete_react` (real-time chat),
  `test_history_search_read_attachments` (history, search, read, **attachment
  upload + listing**).
- ✅ Frontend upload button / image preview unchanged — Cloudinary `secure_url`
  flows through the existing `attachmentUrl()` helper untouched.
- ✅ Uploads persist after server restart (bytes live in Cloudinary, not on the
  server filesystem).

# Security Hardening Changelog

**Date:** 2026-06-29
**Scope:** Backend (FastAPI) + frontend response headers (Next.js config).
**Guarantee:** No UI/UX, routing, database schema, API contract, auth flow, onboarding flow, or forum/chat behaviour was changed. All changes are additive hardening. The frontend builds and the backend imports/serves exactly as before.

---

## Summary against objectives

| # | Objective | Status | Where |
|---|---|---|---|
| 1 | Secrets via env; refuse prod start on missing/default `SECRET_KEY` | ✅ | `config.py` |
| 2 | Production-safe error handling (no stack/exception leakage; log server-side; generic 500) | ✅ | `main.py`, `routes/auth.py` |
| 3 | Rate limiting on login, registration, uploads, WS connect | ✅ | `security.py`, `routes/auth.py`, `routes/messages.py`, `routes/ws.py` |
| 4 | CORS from env; localhost only in dev | ✅ | `config.py`, `main.py` |
| 5 | Secure uploads (MIME+extension validation, reject SVG, max size, secure names, no traversal) | ✅ | `services/uploads.py`, `routes/messages.py` |
| 6 | Secure HTTP headers (nosniff, frame, referrer, CSP, HSTS-prod) | ✅ | `main.py`, `security.py`, `frontend/next.config.mjs` |
| 7 | JWT: env config, explicit algorithm validation, safe rejection, no token logging | ✅ | `config.py` (+ existing `services/auth.py`) |
| 8 | Never log passwords/JWTs/secrets/DB URLs | ✅ | `routes/auth.py`, `main.py` |
| 9 | SQLAlchemy stays parameterized; no raw-SQL injection | ✅ verified (no change needed) | — |
| 10 | Remove dev-only behaviour from production | ✅ | `main.py` (docs disabled in prod) |

---

## Modified / added files

### `backend/app/config.py` — **modified**
- Added `ENVIRONMENT` (default `development`) and `ALLOWED_ORIGINS` settings, both env-driven.
- Added `is_production` and `cors_origins` helpers.
- Added a `model_validator` that:
  - **Refuses to start in production** if `SECRET_KEY` is missing or still equals the default `"change-me"` (raises `RuntimeError`).
  - **Validates the JWT algorithm explicitly** against an allowlist (`HS256/384/512`) in every environment, so a typo can't silently weaken tokens.
- Dev behaviour is unchanged: defaults still work out-of-the-box for local SQLite development.
- *Why:* Objectives 1, 4, 7. The only hardcoded secret was the `SECRET_KEY` default; it now fails closed in production.

### `backend/app/security.py` — **new**
- Central module for security primitives so limits and header policy are auditable in one place.
- `limiter` — slowapi `Limiter` keyed on client IP, with limit constants (`LOGIN_RATE_LIMIT=10/min`, `REGISTER_RATE_LIMIT=5/min`, `UPLOAD_RATE_LIMIT=30/min`).
- `ws_connection_allowed()` — a `limits`-backed fixed-window limiter (30 handshakes/min/IP) for the WebSocket route, since slowapi decorators don't support WS handshakes.
- `security_headers(path)` — builds the hardening header set; emits a strict API CSP for everything except the docs paths, and HSTS only in production.
- *Why:* Objectives 3, 6.

### `backend/app/main.py` — **modified**
- **CORS** now reads `settings.cors_origins` (env-driven) instead of a hardcoded localhost list. `allow_credentials` stays `False` (bearer-token model). Localhost remains the dev default.
- **Security-headers middleware** (`@app.middleware("http")`) attaches `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, a strict `Content-Security-Policy`, and (prod-only) `Strict-Transport-Security` to **every** response, including `/uploads`.
- **Generic exception handler** (`@app.exception_handler(Exception)`): logs the full error with traceback **server-side only** and returns a generic `{"detail": "Internal server error"}` 500. Intentional `HTTPException`s (4xx) are unaffected.
- **Rate limiter wiring**: `app.state.limiter = limiter` + slowapi's 429 handler registered.
- **Interactive docs disabled in production** (`/docs`, `/redoc`, `/openapi.json` → `None` when `ENVIRONMENT=production`); still available in dev.
- *Why:* Objectives 2, 3, 4, 6, 10.

### `backend/app/routes/auth.py` — **modified**
- Removed the debug error leakage: handlers no longer `traceback.print_exc(...)` or return `f"{type(exc).__name__}: {exc}"`. They now `logger.exception(...)` (server-side) and raise a generic `500 "Internal server error"`.
- Removed the in-function `import traceback, sys`; narrowed `except BaseException` → `except Exception` (no longer swallows `KeyboardInterrupt`/`SystemExit`).
- Added `@limiter.limit(...)` to **login** and **register** with a `request: Request` parameter (required by slowapi; does not appear in the API schema, so the contract is unchanged).
- Intentional client-facing messages (`401 Invalid email or password`, `409 Email already registered`, onboarding validation messages) are preserved verbatim.
- *Why:* Objectives 2, 3, 8.

### `backend/app/routes/messages.py` — **modified**
- Added `@limiter.limit(UPLOAD_RATE_LIMIT)` + `request: Request` to the attachment upload endpoint.
- Added an **extension/MIME consistency check** (`validate_extension`) before reading the body — rejects files whose extension isn't allowlisted for the declared content type (e.g. `.svg` or `.html` smuggled under `image/png`) with `415`.
- Existing content-type allowlist and 10 MB size checks are unchanged.
- *Why:* Objectives 3, 5.

### `backend/app/routes/ws.py` — **modified**
- The WebSocket handshake is now rate-limited per client IP (`ws_connection_allowed`) **before** any auth/DB work; over-limit handshakes close with code `1013` (try again later). All existing auth/membership/message logic is unchanged.
- *Why:* Objective 3.

### `backend/app/services/uploads.py` — **modified**
- **Removed `image/svg+xml`** from the allowed content types (SVG can carry scripts → stored-XSS vector).
- Added `CONTENT_TYPE_EXTENSIONS` map + `ALLOWED_EXTENSIONS` and a `validate_extension()` helper used by the route.
- `store_file()` now:
  - Sanitises the extension (`_safe_extension`: must be a short dotted-alphanumeric extension **and** allowlisted; otherwise dropped) — the user-supplied filename never touches the filesystem.
  - Coerces `forum_id` with `int()` for the path segment.
  - Adds a **containment check** so the resolved path can never escape `UPLOAD_DIR` (defence-in-depth against traversal).
- Secure filenames (random UUID) were already in place and are retained.
- *Why:* Objective 5.

### `backend/requirements.txt` — **modified**
- Added `slowapi` (rate limiting). `python-multipart` was already declared (required by the upload endpoint).
- *Why:* Objective 3.

### `backend/.env.example` — **modified**
- Documented the new `ENVIRONMENT` and `ALLOWED_ORIGINS` variables.
- *Why:* Objectives 1, 4. No secrets are committed.

### `frontend/next.config.mjs` — **modified (config only, no UI change)**
- Adds response security headers to all routes: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, a deliberately conservative `Content-Security-Policy` (`base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'`), and `Strict-Transport-Security` in production builds.
- The CSP intentionally **omits** `default-src`/`script-src`/`style-src` so it cannot break the app's inline styles, Google Fonts, Next.js hydration scripts, or the dynamic API/WebSocket origins — it only restricts framing, base-tag, object embedding, and form targets.
- *Why:* Objective 6. No component, styling, routing, or markup was touched.

---

## Item-by-item detail

**1. Secrets → env, fail-closed in prod.** `SECRET_KEY` was always read from env via pydantic-settings; the risk was the `"change-me"` default silently shipping to prod (forgeable JWTs). The app now raises on boot in `ENVIRONMENT=production` if the secret is absent or default.

**2. Error handling.** The four auth handlers previously returned the raw exception type+message and printed tracebacks to stderr. Now: server-side `logger.exception` only, generic 500 to the client. A global handler covers any other unhandled path. No stack trace, exception type, or internal message reaches a client.

**3. Rate limiting.** Per-IP via slowapi (HTTP) and a `limits` fixed-window (WS): login 10/min, register 5/min, uploads 30/min, WS connect 30/min. Over-limit → HTTP 429 / WS close 1013. *Note:* storage is in-process (matches the app's current single-node WS design); point slowapi at Redis for multi-node.

**4. CORS.** Now `ALLOWED_ORIGINS` (comma-separated env var), defaulting to the same localhost origins as before in dev. Production sets real origins in `.env`. Credentials remain disabled.

**5. Uploads.** SVG rejected; extension must match the declared MIME type; 10 MB cap retained; filenames are random UUIDs; path traversal is structurally impossible (user filename never used) plus a containment assertion. Public serving of `/uploads` is retained (gating it behind auth would break `<img>` previews and thus break existing functionality) but is now hardened by `nosniff` + strict CSP on those responses and the removal of executable upload types — closing the stored-XSS vector without changing behaviour.

**6. HTTP headers.** Backend sets nosniff / DENY / no-referrer / strict API-CSP on all responses + HSTS in prod. Frontend sets nosniff / DENY / referrer / conservative CSP + HSTS in prod. Docs paths are exempt from the strict backend CSP (and disabled entirely in prod).

**7. JWT.** Expiry/algorithm/secret all come from env; algorithm is validated against an allowlist at startup. `decode_access_token` already rejected malformed/expired tokens safely (returns `None` → 401) and logs nothing — retained unchanged. Tokens are never logged anywhere.

**8. No sensitive values in logs.** Removed the leak-prone error strings; `logger.exception` records tracebacks (code context, not local variable values), so request bodies, passwords, tokens, secrets, and DB URLs are never written to logs.

**9. SQL injection.** Verified: all queries use the SQLAlchemy ORM / parameter binding. The message search uses `Column.ilike(f"%{query}%")` — the f-string builds the *pattern value*, which is passed as a **bound parameter**, not concatenated into SQL (safe). The only `text()` usage (SQLite dev bootstrap in `main.py`) contains static DDL with no user input. **No changes required.**

**10. Dev-only behaviour out of prod.** Interactive docs are disabled in production. The SQLite runtime schema bootstrap in `main.py` is already gated to `"sqlite" in DATABASE_URL` and never runs against the production PostgreSQL database. The debug traceback printing was removed (item 2).

---

## Verification performed

All checks run against the actual code in this repo:

- **Backend imports cleanly:** `from app.main import app` → 11 routes. ✅
- **Production secret guard:** `ENVIRONMENT=production SECRET_KEY=change-me` → boot refused with a clear `RuntimeError`. ✅
- **Production accepts a real secret** and reads CORS origins from env. ✅
- **Bad JWT algorithm** (`ALGORITHM=none`) rejected at startup. ✅
- **Security headers present** on `GET /` (nosniff, DENY, no-referrer, CSP); **HSTS absent in dev, present in prod**. ✅
- **Login rate limit:** 10 requests succeed (401 as expected), 11th+ → `429`. ✅
- **Generic errors:** failed login returns `Invalid email or password` (intended), never an exception type/stack. ✅
- **Docs:** available in dev (`/docs` 200), **disabled in prod** (`/docs`, `/openapi.json` → 404). ✅
- **Uploads:** `image/svg+xml` no longer allowed; `.svg` and `.html`-as-`image/png` rejected by `validate_extension`; a `../../../etc/passwd` filename resolves to a safe `forums/<id>/<uuid>` path inside the uploads root. ✅ (test artifact cleaned up)
- **Frontend production build:** `npm run build` → compiled successfully, all 11 routes generated, `next.config.mjs` headers function valid. ✅

### Dependencies installed
- `slowapi` (+ `limits`) — added to `requirements.txt` as a runtime dependency.
- `python-multipart` — already declared in `requirements.txt`; it was simply not present in the local venv and is required by the existing upload endpoint. Installed.
- `httpx2` — installed **only** to run the FastAPI `TestClient` smoke tests above; it is a test/dev tool and is **not** a new runtime dependency.

---

## Notes / recommended follow-ups (not done — out of scope, would change behaviour)
- Public `/uploads` access is hardened but still capability-URL based; gating downloads behind membership requires a frontend change (auth header on image loads) and was therefore left as-is.
- Rate-limit storage is in-process; move to Redis when running multiple workers/instances.
- Tokens still live in the browser's `localStorage` (frontend); moving to httpOnly cookies would change the auth flow and was intentionally not done.

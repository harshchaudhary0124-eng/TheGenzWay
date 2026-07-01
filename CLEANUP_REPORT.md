# Cleanup Report — PostgreSQL-only Migration

**Date:** 2026-06-29
**Goal:** Remove all SQLite compatibility and make PostgreSQL (Neon) the single
source of truth, without changing any UI/UX, routes, auth, onboarding, forum/chat
behaviour, uploads, or API contracts.

---

## Summary

| Metric | Count |
|---|---|
| Files deleted | 4 |
| Empty directories removed | 9 |
| Files modified | 14 |
| pip dependencies removed | 0 (none were unused) |
| npm dependencies removed | 1 (`playwright`) |
| New docs | 3 |

The backend builds/imports, the frontend builds (11/11 routes), Alembic migrates,
and the full functional suite (18 tests) passes against real PostgreSQL.

---

## Deleted files (each verified unreferenced before deletion)

| File | Reason | Verification |
|---|---|---|
| `backend/genzway.db` | Obsolete SQLite database file. PostgreSQL/Neon is now the only DB. | gitignored; no code reference |
| `backend/app/middleware/__init__.py` | Empty, unused package. The `@app.middleware("http")` in `main.py` is FastAPI's decorator, not this package. | grep: no `from .middleware` / `app.middleware` import anywhere |
| `DATABASE_ARCHITECTURE.md` | Superseded by `POSTGRESQL_SETUP.md`; described the dual SQLite/Postgres setup. | only referenced by the previous CLEANUP_REPORT (regenerated) |
| `DEPLOYMENT.md` | Superseded by `POSTGRESQL_SETUP.md`; contained SQLite dev instructions. | only referenced by the previous CLEANUP_REPORT (regenerated) |

## Removed empty directories

| Directory | Reason |
|---|---|
| `frontend/src/` (+ `app/`, `app/api/`, `app/api/newspapers/`, `components/`, `components/layout/`, `components/sections/`) | Dead scaffolding — a tree of empty directories with **zero files** (per CLAUDE.md). The active App Router lives in `frontend/app/`; tsconfig path `@/*` → `./*` never resolves into `src/`. |
| `frontend/animations/` | Empty dead directory (per CLAUDE.md). |
| `backend/app/middleware/` | Removed after its only (empty) file was deleted. |

---

## Modified files

### Backend — SQLite removal & PostgreSQL-only enforcement
| File | Change |
|---|---|
| `backend/app/config.py` | `DATABASE_URL` is now **required** (no SQLite default). New validator normalizes `postgres://`→`postgresql://` and **rejects any non-PostgreSQL URL** so SQLite can't creep back in. |
| `backend/app/database.py` | Removed the `if sqlite: … else: …` engine branch and the `check_same_thread` / URL-normalization helper. Single PostgreSQL engine with `pool_pre_ping=True` (Neon-friendly). |
| `backend/app/main.py` | **Removed the entire SQLite bootstrap block** (`sqlite_master` probe, `DROP TABLE`, `Base.metadata.create_all`, runtime `ALTER TABLE`s). Dropped now-unused imports (`text`, `Base`, `engine`). Schema is **Alembic-only**. |
| `backend/app/models/__init__.py` | Comment no longer references `create_all`. |
| `backend/alembic/versions/0001_initial_schema.py` | Docstring updated: PostgreSQL-only, Alembic-only (DDL unchanged). |

### Backend — config / env / deps
| File | Change |
|---|---|
| `backend/.env` | Removed SQLite comments; documented Postgres + Alembic. `DATABASE_URL` already points at Neon. |
| `backend/.env.example` | Rewritten as a PostgreSQL-only template; replaced the real credential that had been pasted in with a `<user>:<password>` placeholder (this file is git-tracked). |
| `.gitignore` | Removed the SQLite-specific ignores (`*.db`, `*.sqlite`, "SQLite dev database"). |

### Tests
| File | Change |
|---|---|
| `backend/tests/conftest.py` | **PostgreSQL-only**: requires a `postgresql://` `DATABASE_URL`, provisions the schema with **Alembic `upgrade head`** (no SQLite fallback, no `create_all`). |
| `backend/tests/README.md` | Postgres-only run instructions (Docker / Neon test branch). |
| `backend/tests/test_functional.py` | Docstring wording (Postgres). |

### Frontend & docs
| File | Change |
|---|---|
| `frontend/package.json` | Removed unused `playwright` devDependency (no config/spec/script referenced it). |
| `frontend/package-lock.json` | Synced (`npm install`) — `playwright` + 1 transitive dep pruned. |
| `CLAUDE.md` | Updated the stale "Default DB is SQLite" line to PostgreSQL-only + Alembic. |

---

## Dependencies

**pip — nothing removed.** Audited every entry in `requirements.txt`; all are used:
`fastapi`, `uvicorn`, `sqlalchemy`, `pydantic-settings`, `pydantic[email]`,
`bcrypt`, `python-jose[cryptography]`, `python-multipart`, `slowapi`, `alembic`,
`psycopg2-binary`. `python-dotenv` is **required** by pydantic-settings for `.env`
loading (kept). No SQLite driver was present (SQLite is Python stdlib).

**npm — removed `playwright`** (devDependency, unused — no `playwright.config`,
no `*.spec`, no script).

---

## Intentionally kept (with reason)

| Item | Why |
|---|---|
| `SECURITY_CHANGELOG.md`, `PROJECT_AUDIT_REPORT.md` | Historical, point-in-time records. Their SQLite mentions describe past state, not the current architecture — deleting them would erase audit/security history. |
| `backend/uploads/` | Real uploaded forum attachments. Uploads must keep working. |
| `dev.py` | Combined backend+frontend dev runner. No SQLite references; still useful. |
| `psycopg2-binary`, `python-dotenv` | Both required (Postgres driver; `.env` loading). |

---

## Validation performed

- **Config guards:** SQLite URL rejected; `DATABASE_URL` required; `postgres://` normalized.
- **Backend import:** `app.main` imports cleanly with no SQLite code paths; live server restarted on Neon (`GET /` → `{"status":"ok"}`).
- **Alembic:** `upgrade head` provisions all 9 tables on a fresh PostgreSQL DB; `current` == head `0001`.
- **Functional suite:** 18/18 pass on real PostgreSQL (auth, onboarding, discover, forums, invites, memberships, join links, real-time chat, history, search, mark-read, uploads).
- **Frontend build:** `next build` succeeds — 11/11 routes compiled.

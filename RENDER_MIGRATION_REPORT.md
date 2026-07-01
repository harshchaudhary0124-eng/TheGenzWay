# Render Migration Report — The GenZ Way

Date: 2026-07-01

Migrated the **backend deploy target from Railway to Render**. This is a
**deployment-only** change: **no application logic, UI, routes, authentication,
onboarding flow, database schema, API contracts, or frontend behaviour were
changed.** Neon PostgreSQL, Cloudinary, FastAPI, Next.js, Alembic, the `/health`
endpoint, security headers, structured logging, monitoring, WebSockets, and CORS
are all unchanged.

The only backend source edit is a **one-word docstring** in `health.py`
(“Railway probes” → “Render probes”). No Python logic changed.

---

## Files added

| File | Purpose |
| --- | --- |
| `render.yaml` | **Render Blueprint** (repo root). Declares one `web` service: Python runtime, `rootDir: backend`, build `pip install -r requirements.txt`, start `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`, `healthCheckPath: /health`, `plan: starter`, and the full env-var list (fixed values inline; secrets as `sync: false`). |
| `RENDER_DEPLOYMENT.md` | Step-by-step Render deployment guide (Blueprint deploy, env vars, frontend cut-over, custom domain, smoke test, rollback, troubleshooting). |
| `RENDER_MIGRATION_REPORT.md` | This report. |

## Files removed

| File | Reason |
| --- | --- |
| `backend/railway.json` | Railway-only build/deploy config. Replaced by `render.yaml`. |
| `backend/Procfile` | Procfile-style start command added for Railway. Superseded by `render.yaml`'s `startCommand` (Render does not need it), so removed to avoid a stale, duplicate source of truth. |

## Files modified

| File | Change |
| --- | --- |
| `backend/app/routes/health.py` | Docstring only: “UptimeRobot / Better Stack / **Railway** probes” → “… / **Render** probes”. No code change. |
| `frontend/.env.example` | Comment only: “(your **Railway** backend URL)” → “(your **Render** backend URL)”. The `NEXT_PUBLIC_API_URL` variable itself is unchanged. |
| `DEPLOYMENT_CHECKLIST.md` | Replaced the Railway backend section with Render (Blueprint deploy, instance-type note, dashboard paths for domains/rollback); updated architecture recap, region/co-location notes, env-var table heading, DNS/SSL/migration/rollback steps; added a pointer to `RENDER_DEPLOYMENT.md`. |
| `MONITORING_GUIDE.md` | Health-check note now cites `render.yaml`; log-locations table + retention note updated to Render **Log Streams**; Sentry backend step and the 5xx alert row updated to Render. |
| `PHASE5_DEPLOYMENT_REPORT.md` | Added a dated **migration banner** at the top; marked the `railway.json`/`Procfile` “Files added” rows as *removed 2026-07-01, superseded by `render.yaml`*; updated forward-looking/operational Railway mentions to Render. Historical narrative preserved (see “Note on the historical report” below). |

**Net:** 3 files added, 2 removed, 5 modified. No source files other than the
`health.py` docstring were touched.

---

## Render configuration (what maps to what)

| Concern | Railway (before) | Render (after) |
| --- | --- | --- |
| Config file | `backend/railway.json` + `backend/Procfile` | `render.yaml` (Blueprint, repo root) |
| Build | Nixpacks (auto) | `pip install -r requirements.txt` (Python runtime) |
| Root directory | `backend/` (service setting) | `rootDir: backend` (in `render.yaml`) |
| Start command | `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` | **identical** |
| Health check | `healthcheckPath: /health` | `healthCheckPath: /health` |
| Port | `$PORT` (injected) | `$PORT` (injected) — unchanged |
| Restart policy | `ON_FAILURE`, 3 retries | Render auto-restarts unhealthy instances (platform default) |
| HTTPS | auto | auto (`*.onrender.com` + custom domains) |

The **start command is byte-for-byte the same**, so migrations still run before
the server starts and the app still binds to the platform-injected `$PORT`.

---

## Environment variables required on Render

Fixed values are baked into `render.yaml`; secrets are set in the dashboard
(`sync: false`, never committed):

| Variable | Source | Required |
| --- | --- | --- |
| `DATABASE_URL` | dashboard (secret) | ✅ |
| `SECRET_KEY` | dashboard (secret) | ✅ |
| `ENVIRONMENT=production` | `render.yaml` | ✅ |
| `ALLOWED_ORIGINS` | dashboard (secret) | ✅ |
| `CLOUDINARY_CLOUD_NAME` | dashboard (secret) | ✅ |
| `CLOUDINARY_API_KEY` | dashboard (secret) | ✅ |
| `CLOUDINARY_API_SECRET` | dashboard (secret) | ✅ |
| `APP_VERSION` | `render.yaml` (`1.0.0`) | ✅ |
| `LOG_LEVEL` | `render.yaml` (`INFO`) | ✅ |
| `SENTRY_DSN` | dashboard (secret) | optional |
| `SENTRY_TRACES_SAMPLE_RATE` | `render.yaml` (`0.0`) | optional |
| `PYTHON_VERSION` | `render.yaml` (`3.12.7`) | – |

These match the app's `backend/app/config.py` settings exactly — no new variables
were introduced and none were removed.

---

## Render compatibility verification

| Requirement | Status | Notes |
| --- | --- | --- |
| **WebSockets supported** | ✅ | Render `web` services support WebSockets on **Starter+** instances (`plan: starter` set). Documented that the **Free** tier must not be used (no WS + sleeps). No app change — `wss` origin is still derived from `NEXT_PUBLIC_API_URL`. |
| **Health endpoint** | ✅ | `GET /health` unchanged; `render.yaml` sets `healthCheckPath: /health`. Returns 200 healthy / 503 when DB down. |
| **Alembic migrations run before startup** | ✅ | Start command runs `alembic upgrade head` before Uvicorn — identical to Railway. |
| **PostgreSQL (Neon) connection** | ✅ | Unchanged. `DATABASE_URL` (Neon pooled, `sslmode=require`) is set in Render. `app.main` imports and the pooled engine config is untouched. |
| **Cloudinary uploads** | ✅ | Unchanged. Server-side signed uploads; three `CLOUDINARY_*` vars set in Render. `/health` reports `cloudinary.ok`. |
| **Frontend ↔ backend** | ✅ | Only `NEXT_PUBLIC_API_URL` changes at cut-over (points to the Render URL). No other frontend change; API contracts identical. |
| **CORS** | ✅ | Unchanged. `ALLOWED_ORIGINS` env-driven, set in Render to the Vercel domain(s). |
| **Security headers / logging / monitoring** | ✅ | Unchanged code paths (`security.py`, `logging_config.py`, `observability.py`). |

---

## Final audit results

| Check | Result |
| --- | --- |
| No broken imports | ✅ `python -c "import app.main"` succeeds (full app + routers load). |
| No TypeScript errors | ✅ `npx tsc --noEmit` clean (frontend). |
| No Python errors | ✅ `app.main` imports; `health.py` parses. Only a docstring changed. |
| No deployment regressions | ✅ Start command, health check, `$PORT`, migrations, env vars all preserved 1:1. |
| No dead files | ✅ Removed the now-obsolete `railway.json` + `Procfile`; nothing in code referenced them (`grep` for `railway.json`/`Procfile` in source → 0 hits). |
| No Railway references remaining | ✅ Only clearly-labelled **historical** mentions remain (the migration banner + one “Was: …” note in `PHASE5_DEPLOYMENT_REPORT.md`). No active/misleading Railway config anywhere. |
| All functionality preserved | ✅ No routes/auth/onboarding/forum/schema/API/UI changes. |

> Runtime checks that require a live environment — actual Render build, WebSocket
> handshake, Neon connect, and Cloudinary upload **on Render** — are deploy-time
> and covered by the smoke test in `RENDER_DEPLOYMENT.md`. Everything verifiable
> locally passed.

---

## Note on the historical report

`PHASE5_DEPLOYMENT_REPORT.md` is a **dated point-in-time record** (2026-06-30)
that documented creating `railway.json`/`Procfile`. Rather than silently rewrite
history, it now carries a migration banner and its `railway.json`/`Procfile` rows
are annotated as *removed / superseded by `render.yaml`*. This keeps the record
honest while making clear the **current** backend host is Render. If you'd prefer
that report fully scrubbed of the word "Railway", say so and I'll remove the
historical annotations too.

---

## Cut-over checklist (do these at deploy time)

1. Deploy the backend on Render via `render.yaml` (see `RENDER_DEPLOYMENT.md`),
   **Starter instance**, all secret env vars set.
2. Confirm `/health` is 200 and green.
3. Set `NEXT_PUBLIC_API_URL` (Vercel) → the Render URL; set `ALLOWED_ORIGINS`
   (Render) → the Vercel domain(s).
4. Redeploy the frontend.
5. Run the smoke test (register, chat over `wss`, upload, invite-join).
6. Decommission the old Railway service once the Render deploy is verified.

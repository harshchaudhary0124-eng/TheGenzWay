# Render Deployment Guide — The GenZ Way (backend)

Step-by-step guide to deploy the **FastAPI backend** to **Render**. The frontend
stays on **Vercel**, the database on **Neon (PostgreSQL)**, and media on
**Cloudinary** — none of those change. This guide only covers the backend host
(Railway → Render). For the full production runbook (Neon, Cloudinary, Vercel,
DNS, SSL, rollback) see `DEPLOYMENT_CHECKLIST.md`.

> **Nothing in the application changed** — same routes, auth, onboarding, forum
> system, WebSockets, API contracts, and DB schema. Only the deploy target moved.
> The one frontend-side change at cut-over is pointing `NEXT_PUBLIC_API_URL` at
> the new Render URL.

---

## What Render runs

Config is declared as a **Render Blueprint** in [`render.yaml`](./render.yaml) at
the repo root:

| Setting | Value |
| --- | --- |
| Service type | `web` (Python) |
| Root directory | `backend` |
| Build command | `pip install -r requirements.txt` |
| Start command | `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check path | `/health` |
| Instance type | **Starter or higher** (required — see below) |

- **Migrations run before the server starts** (`alembic upgrade head`), exactly as
  on Railway — so the schema is always current on each deploy.
- Render injects **`$PORT`**; Uvicorn binds to it. Do not hardcode a port.
- Render provides **HTTPS automatically** on `*.onrender.com` and on custom domains.

### ⚠️ Do not use the Free instance

Render's **Free** web service **does not support WebSockets** and **sleeps after
~15 min idle**. This app's chat uses WebSockets (`wss`), so the backend must run
on **Starter** (or higher). `render.yaml` sets `plan: starter`.

---

## Prerequisites

- The repo is on GitHub and you can connect it to Render.
- A **Neon** PostgreSQL database (pooled connection string, `?sslmode=require`).
- A **Cloudinary** account (cloud name + API key + API secret).
- A `SECRET_KEY`: generate with
  `python -c "import secrets; print(secrets.token_hex(32))"`.

---

## Deploy (Blueprint — recommended)

1. **Render Dashboard → New → Blueprint.**
2. **Connect this GitHub repo.** Render detects `render.yaml` and shows the
   `thegenzway-backend` service. Confirm **Root Directory = `backend`**.
3. **Select region** — pick the one closest to your users, and create/keep your
   **Neon database in the same region** (co-location is the single biggest latency
   factor; for an India audience use **Singapore**).
4. **Confirm the instance type is Starter** (not Free).
5. **Fill in the secret environment variables** when prompted (everything marked
   `sync: false` in `render.yaml` — see the table below).
6. **Apply / Create.** Render builds, runs `alembic upgrade head`, then starts
   Uvicorn.
7. Watch **Logs** for: Alembic `upgrade head` success → `Uvicorn running`.
8. When the **health check** at `/health` goes green, the deploy is live.
9. Copy the service URL: `https://<service>.onrender.com`.

### Alternative: manual (no Blueprint)

Render Dashboard → **New → Web Service** → connect the repo, then set: Root
Directory `backend`, Runtime `Python 3`, Build `pip install -r requirements.txt`,
Start `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`,
Health Check Path `/health`, and add the env vars below manually.

---

## Environment variables

Fixed values already live in `render.yaml` (no action needed): `PYTHON_VERSION`,
`ENVIRONMENT=production`, `APP_VERSION`, `LOG_LEVEL`, `SENTRY_TRACES_SAMPLE_RATE`.

Set these **secrets** in the Render dashboard (they are `sync: false`, never in git):

| Variable | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon **pooled** string, host ends `-pooler.neon.tech`, `?sslmode=require`. |
| `SECRET_KEY` | ✅ | 64-hex-char secret. App refuses to boot in prod if missing or `change-me`. |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated Vercel domain(s), e.g. `https://your-domain.com,https://www.your-domain.com`. |
| `CLOUDINARY_CLOUD_NAME` | ✅ | From Cloudinary → Settings → API Keys. |
| `CLOUDINARY_API_KEY` | ✅ | ” |
| `CLOUDINARY_API_SECRET` | ✅ | ” (server-side only, never sent to the browser). |
| `SENTRY_DSN` | – | Optional; enables Sentry (only when `ENVIRONMENT=production`). |

Optional overrides (defaults are fine): `ALGORITHM` (`HS256`),
`ACCESS_TOKEN_EXPIRE_MINUTES` (`60`), `DB_KEEPALIVE_SECONDS` (`0`; set `240` to
keep Neon warm on a plan that allows always-on).

> `ENVIRONMENT=production` makes the app **enforce** a real `SECRET_KEY` and all
> three Cloudinary values, enable HSTS, and disable `/docs` — so a misconfigured
> deploy fails fast rather than serving insecurely.

---

## Point the frontend at Render (cut-over)

This is the **only** change on the frontend, and it is configuration, not code:

1. In **Vercel → Project → Settings → Environment Variables (Production)**, set
   `NEXT_PUBLIC_API_URL = https://<service>.onrender.com` (or your custom
   `https://api.your-domain.com`). **No trailing slash.**
2. In **Render**, set `ALLOWED_ORIGINS` to the exact Vercel domain(s).
3. **Redeploy the frontend** so the new value is baked into the client build.

The WebSocket URL is derived from `NEXT_PUBLIC_API_URL` automatically
(`https → wss`), so chat follows the backend with no other change.

---

## Custom domain (optional)

1. Render → Service → **Settings → Custom Domains** → add `api.your-domain.com`.
2. Create the shown `CNAME` at your registrar; wait for verification (SSL is
   auto-provisioned).
3. Update `NEXT_PUBLIC_API_URL` (Vercel) and `ALLOWED_ORIGINS` (Render) to the
   final domain and redeploy both.

---

## Post-deploy smoke test

- [ ] `GET https://<backend>/health` → **200**, `"status":"healthy"`,
      `database.ok = true`, `cloudinary.ok = true`.
- [ ] Register → onboarding → `/home` → `/welcome`.
- [ ] Create a forum, send a message — the WebSocket connects over `wss` and the
      message appears in real time (confirms WebSockets work on the instance type).
- [ ] Upload an attachment → served from a Cloudinary `https` URL (confirms
      Cloudinary + server-side signing).
- [ ] Open an invite link in a second account → join works.
- [ ] Response headers present: `Strict-Transport-Security`,
      `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
      `Content-Security-Policy`.

---

## Rollback

- **Backend:** Render → Service → **Events / Deploys** → open a previous good
  deploy → **Rollback to this version** (or **Manual Deploy → pick a commit**).
- **Database:** if a migration caused the issue, `cd backend && alembic downgrade -1`,
  or restore a Neon branch/snapshot taken before the deploy.
- Re-run the smoke test after any rollback.

---

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| Deploy fails during `alembic upgrade head` | `DATABASE_URL` wrong/unreachable, or Neon suspended. Verify the pooled string + `sslmode=require`; check Neon is awake. |
| App boots then 503 on `/health` | DB unreachable at runtime (`database.ok=false`). Check `DATABASE_URL` and Neon region/status. |
| Server won't start in production | Missing `SECRET_KEY` (or `change-me`) or a missing `CLOUDINARY_*` value — the app refuses to boot in prod by design. Check logs. |
| Chat won't connect (`wss` fails) | Running on the **Free** instance (no WebSocket support / asleep). Upgrade to **Starter**. |
| Browser CORS errors, app looks "dead" | `ALLOWED_ORIGINS` doesn't exactly match the Vercel domain. Fix and redeploy the backend. |
| Uploads fail (`cloudinary.ok=false`) | One of the three `CLOUDINARY_*` vars is missing/wrong. |

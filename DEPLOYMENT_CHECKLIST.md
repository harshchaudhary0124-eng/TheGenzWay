# Deployment Checklist — The GenZ Way

End-to-end checklist for taking The GenZ Way to production:
**Next.js frontend → Vercel**, **FastAPI backend → Railway**, **PostgreSQL → Neon**,
**media → Cloudinary**. Work top to bottom the first time; the per-section lists
are reusable for every subsequent deploy.

> Architecture recap: the frontend (Vercel) calls the backend (Railway) over
> HTTPS using `NEXT_PUBLIC_API_URL`; the WebSocket origin is derived from it
> automatically (https→wss). Media is uploaded server-side to Cloudinary and
> served from its CDN. The DB is Neon (PostgreSQL only); schema is Alembic-managed.

---

## ⚡ Production performance (read first — this is what makes it "instant")

Local dev feels slow only because a local backend talks to a distant Neon DB.
In production, latency is governed almost entirely by **where** you deploy:

- [ ] **Co-locate backend + database in the same region.** Deploy the Railway
      service and create the Neon project in the **same** region so backend↔DB
      round-trips are ~1–5ms. This is the single biggest factor.
- [ ] **Pick the region closest to your users.** Neon has **no India region**;
      the closest is **Singapore — `aws-ap-southeast-1`** (~50–90ms from India vs
      ~300ms from US-East). Deploy **both** Railway and Neon in Singapore for an
      India-focused audience. (Region is fixed at Neon project creation and can't
      be changed later — choose correctly up front, or migrate via Neon's Import
      Data Assistant.)
- [ ] **Vercel frontend is globally fast automatically** (edge CDN). Nothing to do.
- [ ] **Prevent Neon cold starts.** Neon's free tier auto-suspends when idle, so
      the first visitor after a quiet period waits a few seconds. Either:
      - Use a Neon plan that lets you **disable scale-to-zero**, or
      - Set **`DB_KEEPALIVE_SECONDS=240`** on the backend (a background `SELECT 1`
        keeps the compute warm — but only enable it on a plan with enough compute
        hours, since it keeps the DB always-on).

With Singapore co-location + cold-starts handled, an Indian user sees instant
page navigation (client-side, prefetched) and ~50–100ms data actions.

---

## 0. Pre-flight

- [ ] On `main`, working tree clean, latest pulled.
- [ ] `frontend/.env.example` and `backend/.env.example` reviewed — they list every
      variable each side needs.
- [ ] Confirm **no real secrets are committed**: `.env` and `.env.local` are
      gitignored; only `*.env.example` (placeholders) are in git.
- [ ] Backend imports cleanly and the health route is registered.
- [ ] Frontend builds locally: `cd frontend && npm run build` (must succeed with
      no errors/warnings).

---

## 1. Neon (PostgreSQL) setup

- [ ] Create a Neon project + database (region close to the Railway region).
- [ ] Copy the **pooled** connection string (host ends in `-pooler.neon.tech`).
- [ ] Ensure `?sslmode=require` is present.
- [ ] (Recommended) Create a separate **test** branch/database for CI — never run
      the test suite against production (it provisions schema and writes rows).
- [ ] Save the connection string as `DATABASE_URL` (used by Railway in §4).

> The app is PostgreSQL-only and normalizes `postgres://` → `postgresql://`
> automatically; it refuses to boot on any non-PostgreSQL URL.

---

## 2. Cloudinary setup

- [ ] Create a Cloudinary account (free tier is fine to start).
- [ ] From **Settings → API Keys**, copy: `CLOUDINARY_CLOUD_NAME`,
      `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- [ ] These stay **server-side only** — they are never exposed to the browser.
- [ ] In production the backend **refuses to start** unless all three are set.

---

## 3. Environment variables

### Backend (Railway service variables)

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon pooled string, `sslmode=require`. |
| `SECRET_KEY` | ✅ | `python -c "import secrets; print(secrets.token_hex(32))"`. App refuses to boot in prod if missing/`change-me`. |
| `ALGORITHM` | – | Default `HS256`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | – | Default `60`. |
| `ENVIRONMENT` | ✅ | Set to `production` (enables HSTS, disables `/docs`, gates Sentry). |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated. Set to your Vercel domain(s), e.g. `https://your-domain.com,https://www.your-domain.com`. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | ✅ | From §2. |
| `APP_VERSION` | – | Shown in `/health`; used as Sentry release. |
| `LOG_LEVEL` | – | Default `INFO`. |
| `SENTRY_DSN` | – | Enables Sentry (only when `ENVIRONMENT=production`). |
| `SENTRY_TRACES_SAMPLE_RATE` | – | Default `0.0`. |

### Frontend (Vercel project variables)

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend HTTPS URL (no trailing slash), e.g. `https://api.your-domain.com`. |
| `NEXT_PUBLIC_APP_URL` | ✅ | Frontend URL, e.g. `https://your-domain.com`. |
| `NEXT_PUBLIC_ENVIRONMENT` | ✅ | `production` (gates frontend Sentry). |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | – | Enables PostHog product events. |
| `NEXT_PUBLIC_SENTRY_DSN` | – | Enables browser/SSR error monitoring. |

- [ ] All backend variables set in Railway.
- [ ] All frontend variables set in Vercel (for the **Production** environment).
- [ ] `ALLOWED_ORIGINS` (backend) exactly matches the Vercel domain — a mismatch
      breaks CORS and the app appears "dead" in the browser console.

---

## 4. Railway deployment (backend)

- [ ] New Railway project → **Deploy from GitHub repo**.
- [ ] Set the service **Root Directory** to `backend/`.
- [ ] Builder = **Nixpacks** (auto-detects Python via `requirements.txt`).
      `backend/railway.json` already pins the start command + healthcheck.
- [ ] Start command (from `railway.json` / `Procfile`):
      `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
      — runs DB migrations, then serves on Railway's `$PORT`.
- [ ] Add all backend env vars (§3).
- [ ] Deploy. Watch logs for: Alembic `upgrade head` success, then Uvicorn start.
- [ ] Confirm the healthcheck passes (Railway uses `/health`).
- [ ] Note the public backend URL (use it for `NEXT_PUBLIC_API_URL`).

---

## 5. Vercel deployment (frontend)

- [ ] New Vercel project → import the repo.
- [ ] Set **Root Directory** to `frontend/`.
- [ ] Framework preset: **Next.js** (auto-detected). Build `next build`, install `npm install`.
- [ ] Add all frontend env vars (§3) to the **Production** environment.
- [ ] Deploy. Confirm the build succeeds with no warnings.
- [ ] Open the deployment URL and confirm the landing page renders.

---

## 6. DNS setup

- [ ] Frontend: add your apex/`www` domain in Vercel → create the shown
      `A`/`CNAME` records at your registrar.
- [ ] Backend: add a custom domain (e.g. `api.your-domain.com`) in Railway →
      add the shown `CNAME`.
- [ ] After DNS propagates, update `NEXT_PUBLIC_API_URL` (Vercel) and
      `ALLOWED_ORIGINS` (Railway) to the final domains and redeploy both.

---

## 7. SSL verification

- [ ] Vercel domain serves over HTTPS with a valid cert (auto-provisioned).
- [ ] Railway domain serves over HTTPS with a valid cert (auto-provisioned).
- [ ] `https://your-domain.com` → no mixed-content warnings (all API/WS calls are
      `https`/`wss`).
- [ ] Response headers present on API responses: `Strict-Transport-Security`,
      `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
      `Content-Security-Policy`.

---

## 8. Database migration

- [ ] Migrations run automatically on each Railway deploy (`alembic upgrade head`
      in the start command).
- [ ] To run manually: `cd backend && alembic upgrade head`.
- [ ] To check current revision: `alembic current`.
- [ ] To create a new migration after model changes:
      `alembic revision --autogenerate -m "describe change"` (review the generated
      file before committing).

---

## 9. Post-deploy smoke test

- [ ] `GET https://<backend>/health` → **200** with `"status":"healthy"` and
      `database.ok = true`.
- [ ] Register a new account → land in onboarding.
- [ ] Complete onboarding → reach `/home`.
- [ ] Create a discussion forum, send a message (WebSocket connects over `wss`).
- [ ] Upload an attachment → served from a Cloudinary `https` URL.
- [ ] Create an invite link, open it in a second account → join works.
- [ ] (If configured) Confirm events appear in PostHog and a test error in Sentry.

---

## 10. Rollback procedure

**Frontend (Vercel)**
- [ ] Vercel → Deployments → pick the last good deployment → **Promote to
      Production** (instant rollback).

**Backend (Railway)**
- [ ] Railway → Deployments → select the previous successful deploy → **Redeploy**.

**Database (Neon)** — only if a migration caused the problem:
- [ ] Downgrade one revision: `cd backend && alembic downgrade -1`.
- [ ] Or restore from a Neon point-in-time/branch snapshot taken before deploy.
- [ ] ⚠️ Always take a Neon backup/branch **before** running a destructive
      migration so a clean restore point exists.

**General**
- [ ] After any rollback, re-run the §9 smoke test.
- [ ] If you rolled back the backend, double-check the DB schema still matches the
      backend revision (a forward migration may need an explicit downgrade).

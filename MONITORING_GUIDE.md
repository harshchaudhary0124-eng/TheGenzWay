# Monitoring Guide — The GenZ Way

How to observe the production deployment: the health endpoint, structured logs,
error monitoring (Sentry), uptime monitoring (UptimeRobot / Better Stack), and
product analytics (Vercel Analytics + PostHog).

Everything here is **off by default and opt-in via environment variables** —
nothing ships data anywhere until you configure it, and several integrations only
activate when `ENVIRONMENT`/`NEXT_PUBLIC_ENVIRONMENT` is `production`.

---

## Health endpoint

`GET /health` on the backend (e.g. `https://<backend>/health`).

```jsonc
{
  "status": "healthy",                // "unhealthy" → HTTP 503
  "timestamp": "2026-06-30T12:00:00+00:00",
  "version": "1.0.0",                 // APP_VERSION
  "environment": "production",
  "uptime_seconds": 1234.5,
  "checks": {
    "database":   { "ok": true, "detail": "connected" },
    "cloudinary": { "ok": true, "detail": "configured" }
  }
}
```

- **HTTP 200** only when healthy; **503** when the database is unreachable (a hard
  dependency). Cloudinary being unconfigured is reported as degraded but does
  **not** flip the status to 503 (the core app still serves).
- Unauthenticated, cheap, and `Cache-Control: no-store` — safe to poll frequently.
- No secrets in the response.
- Render is already configured to use `/health` as its deploy healthcheck
  (`healthCheckPath: /health` in `render.yaml`).

---

## Logging

Structured logging is configured in `backend/app/logging_config.py` and wired in
`app/main.py`.

- **Format:** human-readable in development; **JSON (one object per line)** in
  production (`ENVIRONMENT=production`) — ready for any log drain.
- **Level:** `LOG_LEVEL` env var (default `INFO`).
- **What is logged:** every request (method, path, status, duration, `request_id`),
  authentication failures, upload failures, database errors, WebSocket errors,
  and all unhandled exceptions (with traceback, server-side only).
- **What is never logged:** passwords, JWTs, API keys/secrets, Cloudinary
  secrets, Authorization headers, request bodies, or query strings. A redaction
  filter masks anything credential-shaped as defence-in-depth, and each response
  carries an `X-Request-ID` header to correlate a user report with server logs.

### Log locations

| Environment | Where to read logs |
| --- | --- |
| Render (backend) | Service → **Logs** (live stdout JSON) + **Events** for deploys. Pipe to a drain for retention. |
| Vercel (frontend) | Project → **Logs** (functions/SSR) + **Runtime Logs**. |
| Local dev | Terminal running `uvicorn` (human-readable) / `npm run dev`. |

> Render/Vercel only retain recent logs. For long-term retention and search,
> forward Render's logs to a drain — Render supports **Log Streams** (Settings →
> Log Streams) to Better Stack (Logtail), Datadog, Papertrail, etc.

---

## Error monitoring — Sentry

Backend wiring: `backend/app/observability.py` (initialised from `app/main.py`).
Frontend wiring: `frontend/instrumentation.ts` (server/edge),
`frontend/instrumentation-client.ts` (browser), and `app/global-error.tsx`
(captures React render errors).

**Both sides only enable Sentry when the environment is `production` AND a DSN is
set.** PII is disabled (`send_default_pii=False` / `sendDefaultPii: false`),
session replay is off, and the backend additionally scrubs auth headers, cookies
and query strings from every event before it is sent.

### Setup

1. Create a Sentry account → create **two** projects: one **Python (FastAPI)**,
   one **Next.js**.
2. Copy each project's DSN.
3. **Backend (Render):** set `SENTRY_DSN=<python-dsn>`, ensure
   `ENVIRONMENT=production` (already set in `render.yaml`). Optionally
   `SENTRY_TRACES_SAMPLE_RATE` (e.g. `0.1`).
4. **Frontend (Vercel):** set `NEXT_PUBLIC_SENTRY_DSN=<nextjs-dsn>` and
   `NEXT_PUBLIC_ENVIRONMENT=production`.
5. Redeploy both. Trigger a test error and confirm it appears in Sentry.

> Source-map upload (for de-minified frontend stack traces) is **not** wired to
> keep builds simple and credential-free. To add it later, wrap
> `frontend/next.config.mjs` with `withSentryConfig` and set a `SENTRY_AUTH_TOKEN`
> — see "Remaining recommendations" in `PHASE5_DEPLOYMENT_REPORT.md`.

---

## Uptime monitoring

Point any uptime service at the health endpoint. **Alert on non-200** — the
endpoint returns 503 when the DB is down, so monitors catch real outages instead
of a misleading 200.

### UptimeRobot

1. Add New Monitor → **HTTP(s)**.
2. URL: `https://<backend>/health`.
3. Interval: 1–5 minutes.
4. (Pro) Add a keyword monitor for `"status":"healthy"` for stricter checks.
5. Add an alert contact (email / Slack / SMS).

### Better Stack (Uptime)

1. Create a Monitor → **HTTP**.
2. URL: `https://<backend>/health`; expected status `200`.
3. (Optional) Expected body contains `healthy`.
4. Set check frequency + an escalation policy / on-call.
5. Also monitor the **frontend** root URL `https://your-domain.com` for a 200.

---

## Product analytics

No personal data is sent. Page-level analytics come from Vercel Analytics;
anonymous product events come from PostHog (`frontend/lib/analytics.ts`).

### Vercel Analytics

- Mounted via `<Analytics/>` in the root layout — **no key required**.
- Enable it in the Vercel dashboard (Project → **Analytics**). Active on
  production automatically; gives traffic + Web Vitals.

### PostHog

1. Create a PostHog project, copy the **Project API Key** and host
   (`https://us.i.posthog.com` or EU).
2. Frontend env: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.
3. In PostHog **Project Settings**, enable **"Discard client IP data"** for full
   anonymity (the client is already configured with `person_profiles: "never"`,
   autocapture off, session recording off, and URL query strings stripped).

**Tracked events (anonymous counters — the event name is the entire payload):**

| Event | Fires when |
| --- | --- |
| `user_registered` | Registration succeeds |
| `user_logged_in` | Login succeeds |
| `onboarding_completed` | Onboarding is submitted successfully |
| `forum_created` | A discussion forum is created |
| `forum_invitation_sent` | An invite is sent |
| `forum_joined` | A user joins (invite accept or invite link) |
| `message_sent` | A chat message is sent over the WebSocket |

---

## Alert recommendations

| Signal | Source | Recommended alert |
| --- | --- | --- |
| Backend down / DB unreachable | UptimeRobot / Better Stack on `/health` | Page on 2 consecutive non-200s. |
| Frontend down | Uptime monitor on root URL | Alert on non-200. |
| Error spike | Sentry | Alert when a new issue appears or error rate exceeds baseline. |
| Auth-failure spike | Logs (`Authentication failed`) | Alert on abnormal volume (possible brute force; rate limiting already returns 429). |
| Upload failures | Logs (`Upload failed`) | Alert on sustained failures (Cloudinary outage / misconfig). |
| 5xx rate | Render/Vercel metrics + Sentry | Alert when 5xx share crosses a threshold. |
| DB connections near cap | Neon dashboard | Watch pool usage; tune `pool_size`/`max_overflow` if saturating. |
| Latency regression | Vercel Analytics (Web Vitals) / `duration_ms` in logs | Investigate sustained p95 increases. |

---

## Quick reference

| Concern | Where |
| --- | --- |
| Health JSON | `GET /health` |
| Logging config | `backend/app/logging_config.py`, wired in `app/main.py` |
| Backend Sentry | `backend/app/observability.py` |
| Frontend Sentry | `frontend/instrumentation*.ts`, `app/global-error.tsx` |
| Analytics events | `frontend/lib/analytics.ts` |
| Backend env template | `backend/.env.example` |
| Frontend env template | `frontend/.env.example` |

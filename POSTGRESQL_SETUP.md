# PostgreSQL Setup — The GenZ Way (Neon)

The application is **PostgreSQL-only**. There is no SQLite fallback and no
runtime `create_all`; **Alembic** is the single schema-management system. Neon is
the recommended managed PostgreSQL provider.

---

## 1. Architecture

| Concern | Where | Authority |
|---|---|---|
| Schema definition (source of truth) | `backend/app/models/*.py` | SQLAlchemy ORM models |
| Schema provisioning / changes | `backend/alembic/versions/` | `alembic upgrade head` |
| Engine / session / `Base` | `backend/app/database.py` | single PostgreSQL engine |
| Connection string | `DATABASE_URL` (env / `.env`) | required, validated |

**`config.py`** requires `DATABASE_URL`, normalizes `postgres://` → `postgresql://`,
and **rejects any non-PostgreSQL URL** (the app refuses to start otherwise).

**`database.py`** creates one engine with `pool_pre_ping=True` so connections
dropped by Neon's serverless proxy are transparently recycled.

### Tables (created by `0001_initial_schema`)
`users`, `user_onboarding`, `discussion_forums`, `forum_memberships`,
`forum_invites`, `forum_messages`, `forum_read_states`, `forum_attachments`,
`forum_reactions` — with all foreign keys (`CASCADE` / `SET NULL`), composite PKs
(`user_onboarding`, `forum_read_states`), and the unique reaction constraint.

---

## 2. Neon configuration

1. Create a project at <https://console.neon.tech>.
2. Copy the **pooled** connection string (host contains `-pooler`).
3. Set it in `backend/.env` (keep `sslmode=require`):
   ```
   DATABASE_URL=postgresql://<user>:<password>@<endpoint>-pooler.neon.tech/<db>?sslmode=require
   ```
4. The `psycopg2-binary` driver is already in `requirements.txt`.

Required environment variables (`backend/.env`, template in `.env.example`):

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL only; `postgres://` is auto-normalized. |
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_hex(32))"`. App refuses to start in production while empty/`change-me`. |
| `ALGORITHM` | `HS256` (also `HS384`/`HS512`). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | e.g. `60`. |
| `ENVIRONMENT` | `development` or `production` (prod disables `/docs`, enables HSTS). |
| `ALLOWED_ORIGINS` | Comma-separated browser origins. |

---

## 3. Migration workflow

Run from `backend/`:

```bash
alembic upgrade head      # apply/upgrade schema
alembic current           # show current revision
alembic history           # list migrations
alembic downgrade base    # drop everything the baseline created

# After editing models:
alembic revision --autogenerate -m "describe change"
# review the generated file, then:
alembic upgrade head
```

`alembic/env.py` imports the whole `app.models` package, so autogenerate sees
every table.

---

## 4. Local development workflow

You need a PostgreSQL database. Two options:

**A. Use your Neon database directly** (simplest):
```bash
cd backend
python -m venv venv && venv\Scripts\activate     # Git Bash: source venv/Scripts/activate
pip install -r requirements.txt
# .env already has the Neon DATABASE_URL
alembic upgrade head          # once, to provision the schema
uvicorn app.main:app --reload # http://localhost:8000

cd ../frontend && npm install && npm run dev      # http://localhost:3000
```

**B. Local PostgreSQL via Docker** (isolated from Neon):
```bash
docker run -d --name genzway_pg \
  -e POSTGRES_PASSWORD=devpw -e POSTGRES_DB=genzway -p 5432:5432 postgres:16-alpine
# in backend/.env:
#   DATABASE_URL=postgresql://postgres:devpw@127.0.0.1:5432/genzway
cd backend && alembic upgrade head && uvicorn app.main:app --reload
```

Or run both servers with one command from the repo root: `python dev.py --dev`.

Open **http://localhost:3000**.

---

## 5. Production deployment workflow

```bash
cd backend
pip install -r requirements.txt

# .env (production):
#   ENVIRONMENT=production
#   DATABASE_URL=postgresql://...-pooler.neon.tech/<db>?sslmode=require
#   SECRET_KEY=<strong 64-hex secret>
#   ALLOWED_ORIGINS=https://your-frontend-domain
#   ALGORITHM=HS256
#   ACCESS_TOKEN_EXPIRE_MINUTES=60

alembic upgrade head          # provision/upgrade the Neon schema

uvicorn app.main:app --host 0.0.0.0 --port 8000
# or: gunicorn -k uvicorn.workers.UvicornWorker app.main:app
```

In `production`, interactive `/docs`, `/redoc`, `/openapi.json` are disabled, HSTS
is sent, and CORS is restricted to `ALLOWED_ORIGINS`. Uploaded files live under
`backend/uploads/` (the `/uploads` mount) — put that on a persistent volume or
object storage.

### Deploy checklist
- [ ] `ENVIRONMENT=production`
- [ ] Strong unique `SECRET_KEY` (not `change-me`)
- [ ] `DATABASE_URL` → Neon, `sslmode=require`
- [ ] `ALLOWED_ORIGINS` lists only real frontend origin(s)
- [ ] `alembic upgrade head` run (`alembic current` == head)
- [ ] `/uploads` on persistent storage
- [ ] `GET /` returns `{"status":"ok"}`

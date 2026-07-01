# Backend functional tests (PostgreSQL only)

End-to-end suite that drives the real FastAPI app + WebSocket API against a
PostgreSQL database.

Covers: health, register/login/JWT/`me`, onboarding (+ profile, sync, validation),
discover, forum create/list, invites (send/list/accept/reject), invite links +
join, membership access control, real-time chat (send/edit/delete/react/typing/
presence), message history, search, mark-read, and attachment upload/listing.

## Requirements

The suite needs a **dedicated PostgreSQL test database** via `DATABASE_URL`
(never your production database — the schema is provisioned and rows are
written). `conftest.py` runs `alembic upgrade head` automatically at session
start, so you only need an empty database.

## Run (local Docker Postgres)

```bash
docker run -d --name genzway_pg_test \
  -e POSTGRES_PASSWORD=testpw -e POSTGRES_DB=genzway -p 5432:5432 postgres:16-alpine

cd backend
export DATABASE_URL="postgresql://postgres:testpw@127.0.0.1:5432/genzway"
PYTHONPATH=. python -m pytest tests/ -q

docker rm -f genzway_pg_test   # teardown
```

## Run (Neon test branch)

Create a throwaway Neon branch, then:

```bash
cd backend
export DATABASE_URL="postgresql://...neon.tech/<branch_db>?sslmode=require"
PYTHONPATH=. python -m pytest tests/ -q
```

> The suite disables the per-IP rate limiter for the test session only
> (`limiter.enabled = False` in `conftest.py`) — a test-time toggle, not an
> app-code change.

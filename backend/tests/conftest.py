"""Shared test fixtures (PostgreSQL only).

The suite runs the REAL FastAPI app end-to-end against a PostgreSQL database
given by ``DATABASE_URL``. Point it at a DEDICATED test database (a local
Docker Postgres or a Neon test branch) — never your production database, since
the schema is (re)provisioned and rows are written.

Schema is provisioned with Alembic (``upgrade head``) at session start — the
same single source of truth the app uses. There is no SQLite fallback and no
``create_all``.

Rate limiting is disabled for the test session only (``limiter.enabled = False``).
This is a test-time toggle, not an app-code change.
"""
import os
import uuid

import pytest

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL or not DATABASE_URL.startswith("postgresql"):
    raise RuntimeError(
        "Tests require a PostgreSQL DATABASE_URL (postgresql://...). "
        "Point it at a dedicated test database, e.g.\n"
        "  docker run -d --name genzway_pg -e POSTGRES_PASSWORD=testpw "
        "-e POSTGRES_DB=genzway -p 5432:5432 postgres:16-alpine\n"
        "  export DATABASE_URL=postgresql://postgres:testpw@127.0.0.1:5432/genzway"
    )
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ENVIRONMENT", "development")

# Provision the schema with Alembic before importing the app (Alembic-only).
from alembic import command  # noqa: E402
from alembic.config import Config as AlembicConfig  # noqa: E402

_here = os.path.dirname(__file__)
_backend = os.path.abspath(os.path.join(_here, ".."))
_alembic_cfg = AlembicConfig(os.path.join(_backend, "alembic.ini"))
_alembic_cfg.set_main_option("script_location", os.path.join(_backend, "alembic"))
command.upgrade(_alembic_cfg, "head")

from fastapi.testclient import TestClient  # noqa: E402
import app.main as main  # noqa: E402

# Turn off the per-IP rate limiter for the whole test session (test-only).
main.app.state.limiter.enabled = False


@pytest.fixture(scope="session")
def client():
    with TestClient(main.app) as c:
        yield c


# ── helpers ──────────────────────────────────────────────────────────────────
def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def make_user(client):
    """Factory: register a unique user, return (token, user_dict)."""
    def _make(domains=None, full_name="Test Builder"):
        domains = domains or ["Artificial Intelligence"]
        email = f"user_{uuid.uuid4().hex[:10]}@example.com"
        r = client.post("/auth/register", json={
            "full_name": full_name,
            "email": email,
            "password": "supersecret123",
            "qualification": "Student",
            "interested_domains": domains,
            "country": "India",
            "city": "Delhi",
        })
        assert r.status_code == 201, r.text
        token = r.json()["access_token"]
        me = client.get("/auth/me", headers=auth_header(token))
        assert me.status_code == 200, me.text
        return token, me.json()
    return _make


def complete_onboarding(client, token, domains):
    """Submit complete onboarding answers for each of the user's domains."""
    domains_data = [
        {"domain": d, "answers": {"q1": "A1", "q2": "A2", "q3": "A3", "q4": "A4"}}
        for d in domains
    ]
    r = client.post("/auth/onboarding", headers=auth_header(token),
                    json={"domains_data": domains_data})
    assert r.status_code == 200, r.text
    return r.json()

"""Health & readiness endpoint for uptime/monitoring services.

``GET /health`` is designed for UptimeRobot / Better Stack / Railway probes:

* Returns **HTTP 200 only when the service is healthy** (DB reachable). When a
  hard dependency is down it returns **503** so monitors alert instead of seeing
  a misleading 200.
* The JSON body reports per-check detail (database, Cloudinary), the running
  version, a UTC timestamp and process uptime — handy for dashboards and
  on-call triage.
* It is cheap and unauthenticated (no secrets in the response) so probes can hit
  it frequently, and it sets ``Cache-Control: no-store`` so nothing caches a
  stale "healthy".

Cloudinary is treated as **degraded, not fatal**: media uploads would fail if it
were misconfigured, but the core app (auth, forums, chat) still serves, so a
Cloudinary problem does not flip the endpoint to 503.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Response, status
from sqlalchemy import text

from ..config import settings
from ..database import SessionLocal

logger = logging.getLogger("app.health")

router = APIRouter(tags=["health"])

# Process start (monotonic clock — immune to wall-clock adjustments).
_STARTED_AT = time.monotonic()


def _check_database() -> tuple[bool, str]:
    """Run a trivial query to confirm the DB is reachable."""
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
        return True, "connected"
    except Exception:
        logger.exception("Health check: database unreachable")
        return False, "unreachable"


def _check_cloudinary() -> tuple[bool, str]:
    """Confirm Cloudinary credentials are present (config-level readiness)."""
    if settings.cloudinary_configured:
        return True, "configured"
    return False, "not_configured"


@router.get("/health")
def health(response: Response):
    db_ok, db_detail = _check_database()
    cloud_ok, cloud_detail = _check_cloudinary()

    # Database is a hard dependency; Cloudinary is degraded-but-serving.
    healthy = db_ok
    if not healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    response.headers["Cache-Control"] = "no-store"
    return {
        "status": "healthy" if healthy else "unhealthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": round(time.monotonic() - _STARTED_AT, 1),
        "checks": {
            "database": {"ok": db_ok, "detail": db_detail},
            "cloudinary": {"ok": cloud_ok, "detail": cloud_detail},
        },
    }

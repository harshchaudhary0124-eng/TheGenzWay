import asyncio
import logging
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import SQLAlchemyError
from .config import settings
from .database import SessionLocal
from .logging_config import configure_logging, redact
from .observability import init_sentry
from .security import limiter, security_headers
from .routes.auth import router as auth_router
from .routes.forum import router as forum_router
from .routes.discover import router as discover_router
from .routes.health import router as health_router
from .routes.messages import router as messages_router
from .routes.ws import router as ws_router
from . import models  # noqa: F401 — ensure every model is registered with Base.metadata

# Structured logging (JSON in production) + Sentry must be set up before the app
# starts handling traffic. init_sentry is a no-op unless ENVIRONMENT=production
# with a DSN configured.
configure_logging(settings.LOG_LEVEL, json_output=settings.is_production)
init_sentry()

logger = logging.getLogger("app")

# Schema management is Alembic-only (PostgreSQL/Neon). Provision/upgrade with:
#   cd backend && alembic upgrade head


def _ping_db() -> None:
    """Trivial query to keep Neon's compute active (runs in a threadpool)."""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
    finally:
        db.close()


async def _keepalive_loop(interval: int) -> None:
    """Periodically ping the DB so Neon never auto-suspends in production.

    Cancelled cleanly on shutdown. Errors are logged but never crash the loop —
    a transient DB blip should not stop the keep-warm.
    """
    logger.info("DB keep-warm enabled", extra={"interval_seconds": interval})
    while True:
        try:
            await asyncio.sleep(interval)
            await run_in_threadpool(_ping_db)
        except asyncio.CancelledError:
            break
        except Exception:
            logger.warning("DB keep-warm ping failed")


# ── Lifespan: sync on every startup ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    On startup, ensure user_onboarding.id always equals users.id for every
    completed user.  The FK enforces value equality; this sync enforces row
    existence — so no completed user is ever missing their onboarding rows.

    Also starts the optional DB keep-warm task (DB_KEEPALIVE_SECONDS > 0) so the
    database never cold-starts for the first user after an idle period.
    """
    from .services.sync import sync_onboarding_rows
    db = SessionLocal()
    try:
        sync_onboarding_rows(db)
    finally:
        db.close()

    keepalive_task: asyncio.Task | None = None
    if settings.DB_KEEPALIVE_SECONDS > 0:
        keepalive_task = asyncio.create_task(_keepalive_loop(settings.DB_KEEPALIVE_SECONDS))

    try:
        yield
    finally:
        if keepalive_task is not None:
            keepalive_task.cancel()
            try:
                await keepalive_task
            except asyncio.CancelledError:
                pass


# Interactive API docs are disabled in production (they advertise the full
# surface area and conflict with the strict CSP); available in development.
_docs_enabled = not settings.is_production
app = FastAPI(
    title="TheGenzWay API",
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

# Rate limiting (slowapi): register the limiter + its 429 handler.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Compress JSON/text responses over the wire (skips already-compressed media,
# which is served straight from the Cloudinary CDN anyway). minimum_size avoids
# spending CPU on tiny payloads.
app.add_middleware(GZipMiddleware, minimum_size=512)

# CORS — allowed origins come from settings (env-driven). Localhost stays on by
# default for dev; production overrides ALLOWED_ORIGINS in .env.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def _apply_security_headers(request: Request, call_next):
    """Attach hardening headers to every API response."""
    response = await call_next(request)
    for name, value in security_headers(request.url.path).items():
        response.headers.setdefault(name, value)
    return response


@app.middleware("http")
async def _log_requests(request: Request, call_next):
    """Structured access logging.

    Logs method, path, status and duration for every request — never headers,
    bodies, query strings or auth material (the path is redacted defensively in
    case a token ever rides in it). Each request gets a short id echoed back in
    the ``X-Request-ID`` header to correlate client reports with server logs.
    """
    request_id = uuid.uuid4().hex[:12]
    start = time.perf_counter()
    path = redact(request.url.path)
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - start) * 1000, 1)
        logger.exception(
            "request failed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": path,
                "duration_ms": duration_ms,
            },
        )
        raise
    duration_ms = round((time.perf_counter() - start) * 1000, 1)
    logger.info(
        "request",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(SQLAlchemyError)
async def _database_exception_handler(request: Request, exc: SQLAlchemyError):
    """Log database errors distinctly (they signal infra issues) and return 500.

    The exception detail never reaches the client; only a generic message does.
    """
    logger.exception(
        "database error", extra={"method": request.method, "path": redact(request.url.path)}
    )
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception):
    """Never leak stack traces / exception details to clients.

    The full error (with traceback) is logged server-side only; the client
    receives a generic 500. Intentional HTTPExceptions are handled separately
    by FastAPI and are unaffected.
    """
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(forum_router)
# messages_router shares the /forums prefix; must be registered AFTER forum_router
# so literal routes (/forums/mine, /forums/invites) match before /forums/{forum_id}.
app.include_router(messages_router)
app.include_router(discover_router)
app.include_router(ws_router)

# Uploaded media is stored in Cloudinary and served directly from its CDN over
# HTTPS (the attachment's secure_url). The API no longer serves any files from
# the local filesystem — there is no /uploads mount.


@app.get("/")
def root():
    return {"status": "ok"}

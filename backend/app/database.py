from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings

# PostgreSQL (Neon) is the only supported database. The URL is validated and
# normalized to the `postgresql://` form in config.py.
#
# Pooling tuned for Neon's serverless proxy. Optimised for LOW LATENCY:
#   • NO pool_pre_ping — pre-ping fires an extra `SELECT 1` round-trip before
#                      EVERY checkout. Against a geographically distant Neon
#                      region that doubles the latency of every DB request, so we
#                      drop it and rely on TCP keepalives + pool_recycle instead.
#   • TCP keepalives — the OS probes the socket so dead connections are detected
#                      at the transport layer (no app-level round-trip on the hot
#                      path). This replaces pre_ping's stale-connection safety.
#   • pool_recycle   — proactively retire connections older than 5 min; Neon
#                      closes idle connections, so we recycle before it does.
#   • pool_size /    — a small warm pool + burst headroom. Keeps steady-state
#     max_overflow     latency low (reused TCP/TLS sessions) without exhausting
#                      Neon's connection budget under spikes.
#   • pool_timeout   — fail fast (don't hang the event loop) if the pool is saturated.
engine = create_engine(
    settings.DATABASE_URL,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    connect_args={
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    },
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

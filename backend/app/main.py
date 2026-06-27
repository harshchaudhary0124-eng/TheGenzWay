from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from .config import settings
from .database import engine, Base, SessionLocal
from .services.uploads import UPLOAD_DIR
from .routes.auth import router as auth_router
from .routes.forum import router as forum_router
from .routes.discover import router as discover_router
from .routes.messages import router as messages_router
from .routes.ws import router as ws_router
from . import models  # noqa: ensure all models are imported before create_all

# ── SQLite dev setup ──────────────────────────────────────────────────────────
# For PostgreSQL, run: cd backend && alembic upgrade head
if "sqlite" in settings.DATABASE_URL:
    # Drop user_onboarding if it still has the old `user_id` column so
    # create_all can rebuild it with the correct (id, domain) composite PK.
    with engine.connect() as _conn:
        result = _conn.execute(text(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='user_onboarding'"
        ))
        row = result.fetchone()
        if row and "user_id" in (row[0] or ""):
            _conn.execute(text("DROP TABLE IF EXISTS user_onboarding"))
            _conn.commit()

    Base.metadata.create_all(bind=engine)

    with engine.connect() as _conn:
        for _stmt in [
            "ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT 0 NOT NULL",
            "ALTER TABLE users ADD COLUMN onboarding_answers JSON DEFAULT '{}'",
            "ALTER TABLE discussion_forums ADD COLUMN join_token VARCHAR(64)",
        ]:
            try:
                _conn.execute(text(_stmt))
                _conn.commit()
            except Exception:
                pass  # column already exists


# ── Lifespan: sync on every startup (all DB types) ───────────────────────────
@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    On startup, ensure user_onboarding.id always equals users.id for every
    completed user.  The FK enforces value equality; this sync enforces row
    existence — so no completed user is ever missing their onboarding rows.
    """
    from .services.sync import sync_onboarding_rows
    db = SessionLocal()
    try:
        sync_onboarding_rows(db)
    finally:
        db.close()
    yield


app = FastAPI(title="TheGenzWay API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(forum_router)
# messages_router shares the /forums prefix; must be registered AFTER forum_router
# so literal routes (/forums/mine, /forums/invites) match before /forums/{forum_id}.
app.include_router(messages_router)
app.include_router(discover_router)
app.include_router(ws_router)

# Serve uploaded forum attachments. Filenames embed a UUID so the URLs are
# unguessable capability links (v1). A signed/membership-checked download
# endpoint is the production upgrade path.
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/")
def root():
    return {"status": "ok"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routes.auth import router as auth_router
from . import models  # noqa: ensure all models are imported before create_all

# Auto-create tables for SQLite dev only; for PostgreSQL run `alembic upgrade head`
if "sqlite" in settings.DATABASE_URL:
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="TheGenzWay API")

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


@app.get("/")
def root():
    return {"status": "ok"}

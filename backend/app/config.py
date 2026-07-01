from pydantic import model_validator
from pydantic_settings import BaseSettings

# The insecure placeholder shipped for local dev. The app refuses to boot in
# production while SECRET_KEY still equals this value (see _enforce_production).
DEFAULT_SECRET_KEY = "change-me"
ALLOWED_JWT_ALGORITHMS = {"HS256", "HS384", "HS512"}


class Settings(BaseSettings):
    # "development" (default) keeps the local-friendly behaviour. Set
    # ENVIRONMENT=production in the deployment .env to enforce hardening.
    ENVIRONMENT: str = "development"

    # PostgreSQL (Neon) is the only supported database. Required — there is no
    # default; the app fails fast if DATABASE_URL is missing or not PostgreSQL.
    DATABASE_URL: str
    SECRET_KEY: str = DEFAULT_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Comma-separated list of browser origins allowed to call the API.
    # Localhost is enabled by default for dev; override in production.
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # ── Observability ─────────────────────────────────────────────────────────
    # Reported by GET /health and tagged on Sentry events. Bump per release.
    APP_VERSION: str = "1.0.0"
    # Root log level (DEBUG/INFO/WARNING/ERROR). INFO is a sane production default.
    LOG_LEVEL: str = "INFO"
    # Sentry error monitoring. Left blank by default; Sentry is ONLY initialised
    # when ENVIRONMENT=production AND this is set (see observability.init_sentry).
    # This is a DSN, not a secret credential, but it still belongs in .env only.
    SENTRY_DSN: str = ""
    # Fraction of transactions sampled for performance tracing (0.0–1.0).
    SENTRY_TRACES_SAMPLE_RATE: float = 0.0

    # ── Database keep-warm ────────────────────────────────────────────────────
    # Seconds between background `SELECT 1` pings that stop Neon's compute from
    # auto-suspending (which causes a multi-second cold start for the next user).
    # 0 = disabled (default). Enable only on a Neon plan with enough compute hours
    # — keeping the DB always-on consumes compute continuously. A value like 240
    # (4 min) keeps it warm under Neon's ~5-min idle-suspend window.
    DB_KEEPALIVE_SECONDS: int = 0

    # ── Cloudinary (production media storage) ─────────────────────────────────
    # All uploaded media (profile images, forum attachments, project assets) is
    # stored in Cloudinary, never on the server filesystem. Credentials live only
    # here on the server — uploads are signed server-side and the client never
    # receives these values. Required in production (see _enforce_production).
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    model_config = {"env_file": ".env"}

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() in {"production", "prod"}

    @property
    def cloudinary_configured(self) -> bool:
        return bool(
            self.CLOUDINARY_CLOUD_NAME
            and self.CLOUDINARY_API_KEY
            and self.CLOUDINARY_API_SECRET
        )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def sentry_enabled(self) -> bool:
        """Sentry is on only in production with a configured DSN."""
        return self.is_production and bool(self.SENTRY_DSN.strip())

    @model_validator(mode="after")
    def _enforce_production(self) -> "Settings":
        # PostgreSQL only. Normalize the `postgres://` scheme some providers emit
        # (Neon/Heroku) to the `postgresql://` form SQLAlchemy 2.x requires, then
        # reject anything that isn't PostgreSQL so SQLite can never creep back in.
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = "postgresql://" + self.DATABASE_URL[len("postgres://"):]
        if not self.DATABASE_URL.startswith("postgresql"):
            raise ValueError(
                "DATABASE_URL must be a PostgreSQL connection string "
                "(postgresql://...). This project is PostgreSQL-only (Neon)."
            )
        # Algorithm is always validated so a typo can never silently weaken JWTs.
        if self.ALGORITHM not in ALLOWED_JWT_ALGORITHMS:
            raise ValueError(
                f"Unsupported JWT ALGORITHM '{self.ALGORITHM}'. "
                f"Use one of: {', '.join(sorted(ALLOWED_JWT_ALGORITHMS))}"
            )
        # Refuse to start in production with a missing/default secret.
        if self.is_production and (not self.SECRET_KEY or self.SECRET_KEY == DEFAULT_SECRET_KEY):
            raise RuntimeError(
                "SECRET_KEY must be set to a strong, unique value in production. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        # Media storage is Cloudinary-only; production must have credentials or
        # every upload would fail at runtime. Fail fast at boot instead.
        if self.is_production and not self.cloudinary_configured:
            raise RuntimeError(
                "Cloudinary is the production media store. Set CLOUDINARY_CLOUD_NAME, "
                "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the environment."
            )
        return self


settings = Settings()

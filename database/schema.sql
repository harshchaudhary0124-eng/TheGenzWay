-- TheGenzWay — reference schema (informational only)
-- The authoritative migration source is backend/alembic/versions/
-- To apply to a fresh PostgreSQL database: cd backend && alembic upgrade head

CREATE TABLE users (
    id               SERIAL PRIMARY KEY,
    full_name        VARCHAR(255)  NOT NULL,
    email            VARCHAR(255)  UNIQUE NOT NULL,
    hashed_password  TEXT          NOT NULL,
    qualification    VARCHAR(100)  NOT NULL,
    interested_domains JSON        DEFAULT '[]',
    country          VARCHAR(100)  NOT NULL,
    city             VARCHAR(100)  NOT NULL,
    profile_slug     VARCHAR(100)  UNIQUE NOT NULL,
    created_at       TIMESTAMP     DEFAULT NOW(),
    updated_at       TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX ix_users_id           ON users (id);
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE UNIQUE INDEX ix_users_profile_slug ON users (profile_slug);

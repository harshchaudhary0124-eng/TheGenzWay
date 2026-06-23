-- TheGenzWay — reference schema (informational only)
-- The authoritative migration source is backend/alembic/versions/
-- To apply to a fresh PostgreSQL database: cd backend && alembic upgrade head

CREATE TABLE users (
    id                   SERIAL PRIMARY KEY,
    full_name            VARCHAR(255)  NOT NULL,
    email                VARCHAR(255)  UNIQUE NOT NULL,
    hashed_password      TEXT          NOT NULL,
    qualification        VARCHAR(100)  NOT NULL,
    interested_domains   JSON          DEFAULT '[]',
    country              VARCHAR(100)  NOT NULL,
    city                 VARCHAR(100)  NOT NULL,
    profile_slug         VARCHAR(100)  UNIQUE NOT NULL,
    onboarding_completed BOOLEAN       NOT NULL DEFAULT FALSE,
    onboarding_answers   JSON          DEFAULT '{}',
    created_at           TIMESTAMP     DEFAULT NOW(),
    updated_at           TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX        ix_users_id           ON users (id);
CREATE UNIQUE INDEX ix_users_email        ON users (email);
CREATE UNIQUE INDEX ix_users_profile_slug ON users (profile_slug);

-- Dedicated onboarding detail table — one row per (user, domain).
-- `id` is the same value as users.id — no separate surrogate key.
-- A user with N selected domains will have N rows here.
CREATE TABLE user_onboarding (
    id         INTEGER      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    domain     VARCHAR(100) NOT NULL,
    full_name  VARCHAR(255) NOT NULL,
    answer_1   VARCHAR(500) NOT NULL,
    answer_2   VARCHAR(500) NOT NULL,
    answer_3   VARCHAR(500) NOT NULL,
    answer_4   VARCHAR(500) NOT NULL,
    created_at TIMESTAMP    DEFAULT NOW(),
    PRIMARY KEY (id, domain)
);

CREATE INDEX ix_user_onboarding_id ON user_onboarding (id);

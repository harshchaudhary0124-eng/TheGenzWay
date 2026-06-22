-- TheGenzWay Database Schema

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE community_posts (
    id          SERIAL PRIMARY KEY,
    content     TEXT NOT NULL,
    author_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT NOW()
);

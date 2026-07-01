# Project Structure — The GenZ Way

Production layout after the PostgreSQL-only migration. Database is **PostgreSQL
(Neon)** only; schema is managed exclusively by **Alembic**.

```
TheGenzWay/
├── backend/                      FastAPI API + PostgreSQL (Neon)
│   ├── alembic/                  Schema migrations — the ONLY schema source
│   │   ├── env.py                Imports app.models so all tables register
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 0001_initial_schema.py   Complete 9-table baseline
│   ├── alembic.ini
│   ├── app/
│   │   ├── main.py               App assembly: CORS, security headers, routers,
│   │   │                         /uploads mount, lifespan sync. No create_all.
│   │   ├── config.py             pydantic-settings; DATABASE_URL required &
│   │   │                         validated as PostgreSQL-only
│   │   ├── database.py           SQLAlchemy engine (pool_pre_ping) + SessionLocal + Base
│   │   ├── security.py           Rate limiting + secure HTTP headers
│   │   ├── models/               SQLAlchemy ORM models (source of truth for schema)
│   │   │   ├── user.py           users
│   │   │   ├── onboarding.py     user_onboarding (composite PK)
│   │   │   ├── forum.py          discussion_forums, forum_memberships, forum_invites
│   │   │   └── message.py        forum_messages, forum_read_states,
│   │   │                         forum_attachments, forum_reactions
│   │   ├── schemas/              Pydantic request/response models
│   │   │   ├── auth.py  forum.py  message.py
│   │   ├── services/             Business logic (kept out of routes)
│   │   │   ├── auth.py           password hashing + JWT
│   │   │   ├── chat.py           message persistence + serialization
│   │   │   ├── forum_access.py   membership checks
│   │   │   ├── sync.py           onboarding row sync (startup + endpoint)
│   │   │   ├── uploads.py        file validation + disk storage
│   │   │   └── ws_manager.py     WebSocket connection/presence manager
│   │   └── routes/               APIRouter modules (HTTP + WS)
│   │       ├── auth.py           /auth/*  (register, login, me, onboarding…)
│   │       ├── forum.py          /forums/* (create, invites, memberships, links)
│   │       ├── messages.py       /forums/{id}/* (history, search, read, attachments)
│   │       ├── discover.py       /discover/people
│   │       └── ws.py             /ws/forums/{id}  (real-time chat)
│   ├── tests/                    PostgreSQL-only functional suite (18 tests)
│   │   ├── conftest.py           Alembic-provisioned fixtures; limiter off in tests
│   │   ├── test_functional.py
│   │   └── README.md
│   ├── uploads/                  Local-disk forum attachments (gitignored)
│   ├── requirements.txt
│   ├── .env                      Real config (gitignored)
│   └── .env.example              Documented template (PostgreSQL-only)
│
├── frontend/                     Next.js 15 App Router (UI — unchanged)
│   ├── app/                      Routes (page.tsx per route) + api/newspapers
│   │   ├── page.tsx  layout.tsx  globals.css  global-error.tsx
│   │   ├── welcome/  home/  about/  community/  join/  login/
│   │   ├── forums/[forumId]/     chat page
│   │   └── forums/join/[token]/  invite-link join
│   ├── components/               Section + forum + ui components
│   │   ├── forum/                chat UI (sidebar, composer, message list…)
│   │   └── ui/                   Background, BuilderConstellation, BuilderStats
│   ├── hooks/                    useReveal, useForumSocket
│   ├── lib/                      constants, auth, chat, forum, onboarding, discover…
│   ├── public/                   newspapers/ images, op1.jpg
│   ├── next.config.mjs  tsconfig.json  postcss.config.mjs
│   ├── package.json
│   └── .env.local               Frontend env (API base URL)
│
├── dev.py                        One-command dev runner (backend + frontend)
├── CLAUDE.md                     Implementation rulebook
├── POSTGRESQL_SETUP.md           DB architecture, Neon, migration & deploy workflows
├── PROJECT_STRUCTURE.md          This file
├── CLEANUP_REPORT.md             What changed in the PostgreSQL-only migration
├── SECURITY_CHANGELOG.md         Historical security-hardening record
└── PROJECT_AUDIT_REPORT.md       Historical audit record
```

## Major directories

- **`backend/app/`** — the FastAPI application, split into `models` (ORM / schema
  source of truth), `schemas` (API I/O), `services` (business logic), and
  `routes` (HTTP/WS endpoints). `config.py`, `database.py`, and `security.py` are
  cross-cutting app-core modules.
- **`backend/alembic/`** — the single schema-management system. Every schema
  change is a migration here; there is no runtime table creation.
- **`backend/tests/`** — end-to-end functional suite that runs against a real
  PostgreSQL database (Docker or a Neon test branch).
- **`frontend/app/` & `frontend/components/`** — the Next.js UI (untouched by this
  migration): landing/marketing sections, the forum/chat experience, and shared
  UI primitives.
- **`frontend/lib/` & `frontend/hooks/`** — client-side data/access helpers and
  React hooks (e.g. `useForumSocket` for the chat WebSocket).
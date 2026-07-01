# The GenZ Way — CLAUDE.md

> Implementation rulebook for Claude Code. Derived from the actual repo state. Do not invent architecture — infer from code.

---

## Project Overview

Community platform for ambitious Gen Z builders (founders, devs, designers, indie hackers). Currently a dark-themed, animation-heavy marketing landing page with a skeletal FastAPI backend.

**Core ethos:** bold, editorial, dark. "Refuse average."  
**Tagline:** Build. Connect. Ship. Repeat.

---

## Run Commands

```bash
# Frontend — Next.js dev server
cd frontend && npm run dev          # http://localhost:3000

# Backend — FastAPI dev server
cd backend && uvicorn app.main:app --reload   # http://localhost:8000
```

`predev` kills port 3010 as cleanup before starting. The active frontend port is **3000**.

---

## Actual Repository Structure

```
TheGenzWay/
├── frontend/
│   ├── app/                         ← Next.js App Router root
│   │   ├── page.tsx                 ← Homepage: section composer only, no logic
│   │   ├── layout.tsx               ← Root layout; Google Fonts loaded here
│   │   ├── globals.css              ← Tailwind v4 + CSS custom properties
│   │   ├── about/page.tsx           ← Stub (one-liner placeholder)
│   │   ├── community/page.tsx       ← Stub (one-liner placeholder)
│   │   ├── join/page.tsx            ← Stub (one-liner placeholder)
│   │   ├── login/                   ← Empty directory — no page.tsx yet
│   │   ├── profile/                 ← Empty directory — no page.tsx yet
│   │   └── api/
│   │       └── newspapers/route.ts  ← GET /api/newspapers — lists public/newspapers/ images
│   ├── components/
│   │   ├── Nav.tsx
│   │   ├── Hero.tsx
│   │   ├── Manifesto.tsx
│   │   ├── ManifestoArrow.tsx
│   │   ├── WhoSection.tsx
│   │   ├── ExperimentalType.tsx
│   │   ├── CTASection.tsx
│   │   └── Footer.tsx
│   │   └── ui/
│   │       ├── Background.tsx          ← Fixed radial glow + SVG grain overlay (one component)
│   │       ├── BuilderConstellation.tsx ← Animated node network rendered in Hero
│   │       └── BuilderStats.tsx        ← Live counter panel rendered in Manifesto
│   ├── hooks/
│   │   └── useReveal.ts             ← Shared scroll-reveal hook (useInView wrapper)
│   ├── lib/
│   │   └── constants.ts             ← Brand color tokens + font style objects (source of truth)
│   ├── public/
│   │   ├── newspapers/              ← 8 images (1g–8g, .webp/.jpg) served by /api/newspapers
│   │   └── op1.jpg                  ← Photo used in ExperimentalType section
│   ├── src/                         ← DEAD — empty directory scaffold only, no files
│   ├── animations/                  ← DEAD — empty directory, no files
│   ├── next.config.mjs              ← Empty config (no custom settings)
│   └── tsconfig.json                ← Path alias: @/* → ./*
│
├── backend/
│   ├── app/
│   │   ├── main.py                  ← FastAPI app; CORS for localhost:3000; GET / health check
│   │   ├── config.py                ← pydantic-settings: DATABASE_URL, SECRET_KEY, JWT TTL
│   │   ├── models/                  ← Empty (SQLAlchemy models go here)
│   │   ├── schemas/                 ← Empty (Pydantic request/response schemas go here)
│   │   ├── routes/                  ← Empty (APIRouter modules go here)
│   │   ├── services/                ← Empty (business logic goes here)
│   │   └── middleware/              ← Empty
│   ├── requirements.txt             ← fastapi, uvicorn, sqlalchemy, pydantic-settings,
│   │                                   python-dotenv, passlib[bcrypt], python-jose
│   └── .env.example
│
└── database/
    ├── schema.sql                   ← PostgreSQL DDL: users, projects, community_posts
    ├── migrations/                  ← Empty
    └── seeds/                       ← Empty
```

---

## Brand Tokens — Source of Truth

**File:** `frontend/lib/constants.ts` — always import from here. Never hardcode hex values or font strings in components.

```ts
export const C = {
  orange: "#FF5B2E",   // primary accent, CTAs
  glow:   "#FF8A3D",   // soft glow variant
  red:    "#C74343",   // destructive / error states
  cream:  "#F5F2EB",   // primary text
  muted:  "#8C8C8C",   // subdued / secondary text
  bg:     "#080808",   // near-black background
};

export const DISPLAY: CSSProperties = { fontFamily: "'Anton', Impact, sans-serif" };
export const SCRIPT:  CSSProperties = { fontFamily: "'Caveat', cursive" };
export const SANS:    CSSProperties = { fontFamily: "'DM Sans', system-ui, sans-serif" };
```

**Fonts** are loaded via Google Fonts in `app/layout.tsx`: Anton (display headings), Caveat (handwritten accent), DM Sans (body/UI).

---

## Homepage Assembly Contract

`frontend/app/page.tsx` is a **pure section composer**. It imports and renders sections in order — no logic, no state, no inline JSX beyond layout wrappers.

**Current render order:**
```
<Background />          ← fixed visual layer (glow + grain)
<Nav />
<Hero />
<div relative>
  <Manifesto />         ← includes BuilderStats internally
  <WhoSection />
  <ManifestoArrow />    ← SVG arrow overlay, absolutely positioned over this wrapper
</div>
<ExperimentalType />
<div flex-col>
  <CTASection />
  <Footer />
</div>
```

Do not add logic or inline section JSX to `page.tsx`. If a new section is needed, create a component file and import it.

---

## Current Route Map

| Route | File | State |
|---|---|---|
| `/` | `app/page.tsx` | Live — full landing page |
| `/about` | `app/about/page.tsx` | Stub placeholder |
| `/community` | `app/community/page.tsx` | Stub placeholder |
| `/join` | `app/join/page.tsx` | Stub placeholder |
| `/login` | `app/login/` | **Directory exists, no page.tsx** |
| `/profile` | `app/profile/` | **Directory exists, no page.tsx** |
| `GET /api/newspapers` | `app/api/newspapers/route.ts` | Live — lists `public/newspapers/` |

---

## Component Placement Rules

| What | Where |
|---|---|
| Full-page section | `frontend/components/<SectionName>.tsx` |
| Reusable UI primitive / visual effect | `frontend/components/ui/<Name>.tsx` |
| Shared React hook | `frontend/hooks/<useName>.ts` |
| Brand tokens, font constants | `frontend/lib/constants.ts` |
| Route page | `frontend/app/<route>/page.tsx` |
| API route | `frontend/app/api/<route>/route.ts` |

**Never** place section components inside `app/` directly. `app/` is for route files only.  
**Never** use `frontend/src/` — it is dead scaffolding with zero files.  
**Never** use `frontend/animations/` — it is empty.

---

## Background and Visual Effects Rules

`Background.tsx` renders two fixed layers:
1. A radial orange glow (`zIndex: -1`)
2. An SVG fractal noise grain overlay (`zIndex: 9998`, opacity `0.038`)

Both are in **one component**. Do not split them. Do not create a separate `Grain.tsx` or `GlobalBackground.tsx` — those were deleted. Do not add a second `<Background />` anywhere.

Each section component manages its own **ambient glow divs** (animated `radial-gradient` blurs, `pointer-events-none`, `aria-hidden`). This is intentional — section-local glows are not the same as the global background.

---

## Scroll and Animation Rules

- All section entrance animations use `useReveal()` from `frontend/hooks/useReveal.ts`. It wraps `useInView` with `once: true` and `amount: 0.25` as defaults. Pass the returned `ref` to the section element and use `inView` as the `animate` condition.
- Animations are triggered by **scroll position**, not timers (timers are only used for post-layout bezier calculations and activity tickers).
- Do **not** introduce nested scroll containers (`overflow: scroll/auto` on non-root elements that contain scroll-animated content). This breaks `IntersectionObserver`.
- Do **not** add `scroll-snap` or `scroll-behavior` overrides at the page level — this landing page uses free scroll with JS-driven `useInView`.
- Do **not** use `overflow: hidden` on `<html>` or `<body>` — it is intentionally left without it to allow natural scroll.
- SVG bezier arrows (Hero → Manifesto, ManifestoArrow, ExperimentalType) are **DOM-measurement-driven**: they read `getBoundingClientRect()` after layout settles and recalculate on `resize`. Always wait for animations to settle before measuring (use `setTimeout` ≥ layout settle time). Never hardcode arrow coordinates.

---

## Frontend Architecture Rules

- **Styling convention:** brand colors/fonts via inline `style` prop using `C` and font constants. Spacing, flex/grid, breakpoints, show/hide → Tailwind classes.
- **Fluid typography:** use `clamp()` for all heading font sizes. Never use fixed `px` sizes at heading scale.
- **No `Math.random()` at module scope** in any component — it breaks SSR/CSR hydration. Randomness must be inside `useEffect` or post-mount callbacks.
- **Deterministic SSR-safe values** where needed (e.g., `BuilderConstellation` uses coprime moduli for node positions).
- **Animation library:** `motion/react` (Framer Motion v12, package name `motion`). Do not install a second animation library.
- **Path alias:** `@/` maps to `frontend/` root (set in `tsconfig.json`). Use `@/components/...`, `@/lib/...`, `@/hooks/...`.
- **Do not create duplicate component variants** (`HeroNew.tsx`, `Manifesto2.tsx`, etc.). Refactor the existing file.
- **TypeScript strict mode is on.** No `any` casts without justification.

---

## Backend Architecture Rules

- Framework: FastAPI. Single entrypoint: `backend/app/main.py`.
- Settings via pydantic-settings in `backend/app/config.py`. Reads from `.env`. The database is **PostgreSQL only** (Neon); `DATABASE_URL` is required and validated. Schema is managed exclusively by Alembic (`backend/alembic/`).
- CORS is configured for `http://localhost:3000` only.
- When adding routes: create an `APIRouter` in `backend/app/routes/<domain>.py`, register it in `main.py` with a prefix.
- SQLAlchemy models go in `backend/app/models/`. Pydantic schemas (request/response) go in `backend/app/schemas/`. Business logic goes in `backend/app/services/`.
- Auth dependencies: `passlib[bcrypt]` for password hashing, `python-jose` for JWT. Not yet wired — config keys exist but no endpoints use them.

---

## Database

**Schema file:** `database/schema.sql`

```sql
users           (id, username, email, password_hash, created_at)
projects        (id, title, description, owner_id → users, created_at)
community_posts (id, content, author_id → users, created_at)
```

`database/migrations/` and `database/seeds/` exist as empty directories. Not wired to the ORM yet.

---

## Current State — What Is and Isn't Wired

| Area | Status |
|---|---|
| Landing page (visual) | Complete and live |
| Nav links | About + Community (both stub pages) |
| `/join`, `/about`, `/community` pages | Stub one-liners |
| `/login`, `/profile` routes | Directories exist, no `page.tsx` |
| Backend API | Only `GET /` health check |
| Database | Schema defined, not connected to ORM |
| Auth | Dependencies installed, not implemented |
| All display data | Hardcoded (stats, activities, constellation labels) |
| Newspapers API | Live — reads `public/newspapers/` but nothing consumes it on the frontend yet |

---

## What Not To Do

- Do not hardcode `#FF5B2E`, `#F5F2EB`, or any brand value — use `C.*` from `lib/constants.ts`.
- Do not hardcode font family strings — use `DISPLAY`, `SCRIPT`, or `SANS` from `lib/constants.ts`.
- Do not write new files in `frontend/src/` or `frontend/animations/` — both are dead scaffolding.
- Do not create a second background component or render `<Background />` more than once.
- Do not add `overflow: hidden` to `<html>` or `<body>`.
- Do not add nested scroll containers inside animation sections.
- Do not use `Math.random()` at module scope.
- Do not inline section markup into `app/page.tsx` — create a component.
- Do not create `SomethingNew.tsx` or `Something2.tsx` variants — edit the existing file.
- Do not push to the remote or create PRs without explicit confirmation.

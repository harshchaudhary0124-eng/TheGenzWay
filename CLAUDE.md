# The GenZ Way

Community/movement platform for ambitious Gen Z builders. Currently: a premium landing page. Backend and database are empty stubs.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript 5, Tailwind CSS v4, `motion` (Framer Motion v12)
- **Backend:** Python FastAPI — skeleton only, no routes implemented
- **Database:** Not yet implemented
- **Fonts:** Anton (display), Caveat (handwritten), DM Sans (body) — loaded via Google Fonts in `layout.tsx`

## Directory Structure

```
frontend/app/         — Next.js App Router pages and layouts
frontend/app/page.tsx — Entire landing page (single file, ~1180 lines)
frontend/app/layout.tsx — Root layout; Google Fonts link tags live here
frontend/app/globals.css — Tailwind v4 import + CSS custom properties
backend/app/main.py   — Empty FastAPI entry point
database/             — Empty, not yet used
docs/                 — Empty
venv/                 — Python virtualenv (don't edit)
```

## Brand Tokens (defined at top of `page.tsx`)

```ts
const C = { orange:"#FF5B2E", glow:"#FF8A3D", red:"#C74343", cream:"#F5F2EB", muted:"#8C8C8C", bg:"#080808" }
```
These are inline style constants, not CSS variables (though globals.css mirrors them as `--primary`, `--background`, etc.).

## Frontend Architecture

- **Single page** — all sections are React components defined and composed in `page.tsx`; no subdirectories or separate component files yet
- **Scroll animations** — shared `useReveal()` hook wraps `useInView` from `motion/react`; all section components use it
- `GlobalBackground` — fixed radial orange glow (`z-index: -1`)
- `Grain` — fixed SVG noise overlay (`opacity: 0.038`, `z-index: 9998`)
- `DrawArrow` / `HeroCurvedArrow` — animated SVG path components between sections
- **All data is hardcoded** — `PROJECTS[]`, `TESTIMONIALS[]`, `WHO_ROLES[]` are static arrays in `page.tsx`

## Landing Page Sections (render order)

`Nav` → `Hero` → `Manifesto` → `Problem` → `WhoSection` → `Projects` → `ExperimentalType` → `Testimonials` → `CTASection` → `Footer`

## Coding Conventions

- Inline `style={{}}` objects for brand colors; Tailwind for spacing/layout
- `clamp()` for all fluid font sizes
- `motion.` components for all entrance animations; `useInView` drives them
- TypeScript strict mode on; no `any`
- No component library — all UI is hand-rolled

## Important Commands

```bash
cd frontend && npm run dev    # start dev server (localhost:3000)
cd frontend && npm run build  # production build
cd frontend && npm run lint   # ESLint
```

## Known Goals / Future Direction

- **Backend:** FastAPI needs routes for user auth, project listings, community features
- **Database:** Schema TBD — likely users, projects, memberships
- **Routing:** Additional pages needed (projects board, profiles, community)
- **Forms:** Waitlist/signup form on the landing CTAs (currently `href="#"`)
- **Data:** Replace hardcoded `PROJECTS[]` and `TESTIMONIALS[]` with API calls
- **Component split:** `page.tsx` should be broken into `components/` once pages multiply

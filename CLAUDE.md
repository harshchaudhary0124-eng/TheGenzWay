# CLAUDE.md

## Project Overview

TheGenzWay is a community platform for builders, creators, founders, students, and problem-solvers.

Current priority:

* Landing page development
* Community building
* Future platform architecture

---

## Architecture

```text
TheGenzWay/
├── frontend/
│   └── app/
│       ├── page.tsx
│       ├── layout.tsx
│       └── globals.css
├── backend/
│   └── app/main.py
├── database/
└── CLAUDE.md
```

### Active Development Area

Most work happens in:

```text
frontend/app/page.tsx
```

The landing page is intentionally kept as a single file.

Do not split into components unless explicitly requested.

Backend is currently a placeholder. Do not implement backend features unless requested.

---

## Commands

```bash
cd frontend

npm run dev
npm run build
npm run lint
npx tsc --noEmit
```

---

## Code Style

* TypeScript strict mode
* Functional React components
* Reuse existing patterns
* Prefer simple solutions
* Prefer small targeted edits
* Preserve current design language

---

## Repository Exploration Rules

Read this file first.

Read only files required for the task.

Never scan the entire repository unless explicitly requested.

Avoid:

```bash
tree
find .
Get-ChildItem -Recurse
grep entire project
```

Ignore:

```text
node_modules/
.next/
dist/
build/
coverage/
venv/
.git/
```

---

## Planning Policy

Before implementation:

1. Briefly explain the plan
2. List files to modify
3. Implement

Avoid large unplanned changes.

---

## Package Policy

Never install packages without approval.

Before suggesting a package:

* Explain why it is needed
* Mention bundle impact
* Suggest alternatives

---

## Performance Rules

Performance is a priority.

Prefer:

* CSS animations
* CSS transforms
* Lazy loading
* Existing Motion patterns

Avoid:

* Unnecessary re-renders
* Heavy dependencies
* Expensive scroll listeners
* Large refactors

---

## Landing Page

Current section order:

```text
Nav
Hero
Manifesto
Problem
WhoSection
Projects
ExperimentalType
Testimonials
CTASection
Footer
```

Do not change section order unless requested.

---

## Brand Tokens

```text
orange = #FF5B2E
glow   = #FF8A3D
red    = #C74343
cream  = #F5F2EB
muted  = #8C8C8C
bg     = #080808
```

Follow existing branding and typography.

---

## Refactoring Rules

Do not:

* Split page.tsx
* Reorganize folders
* Add state-management libraries
* Refactor unrelated code

Prefer the smallest change that solves the task.

---

## Success Criteria

* Solve only the requested task
* Modify the fewest files possible
* Preserve performance
* Preserve design consistency
* Avoid unnecessary exploration

```
```

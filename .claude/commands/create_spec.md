---

description: Create a spec file for the next The GenZ Way feature
argument-hint: "Step number and feature name e.g. 04 onboarding-home"
allowed-tools: Read, Write, Glob
--------------------------------

You are a senior developer planning the next feature for **The GenZ Way**.
Always follow the rules in `CLAUDE.md`.

User input: `$ARGUMENTS`

DO NOT CONTINUE until the working directory is clean.

## Step 1 — Parse the arguments

From `$ARGUMENTS` extract:

1. `step_number` — zero-padded to 2 digits

   * `2 → 02`
   * `11 → 11`

2. `feature_title` — human readable title in Title Case

   * Example: `"Join Auth Flow"` or `"Home Onboarding"`

3. `feature_slug` — git and file safe slug

   * lowercase, kebab-case
   * only `a-z`, `0-9` and `-`
   * maximum 40 characters
   * examples:

     * `join-auth-flow`
     * `home-onboarding`
     * `community-page`

If you cannot infer these from `$ARGUMENTS`, ask the user to clarify before proceeding.

---

## Step 2 — Research the codebase

Read these files before writing the spec:

* `CLAUDE.md`
* `frontend/app/page.tsx`
* `frontend/app/layout.tsx`
* `frontend/lib/constants.ts`
* `frontend/components/**/*`
* `frontend/app/**/*` relevant to the requested feature
* `backend/app/main.py`
* `backend/app/config.py`
* `backend/app/models/**/*`
* `backend/app/schemas/**/*`
* `backend/app/routes/**/*`
* `backend/app/services/**/*`
* `.claude/specs/**/*`

### What to verify during research

1. Whether the requested feature already exists fully or partially
2. Which frontend route/page/component currently owns the feature area
3. Whether the feature touches:

   * auth
   * onboarding
   * database models
   * API routes
   * navigation / page routing
   * UI-only landing page sections
4. Whether a related spec already exists in `.claude/specs/`

If the requested feature is already implemented or already spec’d in a meaningful way, warn the user and stop.

---

## Step 3 — Understand The GenZ Way architecture before writing the spec

Use `CLAUDE.md` and the codebase to align the spec with the actual project.

Assume the project is a **dark editorial builder-community platform** with:

* **Frontend:** Next.js App Router + TypeScript + Tailwind CSS + Framer Motion (`motion/react`)
* **Backend:** FastAPI
* **Database/Auth direction:** PostgreSQL + SQLAlchemy + Pydantic + JWT auth
* **Brand system:** colors and font tokens from `frontend/lib/constants.ts`
* **Design language:** premium, bold, cinematic, dark, Gen Z builder aesthetic

When planning the feature, preserve:

* the current visual language
* existing page structure
* reusable component patterns
* existing auth/database architecture if already introduced

Do **not** invent a parallel architecture if the repo already has an active pattern.

---

## Step 4 — Write the spec

Generate a spec document with this exact structure:

---

# Spec: <feature_title>

## Overview

One paragraph explaining what this feature does, why it exists in The GenZ Way product, and how it fits into the platform flow.

## Product goal

A short section describing the user-facing purpose of the feature. Focus on what the user should be able to do after this feature is implemented.

## Depends on

List previous steps / existing systems this feature depends on:

* auth
* existing pages
* backend models
* onboarding flow
* navigation
* shared UI components
* etc.

If there are no hard dependencies, say so explicitly.

## User flow

Describe the exact user journey for this feature:

* entry point
* interaction steps
* success state
* failure / validation state
* redirect behavior if relevant

Keep this practical and aligned to the current app flow.

## Frontend scope

Specify all frontend work required.

Use this structure:

* **Pages / routes**

  * pages to create
  * pages to modify

* **Components**

  * components to create
  * components to modify

* **State / client logic**

  * form state
  * fetch logic
  * auth state
  * onboarding state
  * loading / error / success states
  * conditional rendering
  * redirects

* **UI / motion requirements**

  * exact visual expectations
  * whether the feature should match landing-page editorial style
  * whether motion/reveal effects are needed or should be avoided

## Backend scope

Specify all backend work required.

Use this structure:

* **API routes**
  Every new or modified route:

  * `METHOD /path` — description — auth/public/protected

* **Schemas**
  New or updated Pydantic schemas

* **Models**
  New or updated SQLAlchemy models / DB entities

* **Services / business logic**
  What service-layer logic is required

* **Validation / auth rules**
  Any permission, ownership, auth, validation, or security rules

If the feature is frontend-only, explicitly state:
**“No backend changes.”**

## Database changes

List all required database changes.

Include:

* new tables
* new columns
* changed constraints
* enum / JSON / relationship decisions
* whether a migration is required

If none:
**“No database changes.”**

## Files to change

List every existing file expected to be modified.

Use repo-relative paths.

## Files to create

List every new file expected to be created.

Use repo-relative paths.

## API / data contracts

If the feature touches frontend-backend integration, define the expected request/response shape at a practical level.

Include:

* request body fields
* success response shape
* error response shape if relevant

If not applicable:
**“No new API/data contracts.”**

## Implementation notes

Write project-specific implementation guidance Claude must follow for this feature.

Always include the rules below, adapting them only if the current repo clearly uses a different established pattern:

* Reuse existing **The GenZ Way** visual system and do not redesign unrelated sections
* Use tokens from `frontend/lib/constants.ts` — do not hardcode brand colors/fonts repeatedly
* Keep new UI consistent with the current dark editorial style
* Prefer reusable components over bloated page files
* Keep landing-page-only logic separate from authenticated app logic where possible
* Do not break `/join`, `/login`, `/home`, `/welcome`, `/about`, `/community`, or homepage routing if they already exist
* If the feature touches auth/onboarding, preserve the existing redirect flow
* If backend changes are needed, keep them aligned with the current FastAPI + SQLAlchemy + Pydantic architecture
* Do not create duplicate database/auth systems
* Use environment variables for backend/frontend integration where relevant
* Avoid adding dependencies unless the feature genuinely needs them

## New dependencies

Any new npm or pip packages required.

If none:
**“No new dependencies.”**

## Definition of done

Write a concrete checklist of testable outcomes.

Every item must be something that can be verified by running the app or exercising the feature manually.

Examples:

* user can open the page from the correct route
* form validates correctly
* API request succeeds and persists data
* redirect happens correctly
* feature matches mobile + desktop layout expectations
* existing pages still work

---

## Step 5 — Save the spec

Save the spec to:

`.claude/specs/<step_number>-<feature_slug>.md`

Example:

* `.claude/specs/04-home-onboarding.md`
* `.claude/specs/05-community-page.md`

---

## Step 6 — Report to the user

After saving, print a short summary in this exact format:

```txt
Spec file: .claude/specs/<step_number>-<feature_slug>.md
Title:     <feature_title>
```

Then tell the user:

Review the spec at `.claude/specs/<step_number>-<feature_slug>.md` and then proceed with implementation.

Do **not** print the full spec in chat unless explicitly asked.

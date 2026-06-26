# Spec: Welcome Page Setup

## Overview

The Welcome page (`/welcome`) is the first authenticated destination a user reaches after completing onboarding. It confirms the user has been accepted into the community, personalises the experience with their first name and selected domains, and provides a clear primary CTA to enter the community. This page is a pivotal emotional moment in the user journey — the payoff after registration and onboarding — so it must feel premium, confident, and cinematic, consistent with The GenZ Way's dark editorial aesthetic.

**Current status:** The core page UI is already implemented in `frontend/app/welcome/page.tsx`. This spec formalises the intended design contract, documents the auth guard requirement, and identifies the remaining gap — a functional logout mechanism.

---

## Product goal

After completing the onboarding flow (`/home`), a logged-in user arrives at `/welcome` and:

- Sees a personalised, full-screen confirmation screen ("YOU'RE IN, {FIRSTNAME}.")
- Sees their selected interest domains displayed as chips
- Reads the platform tagline: *Refuse average.*
- Has a clear CTA to explore the community
- Can log out if needed

---

## Depends on

- **Auth system** — JWT token stored in `localStorage` via `frontend/lib/auth.ts` (`getToken`, `apiGetMe`)
- **`/join` registration flow** — user must be registered before reaching this page
- **`/home` onboarding flow** — user must have `onboarding_completed = true`; the `/home` page redirects already-completed users here
- **`POST /auth/onboarding` backend endpoint** — sets `onboarding_completed = true` on the user record
- **`GET /auth/me` backend endpoint** — returns `UserProfile` including `full_name`, `interested_domains`, `onboarding_completed`
- **`Background` component** — shared fixed visual layer
- **Brand tokens** — `C`, `DISPLAY`, `SCRIPT`, `SANS` from `frontend/lib/constants.ts`

---

## User flow

1. User completes the final onboarding question in `/home`
2. `apiSaveOnboarding` is called; on success the router replaces with `/welcome`
3. `/welcome` page mounts:
   - Reads token from `localStorage`
   - If no token → redirect to `/login`
   - Calls `GET /auth/me`
   - If request fails (expired/invalid token) → redirect to `/login`
4. While loading: blank background (`C.bg`, `minHeight: 100vh`) — no spinner or flash
5. On success: animated welcome screen renders with personalised content
6. User clicks "Explore the community →" → navigates to `/community`
7. User clicks "Log out" → token is cleared from `localStorage`, redirect to `/`

**Edge cases:**
- User navigates directly to `/welcome` without completing onboarding: `apiGetMe` still succeeds (they're logged in), so the page renders. This is acceptable; the page is not onboarding-only.
- Token present but expired: `GET /auth/me` returns 401 → redirect to `/login`.

---

## Frontend scope

### Pages / routes

- **Modify:** `frontend/app/welcome/page.tsx` — add a logout button; all other UI is already built

### Components

- **No new components required.** The page is self-contained.
- The `Background` component (`frontend/components/ui/Background.tsx`) is already rendered on this page.

### State / client logic

Already implemented:
- `user: UserProfile | null` — populated by `apiGetMe` on mount
- Auth guard in `useEffect`: token missing or `apiGetMe` failure → `router.replace("/login")`
- Loading state: renders blank `<main>` while user is null

To add:
- `handleLogout` function: calls `clearToken()` (from `frontend/lib/auth.ts`), then `router.replace("/")`

### UI / motion requirements

Already implemented (do not change):
- `Background` component rendered as the fixed visual layer
- Ambient orange radial glow div (section-local, `aria-hidden`)
- Brand mark: "The GenZ Way" in `C.orange`, spaced uppercase, 0.6rem
- Heading: `"YOU'RE IN,"` + `"{FIRSTNAME}."` stacked, `DISPLAY` font, `clamp(2.8rem, 9vw, 6rem)`, second line in `C.orange`
- Domain chips: `user.interested_domains` mapped to bordered pill spans
- Tagline: `"Refuse average."` in `SCRIPT` font, `C.muted`
- CTA button: `C.orange` filled button, box-shadow glow, links to `/community`
- All elements use `motion` (`motion/react`) with staggered `opacity`/`y` entrance animations

To add:
- Logout link/button: minimal, below the CTA. Styled in `C.muted`, small (`0.68rem`), no border, text-only. Matches the subdued visual register of the tagline area. No motion wrapper needed.

---

## Backend scope

No backend changes. The required endpoints (`POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/onboarding`) are all implemented and live.

---

## Database changes

No database changes.

---

## Files to change

- `frontend/app/welcome/page.tsx` — add logout button with `handleLogout` using `clearToken` + `router.replace("/")`

## Files to create

None.

---

## API / data contracts

No new API/data contracts. The page consumes the existing `GET /auth/me` endpoint.

**Response shape already consumed:**
```ts
UserProfile {
  id: number
  full_name: string          // used: firstName = full_name.split(" ")[0].toUpperCase()
  email: string
  qualification: string
  interested_domains: string[]  // displayed as domain chips
  country: string
  city: string
  profile_slug: string
  onboarding_completed: boolean
  onboarding_answers: Record<string, unknown>
  created_at: string
}
```

---

## Implementation notes

- Use `clearToken` from `frontend/lib/auth.ts` — do not re-implement token removal
- Logout triggers `router.replace("/")` (homepage), not `/login` — logging out should feel like a clean exit, not a failure
- The logout UI should be visually quiet: `C.muted` color, no border, no background, `SANS` font, small size — it must not compete with the primary CTA
- Keep the page as a `"use client"` component — the auth guard requires `useEffect` and `useRouter`
- Do not add `<Nav />` to this page — the welcome screen is intentionally nav-free, a standalone moment
- Do not add `overflow: hidden` to any wrapper
- Do not use `Math.random()` at module scope
- Brand colors/fonts must come from `frontend/lib/constants.ts`

---

## New dependencies

No new dependencies.

---

## Definition of done

- [ ] `/welcome` renders a blank screen (no flash/spinner) while fetching user data
- [ ] `/welcome` without a token redirects to `/login`
- [ ] `/welcome` with an invalid/expired token redirects to `/login`
- [ ] Authenticated user sees `"YOU'RE IN, {FIRSTNAME}."` with correct first name in orange
- [ ] All `interested_domains` appear as chips below the heading
- [ ] Tagline "Refuse average." renders in Caveat font, muted color
- [ ] "Explore the community →" CTA links to `/community`
- [ ] A logout option is visible below the CTA
- [ ] Clicking logout clears the token from `localStorage` and redirects to `/`
- [ ] After logout, revisiting `/welcome` redirects back to `/login`
- [ ] Page matches mobile (`< 640px`) and desktop layouts — heading scales with `clamp()`
- [ ] No regressions on `/join`, `/login`, `/home` routing

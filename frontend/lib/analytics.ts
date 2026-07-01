/**
 * Privacy-first product analytics.
 *
 * Two integrations:
 *  - **Vercel Analytics** — traffic/web vitals, mounted via `<Analytics/>` in the
 *    layout (see components/Analytics.tsx). Zero config; active on Vercel.
 *  - **PostHog** — the anonymous product events defined here.
 *
 * Hard rules (No personal data is ever sent):
 *  - PostHog initialises only in the browser and only when
 *    `NEXT_PUBLIC_POSTHOG_KEY` is set. Without it, every `track()` is a silent
 *    no-op — safe for development and for builds where analytics isn't wired.
 *  - Person profiles are disabled (`person_profiles: "never"`) and autocapture /
 *    session recording are off, so PostHog cannot build a profile or capture
 *    form input on its own.
 *  - URLs are sanitised to drop query strings, which can carry invite tokens.
 *  - The helper functions take **no arguments** — the event name is the entire
 *    payload. There is no path for PII to be attached.
 */
import type { PostHog } from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// posthog-js is loaded lazily (dynamic import) only when a key is configured, so
// the ~50KB SDK never lands in the page bundles or the critical path. `ph` holds
// the instance once loaded; until then every track() call is a no-op.
let initialised = false;
let ph: PostHog | null = null;

/** Strip query strings / identifying URL fields from any captured property. */
function sanitizeProperties(properties: Record<string, unknown>): Record<string, unknown> {
  for (const key of Object.keys(properties)) {
    const value = properties[key];
    if (
      typeof value === "string" &&
      (key.includes("url") || key.includes("referr") || key.includes("pathname") || key.includes("host"))
    ) {
      properties[key] = value.split("?")[0];
    }
  }
  return properties;
}

/** Initialise PostHog once (browser-only, key-gated). Safe to call repeatedly. */
export function initAnalytics(): void {
  if (initialised || typeof window === "undefined" || !POSTHOG_KEY) return;
  initialised = true; // set immediately so we don't kick off two parallel imports
  // Load the SDK off the critical path; it never blocks rendering or navigation.
  import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: false, // no automatic DOM event capture
        capture_pageview: true, // anonymous pageviews only
        capture_pageleave: true,
        disable_session_recording: true,
        person_profiles: "never", // never identify users or build profiles
        sanitize_properties: (props) => sanitizeProperties(props as Record<string, unknown>),
      });
      ph = posthog;
    })
    .catch(() => {
      initialised = false; // allow a later retry if the chunk failed to load
    });
}

/** Anonymous product events — these names are the only data we send. */
export const AnalyticsEvent = {
  Registration: "user_registered",
  Login: "user_logged_in",
  OnboardingCompleted: "onboarding_completed",
  ForumCreated: "forum_created",
  ForumInvited: "forum_invitation_sent",
  ForumJoined: "forum_joined",
  MessageSent: "message_sent",
} as const;

type EventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

/** Fire-and-forget event capture. Never throws; never sends personal data. */
function track(event: EventName): void {
  try {
    ph?.capture(event); // no-op until/unless PostHog finished loading
  } catch {
    /* analytics must never break the app */
  }
}

export const trackRegistration = () => track(AnalyticsEvent.Registration);
export const trackLogin = () => track(AnalyticsEvent.Login);
export const trackOnboardingCompleted = () => track(AnalyticsEvent.OnboardingCompleted);
export const trackForumCreated = () => track(AnalyticsEvent.ForumCreated);
export const trackForumInvited = () => track(AnalyticsEvent.ForumInvited);
export const trackForumJoined = () => track(AnalyticsEvent.ForumJoined);
export const trackMessageSent = () => track(AnalyticsEvent.MessageSent);

/**
 * Browser Sentry init (Next.js client instrumentation, loaded automatically).
 *
 * Enabled ONLY when NEXT_PUBLIC_ENVIRONMENT=production AND a DSN is configured;
 * otherwise Sentry.init is never called and nothing is reported. Session replay
 * is disabled and PII is never attached so no personal data leaves the browser.
 */
import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENABLED = process.env.NEXT_PUBLIC_ENVIRONMENT === "production" && !!DSN;

if (ENABLED) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

// Lets Sentry instrument client-side navigations (App Router).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

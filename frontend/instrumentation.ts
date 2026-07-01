/**
 * Server/edge Sentry init (Next.js instrumentation hook).
 *
 * Sentry is enabled ONLY when NEXT_PUBLIC_ENVIRONMENT=production AND a DSN is
 * configured — in every other case `register()` is a no-op so nothing is sent
 * from local/dev runs. `onRequestError` forwards server render errors to Sentry.
 */
import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENABLED = process.env.NEXT_PUBLIC_ENVIRONMENT === "production" && !!DSN;

export async function register() {
  if (!ENABLED) return;
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: DSN,
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
      tracesSampleRate: 0,
      sendDefaultPii: false, // never attach cookies/headers/user data
    });
  }
}

export const onRequestError = Sentry.captureRequestError;

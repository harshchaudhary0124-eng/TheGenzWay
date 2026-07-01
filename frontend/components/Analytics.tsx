"use client";

import { useEffect } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { initAnalytics } from "@/lib/analytics";

/**
 * App-wide analytics mount. Renders nothing visible — adding it does not change
 * any UI:
 *  - Vercel Analytics (traffic / web vitals) — active on Vercel production.
 *  - PostHog (anonymous product events) — initialised on mount; a no-op unless
 *    NEXT_PUBLIC_POSTHOG_KEY is configured.
 */
export default function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return <VercelAnalytics />;
}

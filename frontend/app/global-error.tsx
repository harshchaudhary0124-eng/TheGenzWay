"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // No-op unless Sentry was initialised (production + DSN). UI is unchanged.
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          margin: 0,
          background: "#080808",
          color: "#F5F2EB",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "16px",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", letterSpacing: "0.05em" }}>
          Something went wrong.
        </h2>
        <button
          onClick={reset}
          style={{
            padding: "8px 20px",
            background: "transparent",
            border: "1px solid rgba(255,91,46,0.4)",
            color: "#FF5B2E",
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

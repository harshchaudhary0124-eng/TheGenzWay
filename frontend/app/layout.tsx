import type { Metadata } from "next";
import "./globals.css";
import AnalyticsProvider from "@/components/Analytics";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  // metadataBase makes OG/canonical URLs absolute in production; omitted (and
  // harmless) when NEXT_PUBLIC_APP_URL isn't set locally.
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  title: "The GenZ Way",
  description: "Build. Connect. Ship. Repeat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@400;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <AnalyticsProvider />
      </body>
    </html>
  );
}

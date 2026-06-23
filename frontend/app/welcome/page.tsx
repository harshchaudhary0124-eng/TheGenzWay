"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import Link from "next/link";
import Background from "@/components/ui/Background";
import { C, DISPLAY, SANS, SCRIPT } from "@/lib/constants";
import { getToken, apiGetMe } from "@/lib/auth";
import type { UserProfile } from "@/lib/auth";

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/login"); return; }
    apiGetMe(token)
      .then(u => setUser(u))
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!user) {
    return <main style={{ background: C.bg, minHeight: "100vh" }} />;
  }

  const firstName = user.full_name.split(" ")[0].toUpperCase();

  return (
    <>
      <Background />
      <main
        className="min-h-screen flex items-center justify-center px-6 py-16"
        style={{ ...SANS }}
      >
        <div className="w-full max-w-lg text-center" style={{ position: "relative" }}>
          {/* Ambient glow */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "-80px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "400px",
              height: "240px",
              background: `radial-gradient(ellipse, rgba(255,91,46,0.14) 0%, transparent 68%)`,
              filter: "blur(48px)",
              pointerEvents: "none",
            }}
          />

          {/* Brand mark */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            style={{
              fontSize: "0.6rem",
              color: C.orange,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: "52px",
            }}
          >
            The GenZ Way
          </motion.p>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              style={{
                ...DISPLAY,
                fontSize: "clamp(2.8rem, 9vw, 6rem)",
                color: C.cream,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: "8px",
              }}
            >
              YOU&apos;RE IN,
            </h1>
            <h1
              style={{
                ...DISPLAY,
                fontSize: "clamp(2.8rem, 9vw, 6rem)",
                color: C.orange,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: "44px",
              }}
            >
              {firstName}.
            </h1>
          </motion.div>

          {/* Domain chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {user.interested_domains.map(d => (
              <span
                key={d}
                style={{
                  fontSize: "0.65rem",
                  color: "rgba(245,242,235,0.55)",
                  border: "1px solid rgba(245,242,235,0.12)",
                  padding: "4px 12px",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                {d}
              </span>
            ))}
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            style={{
              ...SCRIPT,
              fontSize: "clamp(1.2rem, 3vw, 1.75rem)",
              color: C.muted,
              marginBottom: "52px",
            }}
          >
            Refuse average.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.6 }}
          >
            <Link
              href="/community"
              style={{
                display: "inline-block",
                padding: "14px 38px",
                background: C.orange,
                color: C.bg,
                fontSize: "0.75rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                textDecoration: "none",
                boxShadow: `0 0 36px rgba(255,91,46,0.28)`,
                fontWeight: 600,
                ...SANS,
              }}
            >
              Explore the community →
            </Link>
          </motion.div>
        </div>
      </main>
    </>
  );
}

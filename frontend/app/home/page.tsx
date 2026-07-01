"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Background from "@/components/ui/Background";
import OnboardingFlow from "@/components/OnboardingFlow";
import { C, DISPLAY, SANS } from "@/lib/constants";
import { getToken, apiGetMe, apiSaveOnboarding, getCachedUser } from "@/lib/auth";
import type { UserProfile } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completedAnswers, setCompletedAnswers] = useState<Record<string, Record<string, string>>>({});

  // Warm the bundle for the route we redirect completed users to.
  useEffect(() => { router.prefetch("/welcome"); }, [router]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const isComplete = (u: UserProfile) => {
      const savedAnswers = u.onboarding_answers as Record<string, unknown>;
      return u.onboarding_completed && u.interested_domains.every(
        d => savedAnswers[d] && typeof savedAnswers[d] === "object" &&
             Object.keys(savedAnswers[d] as object).length > 0
      );
    };

    // Decide instantly from the cached profile so navigation never blocks on a
    // round-trip: already-onboarded users bounce straight to /welcome; users who
    // still need onboarding render it immediately. apiGetMe still revalidates.
    const cached = getCachedUser();
    if (cached && isComplete(cached)) {
      router.replace("/welcome");
      return;
    }
    if (cached) {
      setUser(cached);
      setLoading(false);
    }

    apiGetMe(token)
      .then(u => {
        if (isComplete(u)) {
          router.replace("/welcome");
        } else {
          setUser(u);
          setLoading(false);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const handleDomainComplete = async (domain: string, answers: Record<string, string>) => {
    if (!user) return;

    const newCompleted = { ...completedAnswers, [domain]: answers };
    setCompletedAnswers(newCompleted);

    const allDone = user.interested_domains.every(d => newCompleted[d]);
    if (!allDone) return;

    const token = getToken();
    if (!token) { router.replace("/login"); return; }
    setSubmitting(true);
    try {
      const domainsData = Object.entries(newCompleted).map(([dom, ans]) => ({
        domain: dom,
        answers: ans,
      }));
      await apiSaveOnboarding(token, domainsData);
      router.replace("/welcome");
    } catch {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main
        style={{
          background: C.bg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.p
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ color: C.muted, ...SANS, fontSize: "0.875rem", letterSpacing: "0.05em" }}
        >
          Loading…
        </motion.p>
      </main>
    );
  }

  if (!user) return null;

  const domains = user.interested_domains;
  const completedCount = Object.keys(completedAnswers).length;

  // Single domain — centered card (original layout)
  if (domains.length === 1) {
    return (
      <>
        <Background />
        <div className="min-h-screen flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-[520px]">
            <OnboardingFlow
              domain={domains[0]}
              onComplete={handleDomainComplete}
            />
          </div>
        </div>
      </>
    );
  }

  // Multi-domain — grid layout
  const gridMaxWidth =
    domains.length === 2
      ? "1120px"
      : domains.length === 3
      ? "1480px"
      : "1480px";

  return (
    <>
      <Background />

      {/* Global saving overlay */}
      <AnimatePresence>
        {submitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(8,8,8,0.88)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              backdropFilter: "blur(10px)",
            }}
          >
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{ color: C.muted, ...SANS, fontSize: "0.875rem", letterSpacing: "0.08em" }}
            >
              Saving your profile…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-screen px-4 py-12" style={{ ...SANS }}>
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p
            style={{
              fontSize: "0.6rem",
              color: C.orange,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            The GenZ Way
          </p>
          <h1
            style={{
              ...DISPLAY,
              fontSize: "clamp(1.8rem, 5vw, 3rem)",
              color: C.cream,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: "14px",
            }}
          >
            Tell us about you
          </h1>

          {/* Overall progress */}
          <p
            style={{
              fontSize: "0.68rem",
              color: completedCount === domains.length ? C.orange : C.muted,
              letterSpacing: "0.1em",
              marginBottom: "10px",
              transition: "color 0.3s",
            }}
          >
            {completedCount} of {domains.length} domains completed
          </p>
          <div
            style={{
              height: "1px",
              background: "rgba(245,242,235,0.07)",
              maxWidth: "280px",
              margin: "0 auto",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <motion.div
              animate={{ width: `${(completedCount / domains.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{
                height: "100%",
                background: C.orange,
                position: "absolute",
                left: 0,
                top: 0,
              }}
            />
          </div>
        </motion.div>

        {/* Domain cards */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            justifyContent: "center",
            maxWidth: gridMaxWidth,
            margin: "0 auto",
            alignItems: "flex-start",
          }}
        >
          {domains.map((domain, i) => {
            const isDone = !!completedAnswers[domain];
            return (
              <motion.div
                key={domain}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: isDone ? 0.72 : 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  flex: "1 1 400px",
                  maxWidth: domains.length === 2 ? "520px" : "460px",
                  minWidth: "300px",
                }}
              >
                <OnboardingFlow
                  domain={domain}
                  onComplete={handleDomainComplete}
                  isCompleted={isDone}
                  compact={domains.length >= 3}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Divider label between sections (only for exactly 2 domains — visual center element) */}
        {domains.length === 2 && (
          <div
            aria-hidden
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: -1,
            }}
          >
            <div
              style={{
                width: "1px",
                height: "240px",
                background: "linear-gradient(to bottom, transparent, rgba(255,91,46,0.12), transparent)",
              }}
            />
          </div>
        )}
      </main>
    </>
  );
}

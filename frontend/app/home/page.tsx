"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import Background from "@/components/ui/Background";
import OnboardingFlow from "@/components/OnboardingFlow";
import { C, SANS } from "@/lib/constants";
import { getToken, apiGetMe, apiSaveOnboarding } from "@/lib/auth";
import type { UserProfile } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    apiGetMe(token)
      .then(u => {
        if (u.onboarding_completed) {
          router.replace("/welcome");
        } else {
          setUser(u);
          setLoading(false);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const handleComplete = async (domain: string, answers: Record<string, string>) => {
    const token = getToken();
    if (!token) { router.replace("/login"); return; }
    setSubmitting(true);
    try {
      await apiSaveOnboarding(token, domain, answers);
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

  return (
    <>
      <Background />
      <OnboardingFlow user={user} onComplete={handleComplete} submitting={submitting} />
    </>
  );
}

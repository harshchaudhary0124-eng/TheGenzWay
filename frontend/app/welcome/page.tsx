"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Background from "@/components/ui/Background";
import WelcomeNavbar from "@/components/WelcomeNavbar";
import PersonCard from "@/components/PersonCard";
// On-demand modals — code-split so they're not in the initial /welcome bundle.
const AddToForumModal = dynamic(() => import("@/components/AddToForumModal"), { ssr: false });
const ProfileModal = dynamic(() => import("@/components/ProfileModal"), { ssr: false });
import { C, DISPLAY, SANS, SCRIPT } from "@/lib/constants";
import { getToken, apiGetMe, getCachedUser } from "@/lib/auth";
import type { UserProfile } from "@/lib/auth";
import { apiDiscoverPeople } from "@/lib/discover";
import type { DiscoveredPerson } from "@/lib/discover";
import { profileFromDiscovered } from "@/lib/profile";
import { apiGetInvites, apiGetMyForums } from "@/lib/forum";
import type { DiscussionForum, ForumInvite } from "@/lib/forum";

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [people, setPeople] = useState<DiscoveredPerson[]>([]);

  // Warm the bundle for the only route we redirect to, so the hop is instant.
  useEffect(() => { router.prefetch("/home"); }, [router]);
  const [invites, setInvites] = useState<ForumInvite[]>([]);
  const [forums, setForums] = useState<DiscussionForum[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [forumTarget, setForumTarget] = useState<DiscoveredPerson | null>(null);
  const [profileTarget, setProfileTarget] = useState<DiscoveredPerson | null>(null);

  const refreshPanels = useCallback(async (token: string) => {
    const [inv, f] = await Promise.all([apiGetInvites(token), apiGetMyForums(token)]);
    setInvites(inv);
    setForums(f);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/login"); return; }

    // Onboarding is complete only if the flag is set AND every selected domain
    // has answers saved (catches partial-onboarding users).
    const isComplete = (u: UserProfile) => {
      const answers = u.onboarding_answers as Record<string, unknown>;
      return u.onboarding_completed && u.interested_domains.every(
        d => answers[d] && typeof answers[d] === "object" && Object.keys(answers[d] as object).length > 0
      );
    };

    const loadPanels = () => Promise.all([
      apiDiscoverPeople(token),
      apiGetInvites(token),
      apiGetMyForums(token),
    ]);

    // Instant paint from the last known profile; apiGetMe below revalidates.
    // When the cache already says onboarding is complete (the common case),
    // start the panel fetches NOW — in parallel with /auth/me — so the people
    // grid loads a round-trip sooner instead of waiting for /auth/me first.
    const cached = getCachedUser();
    let panelsPromise: ReturnType<typeof loadPanels> | null = null;
    if (cached && isComplete(cached)) {
      setUser(cached);
      panelsPromise = loadPanels();
    }

    apiGetMe(token)
      .then(async u => {
        // Block entry (redirect to onboarding) unless fully complete.
        if (!isComplete(u)) {
          router.replace("/home");
          return;
        }

        setUser(u);

        const [p, inv, f] = await (panelsPromise ?? loadPanels());
        setPeople(p);
        setInvites(inv);
        setForums(f);
        setLoadingPeople(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!user) {
    return <main style={{ background: C.bg, minHeight: "100vh" }} />;
  }

  return (
    <>
      <Background />

      {/* Navbar */}
      <WelcomeNavbar
        user={user}
        invites={invites}
        forums={forums}
        onRefresh={() => {
          const token = getToken();
          if (token) refreshPanels(token);
        }}
      />

      {/* Forum modal */}
      {forumTarget && (
        <AddToForumModal
          target={forumTarget}
          myForums={forums}
          onClose={() => setForumTarget(null)}
          onSuccess={() => {
            const token = getToken();
            if (token) refreshPanels(token);
          }}
        />
      )}

      {/* Profile modal */}
      {profileTarget && (
        <ProfileModal
          profile={profileFromDiscovered(profileTarget)}
          highlightDomains={profileTarget.matched_domains.map(d => d.domain)}
          onClose={() => setProfileTarget(null)}
        />
      )}

      <main
        style={{
          paddingTop: "56px",
          minHeight: "100vh",
          ...SANS,
        }}
      >

        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            paddingLeft: "clamp(1.5rem, 6vw, 6rem)",
            paddingRight: "clamp(1.5rem, 6vw, 6rem)",
          }}
        >
          {/* ── People Discovery ──────────────────────────────────────── */}
          <section style={{ paddingTop: "clamp(1.5rem, 3vw, 2.5rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "clamp(1.25rem, 2.5vw, 2rem)", flexWrap: "wrap" }}>
              <h2
                style={{
                  ...DISPLAY,
                  fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                  color: C.cream,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                People on your wavelength
              </h2>
              {!loadingPeople && (
                <span style={{ fontSize: "0.72rem", color: C.muted }}>
                  {people.length > 0
                    ? `${people.length} builder${people.length > 1 ? "s" : ""} matched`
                    : "No matches yet"}
                </span>
              )}
            </div>

            {/* Loading skeleton */}
            {loadingPeople && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 420px), 1fr))",
                  gap: "clamp(1rem, 2vw, 1.5rem)",
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: "300px",
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      animation: "pulse 1.8s ease-in-out infinite",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loadingPeople && people.length === 0 && (
              <div style={{ textAlign: "center", padding: "clamp(3rem, 8vw, 6rem) 0" }}>
                <p style={{ ...SCRIPT, fontSize: "clamp(1.2rem, 3vw, 1.6rem)", color: C.muted, marginBottom: "12px" }}>
                  No one matched yet
                </p>
                <p style={{ color: "rgba(245,242,235,0.35)", fontSize: "0.82rem", maxWidth: "320px", margin: "0 auto", lineHeight: 1.6 }}>
                  The community is growing. Check back soon — or invite a builder you know.
                </p>
              </div>
            )}

            {/* People grid — masonry via CSS columns so cards pack
                upward and never leave gaps under shorter cards */}
            {!loadingPeople && people.length > 0 && (
              <div
                style={{
                  columnWidth: "420px",
                  columnGap: "clamp(1rem, 2vw, 1.5rem)",
                }}
              >
                {people.map((person, i) => (
                  <div
                    key={person.id}
                    style={{
                      breakInside: "avoid",
                      marginBottom: "clamp(1rem, 2vw, 1.5rem)",
                    }}
                  >
                    <PersonCard
                      person={person}
                      index={i}
                      onAddToForum={setForumTarget}
                      onViewProfile={setProfileTarget}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Background from "@/components/ui/Background";
import WelcomeNavbar from "@/components/WelcomeNavbar";
import PersonCard from "@/components/PersonCard";
import AddToForumModal from "@/components/AddToForumModal";
import ProfileModal from "@/components/ProfileModal";
import { C, DISPLAY, SANS, SCRIPT } from "@/lib/constants";
import { getToken, apiGetMe } from "@/lib/auth";
import type { UserProfile } from "@/lib/auth";
import { apiDiscoverPeople, apiGetPersonProfile } from "@/lib/discover";
import type { DiscoveredPerson } from "@/lib/discover";
import { apiGetInvites, apiGetMyForums } from "@/lib/forum";
import type { DiscussionForum, ForumInvite } from "@/lib/forum";

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [people, setPeople] = useState<DiscoveredPerson[]>([]);
  const [invites, setInvites] = useState<ForumInvite[]>([]);
  const [forums, setForums] = useState<DiscussionForum[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [forumTarget, setForumTarget] = useState<DiscoveredPerson | null>(null);
  const [profilePerson, setProfilePerson] = useState<DiscoveredPerson | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const refreshPanels = useCallback(async (token: string) => {
    const [inv, f] = await Promise.all([apiGetInvites(token), apiGetMyForums(token)]);
    setInvites(inv);
    setForums(f);
  }, []);

  const openProfileById = useCallback(async (userId: number) => {
    const token = getToken();
    if (!token) return;

    setProfileLoading(true);
    setProfileError(null);
    setProfilePerson(null);

    try {
      // Always fetch fresh — the endpoint returns ALL domains with real data
      const person = await apiGetPersonProfile(token, userId);
      setProfilePerson(person);
    } catch {
      // Fetch failed: fall back to whatever cached data we have
      const cachedPerson = people.find(p => p.id === userId);
      if (cachedPerson) {
        setProfilePerson(cachedPerson);
      } else {
        const invite = invites.find(inv => inv.sender.id === userId);
        if (invite) {
          setProfilePerson({
            id: invite.sender.id,
            full_name: invite.sender.full_name,
            city: invite.sender.city,
            country: invite.sender.country,
            interested_domains: invite.sender.interested_domains,
            matched_domains: invite.sender.matched_domains,
            profile_slug: "",
          });
        } else {
          setProfileError("This profile isn't available right now.");
        }
      }
    } finally {
      setProfileLoading(false);
    }
  }, [people, invites]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/login"); return; }

    apiGetMe(token)
      .then(async u => {
        // Block entry if onboarding flag is not set
        if (!u.onboarding_completed) {
          router.replace("/home");
          return;
        }

        // Secondary guard: every selected domain must have answers saved.
        // Catches users whose onboarding_completed was set with partial data
        // (e.g. Shashank who answered only 1 of his multiple selected domains).
        const answers = u.onboarding_answers as Record<string, unknown>;
        const allAnswered = u.interested_domains.every(
          d => answers[d] && typeof answers[d] === "object" && Object.keys(answers[d] as object).length > 0
        );
        if (!allAnswered) {
          router.replace("/home");
          return;
        }

        setUser(u);

        const [p, inv, f] = await Promise.all([
          apiDiscoverPeople(token),
          apiGetInvites(token),
          apiGetMyForums(token),
        ]);
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
        onViewProfile={openProfileById}
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
      <ProfileModal
        person={profilePerson}
        loading={profileLoading}
        error={profileError}
        onClose={() => { setProfilePerson(null); setProfileError(null); }}
      />

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

            {/* People grid */}
            {!loadingPeople && people.length > 0 && (
              <div
                style={{
                  columns: "2 420px",
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
                      onViewProfile={(p) => openProfileById(p.id)}
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

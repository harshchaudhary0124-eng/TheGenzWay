"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { C, SANS } from "@/lib/constants";
import { getToken } from "@/lib/auth";
import { apiJoinForum } from "@/lib/chat";

export default function JoinForumPage() {
  const router = useRouter();
  const params = useParams();
  const joinToken = String(params.token);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      // Send through login, then bounce back here to complete the join.
      const next = encodeURIComponent(`/forums/join/${joinToken}`);
      router.replace(`/login?next=${next}`);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const forumId = await apiJoinForum(t, joinToken);
        if (!cancelled) router.replace(`/forums/${forumId}`);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not join this forum");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [joinToken, router]);

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.bg,
        color: C.cream,
        ...SANS,
      }}
    >
      {error ? (
        <div style={{ textAlign: "center" }}>
          <p style={{ color: C.cream, fontSize: "1rem", marginBottom: 12 }}>{error}</p>
          <button
            onClick={() => router.push("/welcome")}
            style={{
              color: C.orange,
              background: "none",
              border: `1px solid ${C.orange}55`,
              borderRadius: 8,
              padding: "8px 16px",
              cursor: "pointer",
              ...SANS,
            }}
          >
            ← Back to welcome
          </button>
        </div>
      ) : (
        <div style={{ color: C.muted }}>Joining forum…</div>
      )}
    </main>
  );
}

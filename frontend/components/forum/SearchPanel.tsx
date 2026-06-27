"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { C, SANS } from "@/lib/constants";
import { apiSearchMessages, type ChatMessage } from "@/lib/chat";
import Avatar from "./Avatar";

function timeOf(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SearchPanel({
  token,
  forumId,
  onJump,
  onClose,
}: {
  token: string;
  forumId: number;
  onJump: (id: number) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search as the user types.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await apiSearchMessages(token, forumId, q);
      setResults(r);
      setSearched(true);
      setLoading(false);
    }, 280);
    return () => clearTimeout(t);
  }, [query, token, forumId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "8vh",
        ...SANS,
      }}
    >
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -16, opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 92vw)",
          maxHeight: "72vh",
          display: "flex",
          flexDirection: "column",
          background: "#101010",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ color: C.muted }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
            placeholder="Search messages…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: C.cream,
              fontSize: "0.95rem",
              ...SANS,
            }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "1rem" }}
          >
            ✕
          </button>
        </div>

        <div style={{ overflowY: "auto" }}>
          {loading && (
            <div style={{ padding: 18, color: C.muted, fontSize: "0.8rem", textAlign: "center" }}>Searching…</div>
          )}
          {!loading && searched && results.length === 0 && (
            <div style={{ padding: 18, color: C.muted, fontSize: "0.8rem", textAlign: "center" }}>
              No messages found.
            </div>
          )}
          {!loading &&
            results.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onJump(m.id)}
                style={{
                  display: "flex",
                  gap: 10,
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <Avatar name={m.sender_name} userId={m.sender_id} size={30} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: C.cream, fontSize: "0.8rem", fontWeight: 600 }}>{m.sender_name}</span>
                    <span style={{ color: C.muted, fontSize: "0.64rem", flexShrink: 0 }}>{timeOf(m.created_at)}</span>
                  </div>
                  <p style={{ color: "rgba(245,242,235,0.7)", fontSize: "0.78rem", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.content || (m.attachments.length ? `📎 ${m.attachments.length} attachment(s)` : "")}
                  </p>
                </div>
              </button>
            ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

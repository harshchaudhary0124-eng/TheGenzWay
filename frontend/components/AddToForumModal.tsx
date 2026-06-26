"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { C, SANS, DISPLAY } from "@/lib/constants";
import type { DiscoveredPerson } from "@/lib/discover";
import type { DiscussionForum } from "@/lib/forum";
import { apiSendInvite } from "@/lib/forum";
import { getToken } from "@/lib/auth";

interface Props {
  target: DiscoveredPerson;
  myForums: DiscussionForum[];
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "choose" | "existing" | "new";

export default function AddToForumModal({ target, myForums, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("choose");
  const [selectedForumId, setSelectedForumId] = useState<number | null>(null);
  const [newForumName, setNewForumName] = useState("");
  const [newForumContext, setNewForumContext] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSend() {
    const token = getToken();
    if (!token) return;

    setError(null);
    setSending(true);
    try {
      if (step === "existing") {
        if (!selectedForumId) { setError("Select a forum first"); setSending(false); return; }
        await apiSendInvite(token, {
          recipient_id: target.id,
          forum_id: selectedForumId,
          context: newForumContext || undefined,
        });
      } else {
        if (!newForumName.trim()) { setError("Forum name is required"); setSending(false); return; }
        await apiSendInvite(token, {
          recipient_id: target.id,
          forum_name: newForumName.trim(),
          forum_domain: target.matched_domains[0]?.domain,
          context: newForumContext || undefined,
        });
      }
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: C.cream,
    fontSize: "0.84rem",
    outline: "none",
    boxSizing: "border-box",
    ...SANS,
  };

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: "440px",
            background: "#0e0e0e",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "clamp(1.5rem, 4vw, 2rem)",
            ...SANS,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <p style={{ fontSize: "0.6rem", color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "4px" }}>
                Add to Discussion Forum
              </p>
              <h2
                style={{
                  ...DISPLAY,
                  fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                  color: C.cream,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                {target.full_name}
              </h2>
              <p style={{ color: C.muted, fontSize: "0.75rem", marginTop: "2px" }}>
                {target.city}, {target.country}{target.matched_domains[0] ? ` · ${target.matched_domains[0].domain}` : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: C.muted,
                fontSize: "1.2rem",
                cursor: "pointer",
                lineHeight: 1,
                padding: "4px",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Success state */}
          {done && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "10px" }}>✓</p>
              <p style={{ color: C.orange, fontSize: "0.82rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Invite sent!
              </p>
            </div>
          )}

          {/* Step: choose */}
          {!done && step === "choose" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ color: "rgba(245,242,235,0.65)", fontSize: "0.82rem", marginBottom: "8px" }}>
                Where do you want to add this person?
              </p>

              <button
                onClick={() => setStep("existing")}
                style={{
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: C.cream,
                  fontSize: "0.82rem",
                  textAlign: "left",
                  cursor: myForums.length === 0 ? "not-allowed" : "pointer",
                  opacity: myForums.length === 0 ? 0.4 : 1,
                  transition: "all 0.15s ease",
                  ...SANS,
                }}
                disabled={myForums.length === 0}
              >
                <span style={{ display: "block", fontWeight: 600, marginBottom: "3px" }}>
                  Add to an existing forum
                </span>
                <span style={{ color: C.muted, fontSize: "0.74rem" }}>
                  {myForums.length === 0
                    ? "You don't have any forums yet"
                    : `${myForums.length} forum${myForums.length > 1 ? "s" : ""} available`}
                </span>
              </button>

              <button
                onClick={() => setStep("new")}
                style={{
                  padding: "14px 16px",
                  background: "rgba(255,91,46,0.05)",
                  border: "1px solid rgba(255,91,46,0.2)",
                  color: C.cream,
                  fontSize: "0.82rem",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  ...SANS,
                }}
              >
                <span style={{ display: "block", fontWeight: 600, marginBottom: "3px" }}>
                  Create a new discussion forum
                </span>
                <span style={{ color: C.muted, fontSize: "0.74rem" }}>
                  Start a fresh thread and invite {target.full_name.split(" ")[0]}
                </span>
              </button>
            </div>
          )}

          {/* Step: pick existing forum */}
          {!done && step === "existing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button onClick={() => setStep("choose")} style={{ background: "none", border: "none", color: C.muted, fontSize: "0.75rem", cursor: "pointer", textAlign: "left", padding: 0, marginBottom: "4px" }}>
                ← Back
              </button>

              <p style={{ color: "rgba(245,242,235,0.65)", fontSize: "0.82rem" }}>
                Pick a forum
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                {myForums.map(forum => (
                  <label
                    key={forum.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      background: selectedForumId === forum.id ? "rgba(255,91,46,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${selectedForumId === forum.id ? "rgba(255,91,46,0.35)" : "rgba(255,255,255,0.08)"}`,
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                  >
                    <input
                      type="radio"
                      name="forum"
                      value={forum.id}
                      checked={selectedForumId === forum.id}
                      onChange={() => setSelectedForumId(forum.id)}
                      style={{ accentColor: C.orange }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: C.cream, fontSize: "0.82rem", fontWeight: 600 }}>{forum.name}</p>
                      <p style={{ color: C.muted, fontSize: "0.7rem" }}>
                        {forum.domain && <span>{forum.domain} · </span>}
                        {forum.member_count} {forum.member_count === 1 ? "member" : "members"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <textarea
                placeholder="Optional: add context for the invite..."
                value={newForumContext}
                onChange={e => setNewForumContext(e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: "none" }}
              />

              {error && <p style={{ color: C.red, fontSize: "0.75rem" }}>{error}</p>}

              <button
                onClick={handleSend}
                disabled={sending || !selectedForumId}
                style={{
                  padding: "11px",
                  background: sending || !selectedForumId ? "rgba(255,91,46,0.3)" : C.orange,
                  border: "none",
                  color: C.bg,
                  fontSize: "0.74rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  cursor: sending || !selectedForumId ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                  ...SANS,
                }}
              >
                {sending ? "Sending..." : "Send Invite"}
              </button>
            </div>
          )}

          {/* Step: create new forum */}
          {!done && step === "new" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button onClick={() => setStep("choose")} style={{ background: "none", border: "none", color: C.muted, fontSize: "0.75rem", cursor: "pointer", textAlign: "left", padding: 0, marginBottom: "4px" }}>
                ← Back
              </button>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.65rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Forum name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI Builders · Early Stage"
                  value={newForumName}
                  onChange={e => setNewForumName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.65rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Why this forum? (optional)
                </label>
                <textarea
                  placeholder="Add context for why you're inviting them..."
                  value={newForumContext}
                  onChange={e => setNewForumContext(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>

              {error && <p style={{ color: C.red, fontSize: "0.75rem" }}>{error}</p>}

              <button
                onClick={handleSend}
                disabled={sending}
                style={{
                  padding: "11px",
                  background: sending ? "rgba(255,91,46,0.3)" : C.orange,
                  border: "none",
                  color: C.bg,
                  fontSize: "0.74rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  cursor: sending ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                  ...SANS,
                }}
              >
                {sending ? "Creating & Sending..." : "Create Forum & Send Invite"}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

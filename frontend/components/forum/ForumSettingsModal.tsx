"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { C, SANS, DISPLAY } from "@/lib/constants";
import {
  apiUpdateForum,
  apiLeaveForum,
  apiCreateInviteLink,
  type ForumDetail,
} from "@/lib/chat";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "0.6rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: C.muted,
        margin: "20px 0 8px",
      }}
    >
      {children}
    </div>
  );
}

const field: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: C.cream,
  padding: "9px 11px",
  fontSize: "0.85rem",
  outline: "none",
};

export default function ForumSettingsModal({
  token,
  forum,
  canManage,
  onUpdated,
  onLeft,
  onClose,
}: {
  token: string;
  forum: ForumDetail;
  canManage: boolean;
  onUpdated: (patch: { name: string; description: string | null }) => void;
  onLeft: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(forum.name);
  const [description, setDescription] = useState(forum.description ?? "");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [link, setLink] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [leaving, setLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  async function save() {
    setError(null);
    setSavedMsg(null);
    if (!name.trim()) {
      setError("Forum name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const res = await apiUpdateForum(token, forum.id, { name: name.trim(), description });
      onUpdated({ name: res.name, description: res.description });
      setSavedMsg("Saved");
      setTimeout(() => setSavedMsg(null), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function generateLink() {
    setLinkLoading(true);
    setError(null);
    try {
      const res = await apiCreateInviteLink(token, forum.id);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setLink(`${origin}${res.url}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create link");
    } finally {
      setLinkLoading(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — user can select manually */
    }
  }

  async function leave() {
    setLeaving(true);
    setError(null);
    try {
      await apiLeaveForum(token, forum.id);
      onLeft();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to leave forum");
      setLeaving(false);
    }
  }

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
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "7vh",
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
          width: "min(520px, 92vw)",
          maxHeight: "82vh",
          overflowY: "auto",
          background: "#0E0E0E",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "20px 22px 26px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ ...DISPLAY, color: C.cream, fontSize: "1.3rem", margin: 0 }}>Forum Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "1.1rem" }}
          >
            ✕
          </button>
        </div>

        {/* Edit (creator only) */}
        {canManage && (
          <>
            <SectionLabel>Name</SectionLabel>
            <input value={name} onChange={(e) => setName(e.target.value)} style={field} />
            <SectionLabel>Description</SectionLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ ...field, resize: "vertical" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                style={{
                  background: C.orange,
                  color: "#0A0A0A",
                  border: "none",
                  borderRadius: 9,
                  padding: "9px 18px",
                  fontWeight: 600,
                  fontSize: "0.84rem",
                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              {savedMsg && <span style={{ color: "#5FA463", fontSize: "0.78rem" }}>{savedMsg}</span>}
            </div>
          </>
        )}

        {/* Add a builder — shareable join link */}
        <SectionLabel>Add a builder</SectionLabel>
        <p style={{ color: "rgba(245,242,235,0.6)", fontSize: "0.78rem", lineHeight: 1.5, margin: "0 0 10px" }}>
          Share this link with another builder. Anyone who opens it is added to this forum automatically.
        </p>
        {link ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input readOnly value={link} onFocus={(e) => e.target.select()} style={{ ...field, flex: 1 }} />
            <button
              type="button"
              onClick={copyLink}
              style={{
                background: "rgba(255,255,255,0.06)",
                color: C.cream,
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 9,
                padding: "0 16px",
                fontSize: "0.8rem",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={generateLink}
            disabled={linkLoading}
            style={{
              background: "rgba(255,91,46,0.12)",
              color: C.orange,
              border: `1px solid ${C.orange}55`,
              borderRadius: 9,
              padding: "9px 18px",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: linkLoading ? "default" : "pointer",
            }}
          >
            {linkLoading ? "Generating…" : "Generate invite link"}
          </button>
        )}

        {/* Leave forum (non-creator) */}
        {!canManage && (
          <>
            <SectionLabel>Danger zone</SectionLabel>
            {confirmLeave ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: C.cream, fontSize: "0.82rem" }}>Leave this forum?</span>
                <button
                  type="button"
                  onClick={leave}
                  disabled={leaving}
                  style={{
                    background: C.red,
                    color: C.cream,
                    border: "none",
                    borderRadius: 9,
                    padding: "8px 16px",
                    fontSize: "0.8rem",
                    cursor: leaving ? "default" : "pointer",
                  }}
                >
                  {leaving ? "Leaving…" : "Yes, leave"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmLeave(false)}
                  style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "0.8rem" }}
                >
                  cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmLeave(true)}
                style={{
                  background: "none",
                  color: C.red,
                  border: `1px solid ${C.red}66`,
                  borderRadius: 9,
                  padding: "9px 18px",
                  fontSize: "0.84rem",
                  cursor: "pointer",
                }}
              >
                Leave forum
              </button>
            )}
          </>
        )}

        {error && <p style={{ color: C.red, fontSize: "0.78rem", marginTop: 14 }}>{error}</p>}
      </motion.div>
    </motion.div>
  );
}

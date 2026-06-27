"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { C, SANS } from "@/lib/constants";
import { renderMarkdown } from "@/lib/markdown";
import {
  attachmentUrl,
  isImageAttachment,
  type AttachmentInfo,
  type ChatMessage,
} from "@/lib/chat";
import Avatar from "./Avatar";
import EmojiPicker from "./EmojiPicker";

function timeOf(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentView({ a }: { a: AttachmentInfo }) {
  const href = attachmentUrl(a.url);
  if (isImageAttachment(a)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={href}
          alt={a.filename}
          style={{
            maxWidth: 320,
            maxHeight: 240,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            objectFit: "cover",
          }}
        />
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download={a.filename}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        textDecoration: "none",
        maxWidth: 320,
      }}
    >
      <span style={{ fontSize: "1.3rem" }}>📄</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", color: C.cream, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {a.filename}
        </span>
        <span style={{ color: C.muted, fontSize: "0.66rem" }}>{formatBytes(a.size_bytes)}</span>
      </span>
    </a>
  );
}

export default function MessageItem({
  message,
  isOwn,
  currentUserId,
  grouped,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: {
  message: ChatMessage;
  isOwn: boolean;
  currentUserId: number;
  grouped: boolean; // consecutive message from same sender → hide avatar/name
  onReply: (m: ChatMessage) => void;
  onEdit: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  onReact: (id: number, emoji: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [showReactPicker, setShowReactPicker] = useState(false);

  const deleted = message.is_deleted;
  const failed = message._status === "failed";
  const sending = message._status === "sending";
  const reactable = !sending && !deleted && message.id > 0;

  function saveEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== message.content) onEdit(message.id, trimmed);
    setEditing(false);
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        gap: 12,
        padding: grouped ? "2px 16px 2px" : "10px 16px 2px",
        background: hovered ? "rgba(255,255,255,0.02)" : "transparent",
        ...SANS,
      }}
    >
      {/* avatar column */}
      <div style={{ width: 38, flexShrink: 0 }}>
        {!grouped && <Avatar name={message.sender_name} userId={message.sender_id} size={38} />}
      </div>

      {/* body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!grouped && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
            <span style={{ color: C.cream, fontWeight: 600, fontSize: "0.86rem" }}>
              {message.sender_name}
            </span>
            <span style={{ color: C.muted, fontSize: "0.66rem" }}>{timeOf(message.created_at)}</span>
          </div>
        )}

        {/* reply preview */}
        {message.reply_to && !deleted && (
          <div
            style={{
              borderLeft: `2px solid ${C.orange}88`,
              paddingLeft: 8,
              marginBottom: 4,
              fontSize: "0.72rem",
              color: C.muted,
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <span style={{ color: C.orange, fontWeight: 600 }}>
              {message.reply_to.sender_name}
            </span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {message.reply_to.is_deleted ? "message deleted" : message.reply_to.content}
            </span>
          </div>
        )}

        {/* content */}
        {deleted ? (
          <span style={{ color: C.muted, fontStyle: "italic", fontSize: "0.84rem" }}>
            This message was deleted
          </span>
        ) : editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <textarea
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                } else if (e.key === "Escape") {
                  setEditing(false);
                  setDraft(message.content);
                }
              }}
              rows={2}
              style={{
                width: "100%",
                resize: "vertical",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: C.cream,
                padding: "8px 10px",
                fontSize: "0.84rem",
                ...SANS,
              }}
            />
            <div style={{ display: "flex", gap: 10, fontSize: "0.68rem", color: C.muted }}>
              <button onClick={saveEdit} style={linkBtn(C.orange)}>save</button>
              <button onClick={() => { setEditing(false); setDraft(message.content); }} style={linkBtn(C.muted)}>cancel</button>
              <span>escape to cancel · enter to save</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              color: failed ? C.red : C.cream,
              fontSize: "0.88rem",
              lineHeight: 1.5,
              opacity: sending ? 0.55 : 1,
              wordBreak: "break-word",
            }}
          >
            {renderMarkdown(message.content)}
            {message.is_edited && (
              <span style={{ color: C.muted, fontSize: "0.62rem", marginLeft: 6 }}>(edited)</span>
            )}
            {sending && (
              <span style={{ color: C.muted, fontSize: "0.62rem", marginLeft: 6 }}>sending…</span>
            )}
            {failed && (
              <span style={{ color: C.red, fontSize: "0.62rem", marginLeft: 6 }}>failed to send</span>
            )}
          </div>
        )}

        {/* attachments */}
        {!deleted && message.attachments && message.attachments.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {message.attachments.map((a) => (
              <AttachmentView key={a.id} a={a} />
            ))}
          </div>
        )}

        {/* reactions */}
        {!deleted && message.reactions && message.reactions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {message.reactions.map((g) => {
              const mine = g.user_ids.includes(currentUserId);
              return (
                <button
                  key={g.emoji}
                  type="button"
                  onClick={() => reactable && onReact(message.id, g.emoji)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: "0.74rem",
                    cursor: reactable ? "pointer" : "default",
                    background: mine ? `${C.orange}22` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${mine ? `${C.orange}88` : "rgba(255,255,255,0.1)"}`,
                    color: mine ? C.orange : C.cream,
                  }}
                >
                  <span>{g.emoji}</span>
                  <span>{g.user_ids.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* hover actions */}
      {(hovered || showReactPicker) && !editing && !deleted && !sending && (
        <div
          style={{
            position: "absolute",
            top: grouped ? -6 : 4,
            right: 14,
            display: "flex",
            gap: 4,
            background: "#121212",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: 2,
          }}
        >
          {reactable && (
            <div style={{ position: "relative" }}>
              <IconBtn label="Add reaction" onClick={() => setShowReactPicker((s) => !s)}>
                😊
              </IconBtn>
              <AnimatePresence>
                {showReactPicker && (
                  <EmojiPicker
                    onSelect={(emoji) => {
                      onReact(message.id, emoji);
                      setShowReactPicker(false);
                    }}
                    onClose={() => setShowReactPicker(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
          <IconBtn label="Reply" onClick={() => onReply(message)}>↩</IconBtn>
          {isOwn && <IconBtn label="Edit" onClick={() => { setDraft(message.content); setEditing(true); }}>✎</IconBtn>}
          {isOwn && <IconBtn label="Delete" onClick={() => onDelete(message.id)}>🗑</IconBtn>}
        </div>
      )}
    </div>
  );
}

function linkBtn(color: string): React.CSSProperties {
  return { background: "none", border: "none", color, cursor: "pointer", fontSize: "0.68rem", padding: 0 };
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{
        width: 26,
        height: 24,
        background: "transparent",
        border: "none",
        borderRadius: 6,
        color: C.muted,
        cursor: "pointer",
        fontSize: "0.8rem",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = C.cream; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}
    >
      {children}
    </button>
  );
}

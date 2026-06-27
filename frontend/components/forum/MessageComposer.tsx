"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { C, SANS } from "@/lib/constants";
import {
  apiUploadAttachment,
  attachmentUrl,
  isImageAttachment,
  type AttachmentInfo,
  type ChatMessage,
} from "@/lib/chat";
import EmojiPicker from "./EmojiPicker";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageComposer({
  token,
  forumId,
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  disabled,
}: {
  token: string;
  forumId: number;
  onSend: (content: string, attachments?: AttachmentInfo[]) => void;
  onTyping: (isTyping: boolean) => void;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        try {
          const att = await apiUploadAttachment(token, forumId, file);
          setAttachments((prev) => [...prev, att]);
        } catch (e) {
          setUploadError(e instanceof Error ? e.message : "Upload failed");
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeAttachment(id: number) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  // Auto-grow textarea up to a max height.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  // Focus when a reply is started.
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  function stopTyping() {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping(false);
    }
  }

  function handleChange(v: string) {
    setValue(v);
    if (!isTypingRef.current && v.trim()) {
      isTypingRef.current = true;
      onTyping(true);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 2500);
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed && attachments.length === 0) return;
    if (uploading) return;
    onSend(trimmed, attachments);
    setValue("");
    setAttachments([]);
    setUploadError(null);
    setShowEmoji(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    stopTyping();
  }

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !uploading;

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) {
      setValue((v) => v + emoji);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
    });
  }

  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "10px 16px 14px",
        background: "rgba(8,8,8,0.6)",
        ...SANS,
      }}
    >
      {replyTo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "6px 10px",
            marginBottom: 8,
            borderLeft: `2px solid ${C.orange}`,
            background: "rgba(255,255,255,0.03)",
            borderRadius: "0 8px 8px 0",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Replying to <span style={{ color: C.orange }}>{replyTo.sender_name}</span>
            {" — "}
            {replyTo.content.slice(0, 60)}
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "0.9rem" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* pending attachment chips */}
      {(attachments.length > 0 || uploading || uploadError) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {attachments.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 6px 4px 4px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            >
              {isImageAttachment(a) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachmentUrl(a.url)}
                  alt={a.filename}
                  style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 5 }}
                />
              ) : (
                <span style={{ fontSize: "1.1rem", padding: "0 4px" }}>📄</span>
              )}
              <span style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.72rem", color: C.cream }}>
                {a.filename}
              </span>
              <span style={{ fontSize: "0.62rem", color: C.muted }}>{formatBytes(a.size_bytes)}</span>
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                aria-label={`Remove ${a.filename}`}
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "0.8rem" }}
              >
                ✕
              </button>
            </div>
          ))}
          {uploading && (
            <span style={{ fontSize: "0.72rem", color: C.muted, alignSelf: "center" }}>Uploading…</span>
          )}
          {uploadError && (
            <span style={{ fontSize: "0.72rem", color: C.red, alignSelf: "center" }}>{uploadError}</span>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: "none" }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          padding: "8px 10px",
          position: "relative",
        }}
      >
        {/* attach file */}
        <button
          type="button"
          title="Attach file"
          onClick={() => fileInputRef.current?.click()}
          style={composerIcon(C.muted, "pointer")}
        >
          ＋
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          onBlur={stopTyping}
          placeholder={disabled ? "Reconnecting…" : "Write a message — Enter to send, Shift+Enter for newline"}
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            background: "transparent",
            border: "none",
            outline: "none",
            color: C.cream,
            fontSize: "0.88rem",
            lineHeight: 1.5,
            maxHeight: 160,
            ...SANS,
          }}
        />

        <div style={{ position: "relative" }}>
          <button
            type="button"
            title="Emoji"
            onClick={() => setShowEmoji((s) => !s)}
            style={composerIcon(showEmoji ? C.orange : C.muted, "pointer")}
          >
            🙂
          </button>
          <AnimatePresence>
            {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          style={{
            background: canSend ? C.orange : "rgba(255,255,255,0.06)",
            color: canSend ? "#0A0A0A" : C.muted,
            border: "none",
            borderRadius: 10,
            width: 40,
            height: 34,
            cursor: canSend ? "pointer" : "default",
            fontSize: "0.95rem",
            flexShrink: 0,
            transition: "background 0.15s ease",
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

function composerIcon(color: string, cursor: string): React.CSSProperties {
  return {
    background: "none",
    border: "none",
    color,
    cursor,
    fontSize: "1.1rem",
    lineHeight: 1,
    padding: "4px 2px",
    flexShrink: 0,
  };
}

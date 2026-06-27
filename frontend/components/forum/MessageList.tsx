"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { C, SANS } from "@/lib/constants";
import type { ChatMessage } from "@/lib/chat";
import MessageItem from "./MessageItem";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function dateKey(iso: string): string {
  return new Date(iso).toDateString();
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function Divider({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
      <div style={{ flex: 1, height: 1, background: accent ? `${C.orange}55` : "rgba(255,255,255,0.08)" }} />
      <span
        style={{
          fontSize: "0.62rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: accent ? C.orange : C.muted,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: accent ? `${C.orange}55` : "rgba(255,255,255,0.08)" }} />
    </div>
  );
}

export default function MessageList({
  messages,
  currentUserId,
  hasMore,
  loadingMore,
  firstUnreadId,
  highlightId,
  onHighlightConsumed,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: {
  messages: ChatMessage[];
  currentUserId: number;
  hasMore: boolean;
  loadingMore: boolean;
  firstUnreadId: number | null;
  highlightId: number | null;
  onHighlightConsumed: () => void;
  onLoadMore: () => void;
  onReply: (m: ChatMessage) => void;
  onEdit: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  onReact: (id: number, emoji: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wasAtBottom = useRef(true);
  const prevScrollHeight = useRef(0);
  const prependPending = useRef(false);
  const didInitialScroll = useRef(false);

  // Scroll to + briefly flash a message when jumped to from search.
  useEffect(() => {
    if (highlightId === null) return;
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-mid="${highlightId}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const prevBg = el.style.background;
    el.style.transition = "background 0.4s ease";
    el.style.background = `${C.orange}22`;
    const t = setTimeout(() => {
      el.style.background = prevBg;
      onHighlightConsumed();
    }, 1600);
    return () => clearTimeout(t);
  }, [highlightId, messages, onHighlightConsumed]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!didInitialScroll.current && messages.length > 0) {
      el.scrollTop = el.scrollHeight;
      didInitialScroll.current = true;
    } else if (prependPending.current) {
      // Older messages were prepended — keep the viewport anchored.
      el.scrollTop = el.scrollHeight - prevScrollHeight.current;
      prependPending.current = false;
    } else if (wasAtBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
    prevScrollHeight.current = el.scrollHeight;
  }, [messages]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    wasAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (el.scrollTop < 80 && hasMore && !loadingMore && !prependPending.current) {
      prevScrollHeight.current = el.scrollHeight;
      prependPending.current = true;
      onLoadMore();
    }
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ flex: 1, overflowY: "auto", paddingBottom: 8, ...SANS }}
    >
      {hasMore ? (
        <div style={{ textAlign: "center", padding: "12px", color: C.muted, fontSize: "0.66rem" }}>
          {loadingMore ? "Loading earlier messages…" : "Scroll up for earlier messages"}
        </div>
      ) : (
        messages.length > 0 && (
          <div style={{ textAlign: "center", padding: "16px", color: C.muted, fontSize: "0.66rem" }}>
            This is the beginning of the conversation.
          </div>
        )
      )}

      {messages.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 16px", color: C.muted, fontSize: "0.82rem" }}>
          No messages yet — say something to kick things off.
        </div>
      )}

      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const showDate = !prev || dateKey(prev.created_at) !== dateKey(m.created_at);
        const showUnread = firstUnreadId !== null && m.id === firstUnreadId;
        const grouped =
          !showDate &&
          !showUnread &&
          !!prev &&
          prev.sender_id === m.sender_id &&
          !prev.is_deleted &&
          new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS;

        return (
          <div key={m.client_id ?? m.id} data-mid={m.id}>
            {showDate && <Divider label={dateLabel(m.created_at)} />}
            {showUnread && <Divider label="New messages" accent />}
            <MessageItem
              message={m}
              isOwn={m.sender_id === currentUserId}
              currentUserId={currentUserId}
              grouped={grouped}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReact={onReact}
            />
          </div>
        );
      })}
    </div>
  );
}

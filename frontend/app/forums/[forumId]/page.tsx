"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { C, SANS } from "@/lib/constants";
import { getToken, getCachedUser, apiGetMe, type UserProfile } from "@/lib/auth";
import {
  apiGetForumDetail,
  apiGetMessages,
  apiMarkRead,
  type ChatMessage,
  type ForumDetail,
  type AttachmentInfo,
} from "@/lib/chat";
import { useForumSocket, type ForumSocketHandlers } from "@/hooks/useForumSocket";
import ForumTopBar from "@/components/forum/ForumTopBar";
import ForumSidebar from "@/components/forum/ForumSidebar";
import MessageList from "@/components/forum/MessageList";
import MessageComposer from "@/components/forum/MessageComposer";
// On-demand panels — code-split so they're not in the initial forum bundle.
const SearchPanel = dynamic(() => import("@/components/forum/SearchPanel"), { ssr: false });
const ForumSettingsModal = dynamic(() => import("@/components/forum/ForumSettingsModal"), { ssr: false });

const PAGE_SIZE = 30;

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ForumPage() {
  const router = useRouter();
  const params = useParams();
  const forumId = Number(params.forumId);

  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<UserProfile | null>(null);
  const [forum, setForum] = useState<ForumDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<number>>(new Set());
  const [typing, setTyping] = useState<Record<number, string>>({});
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [firstUnreadId, setFirstUnreadId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);

  const typingTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // ── auth + initial load ─────────────────────────────────────────────────────
  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace("/login");
      return;
    }
    setToken(t);
    setMe(getCachedUser());

    let cancelled = false;
    (async () => {
      try {
        const cu = getCachedUser() ?? (await apiGetMe(t));
        if (cancelled) return;
        setMe(cu);

        const [detail, history] = await Promise.all([
          apiGetForumDetail(t, forumId),
          apiGetMessages(t, forumId, undefined, PAGE_SIZE),
        ]);
        if (cancelled) return;

        setForum(detail);
        setMessages(history);
        setHasMore(history.length === PAGE_SIZE);

        const unread = history.find(
          (m) => m.id > detail.last_read_message_id && m.sender_id !== cu.id,
        );
        setFirstUnreadId(unread ? unread.id : null);

        const lastId = history.length ? history[history.length - 1].id : 0;
        if (lastId > detail.last_read_message_id) apiMarkRead(t, forumId, lastId);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load forum");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [forumId, router]);

  const lastRealId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (!messages[i].client_id) return messages[i].id;
    }
    return 0;
  }, [messages]);

  // Re-fetch the Shared Resources panel only when the attachment count changes.
  const sharedCount = useMemo(
    () => messages.reduce((n, m) => n + (m.attachments?.length ?? 0), 0),
    [messages],
  );

  // ── socket handlers ─────────────────────────────────────────────────────────
  const markReadLatest = useCallback(
    (id: number) => {
      if (!token || id <= 0) return;
      if (typeof document !== "undefined" && document.hasFocus()) apiMarkRead(token, forumId, id);
    },
    [token, forumId],
  );

  const handlers: ForumSocketHandlers = useMemo(
    () => ({
      onMessage: (msg, clientId) => {
        setMessages((prev) => {
          if (clientId) {
            const idx = prev.findIndex((m) => m.client_id === clientId);
            if (idx !== -1) {
              const copy = [...prev];
              copy[idx] = msg;
              return copy;
            }
          }
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        markReadLatest(msg.id);
      },
      onEdit: (msg) =>
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m))),
      onDelete: (msg) =>
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m))),
      onReaction: (msg) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, reactions: msg.reactions } : m)),
        ),
      onPresence: (online) => setOnlineIds(new Set(online)),
      onTyping: (userId, fullName, isTyping) => {
        if (me && userId === me.id) return;
        if (typingTimers.current[userId]) clearTimeout(typingTimers.current[userId]);
        if (isTyping) {
          setTyping((t) => ({ ...t, [userId]: fullName }));
          typingTimers.current[userId] = setTimeout(() => {
            setTyping((t) => {
              const next = { ...t };
              delete next[userId];
              return next;
            });
          }, 4000);
        } else {
          setTyping((t) => {
            const next = { ...t };
            delete next[userId];
            return next;
          });
        }
      },
      onError: (detail, clientId) => {
        if (clientId) {
          setMessages((prev) =>
            prev.map((m) => (m.client_id === clientId ? { ...m, _status: "failed" } : m)),
          );
        } else {
          console.warn("Forum socket error:", detail);
        }
      },
      onReconnected: () => {
        // Fill any gap missed while offline by re-fetching the latest page.
        if (!token) return;
        apiGetMessages(token, forumId, undefined, PAGE_SIZE).then((latest) => {
          setMessages((prev) => {
            const byId = new Map<number, ChatMessage>();
            for (const m of prev) if (!m.client_id) byId.set(m.id, m);
            for (const m of latest) byId.set(m.id, m);
            const merged = Array.from(byId.values()).sort((a, b) => a.id - b.id);
            // keep any still-pending optimistic messages at the tail
            const pending = prev.filter((m) => m.client_id && m._status !== "failed");
            return [...merged, ...pending.filter((p) => !merged.some((x) => x.client_id === p.client_id))];
          });
        });
      },
    }),
    [me, token, forumId, markReadLatest],
  );

  const socket = useForumSocket(loading || error ? null : forumId, token, handlers);

  // ── actions ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    (content: string, attachments: AttachmentInfo[] = []) => {
      if (!me) return;
      if (!content.trim() && attachments.length === 0) return;
      const clientId = uuid();
      const nowIso = new Date().toISOString();
      const optimistic: ChatMessage = {
        id: -Date.now(),
        forum_id: forumId,
        sender_id: me.id,
        sender_name: me.full_name,
        content,
        reply_to: replyTo
          ? {
              id: replyTo.id,
              sender_id: replyTo.sender_id,
              sender_name: replyTo.sender_name,
              content: replyTo.content.slice(0, 120),
              is_deleted: replyTo.is_deleted,
            }
          : null,
        attachments,
        reactions: [],
        is_edited: false,
        is_deleted: false,
        created_at: nowIso,
        updated_at: nowIso,
        client_id: clientId,
        _status: "sending",
      };
      setMessages((prev) => [...prev, optimistic]);
      const ok = socket.sendMessage(
        clientId,
        content,
        replyTo?.id,
        attachments.map((a) => a.id),
      );
      if (!ok) {
        setMessages((prev) =>
          prev.map((m) => (m.client_id === clientId ? { ...m, _status: "failed" } : m)),
        );
      }
      setReplyTo(null);
    },
    // Depend on the individually-stable socket method, not the whole `socket`
    // object (which is a fresh literal every render) — keeps this handler stable
    // so MessageList/MessageItem memoization holds across renders.
    [me, forumId, replyTo, socket.sendMessage],
  );

  const handleReact = useCallback(
    (id: number, emoji: string) => {
      if (!me || id <= 0) return;
      // Optimistic toggle; the server broadcast (onReaction) is authoritative.
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const groups = m.reactions ? m.reactions.map((g) => ({ ...g })) : [];
          const gi = groups.findIndex((g) => g.emoji === emoji);
          if (gi === -1) {
            groups.push({ emoji, user_ids: [me.id] });
          } else if (groups[gi].user_ids.includes(me.id)) {
            const next = groups[gi].user_ids.filter((u) => u !== me.id);
            if (next.length === 0) groups.splice(gi, 1);
            else groups[gi].user_ids = next;
          } else {
            groups[gi].user_ids = [...groups[gi].user_ids, me.id];
          }
          return { ...m, reactions: groups };
        }),
      );
      socket.reactMessage(id, emoji);
    },
    [me, socket.reactMessage],
  );

  const jumpToMessage = useCallback(
    async (id: number) => {
      if (!token) return;
      setSearchOpen(false);
      // Load the page ending at (and including) the target message.
      const page = await apiGetMessages(token, forumId, id + 1, PAGE_SIZE);
      if (page.length) {
        setMessages(page);
        setHasMore(page.length === PAGE_SIZE);
        setFirstUnreadId(null);
      }
      setHighlightId(id);
    },
    [token, forumId],
  );

  const handleEdit = useCallback(
    (id: number, content: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, content, is_edited: true } : m)),
      );
      socket.editMessage(id, content);
    },
    [socket.editMessage],
  );

  const handleDelete = useCallback(
    (id: number) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_deleted: true, content: "" } : m)),
      );
      socket.deleteMessage(id);
    },
    [socket.deleteMessage],
  );

  const loadMore = useCallback(async () => {
    if (!token || messages.length === 0 || loadingMore) return;
    setLoadingMore(true);
    try {
      const oldest = messages.find((m) => !m.client_id);
      const before = oldest ? oldest.id : undefined;
      const older = await apiGetMessages(token, forumId, before, PAGE_SIZE);
      setHasMore(older.length === PAGE_SIZE);
      if (older.length) {
        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.id));
          const fresh = older.filter((m) => !existing.has(m.id));
          return [...fresh, ...prev];
        });
      }
    } finally {
      setLoadingMore(false);
    }
  }, [token, forumId, messages, loadingMore]);

  // ── render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Shell>
        <div style={{ margin: "auto", color: C.muted, ...SANS }}>Loading forum…</div>
      </Shell>
    );
  }

  if (error || !forum || !me) {
    return (
      <Shell>
        <div style={{ margin: "auto", textAlign: "center", ...SANS }}>
          <p style={{ color: C.cream, fontSize: "1rem", marginBottom: 12 }}>
            {error ?? "Forum unavailable"}
          </p>
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
      </Shell>
    );
  }

  const typingNames = Object.values(typing);

  return (
    <Shell>
      <ForumTopBar
        forum={forum}
        onlineCount={onlineIds.size}
        status={socket.status}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        onSearch={() => setSearchOpen(true)}
        onSettings={() => setSettingsOpen(true)}
      />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* sidebar — desktop */}
        <div className="hidden lg:block" style={{ width: 280, flexShrink: 0, minHeight: 0 }}>
          <ForumSidebar token={token ?? ""} forum={forum} onlineIds={onlineIds} refreshKey={sharedCount} />
        </div>

        {/* sidebar — mobile drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)" }}
            >
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "tween", duration: 0.22 }}
                onClick={(e) => e.stopPropagation()}
                style={{ width: 280, height: "100%", background: C.bg }}
              >
                <ForumSidebar token={token ?? ""} forum={forum} onlineIds={onlineIds} refreshKey={sharedCount} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* main chat column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
          <MessageList
            messages={messages}
            currentUserId={me.id}
            hasMore={hasMore}
            loadingMore={loadingMore}
            firstUnreadId={firstUnreadId}
            highlightId={highlightId}
            onHighlightConsumed={() => setHighlightId(null)}
            onLoadMore={loadMore}
            onReply={setReplyTo}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReact={handleReact}
          />

          {typingNames.length > 0 && (
            <div style={{ padding: "2px 18px", height: 18, color: C.muted, fontSize: "0.68rem", ...SANS }}>
              {typingNames.length === 1
                ? `${typingNames[0]} is typing…`
                : `${typingNames.length} people are typing…`}
            </div>
          )}

          <MessageComposer
            token={token ?? ""}
            forumId={forumId}
            onSend={handleSend}
            onTyping={socket.sendTyping}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            disabled={socket.status !== "open"}
          />
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <SearchPanel
            token={token ?? ""}
            forumId={forumId}
            onJump={jumpToMessage}
            onClose={() => setSearchOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <ForumSettingsModal
            token={token ?? ""}
            forum={forum}
            canManage={forum.current_user_role === "creator"}
            onUpdated={(f) => setForum((prev) => (prev ? { ...prev, ...f } : prev))}
            onLeft={() => router.push("/welcome")}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        color: C.cream,
      }}
    >
      {children}
    </main>
  );
}

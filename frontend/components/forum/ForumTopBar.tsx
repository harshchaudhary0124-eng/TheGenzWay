"use client";

import { useRouter } from "next/navigation";
import { C, SANS, DISPLAY } from "@/lib/constants";
import type { ForumDetail } from "@/lib/chat";
import type { SocketStatus } from "@/hooks/useForumSocket";

const STATUS_META: Record<SocketStatus, { color: string; label: string }> = {
  open: { color: "#5FA463", label: "Connected" },
  connecting: { color: C.glow, label: "Connecting…" },
  reconnecting: { color: C.glow, label: "Reconnecting…" },
  closed: { color: C.red, label: "Disconnected" },
};

export default function ForumTopBar({
  forum,
  onlineCount,
  status,
  onToggleSidebar,
  onSearch,
  onSettings,
}: {
  forum: ForumDetail;
  onlineCount: number;
  status: SocketStatus;
  onToggleSidebar: () => void;
  onSearch: () => void;
  onSettings: () => void;
}) {
  const router = useRouter();
  const st = STATUS_META[status];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(8,8,8,0.85)",
        backdropFilter: "blur(12px)",
        ...SANS,
      }}
    >
      <button
        type="button"
        onClick={() => router.push("/welcome")}
        aria-label="Back"
        style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "1.1rem" }}
      >
        ←
      </button>

      {/* mobile sidebar toggle */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle forum info"
        className="lg:hidden"
        style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "1.05rem" }}
      >
        ☰
      </button>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1
            style={{
              ...DISPLAY,
              color: C.cream,
              fontSize: "clamp(1rem, 2.4vw, 1.35rem)",
              letterSpacing: "0.01em",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {forum.name}
          </h1>
          {forum.domain && (
            <span
              style={{
                fontSize: "0.6rem",
                color: C.orange,
                border: "1px solid rgba(255,91,46,0.25)",
                padding: "1px 7px",
                letterSpacing: "0.06em",
                flexShrink: 0,
              }}
            >
              {forum.domain}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
          <span style={{ color: C.muted, fontSize: "0.68rem" }}>
            {forum.member_count} {forum.member_count === 1 ? "member" : "members"}
          </span>
          {onlineCount > 0 && (
            <span style={{ color: "#5FA463", fontSize: "0.68rem" }}>● {onlineCount} online</span>
          )}
        </div>
      </div>

      {/* connection status */}
      <span
        title={st.label}
        style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: "0.66rem" }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.color }} />
        <span className="hidden sm:inline">{st.label}</span>
      </span>

      {/* Search */}
      <button type="button" title="Search messages" onClick={onSearch} style={iconBtn}>
        🔍
      </button>
      {/* Forum settings (edit / leave / invite link) — available to all members */}
      <button type="button" title="Forum settings" onClick={onSettings} style={iconBtn}>
        ⚙
      </button>
    </header>
  );
}

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: C.muted,
  cursor: "pointer",
  fontSize: "0.95rem",
};

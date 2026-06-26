"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { C, SANS, DISPLAY } from "@/lib/constants";
import type { UserProfile } from "@/lib/auth";
import type { DiscussionForum, ForumInvite } from "@/lib/forum";
import { apiAcceptInvite, apiRejectInvite } from "@/lib/forum";
import { getToken, clearToken } from "@/lib/auth";

interface Props {
  user: UserProfile;
  invites: ForumInvite[];
  forums: DiscussionForum[];
  onRefresh: () => void;
  onViewProfile: (userId: number) => void;
}

export default function WelcomeNavbar({ user, invites, forums, onRefresh, onViewProfile }: Props) {
  const router = useRouter();
  const [panel, setPanel] = useState<"invites" | "forums" | null>(null);
  const [acting, setActing] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanel(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  async function handleAccept(inviteId: number) {
    const token = getToken();
    if (!token) return;
    setActing(inviteId);
    try {
      await apiAcceptInvite(token, inviteId);
      onRefresh();
    } finally {
      setActing(null);
    }
  }

  async function handleReject(inviteId: number) {
    const token = getToken();
    if (!token) return;
    setActing(inviteId);
    try {
      await apiRejectInvite(token, inviteId);
      onRefresh();
    } finally {
      setActing(null);
    }
  }

  const firstName = user.full_name.split(" ")[0];

  const navStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    height: "56px",
    background: "rgba(8,8,8,0.94)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 clamp(1rem, 4vw, 2.5rem)",
    ...SANS,
  };

  const iconBtnStyle = (active: boolean): React.CSSProperties => ({
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    background: active ? "rgba(255,91,46,0.1)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? "rgba(255,91,46,0.3)" : "rgba(255,255,255,0.08)"}`,
    color: active ? C.orange : "rgba(245,242,235,0.7)",
    fontSize: "0.72rem",
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "all 0.18s ease",
    userSelect: "none",
  });

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    left: "auto",
    width: "340px",
    maxHeight: "480px",
    overflowY: "auto",
    background: "rgba(12,12,12,0.98)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.09)",
    zIndex: 100,
  };

  const sidebarMenuItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    width: "100%",
    padding: "14px 26px",
    background: "transparent",
    border: "none",
    color: "rgba(245,242,235,0.72)",
    fontSize: "0.96rem",
    letterSpacing: "0.01em",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s ease",
    ...SANS,
  };

  return (
    <>
      <nav style={navStyle}>
        {/* Left — hamburger + greeting */}
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
          {/* Hamburger button */}
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "4.5px",
              padding: "6px 8px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              marginRight: "16px",
            }}
          >
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  display: "block",
                  width: i === 1 ? "14px" : "20px",
                  height: "1.5px",
                  background: "rgba(245,242,235,0.55)",
                  borderRadius: "1px",
                  transition: "width 0.2s ease",
                }}
              />
            ))}
          </button>

          {/* Avatar + greeting */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(255,91,46,0.15)",
                border: "1px solid rgba(255,91,46,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.orange,
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span
              style={{
                fontSize: "0.78rem",
                color: "rgba(245,242,235,0.6)",
                letterSpacing: "0.02em",
              }}
            >
              Hi,{" "}
              <span style={{ color: C.cream, fontWeight: 600 }}>{firstName}</span>
            </span>
          </div>
        </div>

        {/* Right — action buttons */}
        <div ref={panelRef} style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative" }}>

          {/* Invites button */}
          <button
            style={iconBtnStyle(panel === "invites")}
            onClick={() => setPanel(panel === "invites" ? null : "invites")}
          >
            <span style={{ fontSize: "1rem" }}>💌</span>
            <span>Invites</span>
            {invites.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: C.orange,
                  color: C.bg,
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {invites.length}
              </span>
            )}
          </button>

          {/* Forums button */}
          <button
            style={iconBtnStyle(panel === "forums")}
            onClick={() => setPanel(panel === "forums" ? null : "forums")}
          >
            <span style={{ fontSize: "1rem" }}>🧩</span>
            <span>My Forums</span>
            {forums.length > 0 && (
              <span style={{ color: C.muted, fontSize: "0.65rem" }}>({forums.length})</span>
            )}
          </button>

          {/* Panels */}
          <AnimatePresence>
            {panel === "invites" && (
              <motion.div
                key="invites-panel"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={panelStyle}
              >
                <div
                  style={{
                    padding: "14px 18px 10px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: C.muted,
                  }}
                >
                  Discussion Invites
                </div>

                {invites.length === 0 ? (
                  <div
                    style={{
                      padding: "28px 18px",
                      textAlign: "center",
                      color: C.muted,
                      fontSize: "0.8rem",
                    }}
                  >
                    No pending invites
                  </div>
                ) : (
                  invites.map(invite => (
                    <div
                      key={invite.id}
                      style={{
                        padding: "14px 18px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <button
                            onClick={() => { setPanel(null); onViewProfile(invite.sender.id); }}
                            style={{
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              textAlign: "left",
                              marginBottom: "2px",
                              display: "block",
                            }}
                          >
                            <span
                              style={{
                                color: C.cream,
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                borderBottom: `1px solid rgba(255,91,46,0.4)`,
                                transition: "color 0.15s ease, border-color 0.15s ease",
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLSpanElement).style.color = C.orange;
                                (e.currentTarget as HTMLSpanElement).style.borderBottomColor = C.orange;
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLSpanElement).style.color = C.cream;
                                (e.currentTarget as HTMLSpanElement).style.borderBottomColor = "rgba(255,91,46,0.4)";
                              }}
                            >
                              {invite.sender.full_name}
                            </span>
                          </button>
                          <p style={{ color: C.muted, fontSize: "0.72rem", marginBottom: "6px" }}>
                            {invite.sender.city}, {invite.sender.country}
                          </p>
                          <p style={{ color: "rgba(245,242,235,0.55)", fontSize: "0.75rem", marginBottom: "4px" }}>
                            Forum: <span style={{ color: C.cream }}>{invite.forum_name}</span>
                            {invite.forum_domain && (
                              <span style={{ color: C.muted }}> · {invite.forum_domain}</span>
                            )}
                          </p>
                          {invite.context && (
                            <p style={{ color: C.muted, fontSize: "0.72rem", fontStyle: "italic" }}>
                              "{invite.context}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button
                          disabled={acting === invite.id}
                          onClick={() => handleAccept(invite.id)}
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            background: "rgba(255,91,46,0.12)",
                            border: "1px solid rgba(255,91,46,0.35)",
                            color: C.orange,
                            fontSize: "0.7rem",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            cursor: acting === invite.id ? "not-allowed" : "pointer",
                            opacity: acting === invite.id ? 0.5 : 1,
                            transition: "all 0.15s ease",
                          }}
                        >
                          Accept
                        </button>
                        <button
                          disabled={acting === invite.id}
                          onClick={() => handleReject(invite.id)}
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: C.muted,
                            fontSize: "0.7rem",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            cursor: acting === invite.id ? "not-allowed" : "pointer",
                            opacity: acting === invite.id ? 0.5 : 1,
                            transition: "all 0.15s ease",
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {panel === "forums" && (
              <motion.div
                key="forums-panel"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={panelStyle}
              >
                <div
                  style={{
                    padding: "14px 18px 10px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: C.muted,
                  }}
                >
                  My Discussion Forums
                </div>

                {forums.length === 0 ? (
                  <div
                    style={{
                      padding: "28px 18px",
                      textAlign: "center",
                      color: C.muted,
                      fontSize: "0.8rem",
                    }}
                  >
                    No forums yet — invite someone to start one
                  </div>
                ) : (
                  forums.map(forum => (
                    <div
                      key={forum.id}
                      style={{
                        padding: "14px 18px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <p style={{ color: C.cream, fontSize: "0.84rem", fontWeight: 600, marginBottom: "3px" }}>
                        {forum.name}
                      </p>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {forum.domain && (
                          <span
                            style={{
                              fontSize: "0.62rem",
                              color: C.orange,
                              border: "1px solid rgba(255,91,46,0.25)",
                              padding: "1px 7px",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {forum.domain}
                          </span>
                        )}
                        <span style={{ fontSize: "0.7rem", color: C.muted }}>
                          {forum.member_count} {forum.member_count === 1 ? "member" : "members"}
                        </span>
                      </div>
                      {forum.description && (
                        <p style={{ color: "rgba(245,242,235,0.45)", fontSize: "0.72rem", marginTop: "5px" }}>
                          {forum.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Sidebar overlay + drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                zIndex: 9000,
              }}
            />

            {/* Drawer */}
            <motion.div
              key="sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.26, ease: [0.32, 0, 0.18, 1] }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "300px",
                background: "rgba(9,9,9,0.99)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                borderRight: "1px solid rgba(255,255,255,0.07)",
                zIndex: 9001,
                display: "flex",
                flexDirection: "column",
                ...SANS,
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "22px 26px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span
                  style={{
                    ...DISPLAY,
                    fontSize: "1rem",
                    color: C.orange,
                    letterSpacing: "0.04em",
                  }}
                >
                  TheGenzWay
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close menu"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(245,242,235,0.45)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    lineHeight: 1,
                    padding: "5px 9px",
                    letterSpacing: "0.04em",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Profile card */}
              <div
                style={{
                  padding: "24px 26px 22px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(255,91,46,0.12)",
                      border: "1px solid rgba(255,91,46,0.28)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.orange,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p
                      style={{
                        ...DISPLAY,
                        fontSize: "1.15rem",
                        color: C.cream,
                        letterSpacing: "-0.01em",
                        lineHeight: 1.15,
                        marginBottom: "5px",
                      }}
                    >
                      {user.full_name}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: C.muted, letterSpacing: "0.01em" }}>
                      {user.city}, {user.country}
                    </p>
                  </div>
                </div>
                {user.interested_domains.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px" }}>
                    {user.interested_domains.map(d => (
                      <span
                        key={d}
                        style={{
                          fontSize: "0.65rem",
                          color: C.orange,
                          border: "1px solid rgba(255,91,46,0.25)",
                          padding: "3px 10px",
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                        }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu items */}
              <div style={{ flex: 1, paddingTop: "10px" }}>
                {/* Edit Profile */}
                <button
                  style={sidebarMenuItemStyle}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,91,46,0.06)";
                    (e.currentTarget as HTMLButtonElement).style.color = C.cream;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,242,235,0.75)";
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Profile
                </button>

                {/* Notifications (placeholder) */}
                <button
                  style={sidebarMenuItemStyle}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,91,46,0.06)";
                    (e.currentTarget as HTMLButtonElement).style.color = C.cream;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,242,235,0.75)";
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Notifications
                </button>

                {/* Settings */}
                <button
                  style={sidebarMenuItemStyle}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,91,46,0.06)";
                    (e.currentTarget as HTMLButtonElement).style.color = C.cream;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,242,235,0.75)";
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </button>
              </div>

              {/* Bottom — logout */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 0 28px" }}>
                <button
                  onClick={handleLogout}
                  style={{
                    ...sidebarMenuItemStyle,
                    color: "rgba(199,67,67,0.75)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(199,67,67,0.06)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#C74343";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(199,67,67,0.75)";
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

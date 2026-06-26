"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { C, SANS, DISPLAY, SCRIPT } from "@/lib/constants";
import type { DiscoveredPerson } from "@/lib/discover";
import { DOMAIN_ANSWER_KEYS, DOMAIN_ANSWER_LABELS } from "@/lib/discover";

interface Props {
  person: DiscoveredPerson | null;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
}

export default function ProfileModal({ person, loading, error, onClose }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  // Reset tab to first whenever the viewed person changes
  useEffect(() => {
    setActiveTab(0);
  }, [person?.id]);

  // All domain names for tabs; look up rich data per-tab from matched_domains
  const allDomains = person?.interested_domains ?? [];
  const domainDataMap = new Map(
    (person?.matched_domains ?? []).map(md => [md.domain, md])
  );
  const activeDomainName = allDomains[activeTab] ?? null;
  const activeDomainData = activeDomainName ? domainDataMap.get(activeDomainName) ?? null : null;

  return (
    <>
      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="profile-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 9500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                color: C.orange,
                fontSize: "0.72rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                ...SANS,
              }}
            >
              Loading profile…
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error modal */}
      <AnimatePresence>
        {error && !loading && (
          <>
            <motion.div
              key="error-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.72)",
                zIndex: 9500,
              }}
            />
            <div
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9501,
                pointerEvents: "none",
              }}
            >
              <motion.div
                key="error-modal"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  width: "min(400px, 88vw)",
                  background: "rgba(10,10,10,0.99)",
                  backdropFilter: "blur(32px)",
                  WebkitBackdropFilter: "blur(32px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "36px 32px",
                  textAlign: "center",
                  pointerEvents: "auto",
                  ...SANS,
                }}
              >
                <p style={{ fontSize: "1.4rem", marginBottom: "12px" }}>⚠</p>
                <p
                  style={{
                    ...DISPLAY,
                    fontSize: "1rem",
                    color: C.cream,
                    marginBottom: "8px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Profile unavailable
                </p>
                <p style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.5, marginBottom: "24px" }}>
                  {error}
                </p>
                <button
                  onClick={onClose}
                  style={{
                    padding: "8px 24px",
                    background: "rgba(255,91,46,0.1)",
                    border: "1px solid rgba(255,91,46,0.3)",
                    color: C.orange,
                    fontSize: "0.7rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,91,46,0.18)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,91,46,0.1)"; }}
                >
                  Dismiss
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Profile modal */}
      <AnimatePresence>
        {person && (
          <>
            {/* Backdrop */}
            <motion.div
              key="profile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.75)",
                zIndex: 9500,
              }}
            />

            {/* Centering shell — flex so Framer Motion y-animation doesn't break translate */}
            <div
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9501,
                pointerEvents: "none",
              }}
            >
              <motion.div
                key="profile-modal"
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 28, scale: 0.96 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  width: "min(580px, 92vw)",
                  maxHeight: "86vh",
                  overflowY: "auto",
                  background: "rgba(10,10,10,0.99)",
                  backdropFilter: "blur(32px)",
                  WebkitBackdropFilter: "blur(32px)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  pointerEvents: "auto",
                  ...SANS,
                }}
              >
                {/* ── Header ─────────────────────────────── */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "28px 32px 22px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    gap: "16px",
                    background: "linear-gradient(180deg, rgba(255,91,46,0.05) 0%, transparent 100%)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "50%",
                        background: "rgba(255,91,46,0.1)",
                        border: "1.5px solid rgba(255,91,46,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: C.orange,
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        flexShrink: 0,
                        ...DISPLAY,
                      }}
                    >
                      {person.full_name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h2
                        style={{
                          ...DISPLAY,
                          fontSize: "clamp(1.15rem, 3vw, 1.45rem)",
                          color: C.cream,
                          letterSpacing: "-0.015em",
                          lineHeight: 1.1,
                          marginBottom: "7px",
                        }}
                      >
                        {person.full_name}
                      </h2>

                      {/* Location */}
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={C.muted}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0 }}
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span style={{ fontSize: "0.78rem", color: C.muted, letterSpacing: "0.01em" }}>
                          {person.city}, {person.country}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(245,242,235,0.4)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      padding: "6px 10px",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)";
                      (e.currentTarget as HTMLButtonElement).style.color = C.cream;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,242,235,0.4)";
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* ── Domain tabs ────────────────────────── */}
                {allDomains.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      overflowX: "auto",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      scrollbarWidth: "none",
                    }}
                  >
                    {allDomains.map((domain, i) => {
                      const active = i === activeTab;
                      const hasData = domainDataMap.has(domain);
                      return (
                        <button
                          key={domain}
                          onClick={() => setActiveTab(i)}
                          style={{
                            flexShrink: 0,
                            padding: "12px 20px",
                            background: "transparent",
                            border: "none",
                            borderBottom: active
                              ? `2px solid ${C.orange}`
                              : "2px solid transparent",
                            color: active
                              ? C.orange
                              : hasData
                              ? "rgba(245,242,235,0.5)"
                              : "rgba(245,242,235,0.28)",
                            fontSize: "0.68rem",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "color 0.15s ease, border-color 0.15s ease",
                            whiteSpace: "nowrap",
                            ...SANS,
                          }}
                          onMouseEnter={e => {
                            if (!active)
                              (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,242,235,0.75)";
                          }}
                          onMouseLeave={e => {
                            if (!active)
                              (e.currentTarget as HTMLButtonElement).style.color = hasData
                                ? "rgba(245,242,235,0.5)"
                                : "rgba(245,242,235,0.28)";
                          }}
                        >
                          {domain}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── Active domain content ──────────────── */}
                <AnimatePresence mode="wait">
                  {activeDomainName && activeDomainData ? (
                    <motion.div
                      key={activeDomainName}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      style={{ padding: "26px 32px 32px" }}
                    >
                      {/* Identity summary */}
                      {activeDomainData.identity_summary && (
                        <p
                          style={{
                            ...SCRIPT,
                            fontSize: "1.08rem",
                            color: "rgba(245,242,235,0.68)",
                            lineHeight: 1.5,
                            marginBottom: "22px",
                          }}
                        >
                          {activeDomainData.identity_summary}
                        </p>
                      )}

                      {/* Answer grid */}
                      {(() => {
                        const keys = DOMAIN_ANSWER_KEYS[activeDomainName] ?? [];
                        const labels = DOMAIN_ANSWER_LABELS[activeDomainName] ?? [];
                        const points = keys
                          .map((key, i) => ({
                            label: labels[i] ?? key,
                            value: activeDomainData.onboarding_answers[key] ?? "",
                          }))
                          .filter(p => p.value);

                        if (points.length === 0) return null;

                        return (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "16px 36px",
                            }}
                          >
                            {points.map(({ label, value }) => (
                              <div key={label}>
                                <p
                                  style={{
                                    fontSize: "0.58rem",
                                    color: C.muted,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    marginBottom: "4px",
                                  }}
                                >
                                  {label}
                                </p>
                                <p
                                  style={{
                                    fontSize: "0.86rem",
                                    color: "rgba(245,242,235,0.9)",
                                    lineHeight: 1.35,
                                  }}
                                >
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </motion.div>
                  ) : activeDomainName ? (
                    /* Domain listed in interests but no detail data available */
                    <motion.div
                      key={activeDomainName + "-empty"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      style={{
                        padding: "40px 32px",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          ...SCRIPT,
                          fontSize: "1rem",
                          color: "rgba(245,242,235,0.3)",
                          marginBottom: "8px",
                        }}
                      >
                        Interested in {activeDomainName}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: C.muted, lineHeight: 1.5 }}>
                        No additional details shared for this domain yet.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        padding: "40px 32px",
                        color: C.muted,
                        fontSize: "0.82rem",
                        textAlign: "center",
                      }}
                    >
                      No profile details available yet.
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { motion, AnimatePresence } from "motion/react";
import { C, SANS, DISPLAY, SCRIPT } from "@/lib/constants";
import type { ProfileData } from "@/lib/profile";
import { DOMAIN_ANSWER_KEYS, DOMAIN_ANSWER_LABELS } from "@/lib/discover";

interface Props {
  profile: ProfileData;
  onClose: () => void;
  // Optional viewer-relative hint: domain names the viewer also belongs to.
  // When provided, those domains get a subtle "in common with you" tag.
  // Leave undefined to render a neutral, context-free profile (the default
  // for any non-discovery surface).
  highlightDomains?: string[];
}

export default function ProfileModal({ profile, onClose, highlightDomains }: Props) {
  const initial = profile.full_name.charAt(0).toUpperCase();
  const sharedDomains = new Set(highlightDomains ?? []);

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
          WebkitBackdropFilter: "blur(6px)",
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
            maxWidth: "560px",
            maxHeight: "85vh",
            overflowY: "auto",
            background: "#0e0e0e",
            border: "1px solid rgba(255,255,255,0.1)",
            ...SANS,
          }}
        >
          {/* ── Header ─────────────────────────────────── */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#0e0e0e",
              padding: "clamp(1.5rem, 4vw, 2rem) clamp(1.5rem, 4vw, 2rem) clamp(1.1rem, 3vw, 1.5rem)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "rgba(255,91,46,0.12)",
                  border: "1px solid rgba(255,91,46,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.orange,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "0.58rem", color: C.muted, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "5px" }}>
                  Profile
                </p>
                <h2
                  style={{
                    ...DISPLAY,
                    fontSize: "clamp(1.3rem, 3.5vw, 1.7rem)",
                    color: C.cream,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                  }}
                >
                  {profile.full_name}
                </h2>
                <p style={{ color: C.muted, fontSize: "0.8rem", marginTop: "3px" }}>
                  {profile.city}, {profile.country}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                color: C.muted,
                fontSize: "1.3rem",
                cursor: "pointer",
                lineHeight: 1,
                padding: "4px",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* ── All domains (complete profile) ──────────── */}
          <div style={{ padding: "clamp(0.5rem, 2vw, 0.75rem) 0" }}>
            <p
              style={{
                fontSize: "0.6rem",
                color: C.muted,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "clamp(0.9rem, 2vw, 1.1rem) clamp(1.5rem, 4vw, 2rem) clamp(0.4rem, 1vw, 0.6rem)",
              }}
            >
              {profile.domains.length}{" "}
              {profile.domains.length === 1 ? "domain" : "domains"}
            </p>

            {profile.domains.map(({ domain, onboarding_answers, identity_summary }, di) => {
              const keys = DOMAIN_ANSWER_KEYS[domain] ?? [];
              const labels = DOMAIN_ANSWER_LABELS[domain] ?? [];
              const points = keys
                .map((key, i) => ({ label: labels[i], value: onboarding_answers[key] ?? "" }))
                .filter(p => p.value);

              return (
                <div
                  key={domain}
                  style={{
                    padding: "clamp(1rem, 2.5vw, 1.3rem) clamp(1.5rem, 4vw, 2rem)",
                    borderBottom:
                      di < profile.domains.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                  }}
                >
                  {/* Domain name + shared tag */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "0.62rem",
                        color: C.orange,
                        border: "1px solid rgba(255,91,46,0.28)",
                        background: "rgba(255,91,46,0.06)",
                        padding: "3px 10px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {domain}
                    </span>
                    {sharedDomains.has(domain) && (
                      <span style={{ fontSize: "0.62rem", color: C.muted, letterSpacing: "0.04em" }}>
                        ✦ in common with you
                      </span>
                    )}
                  </div>

                  {/* Identity summary */}
                  {identity_summary && (
                    <p
                      style={{
                        ...SCRIPT,
                        fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)",
                        color: "rgba(245,242,235,0.7)",
                        lineHeight: 1.4,
                        marginBottom: points.length > 0 ? "12px" : 0,
                      }}
                    >
                      {identity_summary}
                    </p>
                  )}

                  {/* Labeled answer grid */}
                  {points.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px 20px",
                      }}
                    >
                      {points.map(({ label, value }) => (
                        <div key={label} style={{ minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: "0.58rem",
                              color: C.muted,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              marginBottom: "2px",
                            }}
                          >
                            {label}
                          </p>
                          <p style={{ fontSize: "0.82rem", color: "rgba(245,242,235,0.85)", lineHeight: 1.35 }}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

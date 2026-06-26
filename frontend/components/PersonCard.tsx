"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { C, SANS, DISPLAY, SCRIPT } from "@/lib/constants";
import type { DiscoveredPerson } from "@/lib/discover";
import { DOMAIN_ANSWER_KEYS, DOMAIN_ANSWER_LABELS } from "@/lib/discover";

interface Props {
  person: DiscoveredPerson;
  onAddToForum: (person: DiscoveredPerson) => void;
  index: number;
}

export default function PersonCard({ person, onAddToForum, index }: Props) {
  const [hovered, setHovered] = useState(false);

  const primaryMatch = person.matched_domains[0];
  const hasMultipleDomains = person.matched_domains.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: hovered ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.018)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"}`,
        transition: "background 0.2s ease, border-color 0.2s ease",
        display: "flex",
        flexDirection: "column",
        ...SANS,
      }}
    >
      {/* Hover glow */}
      {hovered && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: "radial-gradient(ellipse at 50% -10%, rgba(255,91,46,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* ── Header ─────────────────────────────────── */}
      <div
        style={{
          padding: "clamp(1.1rem, 2.5vw, 1.5rem)",
          paddingBottom: "clamp(0.9rem, 2vw, 1.2rem)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              ...DISPLAY,
              fontSize: "clamp(1.1rem, 2.2vw, 1.3rem)",
              color: C.cream,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
              marginBottom: "4px",
            }}
          >
            {person.full_name}
          </h3>
          <p style={{ color: C.muted, fontSize: "0.76rem" }}>
            {person.city}, {person.country}
          </p>
        </div>

        {/* Domain badges — stacked if multiple */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end", flexShrink: 0 }}>
          {person.matched_domains.map(({ domain }) => (
            <span
              key={domain}
              style={{
                fontSize: "0.56rem",
                color: C.orange,
                border: "1px solid rgba(255,91,46,0.28)",
                background: "rgba(255,91,46,0.06)",
                padding: "2px 8px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {domain}
            </span>
          ))}
        </div>
      </div>

      {/* ── Identity summary (from primary matched domain) ── */}
      {primaryMatch && (
        <div
          style={{
            padding: "0 clamp(1.1rem, 2.5vw, 1.5rem)",
            paddingBottom: "clamp(0.9rem, 2vw, 1.2rem)",
          }}
        >
          <p
            style={{
              ...SCRIPT,
              fontSize: "clamp(0.92rem, 1.7vw, 1.05rem)",
              color: "rgba(245,242,235,0.65)",
              lineHeight: 1.4,
            }}
          >
            {primaryMatch.identity_summary}
          </p>
        </div>
      )}

      {/* ── Per-domain answer blocks ─────────────────── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {person.matched_domains.map(({ domain, onboarding_answers }, di) => {
          const keys = DOMAIN_ANSWER_KEYS[domain] ?? [];
          const labels = DOMAIN_ANSWER_LABELS[domain] ?? [];
          const points = keys
            .map((key, i) => ({ label: labels[i], value: onboarding_answers[key] ?? "" }))
            .filter(p => p.value);

          if (points.length === 0) return null;

          return (
            <div
              key={domain}
              style={{
                padding: "clamp(0.9rem, 2vw, 1.2rem) clamp(1.1rem, 2.5vw, 1.5rem)",
                borderBottom:
                  di < person.matched_domains.length - 1
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "none",
              }}
            >
              {/* Domain label — only show when multiple domains */}
              {hasMultipleDomains && (
                <p
                  style={{
                    fontSize: "0.58rem",
                    color: C.orange,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                    opacity: 0.8,
                  }}
                >
                  {domain}
                </p>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 20px",
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
                        marginBottom: "1px",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontSize: "0.77rem",
                        color: "rgba(245,242,235,0.8)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Why matched + actions ────────────────────── */}
      <div
        style={{
          padding: "clamp(0.9rem, 2vw, 1.2rem) clamp(1.1rem, 2.5vw, 1.5rem)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {primaryMatch && (
          <p
            style={{
              fontSize: "0.71rem",
              color: "rgba(255,91,46,0.6)",
              fontStyle: "italic",
              lineHeight: 1.4,
            }}
          >
            ✦ {primaryMatch.why_matched}
          </p>
        )}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => onAddToForum(person)}
            style={{
              flex: "1 1 auto",
              padding: "9px 14px",
              background: "rgba(255,91,46,0.1)",
              border: "1px solid rgba(255,91,46,0.3)",
              color: C.orange,
              fontSize: "0.68rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontWeight: 600,
              transition: "background 0.15s ease",
              ...SANS,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,91,46,0.18)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,91,46,0.1)"; }}
          >
            💬 Add to Discussion Forum
          </button>

          <button
            style={{
              padding: "9px 14px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(245,242,235,0.45)",
              fontSize: "0.68rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s ease",
              ...SANS,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.18)";
              (e.currentTarget as HTMLButtonElement).style.color = C.cream;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.09)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,242,235,0.45)";
            }}
          >
            View Profile
          </button>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { SANS } from "@/lib/constants";

// Deterministic palette — index chosen from the user id so a person keeps the
// same colour everywhere. Muted tones that sit well on the near-black bg.
const PALETTE = [
  "#FF5B2E", "#E0843D", "#C9A227", "#5FA463",
  "#3E8E8E", "#4F73C4", "#8A5BD6", "#C7568F",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  name,
  userId,
  size = 38,
  online,
}: {
  name: string;
  userId: number;
  size?: number;
  online?: boolean;
}) {
  const color = PALETTE[userId % PALETTE.length];
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `${color}22`,
          border: `1px solid ${color}66`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.38,
          fontWeight: 700,
          letterSpacing: "0.02em",
          ...SANS,
        }}
      >
        {initials(name)}
      </div>
      {online !== undefined && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: "50%",
            background: online ? "#5FA463" : "#555",
            border: "2px solid #080808",
          }}
        />
      )}
    </div>
  );
}

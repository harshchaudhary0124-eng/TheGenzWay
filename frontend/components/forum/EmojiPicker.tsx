"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { C, SANS } from "@/lib/constants";

// Curated set — common reactions/expressions. Lightweight by design (no dep).
const EMOJIS = [
  "😀", "😂", "🙂", "😉", "😍", "🤔", "😅", "😎",
  "😭", "😡", "👍", "👎", "🙏", "👏", "🙌", "💪",
  "🔥", "✨", "🚀", "🎉", "💯", "❤️", "💡", "👀",
  "✅", "❌", "⚡", "🤝", "😴", "🤯", "🥳", "🫡",
];

export default function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{
        position: "absolute",
        bottom: "calc(100% + 10px)",
        right: 0,
        background: "#101010",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 10,
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        gap: 4,
        width: 280,
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        zIndex: 50,
        ...SANS,
      }}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          style={{
            fontSize: "1.15rem",
            lineHeight: 1,
            padding: "5px 0",
            borderRadius: 7,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "background 0.12s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          aria-label={`Insert ${emoji}`}
        >
          {emoji}
        </button>
      ))}
      <div style={{ gridColumn: "1 / -1", height: 1, background: "rgba(255,255,255,0.06)", margin: "2px 0" }} />
      <span style={{ gridColumn: "1 / -1", fontSize: "0.6rem", color: C.muted, textAlign: "center" }}>
        Pick an emoji
      </span>
    </motion.div>
  );
}

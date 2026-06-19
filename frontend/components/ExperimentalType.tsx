"use client";

import { motion } from "motion/react";
import { useReveal } from "@/hooks/useReveal";
import { C, DISPLAY } from "@/lib/constants";

// Top:    (5,100)→(465,100), CP y=20,  peaks y=40  — bows upward, 60 units.
// Bottom: (465,340)→(5,340),  CP y=300, peaks y=310 — same direction, 30 units.
const SCREEN_PATH =
  "M 5 100 C 135 20 335 20 465 100 L 465 340 C 335 300 135 300 5 340 Z";

function CurvedDisplay() {
  return (
    <div
      className="relative"
      style={{
        width: "clamp(280px, 44vw, 700px)",
        height: "clamp(230px, 38vw, 610px)",
      }}
    >
      {/* Ambient orange glow behind the SVG */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 60% at 47% 50%, rgba(255,91,46,0.2) 0%, rgba(255,138,61,0.07) 48%, transparent 72%)",
          filter: "blur(52px)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <svg
        viewBox="0 0 500 440"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        style={{ width: "100%", height: "100%", position: "relative", zIndex: 1, overflow: "visible" }}
      >
        <defs>
          <radialGradient id="cg-fill" cx="235" cy="220" r="270" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1c1009" />
            <stop offset="50%" stopColor="#0e0807" />
            <stop offset="100%" stopColor="#060404" />
          </radialGradient>

          <radialGradient id="cg-warm" cx="235" cy="180" r="220" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,91,46,0.08)" />
            <stop offset="65%" stopColor="rgba(255,91,46,0.03)" />
            <stop offset="100%" stopColor="rgba(255,91,46,0)" />
          </radialGradient>

          <filter id="cg-glow" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1.6 0.4 0 0 0.14  0.2 0.1 0 0 0  0 0 0 0 0  0 0 0 0.38 0"
              result="tinted"
            />
            <feMerge>
              <feMergeNode in="tinted" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip path — ready to mask content inside later */}
          <clipPath id="cg-clip">
            <path d={SCREEN_PATH} />
          </clipPath>
        </defs>

        <path
          d={SCREEN_PATH}
          fill="none"
          stroke="rgba(255,91,46,0.28)"
          strokeWidth="16"
          filter="url(#cg-glow)"
        />
        <path d={SCREEN_PATH} fill="url(#cg-fill)" />
        <path d={SCREEN_PATH} fill="url(#cg-warm)" />

        {/* Newspapers clipped inside the curved display — 3-panel gallery */}
        <g clipPath="url(#cg-clip)">
          {/* Slot 1 — left */}
          <image
            href="/newspapers/2.webp"
            x={5}
            y={15}
            width={148}
            height={325}
            preserveAspectRatio="xMidYMid slice"
            opacity={0.88}
          />
          {/* Slot 2 — center (gap: 3px) */}
          <image
            href="/newspapers/5.jpg"
            x={156}
            y={15}
            width={148}
            height={325}
            preserveAspectRatio="xMidYMid slice"
            opacity={0.86}
          />
          {/* Slot 3 — right (gap: 3px) */}
          <image
            href="/newspapers/9.jpg"
            x={307}
            y={15}
            width={148}
            height={325}
            preserveAspectRatio="xMidYMid slice"
            opacity={0.87}
          />
          {/* Atmospheric vignette */}
          <path d={SCREEN_PATH} fill="rgba(6,4,4,0.32)" />
          {/* Warm tint overlay */}
          <path d={SCREEN_PATH} fill="url(#cg-warm)" />
        </g>

        <path
          d={SCREEN_PATH}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="1.8"
        />
        <path
          d="M 5 100 C 135 20 335 20 465 100"
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function ExperimentalType() {
  const { ref, inView } = useReveal({ amount: 0.4 });

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center px-6 md:px-16 lg:px-24 relative overflow-hidden"
    >
      {/* Curved display — absolutely positioned, desktop only */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block"
        style={{ opacity: inView ? 1 : 0, transition: "opacity 1.4s ease-out 0.6s" }}
      >
        <CurvedDisplay />
      </div>

      <div className="max-w-screen-xl mx-auto w-full relative z-10">
        <div
          className="leading-none uppercase"
          style={{
            ...DISPLAY,
            fontSize: "clamp(2.5rem, 9vw, 10rem)",
            color: C.cream,
          }}
        >
          IN THE{" "}
          <motion.span
            style={{
              display: "inline-block",
              color: C.orange,
              filter: inView ? "blur(0px)" : "blur(18px)",
              transition: "filter 1.6s ease-out",
            }}
          >
            BLUR
          </motion.span>
        </div>

        <div
          className="leading-none uppercase"
          style={{
            ...DISPLAY,
            fontSize: "clamp(2.5rem, 9vw, 10rem)",
            color: C.cream,
          }}
        >
          OF{" "}
          <motion.span
            style={{
              display: "inline-block",
              color: C.muted,
              filter: inView ? "blur(0px)" : "blur(18px)",
              transition: "filter 1.6s ease-out 0.35s",
            }}
          >
            IDEAS
          </motion.span>
        </div>

        <div className="mt-16 md:mt-24">
          <motion.p
            className="leading-none uppercase block"
            style={{
              ...DISPLAY,
              fontSize: "clamp(2.4rem, 8vw, 8.5rem)",
              color: C.cream,
              opacity: inView ? 1 : 0,
              transition: "opacity 0.9s ease-out 0.9s",
            }}
          >
            FIND YOUR
          </motion.p>
          <motion.p
            className="leading-none uppercase block"
            style={{
              ...DISPLAY,
              fontSize: "clamp(2.8rem, 9.5vw, 10rem)",
              color: C.orange,
              filter: inView ? "blur(0px)" : "blur(22px)",
              opacity: inView ? 1 : 0,
              transition: "filter 1.3s ease-out 1.2s, opacity 0.9s ease-out 1.1s",
            }}
          >
            PEOPLE.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

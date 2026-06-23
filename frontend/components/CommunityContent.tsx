"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";
import { C, DISPLAY, SANS } from "@/lib/constants";

const PILLARS = [
  { label: "Collaborate",   copy: "Find co-founders and teammates for your next project." },
  { label: "Discuss",       copy: "Get real feedback on ideas from people who are building." },
  { label: "Ship together", copy: "Show what you're working on. Celebrate launches. Move fast." },
  { label: "Connect",       copy: "Meet your future co-founder, partner, or first collaborator." },
];

export default function CommunityContent() {
  const { ref, inView } = useReveal({ amount: 0.2 });

  return (
    <section
      id="inside"
      ref={ref}
      className="relative min-h-screen flex flex-col justify-between px-6 md:px-16 lg:px-24 py-24 md:py-32 overflow-hidden"
    >
      {/* Ambient glow */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "20%", right: "-10%",
          width: "55vw", height: "55vw",
          background: `radial-gradient(ellipse, rgba(255,91,46,0.09) 0%, rgba(199,67,67,0.04) 45%, transparent 68%)`,
          filter: "blur(56px)",
          zIndex: 0,
        }}
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-screen-xl mx-auto w-full flex-1 flex flex-col justify-between gap-20 md:gap-28">

        {/* Top: label + pillars */}
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="uppercase tracking-[0.25em] mb-12 md:mb-16"
            style={{ color: C.orange, ...SANS, fontSize: "clamp(0.65rem, 1.2vw, 0.82rem)" }}
          >
            What happens inside
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px"
            style={{ border: "1px solid rgba(245,242,235,0.07)" }}
          >
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.1 }}
                className="p-8 md:p-10"
                style={{
                  backgroundColor: "rgba(245,242,235,0.015)",
                  borderRight: "1px solid rgba(245,242,235,0.07)",
                  borderBottom: "1px solid rgba(245,242,235,0.07)",
                }}
              >
                <p
                  className="leading-none uppercase mb-4"
                  style={{
                    ...DISPLAY,
                    fontSize: "clamp(1.5rem, 2.8vw, 2.4rem)",
                    color: C.cream,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {p.label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted, ...SANS }}>
                  {p.copy}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom: CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 pt-10"
          style={{ borderTop: "1px solid rgba(245,242,235,0.08)" }}
        >
          <div>
            <p
              className="leading-none uppercase mb-2"
              style={{
                ...DISPLAY,
                fontSize: "clamp(1.8rem, 4vw, 4.5rem)",
                color: C.cream,
                letterSpacing: "-0.02em",
              }}
            >
              Ready to build
            </p>
            <p
              className="leading-none uppercase"
              style={{
                ...DISPLAY,
                fontSize: "clamp(1.8rem, 4vw, 4.5rem)",
                color: C.orange,
                letterSpacing: "-0.02em",
              }}
            >
              with your people?
            </p>
          </div>

          <Link
            href="/join"
            className="inline-flex items-center justify-center gap-4 px-10 py-5 text-sm font-semibold tracking-widest uppercase whitespace-nowrap transition-all duration-300 hover:brightness-110 hover:gap-6"
            style={{
              backgroundColor: C.orange,
              color: C.bg,
              boxShadow: `0 0 52px rgba(255,91,46,0.38)`,
              ...SANS,
            }}
          >
            JOIN NOW <span>→</span>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}

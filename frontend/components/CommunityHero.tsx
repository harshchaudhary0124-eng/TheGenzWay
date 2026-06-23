"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { C, DISPLAY, SANS } from "@/lib/constants";

const WHO = ["Founders", "Developers", "Designers", "Indie Hackers", "Creators", "Students"];

export default function CommunityHero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 overflow-hidden pt-20">
      {/* Ambient glow */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "10%", left: "-10%",
          width: "65vw", height: "65vw",
          background: `radial-gradient(ellipse, rgba(255,91,46,0.11) 0%, rgba(255,138,61,0.04) 45%, transparent 68%)`,
          filter: "blur(60px)",
          zIndex: 0,
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-screen-xl mx-auto w-full">
        <motion.p
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="uppercase tracking-[0.3em] mb-8"
          style={{ color: C.orange, ...SANS, fontSize: "clamp(0.65rem, 1.2vw, 0.82rem)" }}
        >
          Community
        </motion.p>

        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: "110%", opacity: 0 }}
            animate={ready ? { y: "0%", opacity: 1 } : {}}
            transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(3rem, 8.5vw, 10.5rem)",
              color: C.cream,
              letterSpacing: "-0.02em",
            }}
          >
            Where builders
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: "110%", opacity: 0 }}
            animate={ready ? { y: "0%", opacity: 1 } : {}}
            transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(3rem, 8.5vw, 10.5rem)",
              color: C.orange,
              letterSpacing: "-0.02em",
            }}
          >
            meet builders.
          </motion.h1>
        </div>

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={ready ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.85, ease: "easeOut", delay: 0.5 }}
          className="my-8"
          style={{
            height: "1px",
            maxWidth: "280px",
            backgroundColor: `rgba(255,91,46,0.35)`,
            transformOrigin: "left",
          }}
        />

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.65 }}
          className="max-w-md text-base md:text-lg leading-relaxed mb-8"
          style={{ color: C.muted, ...SANS }}
        >
          A space to discuss ideas, find collaborators, and work on meaningful
          projects with people who are actually building.
        </motion.p>

        {/* Who it's for — inline chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.85 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {WHO.map((w, i) => (
            <span
              key={w}
              className="text-xs uppercase tracking-widest px-3 py-1.5"
              style={{
                color: C.muted,
                border: `1px solid rgba(245,242,235,0.1)`,
                ...SANS,
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {w}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
        >
          <Link
            href="/join"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:gap-5"
            style={{
              backgroundColor: C.orange,
              color: C.bg,
              boxShadow: `0 0 40px rgba(255,91,46,0.32)`,
              ...SANS,
            }}
          >
            Join the Community <span>→</span>
          </Link>
          <a
            href="#inside"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("inside")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:gap-5"
            style={{
              color: C.cream,
              border: `1px solid rgba(245,242,235,0.15)`,
              ...SANS,
            }}
          >
            What&apos;s inside <span>↓</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

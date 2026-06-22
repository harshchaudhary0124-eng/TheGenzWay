"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { C, DISPLAY, SANS } from "@/lib/constants";

const STATS = [
  { id: 0, label: "BUILDERS", initial: 1786 },
  { id: 1, label: "ACTIVE PROJECTS", initial: 127 },
  { id: 2, label: "STARTUPS FORMED", initial: 29 },
  { id: 3, label: "COUNTRIES CONNECTED", initial: 12 },
] as const;

const ACTIVITIES = [
  "+1 Builder joined",
  "Project shipped",
  "Founder matched",
  "New city connected",
] as const;

function StatRow({
  value,
  label,
  activity,
  isGlowing,
  reducedMotion,
}: {
  value: number;
  label: string;
  activity: string;
  isGlowing: boolean;
  reducedMotion: boolean;
}) {
  const [displayed, setDisplayed] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;

    if (reducedMotion) {
      setDisplayed(value);
      fromRef.current = value;
      return;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    let start: number | null = null;
    const duration = 700;

    const step = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setDisplayed(Math.round(from + (value - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, reducedMotion]);

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <motion.div
        style={{ flex: 1, minWidth: 0 }}
        animate={
          isGlowing && !reducedMotion
            ? { textShadow: `0 0 22px ${C.glow}` }
            : { textShadow: "0 0 0px #FF8A3D" }
        }
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <p
          aria-live="polite"
          aria-atomic="true"
          style={{
            ...DISPLAY,
            fontSize: "clamp(2rem, 3.8vw, 3.2rem)",
            color: C.orange,
            lineHeight: 1,
          }}
        >
          {displayed.toLocaleString()}
        </p>
        <p
          style={{
            ...SANS,
            fontSize: "0.68rem",
            letterSpacing: "0.14em",
            color: C.muted,
            marginTop: "0.35rem",
          }}
        >
          {label}
        </p>
      </motion.div>
      <motion.span
        initial={{ opacity: 0, x: 6 }}
        animate={
          isGlowing && !reducedMotion
            ? { opacity: 1, x: 0 }
            : { opacity: 0, x: 6 }
        }
        transition={{ duration: 0.35, ease: "easeOut" }}
        aria-hidden="true"
        style={{
          ...SANS,
          fontSize: "0.82rem",
          letterSpacing: "0.04em",
          color: "rgba(255,255,255,0.38)",
          whiteSpace: "nowrap",
          flexShrink: 0,
          paddingLeft: "0.75rem",
          textAlign: "right",
        }}
      >
        {activity}
      </motion.span>
    </div>
  );
}

export default function BuilderStats() {
  const [values, setValues] = useState<number[]>(() => STATS.map((s) => s.initial));
  const [glowing, setGlowing] = useState<number | null>(null);
  const [activeMinutes, setActiveMinutes] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inViewRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = 2000 + Math.random() * 2000;
    timerRef.current = setTimeout(() => {
      if (inViewRef.current) {
        const idx = Math.floor(Math.random() * STATS.length);
        const delta = Math.floor(Math.random() * 3) + 1;
        setValues((prev) => prev.map((v, i) => (i === idx ? v + delta : v)));
        setActiveMinutes(Math.floor(Math.random() * 15) + 1);
        setGlowing(idx);
        if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
        glowTimerRef.current = setTimeout(() => setGlowing(null), 1200);
      }
      scheduleNext();
    }, delay);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    if (el) observer.observe(el);
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
      if (el) observer.unobserve(el);
    };
  }, [scheduleNext]);

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}
    >
      <p
        style={{
          ...SANS,
          fontSize: "0.88rem",
          letterSpacing: "0.18em",
          color: `${C.orange}99`,
          textTransform: "uppercase",
        }}
      >
        Live Builder Network
      </p>
      {STATS.map((stat, i) => (
        <div key={stat.id}>
          {i > 0 && (
            <div
              style={{
                height: "1px",
                background: `${C.orange}28`,
                marginBottom: "1rem",
              }}
            />
          )}
          <StatRow
            value={values[i]}
            label={stat.label}
            activity={activeMinutes !== null ? `${ACTIVITIES[i]} · ${activeMinutes} min ago` : ACTIVITIES[i]}
            isGlowing={glowing === i}
            reducedMotion={reducedMotion}
          />
        </div>
      ))}
    </div>
  );
}

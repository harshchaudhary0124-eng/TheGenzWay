"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

// ─── Brand tokens ──────────────────────────────────────────────
const C = {
  orange: "#FF5B2E",
  glow: "#FF8A3D",
  red: "#C74343",
  cream: "#F5F2EB",
  muted: "#8C8C8C",
  bg: "#080808",
  bg2: "#111111",
};

// ─── Typography style objects ───────────────────────────────────
const DISPLAY: React.CSSProperties = { fontFamily: "'Anton', Impact, sans-serif" };
const SCRIPT: React.CSSProperties = { fontFamily: "'Caveat', cursive" };
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', system-ui, sans-serif" };

// ─── Shared hook ────────────────────────────────────────────────
function useReveal(opts?: { once?: boolean; amount?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref as React.RefObject<Element>, {
    once: opts?.once ?? true,
    amount: opts?.amount ?? 0.25,
  });
  return { ref, inView };
}

// ─── Animated counter ───────────────────────────────────────────
function Counter({
  target,
  suffix = "+",
  inView,
}: {
  target: number;
  suffix?: string;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2200;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <>
      {count}
      {suffix}
    </>
  );
}

// ─── Grain overlay ──────────────────────────────────────────────
function Grain() {
  return (
    <div
      className="fixed inset-0 pointer-events-none select-none"
      style={{
        zIndex: 9998,
        opacity: 0.038,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
      }}
    />
  );
}

// ─── Hand-drawn down arrow ──────────────────────────────────────
function DrawArrow({ color = C.orange }: { color?: string }) {
  const { ref, inView } = useReveal({ amount: 0.1 });
  return (
    <div ref={ref}>
      <svg
        viewBox="0 0 60 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: 44, height: 120 }}
      >
        <motion.path
          d="M 30 4 C 27 22 34 42 29 62 C 24 82 33 102 28 120 C 25 132 30 142 30 148"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />
        <motion.path
          d="M 19 136 L 30 150 L 41 136"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 1.4 }}
        />
      </svg>
    </div>
  );
}

// ─── Navigation ─────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(0px)",
          backgroundColor: scrolled ? "rgba(8,8,8,0.85)" : "transparent",
          borderBottom: scrolled ? "1px solid rgba(245,242,235,0.06)" : "none",
          ...SANS,
        }}
      >
        <div className="px-6 md:px-10 py-5 flex items-center justify-between">
          <span
            className="text-xs tracking-[0.22em] uppercase font-medium"
            style={{ color: C.cream }}
          >
            The GenZ Way
          </span>

          <div className="hidden md:flex items-center gap-8">
            {["About", "Builders", "Projects", "Community"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs tracking-wider uppercase transition-opacity duration-200 hover:opacity-100 opacity-60"
                style={{ color: C.cream }}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-xs px-5 py-2.5 font-semibold tracking-widest uppercase transition-all duration-300 hover:brightness-110"
              style={{ backgroundColor: C.orange, color: C.bg }}
            >
              ENTER →
            </a>
            <button
              className="md:hidden text-xl leading-none"
              style={{ color: C.cream }}
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {open && (
          <div
            className="md:hidden px-6 pb-6 flex flex-col gap-5"
            style={{ backgroundColor: C.bg2 }}
          >
            {["About", "Builders", "Projects", "Community"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm uppercase tracking-widest"
                style={{ color: C.muted, ...SANS }}
                onClick={() => setOpen(false)}
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}

// ─── Section 1: Hero ────────────────────────────────────────────
function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden"
      style={{ backgroundColor: C.bg }}
    >
      {/* Atmospheric glow layers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 90% 55% at 50% 75%, rgba(255,91,46,0.16) 0%, rgba(255,138,61,0.07) 45%, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 35% at 50% 95%, rgba(255,91,46,0.13) 0%, transparent 65%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 30% 20% at 20% 40%, rgba(199,67,67,0.06) 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10 w-full px-4 md:px-8 text-center">
        {/* Main wordmark */}
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: "110%", opacity: 0 }}
            animate={ready ? { y: "0%", opacity: 1 } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="leading-none w-full"
            style={{
              ...DISPLAY,
              fontSize: "clamp(3.2rem, 14.5vw, 15rem)",
              color: C.cream,
              textTransform: "uppercase",
              letterSpacing: "-0.015em",
            }}
          >
            THE GENZ WAY
          </motion.h1>
        </div>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={ready ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.5 }}
          className="my-6 mx-auto"
          style={{
            height: "1px",
            maxWidth: "340px",
            backgroundColor: `rgba(255,91,46,0.4)`,
            transformOrigin: "left",
          }}
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: "easeOut", delay: 0.65 }}
          className="text-lg md:text-2xl font-medium tracking-[0.14em] uppercase"
          style={{ color: C.orange, ...SANS }}
        >
          Build. Connect. Ship. Repeat.
        </motion.p>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-3 text-sm md:text-base max-w-sm mx-auto"
          style={{ color: C.muted, ...SANS }}
        >
          For people who would rather create than consume.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 1.15 }}
          className="mt-10 flex flex-wrap gap-4 justify-center items-center"
        >
          <a
            href="#"
            className="inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:gap-5"
            style={{
              backgroundColor: C.orange,
              color: C.bg,
              boxShadow: `0 0 48px rgba(255,91,46,0.35)`,
              ...SANS,
            }}
          >
            Join The Movement <span>→</span>
          </a>
          <a
            href="#"
            className="text-sm tracking-widest uppercase opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: C.cream, ...SANS }}
          >
            See Projects ↓
          </a>
        </motion.div>
      </div>

      {/* Down arrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <DrawArrow />
      </motion.div>
    </section>
  );
}

// ─── Section 2: Manifesto ───────────────────────────────────────
function Manifesto() {
  const { ref, inView } = useReveal({ amount: 0.25 });

  return (
    <section
      ref={ref}
      className="min-h-screen flex flex-col justify-center relative overflow-hidden"
      style={{ backgroundColor: C.bg }}
    >
      <div className="px-6 md:px-16 lg:px-24 max-w-screen-xl mx-auto w-full">
        <motion.div
          initial={{ filter: "blur(24px)", opacity: 0 }}
          animate={inView ? { filter: "blur(0px)", opacity: 1 } : {}}
          transition={{ duration: 1.3, ease: "easeOut" }}
        >
          <p
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(2.8rem, 10.5vw, 11.5rem)",
              color: C.cream,
            }}
          >
            MOST PEOPLE
          </p>
          <p
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(2.8rem, 10.5vw, 11.5rem)",
              color: C.cream,
            }}
          >
            SCROLL.
          </p>
        </motion.div>

        <motion.div
          initial={{ filter: "blur(24px)", opacity: 0 }}
          animate={inView ? { filter: "blur(0px)", opacity: 1 } : {}}
          transition={{ duration: 1.3, ease: "easeOut", delay: 0.55 }}
          className="mt-4 md:mt-6"
        >
          <p
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(2.8rem, 10.5vw, 11.5rem)",
              color: C.orange,
            }}
          >
            A FEW BUILD.
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="mt-14 md:mt-20 text-base md:text-xl max-w-xs"
          style={{ color: C.muted, ...SANS, lineHeight: 1.6 }}
        >
          We built this place for them.
        </motion.p>
      </div>

      <div className="flex justify-center mt-16">
        <DrawArrow />
      </div>
    </section>
  );
}

// ─── Section 3: The Problem ─────────────────────────────────────
function Problem() {
  const { ref, inView } = useReveal({ amount: 0.35 });

  return (
    <section
      ref={ref}
      className="min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 relative overflow-hidden"
      style={{ backgroundColor: C.bg2 }}
    >
      {/* Subtle glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 80% 50%, rgba(199,67,67,0.05) 0%, transparent 60%)`,
        }}
      />

      <div className="max-w-screen-xl mx-auto w-full relative z-10">
        <motion.p
          initial={{ opacity: 0, x: -30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-xs uppercase tracking-[0.25em] mb-10"
          style={{ color: C.orange, ...SANS }}
        >
          The Problem
        </motion.p>

        <div
          className="leading-tight uppercase"
          style={{
            ...DISPLAY,
            fontSize: "clamp(2.2rem, 7.5vw, 8.5rem)",
            color: C.cream,
          }}
        >
          <span>THE INTERNET MADE US </span>
          <motion.span
            style={{
              display: "inline-block",
              color: C.muted,
              filter: inView ? "blur(9px)" : "blur(0px)",
              transition: "filter 1.6s ease-in-out 0.2s",
            }}
          >
            CONNECTED.
          </motion.span>
        </div>

        <div
          className="mt-3 leading-tight uppercase"
          style={{
            ...DISPLAY,
            fontSize: "clamp(2.2rem, 7.5vw, 8.5rem)",
            color: C.cream,
          }}
        >
          <span>BUT NOT </span>
          <motion.span
            style={{
              display: "inline-block",
              color: C.orange,
              filter: inView ? "blur(0px)" : "blur(14px)",
              transition: "filter 1.6s ease-in-out 0.5s",
            }}
          >
            TOGETHER.
          </motion.span>
        </div>

        {/* Handwritten note */}
        <motion.div
          initial={{ opacity: 0, y: 20, rotate: -3 }}
          animate={inView ? { opacity: 1, y: 0, rotate: -3 } : {}}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="mt-12 md:mt-16 inline-block"
        >
          <p
            style={{
              ...SCRIPT,
              fontSize: "clamp(1.8rem, 4.5vw, 4rem)",
              color: C.cream,
              opacity: 0.9,
            }}
          >
            &ldquo;let&rsquo;s fix that.&rdquo;
          </p>
        </motion.div>
      </div>

      <div className="flex justify-start px-6 md:px-16 lg:px-24 mt-12">
        <DrawArrow />
      </div>
    </section>
  );
}

// ─── Section 4: Who Belongs Here ────────────────────────────────
const WHO_ROLES = [
  { label: "Developers", size: "clamp(2.2rem,6.5vw,7rem)", ml: "0%", mt: "0rem" },
  { label: "Designers", size: "clamp(1.5rem,3.8vw,4.2rem)", ml: "28%", mt: "0.5rem" },
  { label: "Founders", size: "clamp(2.6rem,7.8vw,8.5rem)", ml: "4%", mt: "0.5rem" },
  { label: "Creators", size: "clamp(1.4rem,3.4vw,3.8rem)", ml: "55%", mt: "0.5rem" },
  { label: "Hackers", size: "clamp(2rem,5.5vw,6rem)", ml: "62%", mt: "0.5rem" },
  { label: "Students", size: "clamp(1.5rem,3.8vw,4.2rem)", ml: "18%", mt: "0.5rem" },
  { label: "Dreamers", size: "clamp(2.2rem,6.2vw,6.8rem)", ml: "48%", mt: "0.5rem" },
  { label: "Makers", size: "clamp(1.8rem,4.8vw,5.2rem)", ml: "8%", mt: "0.5rem" },
  { label: "Indie Builders", size: "clamp(1.2rem,2.8vw,3.2rem)", ml: "42%", mt: "0.5rem" },
];

function WhoSection() {
  const { ref, inView } = useReveal({ amount: 0.15 });
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section
      className="py-24 md:py-40 px-6 md:px-16 lg:px-24 relative overflow-hidden"
      style={{ backgroundColor: C.bg, minHeight: "100vh" }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          width: "60vw",
          height: "60vh",
          background: `radial-gradient(ellipse, rgba(255,91,46,0.07) 0%, transparent 70%)`,
          top: "30%",
          left: "30%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div ref={ref} className="max-w-screen-xl mx-auto w-full relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-[0.25em] mb-12 md:mb-16"
          style={{ color: C.orange, ...SANS }}
        >
          Who belongs here
        </motion.p>

        {/* Desktop: editorial staggered layout */}
        <div className="hidden md:block">
          {WHO_ROLES.map((role, i) => (
            <motion.div
              key={role.label}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.65, delay: i * 0.07 }}
              className="leading-none uppercase cursor-default select-none transition-colors duration-300"
              style={{
                ...DISPLAY,
                fontSize: role.size,
                marginLeft: role.ml,
                marginTop: role.mt,
                color: hovered === role.label ? C.orange : C.cream,
                display: "block",
              }}
              onMouseEnter={() => setHovered(role.label)}
              onMouseLeave={() => setHovered(null)}
            >
              {role.label}
            </motion.div>
          ))}
        </div>

        {/* Mobile: stacked */}
        <div className="md:hidden flex flex-col gap-3">
          {WHO_ROLES.map((role, i) => (
            <motion.div
              key={role.label}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="leading-none uppercase"
              style={{
                ...DISPLAY,
                fontSize: "clamp(1.8rem, 8vw, 3.5rem)",
                color: C.cream,
              }}
            >
              {role.label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 5: How It Works ────────────────────────────────────
const STEPS = [
  {
    num: "01",
    label: "Find Builders",
    desc: "Discover people with complementary skills and shared ambitions who actually ship.",
  },
  {
    num: "02",
    label: "Share Ideas",
    desc: "Post your vision publicly. Get real feedback. Refine it with people who care.",
  },
  {
    num: "03",
    label: "Join Projects",
    desc: "Plug into live builds or start something new. No barriers. No gatekeeping.",
  },
  {
    num: "04",
    label: "Build Together",
    desc: "Commit, collaborate, and create with people who turn ideas into products.",
  },
  {
    num: "05",
    label: "Launch",
    desc: "Get your work in front of real users within a community built for builders.",
  },
  {
    num: "06",
    label: "Repeat",
    desc: "Every launch is a new beginning. Keep building. Keep shipping. Keep growing.",
  },
];

function HowItWorks() {
  const { ref, inView } = useReveal({ amount: 0.08 });

  return (
    <section
      ref={ref}
      className="px-6 md:px-16 lg:px-24 py-24 md:py-40 relative overflow-hidden"
      style={{ backgroundColor: C.bg2 }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="leading-none uppercase mb-20 md:mb-32"
          style={{
            ...DISPLAY,
            fontSize: "clamp(2rem, 6.5vw, 7rem)",
            color: C.cream,
          }}
        >
          BUILD WITH PEOPLE.{" "}
          <br />
          <span style={{ color: C.orange }}>NOT ALGORITHMS.</span>
        </motion.h2>

        <div className="relative pl-10 md:pl-16">
          {/* Vertical timeline line */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-px"
            style={{ backgroundColor: `rgba(255,91,46,0.18)`, transformOrigin: "top" }}
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
          />

          <div className="flex flex-col gap-16 md:gap-20">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -28 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.13 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div
                  className="absolute -left-10 md:-left-16 top-2 w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: C.orange,
                    boxShadow: `0 0 14px ${C.glow}, 0 0 28px rgba(255,91,46,0.3)`,
                  }}
                />

                <p
                  className="text-xs tracking-[0.25em] uppercase mb-2"
                  style={{ color: C.orange, ...SANS }}
                >
                  {step.num}
                </p>
                <h3
                  className="leading-none uppercase mb-3"
                  style={{
                    ...DISPLAY,
                    fontSize: "clamp(1.8rem, 4.2vw, 4.5rem)",
                    color: C.cream,
                  }}
                >
                  {step.label}
                </h3>
                <p
                  className="text-sm md:text-base leading-relaxed max-w-sm"
                  style={{ color: C.muted, ...SANS }}
                >
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 6: Network Effect ──────────────────────────────────
function NetworkEffect() {
  const { ref, inView } = useReveal({ amount: 0.3 });
  const lines = ["YOUR NEXT COFOUNDER", "MIGHT BE", "ONE SCROLL AWAY."];

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-6"
      style={{ backgroundColor: C.bg }}
    >
      {/* Pulsing glow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: "75vw",
          height: "75vh",
          background: `radial-gradient(ellipse, rgba(255,91,46,0.17) 0%, rgba(255,138,61,0.07) 50%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 text-center">
        {lines.map((line, i) => (
          <motion.p
            key={line}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: i * 0.22 }}
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize:
                i === 1
                  ? "clamp(1.6rem, 5vw, 5.5rem)"
                  : "clamp(2rem, 8.5vw, 9.5rem)",
              color: i === 1 ? C.muted : C.cream,
            }}
          >
            {line}
          </motion.p>
        ))}
      </div>
    </section>
  );
}

// ─── Section 7: Projects ────────────────────────────────────────
const PROJECTS = [
  {
    name: "AI Study Partner",
    status: "Active",
    builders: 4,
    category: "EdTech",
    stage: "Beta",
    desc: "AI-powered learning companion that adapts to your study style and knowledge gaps.",
  },
  {
    name: "Student Startup Network",
    status: "Growing",
    builders: 12,
    category: "Community",
    stage: "Live",
    desc: "Connecting student founders across 50+ universities worldwide.",
  },
  {
    name: "Creator Analytics Tool",
    status: "Active",
    builders: 3,
    category: "Creator Tools",
    stage: "Alpha",
    desc: "Deep insights and analytics built specifically for independent content creators.",
  },
  {
    name: "Local Community App",
    status: "Seeking",
    builders: 2,
    category: "Civic Tech",
    stage: "Ideation",
    desc: "Hyperlocal platform reconnecting neighbors with their communities.",
  },
  {
    name: "Open Source Productivity",
    status: "Open",
    builders: 8,
    category: "Dev Tools",
    stage: "Beta",
    desc: "A fully open productivity suite built by developers, for developers.",
  },
];

function Projects() {
  const { ref, inView } = useReveal({ amount: 0.08 });

  const statusColor = (s: string) => {
    if (s === "Active" || s === "Live" || s === "Growing") return C.orange;
    if (s === "Open") return C.glow;
    return C.muted;
  };

  return (
    <section
      ref={ref}
      className="px-6 md:px-16 lg:px-24 py-24 md:py-32"
      style={{ backgroundColor: C.bg2 }}
    >
      <div className="max-w-screen-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex flex-wrap items-end justify-between gap-4 mb-12 md:mb-16"
        >
          <h2
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(2rem, 5.5vw, 5.5rem)",
              color: C.cream,
            }}
          >
            LIVE PROJECTS
          </h2>
          <a
            href="#"
            className="text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
            style={{ color: C.muted, ...SANS }}
          >
            Browse all →
          </a>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px">
          {PROJECTS.map((proj, i) => (
            <motion.div
              key={proj.name}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: i * 0.09 }}
              className="group p-7 md:p-8 cursor-pointer transition-colors duration-300"
              style={{
                backgroundColor: "rgba(255,255,255,0.018)",
                border: "1px solid rgba(245,242,235,0.06)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  "rgba(255,91,46,0.035)";
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "rgba(255,91,46,0.18)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  "rgba(255,255,255,0.018)";
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "rgba(245,242,235,0.06)";
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <span
                  className="text-xs uppercase tracking-widest px-2.5 py-1"
                  style={{
                    color: statusColor(proj.status),
                    border: `1px solid ${statusColor(proj.status)}38`,
                    ...SANS,
                  }}
                >
                  {proj.status}
                </span>
                <span className="text-xs" style={{ color: C.muted, ...SANS }}>
                  {proj.builders} builders
                </span>
              </div>

              <h3
                className="leading-tight uppercase mb-3"
                style={{
                  ...DISPLAY,
                  fontSize: "clamp(1.2rem, 2.4vw, 1.75rem)",
                  color: C.cream,
                }}
              >
                {proj.name}
              </h3>

              <p
                className="text-sm leading-relaxed mb-5"
                style={{ color: C.muted, ...SANS }}
              >
                {proj.desc}
              </p>

              <div
                className="flex items-center gap-3 text-xs"
                style={{ color: C.muted, ...SANS }}
              >
                <span>{proj.category}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ color: C.orange }}>{proj.stage}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 8: Stats ───────────────────────────────────────────
const STATS = [
  { num: 500, suffix: "+", label: "Builders" },
  { num: 150, suffix: "+", label: "Projects" },
  { num: 50, suffix: "+", label: "Collaborations" },
  { num: 20, suffix: "+", label: "Countries" },
];

function Stats() {
  const { ref, inView } = useReveal({ amount: 0.3 });

  return (
    <section
      ref={ref}
      className="py-24 md:py-40 px-6 md:px-16 lg:px-24 relative overflow-hidden"
      style={{ backgroundColor: C.bg }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,91,46,0.07) 0%, transparent 65%)`,
        }}
      />

      <div className="max-w-screen-xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.75, delay: i * 0.12 }}
              className="text-center"
            >
              <div
                className="leading-none block mb-3"
                style={{
                  ...DISPLAY,
                  fontSize: "clamp(3.5rem, 11vw, 10rem)",
                  color: C.cream,
                }}
              >
                <Counter target={s.num} suffix={s.suffix} inView={inView} />
              </div>
              <p
                className="text-xs uppercase tracking-[0.22em]"
                style={{ color: C.muted, ...SANS }}
              >
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 9: Experimental Typography ─────────────────────────
function ExperimentalType() {
  const { ref, inView } = useReveal({ amount: 0.4 });

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center px-6 md:px-16 lg:px-24 relative overflow-hidden"
      style={{ backgroundColor: C.bg2 }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 40% at 20% 60%, rgba(255,91,46,0.05) 0%, transparent 60%)`,
        }}
      />

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

        <div
          className="mt-6 md:mt-10 self-end text-right ml-auto"
          style={{ maxWidth: "70%" }}
        >
          <motion.p
            className="leading-none uppercase block"
            style={{
              ...DISPLAY,
              fontSize: "clamp(2rem, 7vw, 7.5rem)",
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
              fontSize: "clamp(2.5rem, 8.5vw, 9rem)",
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

// ─── Section 10: Testimonials ───────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "I joined to network. Ended up building my first startup.",
    name: "Maya K.",
    role: "Founder, 22",
  },
  {
    quote: "Found my cofounder here. We launched three months later.",
    name: "James L.",
    role: "Developer, 21",
  },
  {
    quote: "The most productive corner of the internet.",
    name: "Priya S.",
    role: "Designer, 23",
  },
  {
    quote: "Everyone talks about building. People here actually build.",
    name: "Carlos M.",
    role: "Indie Hacker, 24",
  },
];

function Testimonials() {
  const { ref, inView } = useReveal({ amount: 0.1 });

  return (
    <section
      ref={ref}
      className="px-6 md:px-16 lg:px-24 py-24 md:py-32"
      style={{ backgroundColor: C.bg }}
    >
      <div className="max-w-screen-xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-xs uppercase tracking-[0.25em] mb-12 md:mb-16"
          style={{ color: C.orange, ...SANS }}
        >
          From the community
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.75, delay: i * 0.13 }}
              className={i % 2 === 1 ? "md:mt-16" : ""}
            >
              {/* Large quote mark */}
              <span
                className="block leading-none mb-4"
                style={{
                  ...DISPLAY,
                  fontSize: "5rem",
                  color: C.orange,
                  opacity: 0.7,
                  lineHeight: 0.7,
                }}
              >
                &ldquo;
              </span>

              <p
                className="text-xl md:text-2xl leading-snug mb-7"
                style={{ color: C.cream, ...SANS, fontWeight: 300 }}
              >
                {t.quote}
              </p>

              <div className="flex items-center gap-4">
                <div className="w-8 h-px" style={{ backgroundColor: C.orange }} />
                <p
                  className="text-xs tracking-widest uppercase"
                  style={{ color: C.muted, ...SANS }}
                >
                  {t.name} · {t.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 11: CTA ────────────────────────────────────────────
function CTASection() {
  const { ref, inView } = useReveal({ amount: 0.25 });

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 md:px-12"
      style={{ backgroundColor: C.bg }}
    >
      {/* Pulsing glow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: "85vw",
          height: "85vh",
          background: `radial-gradient(ellipse, rgba(255,91,46,0.19) 0%, rgba(199,67,67,0.09) 45%, transparent 68%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 text-center w-full max-w-screen-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(3rem, 15vw, 17rem)",
              color: C.cream,
              letterSpacing: "-0.01em",
            }}
          >
            IF NOT NOW
          </p>
        </motion.div>

        <div className="relative inline-block w-full">
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(3rem, 15vw, 17rem)",
              color: C.orange,
              letterSpacing: "-0.01em",
            }}
          >
            THEN WHEN?
          </motion.p>

          {/* Handwritten overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
            animate={inView ? { opacity: 1, scale: 1, rotate: -4 } : {}}
            transition={{ duration: 0.85, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="absolute pointer-events-none"
            style={{
              top: "15%",
              left: "20%",
              transform: "rotate(-4deg)",
            }}
          >
            <p
              style={{
                ...SCRIPT,
                fontSize: "clamp(2rem, 7.5vw, 8rem)",
                color: C.cream,
                whiteSpace: "nowrap",
                textShadow: `0 0 60px rgba(255,91,46,0.5), 0 0 120px rgba(255,91,46,0.2)`,
              }}
            >
              start building.
            </p>
          </motion.div>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 1.3 }}
          className="mt-16 md:mt-20 flex flex-col items-center gap-5"
        >
          <a
            href="#"
            className="inline-flex items-center gap-4 px-10 py-5 text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:brightness-110 hover:gap-6"
            style={{
              backgroundColor: C.orange,
              color: C.bg,
              boxShadow: `0 0 60px rgba(255,91,46,0.45), 0 0 120px rgba(255,91,46,0.15)`,
              ...SANS,
            }}
          >
            ENTER THE GENZ WAY <span>→</span>
          </a>
          <p className="text-sm" style={{ color: C.muted, ...SANS }}>
            Join builders creating the future together.
          </p>
        </motion.div>
      </div>

      {/* Arrow terminus */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 0.35 } : {}}
        transition={{ delay: 1.8 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <svg viewBox="0 0 60 28" fill="none" style={{ width: 40 }}>
          <path
            d="M 8 4 L 30 22 L 52 4"
            stroke={C.orange}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      className="px-6 md:px-16 lg:px-24 py-16 md:py-20"
      style={{
        backgroundColor: C.bg,
        borderTop: "1px solid rgba(245,242,235,0.06)",
        ...SANS,
      }}
    >
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-12 md:gap-8">
          <div>
            <p
              className="uppercase leading-none mb-2"
              style={{
                ...DISPLAY,
                fontSize: "clamp(1.5rem, 3.5vw, 3rem)",
                color: C.cream,
              }}
            >
              THE GENZ WAY
            </p>
            <p className="text-sm" style={{ color: C.muted }}>
              Build. Connect. Ship. Repeat.
            </p>
          </div>

          <div className="flex gap-12 md:gap-16">
            <div className="flex flex-col gap-3">
              {["About", "Projects", "Community", "Contact"].map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
                  style={{ color: C.muted }}
                >
                  {l}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {["X (Twitter)", "LinkedIn", "Discord", "GitHub"].map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
                  style={{ color: C.muted }}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(245,242,235,0.05)" }}
        >
          <p className="text-xs" style={{ color: C.muted, opacity: 0.45 }}>
            © 2024 The GenZ Way. Built by builders, for builders.
          </p>
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: C.muted, opacity: 0.35 }}
          >
            A movement. Not a product.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Root ────────────────────────────────────────────────────────
export default function Page() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    document.documentElement.style.scrollbarWidth = "none";
  }, []);

  return (
    <div
      style={{
        backgroundColor: C.bg,
        color: C.cream,
        overflowX: "hidden",
        ...SANS,
      }}
    >
      <Grain />
      <Nav />
      <Hero />
      <Manifesto />
      <Problem />
      <WhoSection />
      <HowItWorks />
      <NetworkEffect />
      <Projects />
      <Stats />
      <ExperimentalType />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { C, DISPLAY, SANS } from "@/lib/constants";
import BuilderConstellation from "@/components/ui/BuilderConstellation";

export default function Hero() {
  const [ready, setReady] = useState(false);
  const [arrowPath, setArrowPath] = useState<{ d: string; head: string } | null>(null);
  const [constellationHeight, setConstellationHeight] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const ctaRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;

    function calcArrow() {
      if (window.innerWidth < 768) {
        setArrowPath(null);
        return;
      }
      const section = sectionRef.current;
      const cta = ctaRef.current;
      if (!section || !cta) return;

      const sr = section.getBoundingClientRect();
      const cr = cta.getBoundingClientRect();

      // Start: exact center of CTA button bottom edge, relative to section
      const x1 = cr.left - sr.left + cr.width / 2;
      const y1 = cr.bottom - sr.top;

      // End: center of gap between MOST and PEOPLE, relative to section
      const mpEl = document.getElementById("most-people-heading");
      let x2 = x1 + 200;
      let y2 = sr.height - 20;

      if (mpEl) {
        const mr = mpEl.getBoundingClientRect();
        try {
          const range = document.createRange();
          const textNode = mpEl.firstChild;
          if (textNode) {
            range.setStart(textNode, 0);
            range.setEnd(textNode, 4); // selects "MOST"
            const mostRect = range.getBoundingClientRect();
            x2 = mostRect.right - sr.left + 5;
          } else {
            x2 = mr.left - sr.left + mr.width * 0.43;
          }
        } catch {
          x2 = mr.left - sr.left + mr.width * 0.43;
        }
        y2 = mr.top - sr.top - 18;
      }

      // Cubic bezier: down from CTA, sweep right, arrive at MOST|PEOPLE gap from above
      const cp1x = x1 + 10;
      const cp1y = y1 + (y2 - y1) * 0.3;
      const cp2x = x2 + 130;
      const cp2y = y1 + (y2 - y1) * 0.72;

      const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;

      // Arrowhead angle from last control point to endpoint
      const angle = Math.atan2(y2 - cp2y, x2 - cp2x);
      const len = 13;
      const spread = Math.PI / 5;
      const ax1 = x2 - len * Math.cos(angle - spread);
      const ay1 = y2 - len * Math.sin(angle - spread);
      const ax2 = x2 - len * Math.cos(angle + spread);
      const ay2 = y2 - len * Math.sin(angle + spread);
      const head = `M ${ax1.toFixed(1)} ${ay1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} L ${ax2.toFixed(1)} ${ay2.toFixed(1)}`;

      setArrowPath({ d, head });
    }

    // Delay until CTA animation settles (delay: 1.1s + duration: 0.65s)
    const t = setTimeout(calcArrow, 1800);
    window.addEventListener("resize", calcArrow);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", calcArrow);
    };
  }, [ready]);

  // Clamp constellation height to the bottom of the CTA button row.
  // Runs immediately when ready — no timeout, so height is never null when the
  // constellation first renders and the calc(100% - 80px) fallback is never hit.
  useEffect(() => {
    if (!ready) return;
    function calcConstellHeight() {
      const section = sectionRef.current;
      const row = ctaRowRef.current;
      if (!section || !row) return;
      const sr = section.getBoundingClientRect();
      const rr = row.getBoundingClientRect();
      // constellation top is 80px below section top; end at button row bottom
      const h = rr.bottom - sr.top - 80;
      if (h > 0) setConstellationHeight(h);
    }
    calcConstellHeight();
    window.addEventListener("resize", calcConstellHeight);
    return () => window.removeEventListener("resize", calcConstellHeight);
  }, [ready]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-center items-start"
      style={{ zIndex: 0, overflow: "hidden" }}
    >
      {ready && constellationHeight != null && (
        <BuilderConstellation height={constellationHeight} />
      )}
      <div
        className="relative z-10 w-full px-6 md:px-16 lg:px-24"
        style={{ marginTop: "-6vh" }}
      >
        <div className="w-full md:max-w-[52%]">
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: "110%", opacity: 0 }}
              animate={ready ? { y: "0%", opacity: 1 } : {}}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="leading-none uppercase"
              style={{
                ...DISPLAY,
                fontSize: "clamp(3.2rem, 7.5vw, 10rem)",
                color: C.cream,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
              }}
            >
              For people who
              <br />
              refuse average.
            </motion.h1>
          </div>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={ready ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.5 }}
            className="my-7"
            style={{
              height: "1px",
              maxWidth: "280px",
              backgroundColor: `rgba(255,91,46,0.4)`,
              transformOrigin: "left",
            }}
          />

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, ease: "easeOut", delay: 0.65 }}
            className="text-base md:text-xl font-medium tracking-[0.18em] uppercase"
            style={{ color: C.orange, ...SANS }}
          >
            Build. Connect. Ship. Repeat.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-5 flex flex-col gap-2"
            style={{ color: C.muted, ...SANS }}
          >
            <p className="text-sm md:text-base">Find ambitious people.</p>
            <p className="text-sm md:text-base">Build meaningful things.</p>
            <p className="text-sm md:text-base">Leave your mark.</p>
          </motion.div>

          <motion.div
            ref={ctaRowRef}
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 1.1 }}
            className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
          >
            <a
              ref={ctaRef}
              href="#manifesto"
              onClick={(e) => {
                e.preventDefault();
                window.scrollBy({ top: 400, behavior: "smooth" });
              }}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:gap-5"
              style={{
                backgroundColor: C.orange,
                color: C.bg,
                boxShadow: `0 0 48px rgba(255,91,46,0.35)`,
                ...SANS,
              }}
            >
              Explore Builders <span>→</span>
            </a>
            <Link
              href="/join"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:gap-5"
              style={{
                backgroundColor: "transparent",
                color: C.cream,
                border: `3px solid rgba(255,91,46,0.45)`,
                ...SANS,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.color = C.orange;
                (e.currentTarget as HTMLAnchorElement).style.borderColor = `rgba(255,91,46,0.45)`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.color = C.cream;
                (e.currentTarget as HTMLAnchorElement).style.borderColor = `rgba(255,91,46,0.45)`;
              }}
            >
              Join The Movement <span>→</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {arrowPath && (
        <motion.svg
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 5,
            width: "100%",
            height: "100%",
            overflow: "visible",
            filter: `drop-shadow(0 0 7px ${C.orange}55)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={arrowPath.d}
            stroke={C.orange}
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={arrowPath.head}
            stroke={C.orange}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.svg>
      )}
    </section>
  );
}

"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { useReveal } from "@/hooks/useReveal";
import { C, DISPLAY } from "@/lib/constants";

/* ─── Image panel ─────────────────────────────────────────── */

const OpImage = React.forwardRef<HTMLDivElement, { inView: boolean }>(
  function OpImage({ inView }, ref) {
    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          width: "clamp(300px, 40vw, 620px)",
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(24px)",
          transition:
            "opacity 1.4s ease-out 0.5s, transform 1.4s ease-out 0.5s",
        }}
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "-60px",
            background:
              "radial-gradient(ellipse 80% 70% at 50% 55%, rgba(255,91,46,0.20) 0%, rgba(255,138,61,0.07) 50%, transparent 75%)",
            filter: "blur(52px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Frame */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            borderRadius: "3px",
            overflow: "hidden",
            border: "1px solid rgba(255,91,46,0.22)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.55), 0 0 60px rgba(255,91,46,0.10)",
          }}
        >
          <Image
            src="/op1.jpg"
            alt=""
            width={620}
            height={800}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 40%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Bottom reflection */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "-32px",
            left: "8%",
            right: "8%",
            height: "32px",
            background:
              "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255,91,46,0.10) 0%, transparent 100%)",
            filter: "blur(8px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      </div>
    );
  }
);

/* ─── Main section ────────────────────────────────────────── */

export default function ExperimentalType() {
  const { ref: revealRef, inView } = useReveal({ amount: 0.4 });
  const sectionRef = useRef<HTMLElement>(null);
  const peopleRef = useRef<HTMLSpanElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [arrow, setArrow] = useState<{ d: string; head: string } | null>(null);

  // Attach both the IntersectionObserver ref and our measurement ref to the section
  const setSectionRef = useCallback(
    (el: HTMLElement | null) => {
      (sectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
      (revealRef as React.MutableRefObject<HTMLElement | null>).current = el;
    },
    [revealRef]
  );

  useEffect(() => {
    if (!inView) return;

    function calcArrow() {
      const section = sectionRef.current;
      const people = peopleRef.current;
      const image = imageRef.current;
      if (!section || !people || !image) return;

      const sr = section.getBoundingClientRect();
      const pr = people.getBoundingClientRect();
      const ir = image.getBoundingClientRect();

      // Start — lower-right of "PEOPLE." span
      const x1 = pr.right - sr.left + 6;
const y1 = pr.top - sr.top + pr.height * 0.58;

const x2 = ir.left - sr.left + ir.width * 0.31;
const y2 = ir.top - sr.top + ir.height * 0.49;

const cp1x = x1 + 145;
const cp1y = y1 + 165;

const cp2x = x2 - 190;
const cp2y = y2 - 22;

      const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

      // Arrowhead — angle from last CP → endpoint
      const angle = Math.atan2(y2 - cp2y, x2 - cp2x);
      const len = 24;
const spread = Math.PI / 4.8;
      const ax1 = x2 - len * Math.cos(angle - spread);
      const ay1 = y2 - len * Math.sin(angle - spread);
      const ax2 = x2 - len * Math.cos(angle + spread);
      const ay2 = y2 - len * Math.sin(angle + spread);
      const head = `M ${ax1.toFixed(1)} ${ay1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} L ${ax2.toFixed(1)} ${ay2.toFixed(1)}`;

      setArrow({ d, head });
    }

    // Fire after all section animations (blur + opacity) have settled
    const t = setTimeout(calcArrow, 1900);
    window.addEventListener("resize", calcArrow);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", calcArrow);
    };
  }, [inView]);

  return (
    <section
      ref={setSectionRef}
      className="min-h-screen flex items-center px-6 md:px-16 lg:px-24 relative overflow-hidden"
    >
      {/* Image — right, desktop only */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block pr-12 xl:pr-20">
        <OpImage inView={inView} ref={imageRef} />
      </div>

      {/* Arrow overlay — desktop only */}
      {arrow && (
        <svg
          className="absolute inset-0 pointer-events-none hidden lg:block"
          style={{ zIndex: 20, width: "100%", height: "100%", overflow: "visible" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            d={arrow.d}
            stroke="white"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.88 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
          <motion.path
            d={arrow.head}
            stroke="white"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.88 }}
            transition={{ duration: 0.25, delay: 1.05 }}
          />
        </svg>
      )}

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
              transition:
                "filter 1.3s ease-out 1.2s, opacity 0.9s ease-out 1.1s",
            }}
          >
            <span ref={peopleRef}>PEOPLE.</span>
          </motion.p>
        </div>
      </div>
    </section>
  );
}

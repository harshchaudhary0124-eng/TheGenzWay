"use client";

import { motion } from "motion/react";
import { useReveal } from "@/hooks/useReveal";
import DrawArrow from "@/components/ui/DrawArrow";
import { C, DISPLAY, SCRIPT, SANS } from "@/lib/constants";

export default function Problem() {
  const { ref, inView } = useReveal({ amount: 0.35 });

  return (
    <section
      ref={ref}
      className="min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 relative overflow-hidden"
    >
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

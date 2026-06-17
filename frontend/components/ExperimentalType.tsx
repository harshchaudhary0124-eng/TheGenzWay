"use client";

import { motion } from "motion/react";
import { useReveal } from "@/hooks/useReveal";
import { C, DISPLAY } from "@/lib/constants";

export default function ExperimentalType() {
  const { ref, inView } = useReveal({ amount: 0.4 });

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center px-6 md:px-16 lg:px-24 relative overflow-hidden"
    >
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

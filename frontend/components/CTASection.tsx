"use client";

import { motion } from "motion/react";
import { useReveal } from "@/hooks/useReveal";
import { C, DISPLAY, SCRIPT, SANS } from "@/lib/constants";

export default function CTASection() {
  const { ref, inView } = useReveal({ amount: 0.25 });

  return (
    <section
      ref={ref}
      className="relative flex-1 flex flex-col items-center justify-center px-6 md:px-12"
    >
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: "85vw",
          height: "85vh",
          background: `radial-gradient(ellipse, rgba(255,91,46,0.10) 0%, rgba(199,67,67,0.05) 45%, transparent 68%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        animate={{ opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 text-center w-full max-w-screen-xl mx-auto mt-24 md:mt-32">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(3rem, 15vw, calc(17rem - 5px))",
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

    </section>
  );
}

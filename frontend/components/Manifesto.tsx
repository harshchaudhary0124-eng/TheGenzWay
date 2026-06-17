"use client";

import { motion } from "motion/react";
import { useReveal } from "@/hooks/useReveal";
import DrawArrow from "@/components/ui/DrawArrow";
import { C, DISPLAY, SANS } from "@/lib/constants";

export default function Manifesto() {
  const { ref, inView } = useReveal({ amount: 0.25 });

  return (
    <section
      ref={ref}
      className="min-h-screen flex flex-col justify-start relative overflow-hidden"
      style={{ marginTop: "-3vw", paddingTop: "1vw" }}
    >
      <div className="px-6 md:px-16 lg:px-24 max-w-screen-xl mx-auto w-full">
        <div>
          <p
            id="most-people-heading"
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
        </div>

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

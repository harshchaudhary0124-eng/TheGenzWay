
"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useReveal } from "@/hooks/useReveal";
import { C, DISPLAY, SANS } from "@/lib/constants";

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

export default function WhoSection() {
  const { ref, inView } = useReveal({ amount: 0.15 });
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section
      className="pt-2 pb-24 md:pt-6 md:pb-40 px-6 md:px-16 lg:px-24 relative overflow-hidden"
      style={{ minHeight: "100vh" }}
    >
      <div ref={ref} className="max-w-screen-xl mx-auto w-full relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="uppercase tracking-[0.25em] mb-12 md:mb-16"
          style={{ color: C.orange, ...SANS, fontSize: "20px" }}
        >
          Who belongs here
        </motion.p>

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

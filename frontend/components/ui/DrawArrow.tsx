"use client";

import { motion } from "motion/react";
import { useReveal } from "@/hooks/useReveal";
import { C } from "@/lib/constants";

export default function DrawArrow({ color = C.orange }: { color?: string }) {
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

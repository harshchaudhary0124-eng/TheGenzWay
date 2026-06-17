"use client";

import { motion } from "motion/react";
import { useReveal } from "@/hooks/useReveal";
import { C, DISPLAY, SANS } from "@/lib/constants";

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

export default function Testimonials() {
  const { ref, inView } = useReveal({ amount: 0.1 });

  return (
    <section ref={ref} className="px-6 md:px-16 lg:px-24 py-24 md:py-32">
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

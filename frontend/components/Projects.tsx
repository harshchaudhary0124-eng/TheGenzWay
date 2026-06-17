"use client";

import { motion } from "motion/react";
import { useReveal } from "@/hooks/useReveal";
import { C, DISPLAY, SANS } from "@/lib/constants";

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

function statusColor(s: string) {
  if (s === "Active" || s === "Live" || s === "Growing") return C.orange;
  if (s === "Open") return C.glow;
  return C.muted;
}

export default function Projects() {
  const { ref, inView } = useReveal({ amount: 0.08 });

  return (
    <section ref={ref} className="px-6 md:px-16 lg:px-24 py-24 md:py-32">
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

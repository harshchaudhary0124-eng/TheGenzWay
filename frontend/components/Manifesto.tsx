"use client";

import { motion } from "motion/react";
import { useReveal } from "@/hooks/useReveal";
import BuilderStats from "@/components/BuilderStats";
import { C, DISPLAY, SCRIPT } from "@/lib/constants";

export default function Manifesto() {
  const { ref, inView } = useReveal({ amount: 0.25 });

  return (
    <section
      ref={ref}
      className="flex flex-col justify-start relative overflow-hidden"
      style={{ marginTop: "-3vw", paddingTop: "1vw", minHeight: "84vh", paddingBottom: "5vh" }}
    >
      {/* relative so the absolutely-positioned stats panel has an anchor */}
      <div className="px-6 md:px-16 lg:px-24 max-w-screen-xl mx-auto w-full relative">

        {/* Manifesto headings — left-aligned, full width, unaffected by stats */}
        <div>
          <p
            id="most-people-heading"
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(2.8rem, 9vw, 10rem)",
              color: C.cream,
            }}
          >
            MOST PEOPLE
          </p>
          <p
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(2.8rem, 9vw, 10rem)",
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
              fontSize: "clamp(2.8rem, 9vw, 10rem)",
              color: C.orange,
            }}
          >
            A FEW BUILD.
          </p>
        </motion.div>

        <p
          style={{
            ...SCRIPT,
            fontSize: "clamp(1.9rem, 3vw, 2.6rem)",
            fontWeight: 700,
            color: C.cream,
            lineHeight: 1.3,
            marginTop: "calc(1.25rem + 38px)",
            marginLeft: "calc(2rem + 241px)",
            textShadow: `0 0 32px rgba(248, 247, 247, 0.8)`,
          }}
        >
          So we built this place for them.
        </p>

        {/*
          Stats panel: absolutely positioned at the far-right of the content area.
          Absolute placement keeps it out of the heading flow, preserving the full
          heading width and creating the breathing space between the two blocks.
          Plain div — no opacity animation, always visible.

          Desktop (lg+): absolute, anchored to top-right of the content div.
          Mobile/tablet:  normal flow, spaced below the text.
        */}
        <div
          className="
            mt-16
            lg:mt-0
            lg:absolute lg:top-0 lg:right-0
            lg:w-72 xl:w-80
          "
        >
          <BuilderStats />
        </div>

      </div>

    </section>
  );
}

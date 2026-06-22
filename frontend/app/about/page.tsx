"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";
import { C, DISPLAY, SCRIPT, SANS } from "@/lib/constants";
import Background from "@/components/ui/Background";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const ACTIONS = [
  { verb: "Connect", desc: "Find people who get it — obsessed with building, not just talking about it." },
  { verb: "Discuss", desc: "Real conversations on tech, design, startups, and ideas worth having." },
  { verb: "Collaborate", desc: "Jump into projects, find co-founders, or ship something side by side." },
  { verb: "Build", desc: "Bring ideas to life with people who push you further than you'd go alone." },
];

const ETHOS = [
  { text: "Build with people who refuse to settle.", highlight: false },
  { text: "Ship before you're ready.", highlight: false },
  { text: "Make the thing. The rest follows.", highlight: true },
];

export default function AboutPage() {
  const heroReveal   = useReveal({ amount: 0.1 });
  const whatReveal   = useReveal({ amount: 0.2 });
  const whoReveal    = useReveal({ amount: 0.2 });
  const whyReveal    = useReveal({ amount: 0.25 });
  const doReveal     = useReveal({ amount: 0.2 });
  const ethosReveal  = useReveal({ amount: 0.25 });
  const contactReveal = useReveal({ amount: 0.25 });

  return (
    <div style={{ color: C.cream, ...SANS }}>
      <Background />
      <Nav />

      {/* ── Hero ── */}
      <section
        ref={heroReveal.ref}
        className="relative min-h-[72vh] flex flex-col justify-center px-6 md:px-16 lg:px-24"
        style={{ paddingTop: "16vh", paddingBottom: "8vh" }}
      >
        <motion.div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "-10%", left: "-8%",
            width: "65vw", height: "65vw",
            background: `radial-gradient(ellipse, rgba(255,91,46,0.08) 0%, transparent 68%)`,
            filter: "blur(60px)",
            zIndex: 0,
          }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 max-w-screen-xl mx-auto w-full">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={heroReveal.inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="uppercase tracking-[0.3em] mb-6 text-xs"
            style={{ color: C.orange, ...SANS }}
          >
            About The GenZ Way
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={heroReveal.inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="leading-none uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(3rem, 8.5vw, 9.5rem)",
              color: C.cream,
              letterSpacing: "-0.02em",
            }}
          >
            Big ideas need
            <br />
            <span style={{ color: C.orange }}>the right people.</span>
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={heroReveal.inView ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.55 }}
            className="my-7"
            style={{
              height: "1px",
              maxWidth: "260px",
              backgroundColor: `rgba(255,91,46,0.4)`,
              transformOrigin: "left",
            }}
          />

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={heroReveal.inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-base md:text-lg max-w-xl leading-relaxed"
            style={{ color: C.muted }}
          >
            The GenZ Way is where builders actually show up — to think, make, and ship things that matter.
          </motion.p>
        </div>
      </section>

      {/* ── What it is + Who it's for ── */}
      <section
        ref={whatReveal.ref}
        className="relative px-6 md:px-16 lg:px-24 py-20 md:py-28"
      >
        <div className="max-w-screen-xl mx-auto w-full">
          <motion.p
            initial={{ opacity: 0, x: -12 }}
            animate={whatReveal.inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="uppercase tracking-[0.25em] mb-10 text-xs"
            style={{ color: C.orange, ...SANS }}
          >
            What this is
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-start">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={whatReveal.inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              <p
                className="leading-none uppercase"
                style={{
                  ...DISPLAY,
                  fontSize: "clamp(2rem, 5vw, 5.5rem)",
                  color: C.cream,
                }}
              >
                A place for people
                <br />
                <span style={{ color: C.orange }}>who want more.</span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={whatReveal.inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col gap-5 pt-2 md:pt-4"
            >
              <p className="text-base leading-relaxed" style={{ color: C.muted }}>
                The internet is full of noise. The GenZ Way cuts through it — a focused space where ambitious people come to build real things, share honest ideas, and find people worth building with.
              </p>
              <p className="text-base leading-relaxed" style={{ color: C.muted }}>
                No influencer fluff. No hustle porn. Just people who care deeply about their craft.
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  "Founders", "Developers", "Designers", "Engineers",
                  "Indie Hackers", "Creators", "Students", "Makers",
                ].map((role, i) => (
                  <motion.span
                    key={role}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={whatReveal.inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.45, delay: 0.4 + i * 0.05 }}
                    className="px-3 py-1.5 text-xs uppercase tracking-wider"
                    style={{
                      ...SANS,
                      color: C.cream,
                      border: `1px solid rgba(255,91,46,0.22)`,
                      background: `rgba(255,91,46,0.04)`,
                    }}
                  >
                    {role}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Why it exists ── */}
      <section
        ref={whyReveal.ref}
        className="relative px-6 md:px-16 lg:px-24 py-20 md:py-24"
      >
        <motion.div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "5%", right: "-5%",
            width: "50vw", height: "50vw",
            background: `radial-gradient(ellipse, rgba(255,91,46,0.1) 0%, transparent 68%)`,
            filter: "blur(55px)",
            zIndex: 0,
          }}
          animate={{ opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-screen-xl mx-auto w-full relative z-10">
          <motion.p
            initial={{ opacity: 0 }}
            animate={whyReveal.inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="uppercase tracking-[0.25em] mb-8 text-xs"
            style={{ color: C.orange, ...SANS }}
          >
            Why we exist
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={whyReveal.inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="leading-tight uppercase"
            style={{
              ...DISPLAY,
              fontSize: "clamp(1.8rem, 4.5vw, 5rem)",
              color: C.cream,
              maxWidth: "820px",
            }}
          >
            Most communities{" "}
            <span style={{ color: C.orange }}>collect people.</span>
            <br />
            We connect builders.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={whyReveal.inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 text-base leading-relaxed max-w-lg"
            style={{ color: C.muted }}
          >
            The gap between "having an idea" and "shipping something real" is loneliness. Finding people who push you, challenge you, and build alongside you — that changes everything.
          </motion.p>
        </div>
      </section>

      {/* ── What you can do ── */}
      <section
        ref={doReveal.ref}
        className="relative px-6 md:px-16 lg:px-24 py-16 md:py-24"
      >
        <motion.div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            bottom: "0%", left: "-5%",
            width: "45vw", height: "45vw",
            background: `radial-gradient(ellipse, rgba(199,67,67,0.08) 0%, transparent 65%)`,
            filter: "blur(50px)",
            zIndex: 0,
          }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-screen-xl mx-auto w-full relative z-10">
          <motion.p
            initial={{ opacity: 0 }}
            animate={doReveal.inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="uppercase tracking-[0.25em] mb-10 text-xs"
            style={{ color: C.orange, ...SANS }}
          >
            What you can do here
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ACTIONS.map((item, i) => (
              <motion.div
                key={item.verb}
                initial={{ opacity: 0, y: 22 }}
                animate={doReveal.inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="flex flex-col gap-3 p-5"
                style={{
                  border: `1px solid rgba(255,91,46,0.15)`,
                  background: `rgba(255,91,46,0.02)`,
                }}
              >
                <p
                  className="uppercase leading-none"
                  style={{ ...DISPLAY, fontSize: "clamp(1.3rem, 2.4vw, 2rem)", color: C.orange }}
                >
                  {item.verb}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ethos — max 3 lines ── */}
      <section
        ref={ethosReveal.ref}
        className="relative px-6 md:px-16 lg:px-24 py-20 md:py-28"
      >
        <motion.div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "15%", left: "15%",
            width: "60vw", height: "60vw",
            background: `radial-gradient(ellipse, rgba(255,91,46,0.07) 0%, transparent 68%)`,
            filter: "blur(60px)",
            zIndex: 0,
          }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-screen-xl mx-auto w-full relative z-10 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={ethosReveal.inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="uppercase tracking-[0.3em] mb-10 text-xs"
            style={{ color: C.orange, ...SANS }}
          >
            Our ethos
          </motion.p>

          {ETHOS.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, filter: "blur(12px)", y: 18 }}
              animate={ethosReveal.inView ? { opacity: 1, filter: "blur(0px)", y: 0 } : {}}
              transition={{ duration: 1, ease: "easeOut", delay: i * 0.28 }}
              className="leading-tight uppercase"
              style={{
                ...DISPLAY,
                fontSize: "clamp(1.6rem, 3.5vw, 4rem)",
                color: line.highlight ? C.orange : C.cream,
                marginBottom: i < ETHOS.length - 1 ? "0.4rem" : 0,
              }}
            >
              {line.text}
            </motion.p>
          ))}

          <motion.p
            initial={{ opacity: 0 }}
            animate={ethosReveal.inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-8"
            style={{ ...SCRIPT, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: C.cream, opacity: 0.7 }}
          >
            — for the builders, by the builders.
          </motion.p>
        </div>
      </section>

      {/* ── Contact ── */}
      <section
        ref={contactReveal.ref}
        className="relative px-6 md:px-16 lg:px-24 py-16 md:py-20"
        style={{ borderTop: `1px solid rgba(255,91,46,0.12)` }}
      >
        <div className="max-w-screen-xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={contactReveal.inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <p
                className="uppercase tracking-[0.25em] mb-4 text-xs"
                style={{ color: C.orange, ...SANS }}
              >
                Get in touch
              </p>
              <p
                className="leading-none uppercase mb-6"
                style={{
                  ...DISPLAY,
                  fontSize: "clamp(2rem, 4.5vw, 5rem)",
                  color: C.cream,
                }}
              >
                Questions?
                <br />
                <span style={{ color: C.orange }}>Say hi.</span>
              </p>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                Have a question about the community, want to collaborate, or just want to talk shop? We&apos;re here.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={contactReveal.inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="flex flex-col gap-4"
            >
              <a
                href="mailto:hello@thegenzway.com"
                className="inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:gap-5"
                style={{
                  backgroundColor: C.orange,
                  color: C.bg,
                  boxShadow: `0 0 48px rgba(255,91,46,0.3)`,
                  ...SANS,
                }}
              >
                Email Us <span>→</span>
              </a>

              <div className="flex flex-wrap gap-3 mt-1">
                {["X (Twitter)", "LinkedIn"].map((platform) => (
                  <a
                    key={platform}
                    href="#"
                    className="px-4 py-2 text-xs uppercase tracking-wider transition-colors duration-200"
                    style={{
                      color: C.muted,
                      border: `1px solid rgba(255,91,46,0.2)`,
                      ...SANS,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = C.orange;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = C.muted;
                    }}
                  >
                    {platform}
                  </a>
                ))}
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { C, SANS } from "@/lib/constants";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(0px)",
          backgroundColor: scrolled ? "rgba(8,8,8,0.85)" : "transparent",
          borderBottom: scrolled ? "1px solid rgba(245,242,235,0.06)" : "none",
          ...SANS,
        }}
      >
        <div className="px-6 md:px-10 py-5 flex items-center justify-between">
          <span
            className="text-xs tracking-[0.22em] uppercase font-medium"
            style={{ color: C.cream }}
          >
            The GenZ Way
          </span>

          <div className="hidden md:flex items-center gap-8">
            {["About", "Builders", "Projects", "Community"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs tracking-wider uppercase transition-opacity duration-200 hover:opacity-100 opacity-60"
                style={{ color: C.cream }}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-xs px-5 py-2.5 font-semibold tracking-widest uppercase transition-all duration-300 hover:brightness-110"
              style={{ backgroundColor: C.orange, color: C.bg }}
            >
              ENTER →
            </a>
            <button
              className="md:hidden text-xl leading-none"
              style={{ color: C.cream }}
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {open && (
          <div
            className="md:hidden px-6 pb-6 flex flex-col gap-5"
            style={{ backgroundColor: C.bg }}
          >
            {["About", "Builders", "Projects", "Community"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm uppercase tracking-widest"
                style={{ color: C.muted, ...SANS }}
                onClick={() => setOpen(false)}
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}

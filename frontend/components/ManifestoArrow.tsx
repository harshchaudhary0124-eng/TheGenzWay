"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "motion/react";
import { C } from "@/lib/constants";

export default function ManifestoArrow() {
  const selfRef = useRef<HTMLDivElement>(null);
  const inView = useInView(selfRef, { once: true, amount: 0.2 });
  const [arrowPath, setArrowPath] = useState<{ d: string; head: string } | null>(null);

  useEffect(() => {
    function calcArrow() {
      if (window.innerWidth < 768) {
        setArrowPath(null);
        return;
      }

      const self = selfRef.current;
      const textEl = document.getElementById("so-we-built-text");
      const labelEl = document.getElementById("who-belongs-here-label");
      if (!self || !textEl || !labelEl) return;

      const wr = self.getBoundingClientRect();
      const tr = textEl.getBoundingClientRect();
      const lr = labelEl.getBoundingClientRect();

      // Start: near the left edge of the handwritten text, just below its baseline
      const x1 = tr.left - wr.left + tr.width * 0.05;
      const y1 = tr.bottom - wr.top + 8;

      // End: horizontal center of "BELONGS" in "Who belongs here"
      // text content: "Who belongs here" — "belongs" = chars 4–11
      let x2 = lr.left - wr.left + lr.width * 0.42; // fallback
      const y2 = lr.top - wr.top - 16;

      try {
        const textNode = labelEl.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          const range = document.createRange();
          range.setStart(textNode, 4);   // "b" of "belongs"
          range.setEnd(textNode, 11);    // after "s" of "belongs"
          const bRect = range.getBoundingClientRect();
          x2 = bRect.left - wr.left + bRect.width / 2;
        }
      } catch {
        // keep fallback
      }

      const dx = x2 - x1; // negative — going left
      const dy = y2 - y1; // positive — going down

      // Natural pen-stroke shape:
      //
      //   cp1 is placed 50% of the way DOWN but only 10% of the way LEFT.
      //   This makes the initial tangent nearly vertical — the stroke "drops"
      //   out of the handwritten note rather than traveling horizontally.
      //
      //   cp2 is 25% ABOVE the endpoint and 25% of the horizontal span to
      //   the RIGHT of it.  The bezier must arc leftward from cp1 toward cp2,
      //   creating the gradual left-bending swoosh, then arrives at "BELONGS"
      //   going down-left (≈ 45–55° from horizontal).
      const cp1x = x1 + dx * 0.10;
      const cp1y = y1 + dy * 0.50;

      const cp2x = x2 - dx * 0.25;   // -dx is positive, so this is x2 + |dx|*0.25
      const cp2y = y2 - dy * 0.25;

      const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;

      // Arrowhead angle is derived from the cp2→endpoint tangent,
      // which points diagonally down-left toward the center of "BELONGS".
      const angle = Math.atan2(y2 - cp2y, x2 - cp2x);
      const len = 13;
      const spread = Math.PI / 5;
      const ax1 = x2 - len * Math.cos(angle - spread);
      const ay1 = y2 - len * Math.sin(angle - spread);
      const ax2 = x2 - len * Math.cos(angle + spread);
      const ay2 = y2 - len * Math.sin(angle + spread);
      const head = `M ${ax1.toFixed(1)} ${ay1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} L ${ax2.toFixed(1)} ${ay2.toFixed(1)}`;

      setArrowPath({ d, head });
    }

    const t = setTimeout(calcArrow, 600);
    window.addEventListener("resize", calcArrow);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", calcArrow);
    };
  }, []);

  return (
    <div
      ref={selfRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
      aria-hidden="true"
    >
      {arrowPath && (
        <motion.svg
          className="absolute inset-0"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="manifesto-arrow-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={arrowPath.d}
            stroke={C.orange}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
            filter="url(#manifesto-arrow-glow)"
          />
          <path
            d={arrowPath.head}
            stroke={C.orange}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#manifesto-arrow-glow)"
          />
        </motion.svg>
      )}
    </div>
  );
}

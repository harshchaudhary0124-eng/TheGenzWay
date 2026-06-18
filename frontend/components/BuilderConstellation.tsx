"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

const ORANGE = "#FF5B2E";
const VW = 800;
const VH = 900;
const CONNECT_DIST = 210;

const ACTIVITIES = [
  "Someone just launched Version 1.",
  "A founder found their first 10 users.",
  "An idea became a startup.",
  "A prototype just shipped.",
  "A solopreneur just found a co-founder.",
  "A builder just got their first paying customer.",
  "A team just formed around an idea.",
  "The first user just signed up.",
  "Shreya just got her first 100 users.",
  "A team of two just shipped their first product.",
];

interface NodeData {
  id: number;
  x: number;
  y: number;
  baseR: number;
  driftX: number;
  driftY: number;
  driftDur: number;
}

interface EdgeData {
  from: number;
  to: number;
}

interface ActiveEvent {
  nodeId: number;
  message: string;
  key: number;
}

// Deterministic scatter using coprime moduli — consistent across SSR/CSR
const ALL_NODES: NodeData[] = Array.from({ length: 38 }, (_, i) => ({
  id: i,
  x: 40 + (((i * 37 + 17) % 89) / 89) * 720,
  y: 40 + (((i * 53 + 31) % 97) / 97) * 820,
  baseR: 3 + (i % 3) * 0.9,
  driftX: Math.sin(i * 2.3 + 1) * 4,
  driftY: Math.cos(i * 1.9 + 0.7) * 3,
  driftDur: 3.5 + (i % 7) * 0.7,
}));

const ALL_EDGES: EdgeData[] = (() => {
  const edges: EdgeData[] = [];
  for (let i = 0; i < ALL_NODES.length; i++) {
    for (let j = i + 1; j < ALL_NODES.length; j++) {
      const dx = ALL_NODES[i].x - ALL_NODES[j].x;
      const dy = ALL_NODES[i].y - ALL_NODES[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < CONNECT_DIST) {
        edges.push({ from: i, to: j });
      }
    }
  }
  return edges;
})();

export default function BuilderConstellation({ height }: { height?: number | null }) {
  const [count, setCount] = useState(38);
  const [active, setActive] = useState<ActiveEvent | null>(null);
  const countRef = useRef(38);

  useEffect(() => {
    const update = () => {
      const c = window.innerWidth >= 1024 ? 38 : 22;
      setCount(c);
      countRef.current = c;
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;

    function show() {
      setActive({
        nodeId: Math.floor(Math.random() * countRef.current),
        message: ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)],
        key: Date.now(),
      });
      t = setTimeout(hide, 1800);
    }

    function hide() {
      setActive(null);
      t = setTimeout(show, 1000 + Math.random() * 800);
    }

    t = setTimeout(show, 1200);
    return () => clearTimeout(t);
  }, []);

  const nodes = ALL_NODES.slice(0, count);
  const edges = ALL_EDGES.filter((e) => e.from < count && e.to < count);

  const activeNode = active ? ALL_NODES[active.nodeId] : null;
  const activeNeighborIds = new Set<number>();
  if (active) {
    edges.forEach((e) => {
      if (e.from === active.nodeId) activeNeighborIds.add(e.to);
      if (e.to === active.nodeId) activeNeighborIds.add(e.from);
    });
  }

  const cardLeft = activeNode ? (activeNode.x / VW) * 100 : 0;
  const cardTop = activeNode ? (activeNode.y / VH) * 100 : 0;
  const offsetX = cardLeft > 68 ? -152 : 20;
  const offsetY = cardTop > 80 ? -52 : 12;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="hidden md:block absolute right-0 pointer-events-none overflow-hidden"
      style={{ width: "55%", zIndex: 1, top: "80px", height: height != null ? height : "calc(100% - 80px)" }}
    >
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="bc-glow-active" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="14" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="bc-glow-soft" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="bc-glow-ambient" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {edges.map((e, i) => {
          const lit =
            active !== null &&
            (e.from === active.nodeId || e.to === active.nodeId);
          return (
            <motion.line
              key={i}
              x1={ALL_NODES[e.from].x}
              y1={ALL_NODES[e.from].y}
              x2={ALL_NODES[e.to].x}
              y2={ALL_NODES[e.to].y}
              stroke={ORANGE}
              animate={{
                opacity: lit ? 0.55 : 0.13,
                strokeWidth: lit ? 1.4 : 0.6,
              }}
              transition={{ duration: 0.4 }}
            />
          );
        })}

        {nodes.map((node) => {
          const isActive = active?.nodeId === node.id;
          const isNeighbor = activeNeighborIds.has(node.id);
          return (
            <motion.circle
              key={node.id}
              r={node.baseR}
              fill={ORANGE}
              filter={
                isActive
                  ? "url(#bc-glow-active)"
                  : isNeighbor
                  ? "url(#bc-glow-soft)"
                  : "url(#bc-glow-ambient)"
              }
              animate={{
                cx: [
                  node.x,
                  node.x + node.driftX,
                  node.x,
                  node.x - node.driftX,
                  node.x,
                ],
                cy: [
                  node.y,
                  node.y + node.driftY,
                  node.y,
                  node.y - node.driftY,
                  node.y,
                ],
                opacity: isActive ? 1 : isNeighbor ? 0.82 : 0.58,
                r: isActive
                  ? [node.baseR * 2.2, node.baseR * 3.1, node.baseR * 2.2]
                  : node.baseR,
              }}
              transition={{
                cx: {
                  duration: node.driftDur,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                cy: {
                  duration: node.driftDur * 1.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                opacity: { duration: 0.4 },
                r: isActive
                  ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.4 },
              }}
            />
          );
        })}
      </svg>

      <AnimatePresence>
        {active && activeNode && (
          <motion.div
            key={active.key}
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="absolute"
            style={{
              left: `calc(${cardLeft}% + ${offsetX}px)`,
              top: `calc(${cardTop}% + ${offsetY}px)`,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                background: "rgba(8,8,8,0.8)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,91,46,0.22)",
                borderRadius: "8px",
                padding: "7px 14px",
                whiteSpace: "nowrap",
                boxShadow:
                  "0 0 28px rgba(255,91,46,0.1), 0 4px 24px rgba(0,0,0,0.45)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <motion.div
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: ORANGE,
                    boxShadow: `0 0 8px ${ORANGE}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: "#F5F2EB",
                    fontSize: "11.5px",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                  }}
                >
                  {active.message}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

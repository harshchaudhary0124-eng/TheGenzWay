"use client";

import { useRef } from "react";
import type { RefObject } from "react";
import { useInView } from "motion/react";

export function useReveal(opts?: { once?: boolean; amount?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref as RefObject<Element>, {
    once: opts?.once ?? true,
    amount: opts?.amount ?? 0.25,
  });
  return { ref, inView };
}

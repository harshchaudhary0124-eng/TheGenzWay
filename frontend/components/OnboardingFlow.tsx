"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { C, DISPLAY, SANS } from "@/lib/constants";
import { getDomainFlow } from "@/lib/onboarding";
import type { UserProfile } from "@/lib/auth";

interface Props {
  user: UserProfile;
  onComplete: (domain: string, answers: Record<string, string>) => void;
  submitting?: boolean;
}

const TOTAL = 4;

const stepVariants = {
  enter: (d: number) => ({ x: d * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -40, opacity: 0 }),
};

export default function OnboardingFlow({ user, onComplete, submitting = false }: Props) {
  const primaryDomain = user.interested_domains[0] ?? "Entrepreneurship";
  const flow = getDomainFlow(primaryDomain);

  const [step, setStep] = useState(0);
  const [stepAnswers, setStepAnswers] = useState<Array<string | null>>(Array(TOTAL).fill(null));
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [direction, setDirection] = useState(1);

  const buildAnswerDict = (sa: Array<string | null>): Record<string, string> => {
    const d: Record<string, string> = {};
    for (let i = 0; i < TOTAL; i++) {
      if (sa[i] !== null) d[flow.questions[i].id] = sa[i]!;
    }
    return d;
  };

  const answerDict = buildAnswerDict(stepAnswers);
  const q = flow.questions[step];
  const questionText = typeof q.question === "function" ? q.question(answerDict) : q.question;
  const options = typeof q.options === "function" ? q.options(answerDict) : q.options;

  // The value actually stored — "Other: [text]" when Other is picked
  const effectiveAnswer =
    selected === "Other" ? (otherText.trim() ? `Other: ${otherText.trim()}` : null) : selected;

  const canContinue = effectiveAnswer !== null && !submitting;

  const handleSelect = (opt: string) => {
    setSelected(opt);
    if (opt !== "Other") setOtherText("");
  };

  const handleContinue = () => {
    if (!canContinue) return;
    const newSA = [...stepAnswers];
    newSA[step] = effectiveAnswer!;
    for (let i = step + 1; i < TOTAL; i++) newSA[i] = null;
    setStepAnswers(newSA);

    if (step === TOTAL - 1) {
      onComplete(primaryDomain, buildAnswerDict(newSA));
    } else {
      setDirection(1);
      setStep(s => s + 1);
      setSelected(null);
      setOtherText("");
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    setDirection(-1);
    const prevAnswer = stepAnswers[step - 1];
    if (prevAnswer !== null && prevAnswer.startsWith("Other: ")) {
      setSelected("Other");
      setOtherText(prevAnswer.slice(7));
    } else {
      setSelected(prevAnswer);
      setOtherText("");
    }
    setStep(s => s - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ ...SANS }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[520px]"
        style={{
          background: "rgba(12,12,12,0.88)",
          border: "1px solid rgba(245,242,235,0.08)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02)",
          padding: "clamp(28px, 5vw, 44px)",
          position: "relative",
        }}
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-60px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "280px",
            height: "160px",
            background: `radial-gradient(ellipse, rgba(255,91,46,0.12) 0%, transparent 70%)`,
            filter: "blur(32px)",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />

        {/* Top row */}
        <div className="flex items-center justify-between mb-8">
          <p
            style={{
              fontSize: "0.6rem",
              color: C.orange,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            The GenZ Way
          </p>
          <span
            style={{
              fontSize: "0.62rem",
              color: C.orange,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "3px 10px",
              border: "1px solid rgba(255,91,46,0.28)",
            }}
          >
            {flow.label}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <p
            style={{
              fontSize: "0.65rem",
              color: C.muted,
              letterSpacing: "0.12em",
              marginBottom: "8px",
            }}
          >
            {step + 1} / {TOTAL}
          </p>
          <div
            style={{
              height: "1px",
              background: "rgba(245,242,235,0.07)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <motion.div
              animate={{ width: `${((step + 1) / TOTAL) * 100}%` }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              style={{ height: "100%", background: C.orange, position: "absolute", left: 0, top: 0 }}
            />
          </div>
        </div>

        {/* Question + Options */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2
              className="mb-7"
              style={{
                ...DISPLAY,
                fontSize: "clamp(1.25rem, 3.5vw, 1.85rem)",
                color: C.cream,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              {questionText}
            </h2>

            <div className="flex flex-wrap gap-2">
              {options.map((opt, i) => {
                const isSelected = selected === opt;
                const isOtherChip = opt === "Other";
                return (
                  <motion.button
                    key={opt}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.035, duration: 0.25 }}
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: "8px 16px",
                      fontSize: "0.78rem",
                      letterSpacing: isOtherChip ? "0.06em" : "0.03em",
                      border: `1px solid ${isSelected ? C.orange : "rgba(245,242,235,0.11)"}`,
                      background: isSelected ? "rgba(255,91,46,0.1)" : "transparent",
                      color: isSelected ? C.orange : C.cream,
                      cursor: "pointer",
                      transition: "all 0.16s",
                      outline: "none",
                      ...SANS,
                    }}
                    onMouseEnter={e => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,91,46,0.4)";
                    }}
                    onMouseLeave={e => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,242,235,0.11)";
                    }}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {/* "Other" free-text input */}
            <AnimatePresence>
              {selected === "Other" && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  style={{ marginTop: "16px" }}
                >
                  <p
                    style={{
                      fontSize: "0.62rem",
                      color: C.muted,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    Please specify
                  </p>
                  <input
                    autoFocus
                    value={otherText}
                    onChange={e => setOtherText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && canContinue && handleContinue()}
                    placeholder="Type your answer…"
                    maxLength={120}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(245,242,235,0.04)",
                      border: `1px solid ${otherText.trim() ? "rgba(255,91,46,0.45)" : "rgba(255,91,46,0.28)"}`,
                      color: C.cream,
                      outline: "none",
                      fontSize: "0.875rem",
                      transition: "border-color 0.2s",
                      ...SANS,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,91,46,0.55)"; }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = otherText.trim()
                        ? "rgba(255,91,46,0.45)"
                        : "rgba(255,91,46,0.28)";
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={handleBack}
            disabled={step === 0}
            style={{
              fontSize: "0.75rem",
              color: step === 0 ? "transparent" : C.muted,
              background: "none",
              border: "none",
              cursor: step === 0 ? "default" : "pointer",
              letterSpacing: "0.06em",
              transition: "color 0.2s",
              userSelect: "none",
              ...SANS,
            }}
          >
            ← Back
          </button>

          <motion.button
            onClick={handleContinue}
            disabled={!canContinue}
            whileTap={canContinue ? { scale: 0.97 } : {}}
            style={{
              padding: "11px 28px",
              fontSize: "0.75rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              background: canContinue ? C.orange : "rgba(255,91,46,0.12)",
              color: canContinue ? C.bg : "rgba(245,242,235,0.25)",
              border: "none",
              cursor: canContinue ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: canContinue ? `0 0 24px rgba(255,91,46,0.22)` : "none",
              ...SANS,
            }}
          >
            {submitting ? "Saving…" : step === TOTAL - 1 ? "Done →" : "Continue →"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

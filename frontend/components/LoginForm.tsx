"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { C, DISPLAY, SANS } from "@/lib/constants";
import { apiLogin, saveToken } from "@/lib/auth";

type LoginData = { email: string; password: string };
type Errors = Partial<Record<keyof LoginData, string>>;
type Touched = Partial<Record<keyof LoginData, boolean>>;

function validate(f: LoginData): Errors {
  const e: Errors = {};
  if (!f.email.trim()) e.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email";
  if (!f.password) e.password = "Password is required";
  return e;
}

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState<LoginData>({ email: "", password: "" });
  const [touched, setTouched] = useState<Touched>({});
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // Warm the post-login routes so the redirect after submit is instant.
  useEffect(() => {
    router.prefetch("/home");
    router.prefetch("/welcome");
  }, [router]);

  const errors = validate(form);
  const isValid = Object.keys(errors).length === 0;

  const touch = (k: keyof LoginData) => () => setTouched(t => ({ ...t, [k]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;
    setSubmitting(true);
    setServerError("");
    try {
      const { access_token } = await apiLogin(form.email, form.password);
      saveToken(access_token);
      // Honor a ?next= return path (e.g. forum invite links). Only allow
      // same-origin relative paths to avoid open-redirect abuse.
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") ? next : "/home");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20" style={{ ...SANS }}>
      <div className="w-full max-w-5xl flex flex-col lg:flex-row overflow-hidden"
        style={{
          border: "1px solid rgba(245,242,235,0.09)",
          background: "rgba(12,12,12,0.85)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        {/* ── Left brand panel ── */}
        <div
          className="hidden lg:flex lg:w-[38%] flex-col justify-between p-10"
          style={{ borderRight: "1px solid rgba(245,242,235,0.07)", position: "relative", overflow: "hidden" }}
        >
          <motion.div
            aria-hidden
            style={{
              position: "absolute", top: "-20%", left: "-20%",
              width: "120%", height: "80%",
              background: `radial-gradient(ellipse, rgba(255,91,46,0.14) 0%, rgba(255,138,61,0.05) 45%, transparent 68%)`,
              filter: "blur(48px)", pointerEvents: "none", zIndex: 0,
            }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10">
            <p className="uppercase tracking-[0.25em] mb-10" style={{ fontSize: "0.65rem", color: C.orange }}>
              The GenZ Way
            </p>
            <p
              className="leading-none uppercase"
              style={{ ...DISPLAY, fontSize: "clamp(2rem, 3.5vw, 3.2rem)", color: C.cream, letterSpacing: "-0.02em" }}
            >
              Good to have
            </p>
            <p
              className="leading-none uppercase"
              style={{ ...DISPLAY, fontSize: "clamp(2rem, 3.5vw, 3.2rem)", color: C.orange, letterSpacing: "-0.02em" }}
            >
              you back.
            </p>
            <div style={{ width: "36px", height: "1px", backgroundColor: `rgba(255,91,46,0.4)`, margin: "20px 0" }} />
            <p style={{ fontSize: "0.875rem", color: C.muted, lineHeight: 1.65 }}>
              Your people are inside. Log in and keep building.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-4">
            {["Find your people", "Discuss real ideas", "Build in public"].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: C.orange, flexShrink: 0 }} />
                <p style={{ fontSize: "0.8rem", color: C.muted }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-center">
          <p
            className="uppercase mb-8"
            style={{ ...DISPLAY, fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)", color: C.cream, letterSpacing: "-0.01em" }}
          >
            Log In
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-5">

              {/* Email */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.7rem", color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onBlur={touch("email")}
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    padding: "13px 14px",
                    background: "rgba(245,242,235,0.04)",
                    border: `1px solid ${touched.email && errors.email ? "rgba(199,67,67,0.6)" : "rgba(245,242,235,0.11)"}`,
                    color: C.cream,
                    outline: "none",
                    fontSize: "0.9rem",
                    transition: "border-color 0.2s",
                    ...SANS,
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,91,46,0.45)"; }}
                  onBlurCapture={e => { e.currentTarget.style.borderColor = (touched.email && errors.email) ? "rgba(199,67,67,0.6)" : "rgba(245,242,235,0.11)"; }}
                />
                {touched.email && errors.email && (
                  <p style={{ color: C.red, fontSize: "0.72rem", marginTop: "4px", ...SANS }}>{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.7rem", color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    onBlur={touch("password")}
                    placeholder="Your password"
                    style={{
                      width: "100%",
                      padding: "13px 48px 13px 14px",
                      background: "rgba(245,242,235,0.04)",
                      border: `1px solid ${touched.password && errors.password ? "rgba(199,67,67,0.6)" : "rgba(245,242,235,0.11)"}`,
                      color: C.cream,
                      outline: "none",
                      fontSize: "0.9rem",
                      transition: "border-color 0.2s",
                      ...SANS,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,91,46,0.45)"; }}
                    onBlurCapture={e => { e.currentTarget.style.borderColor = (touched.password && errors.password) ? "rgba(199,67,67,0.6)" : "rgba(245,242,235,0.11)"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: "0.7rem", background: "none", border: "none", cursor: "pointer", padding: 0, ...SANS }}
                  >
                    {showPw ? "hide" : "show"}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p style={{ color: C.red, fontSize: "0.72rem", marginTop: "4px", ...SANS }}>{errors.password}</p>
                )}
              </div>

              {/* Server error */}
              {serverError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ color: C.red, fontSize: "0.8rem", ...SANS }}
                >
                  {serverError}
                </motion.p>
              )}

              {/* CTA */}
              <motion.button
                type="submit"
                disabled={submitting}
                whileTap={isValid ? { scale: 0.97 } : {}}
                className="w-full py-4 text-sm font-semibold tracking-widest uppercase transition-all duration-300"
                style={{
                  backgroundColor: isValid ? C.orange : "rgba(255,91,46,0.3)",
                  color: isValid ? C.bg : `rgba(8,8,8,0.5)`,
                  cursor: isValid ? "pointer" : "not-allowed",
                  boxShadow: isValid ? `0 0 32px rgba(255,91,46,0.28)` : "none",
                  border: "none",
                  marginTop: "4px",
                  ...SANS,
                }}
              >
                {submitting ? "Logging in…" : "Log In →"}
              </motion.button>

            </div>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: C.muted, ...SANS }}>
            New here?{" "}
            <Link href="/join" style={{ color: C.orange, textDecoration: "none" }}>
              Create an account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

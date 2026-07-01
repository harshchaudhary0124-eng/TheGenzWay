"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { C, DISPLAY, SANS } from "@/lib/constants";
import { COUNTRIES, CITY_MAP } from "@/lib/countries";
import { apiRegister, saveToken } from "@/lib/auth";

// ─── Constants ─────────────────────────────────────────────────────────────────

const QUALIFICATIONS = [
  "School Student",
  "College Student",
  "Graduate",
  "Working Professional",
  "Founder / Entrepreneur",
  "Freelancer / Independent",
  "Career Break / Exploring",
  "Other",
];

const DOMAIN_OPTIONS = [
  "Entrepreneurship",
  "Artificial Intelligence",
  "Software / Development",
  "Design",
  "Blockchain / Web3",
  "Product / Startups",
  "Content Creation",
  "Marketing / Growth",
  "Finance / Investing",
  "Research / Deep Tech",
];

const MAX_DOMAINS = 5;

// ─── Types ─────────────────────────────────────────────────────────────────────

type FormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  qualification: string;
  domains: string[];
  country: string;
  city: string;
};

type Errors = Partial<Record<keyof FormData, string>>;
type Touched = Partial<Record<keyof FormData, boolean>>;

// ─── Validation ─────────────────────────────────────────────────────────────────

function validate(f: FormData): Errors {
  const e: Errors = {};
  if (!f.fullName.trim()) e.fullName = "Name is required";
  else if (f.fullName.trim().length < 2) e.fullName = "Enter your full name";
  if (!f.email.trim()) e.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email";
  if (!f.password) e.password = "Password is required";
  else if (f.password.length < 8) e.password = "At least 8 characters";
  if (!f.confirmPassword) e.confirmPassword = "Please confirm your password";
  else if (f.password !== f.confirmPassword) e.confirmPassword = "Passwords don't match";
  if (!f.qualification) e.qualification = "Select your qualification";
  if (f.domains.length === 0) e.domains = "Select at least one domain";
  if (!f.country) e.country = "Select your country";
  if (!f.city.trim()) e.city = "Enter your city";
  return e;
}

// ─── Combobox ───────────────────────────────────────────────────────────────────

interface ComboboxProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  freeText?: boolean;
  error?: string;
  touched?: boolean;
}

function Combobox({ value, onChange, options, placeholder, disabled = false, freeText = false, error, touched }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  const close = useCallback(() => {
    setOpen(false);
    if (!freeText) setQuery(value);
  }, [freeText, value]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [close]);

  const filtered = query
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const select = (opt: string) => {
    onChange(opt);
    setQuery(opt);
    setOpen(false);
  };

  const hasError = touched && !!error;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => {
            const v = e.target.value;
            setQuery(v);
            setOpen(true);
            if (freeText) onChange(v);
            else if (options.includes(v)) onChange(v);
            else onChange("");
          }}
          onFocus={() => !disabled && setOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: "100%",
            padding: "9px 36px 9px 14px",
            background: disabled ? "rgba(245,242,235,0.02)" : "rgba(245,242,235,0.04)",
            border: `1px solid ${hasError ? "rgba(199,67,67,0.6)" : open ? "rgba(255,91,46,0.45)" : "rgba(245,242,235,0.11)"}`,
            color: disabled ? C.muted : C.cream,
            outline: "none",
            fontSize: "0.875rem",
            cursor: disabled ? "not-allowed" : "text",
            transition: "border-color 0.2s",
            ...SANS,
          }}
        />
        <span
          style={{
            position: "absolute", right: 12, top: "50%",
            transform: `translateY(-50%) rotate(${open ? "180deg" : "0deg"})`,
            transition: "transform 0.2s",
            color: C.muted,
            fontSize: "0.7rem",
            pointerEvents: "none",
          }}
        >
          ▾
        </span>
      </div>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0, right: 0,
              background: "rgba(10,10,10,0.98)",
              border: "1px solid rgba(245,242,235,0.12)",
              maxHeight: "200px",
              overflowY: "auto",
              zIndex: 100,
              boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
            }}
          >
            {filtered.slice(0, 25).map(opt => (
              <div
                key={opt}
                onMouseDown={() => select(opt)}
                style={{
                  padding: "10px 14px",
                  fontSize: "0.875rem",
                  color: opt === value ? C.orange : C.cream,
                  background: opt === value ? "rgba(255,91,46,0.08)" : "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  ...SANS,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,91,46,0.08)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = opt === value ? "rgba(255,91,46,0.08)" : "transparent"; }}
              >
                {opt}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {hasError && (
        <p style={{ color: C.red, fontSize: "0.72rem", marginTop: "4px", ...SANS }}>{error}</p>
      )}
    </div>
  );
}

// ─── Field + Label helpers ──────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.7rem", color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase", ...SANS }}>
      {children}
    </label>
  );
}

function InputField({
  type = "text", value, onChange, onBlur, placeholder, error, touched, suffix,
}: {
  type?: string; value: string; onChange: (v: string) => void;
  onBlur?: () => void; placeholder: string;
  error?: string; touched?: boolean; suffix?: React.ReactNode;
}) {
  const hasError = touched && !!error;
  return (
    <div>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "9px 14px",
            paddingRight: suffix ? "42px" : "14px",
            background: "rgba(245,242,235,0.04)",
            border: `1px solid ${hasError ? "rgba(199,67,67,0.6)" : "rgba(245,242,235,0.11)"}`,
            color: C.cream,
            outline: "none",
            fontSize: "0.875rem",
            transition: "border-color 0.2s",
            ...SANS,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = hasError ? "rgba(199,67,67,0.6)" : "rgba(255,91,46,0.45)"; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = hasError ? "rgba(199,67,67,0.6)" : "rgba(245,242,235,0.11)"; }}
        />
        {suffix && (
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>{suffix}</span>
        )}
      </div>
      {hasError && (
        <p style={{ color: C.red, fontSize: "0.72rem", marginTop: "4px", ...SANS }}>{error}</p>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function JoinForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    fullName: "", email: "", password: "", confirmPassword: "",
    qualification: "", domains: [], country: "", city: "",
  });
  const [touched, setTouched] = useState<Touched>({});
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // Warm the post-register routes so the redirect after submit is instant.
  useEffect(() => {
    router.prefetch("/home");
    router.prefetch("/welcome");
  }, [router]);

  const errors = validate(form);
  const isValid = Object.keys(errors).length === 0;

  const set = (k: keyof FormData) => (v: string | string[]) =>
    setForm(f => ({ ...f, [k]: v }));

  const touch = (k: keyof FormData) => () =>
    setTouched(t => ({ ...t, [k]: true }));

  const touchAll = () => {
    const all: Touched = {};
    (Object.keys(form) as (keyof FormData)[]).forEach(k => { all[k] = true; });
    setTouched(all);
  };

  const toggleDomain = (d: string) => {
    setTouched(t => ({ ...t, domains: true }));
    setForm(f => {
      if (f.domains.includes(d)) return { ...f, domains: f.domains.filter(x => x !== d) };
      if (f.domains.length >= MAX_DOMAINS) return f;
      return { ...f, domains: [...f.domains, d] };
    });
  };

  const cityOptions = form.country ? [...(CITY_MAP[form.country] ?? []), "Other"] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    touchAll();
    if (!isValid) return;
    setSubmitting(true);
    setServerError("");
    try {
      const { access_token } = await apiRegister({
        full_name: form.fullName,
        email: form.email,
        password: form.password,
        qualification: form.qualification,
        interested_domains: form.domains,
        country: form.country,
        city: form.city,
      });
      saveToken(access_token);
      router.push("/home");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-4 pt-20" style={{ ...SANS }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl flex flex-col lg:flex-row overflow-hidden"
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
              Join the
            </p>
            <p
              className="leading-none uppercase"
              style={{ ...DISPLAY, fontSize: "clamp(2rem, 3.5vw, 3.2rem)", color: C.orange, letterSpacing: "-0.02em" }}
            >
              builders.
            </p>
            <div style={{ width: "36px", height: "1px", backgroundColor: `rgba(255,91,46,0.4)`, margin: "20px 0" }} />
            <p style={{ fontSize: "0.875rem", color: C.muted, lineHeight: 1.65, maxWidth: "240px" }}>
              A community of founders, developers, and creators — building together.
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
        <div className="flex-1 p-5 md:p-7">
          <div className="mb-4">
            <p
              className="uppercase"
              style={{ ...DISPLAY, fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)", color: C.cream, letterSpacing: "-0.01em" }}
            >
              Create Account
            </p>
            <p className="mt-3" style={{ color: C.muted, ...SANS, fontSize: "0.95rem" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                className="loginLink"
                style={{ color: C.orange, ...SANS, fontWeight: 600 }}
              >
                Log in&nbsp;<span className="loginArrow">→</span>
              </Link>
            </p>
            <style>{`
              .loginLink {
                position: relative;
                white-space: nowrap;
                text-decoration: none;
                padding-bottom: 2px;
                border-bottom: 1px solid rgba(255,91,46,0.45);
                transition: border-color 0.25s ease, color 0.25s ease;
              }
              .loginLink:hover { border-color: ${C.glow}; color: ${C.glow}; }
              .loginArrow {
                display: inline-block;
                transition: transform 0.25s ease;
              }
              .loginLink:hover .loginArrow { transform: translateX(3px); }
            `}</style>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-3">

              {/* Full Name */}
              <div>
                <FieldLabel>Full Name</FieldLabel>
                <InputField
                  value={form.fullName}
                  onChange={set("fullName")}
                  onBlur={touch("fullName")}
                  placeholder="Your full name"
                  error={errors.fullName}
                  touched={touched.fullName}
                />
              </div>

              {/* Email */}
              <div>
                <FieldLabel>Email</FieldLabel>
                <InputField
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  onBlur={touch("email")}
                  placeholder="you@example.com"
                  error={errors.email}
                  touched={touched.email}
                />
              </div>

              {/* Password row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Password</FieldLabel>
                  <InputField
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    onBlur={touch("password")}
                    placeholder="Min 8 characters"
                    error={errors.password}
                    touched={touched.password}
                    suffix={
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{ color: C.muted, fontSize: "0.7rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        {showPw ? "hide" : "show"}
                      </button>
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Confirm Password</FieldLabel>
                  <InputField
                    type={showCpw ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    onBlur={touch("confirmPassword")}
                    placeholder="Repeat password"
                    error={errors.confirmPassword}
                    touched={touched.confirmPassword}
                    suffix={
                      <button type="button" onClick={() => setShowCpw(v => !v)} style={{ color: C.muted, fontSize: "0.7rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        {showCpw ? "hide" : "show"}
                      </button>
                    }
                  />
                </div>
              </div>

              {/* Qualification */}
              <div>
                <FieldLabel>Current Qualification</FieldLabel>
                <div style={{ position: "relative" }}>
                  <select
                    value={form.qualification}
                    onChange={e => { set("qualification")(e.target.value); touch("qualification")(); }}
                    onBlur={touch("qualification")}
                    style={{
                      width: "100%",
                      padding: "9px 36px 9px 14px",
                      background: "rgba(245,242,235,0.04)",
                      border: `1px solid ${touched.qualification && errors.qualification ? "rgba(199,67,67,0.6)" : "rgba(245,242,235,0.11)"}`,
                      color: form.qualification ? C.cream : C.muted,
                      outline: "none",
                      fontSize: "0.875rem",
                      appearance: "none",
                      cursor: "pointer",
                      ...SANS,
                    }}
                  >
                    <option value="" disabled style={{ background: "#0a0a0a", color: C.muted }}>Select qualification</option>
                    {QUALIFICATIONS.map(q => (
                      <option key={q} value={q} style={{ background: "#0a0a0a", color: C.cream }}>{q}</option>
                    ))}
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: "0.7rem", pointerEvents: "none" }}>▾</span>
                </div>
                {touched.qualification && errors.qualification && (
                  <p style={{ color: C.red, fontSize: "0.72rem", marginTop: "4px", ...SANS }}>{errors.qualification}</p>
                )}
              </div>

              {/* Domains */}
              <div>
                <FieldLabel>
                  Domains Interested In
                  <span style={{ color: `rgba(140,140,140,0.6)`, marginLeft: "6px", letterSpacing: "normal", textTransform: "none" }}>
                    (up to {MAX_DOMAINS}, {form.domains.length} selected)
                  </span>
                </FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_OPTIONS.map(d => {
                    const selected = form.domains.includes(d);
                    const maxed = !selected && form.domains.length >= MAX_DOMAINS;
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={maxed}
                        onClick={() => toggleDomain(d)}
                        style={{
                          padding: "5px 11px",
                          fontSize: "0.72rem",
                          letterSpacing: "0.05em",
                          border: `1px solid ${selected ? C.orange : "rgba(245,242,235,0.13)"}`,
                          background: selected ? "rgba(255,91,46,0.1)" : "transparent",
                          color: selected ? C.orange : maxed ? `rgba(140,140,140,0.35)` : C.cream,
                          cursor: maxed ? "not-allowed" : "pointer",
                          transition: "all 0.18s",
                          ...SANS,
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                {touched.domains && errors.domains && (
                  <p style={{ color: C.red, fontSize: "0.72rem", marginTop: "6px", ...SANS }}>{errors.domains}</p>
                )}
              </div>

              {/* Country + City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Country</FieldLabel>
                  <Combobox
                    value={form.country}
                    onChange={v => { set("country")(v); set("city")(""); touch("country")(); }}
                    options={COUNTRIES}
                    placeholder="Search country"
                    error={errors.country}
                    touched={touched.country}
                  />
                </div>
                <div>
                  <FieldLabel>
                    City
                    <span style={{ color: `rgba(140,140,140,0.55)`, marginLeft: "6px", letterSpacing: "normal", textTransform: "none", fontSize: "0.65rem" }}>
                      — if missing, select Other
                    </span>
                  </FieldLabel>
                  <Combobox
                    value={form.city}
                    onChange={set("city")}
                    options={cityOptions}
                    placeholder={form.country ? "Search or type city" : "Select country first"}
                    disabled={!form.country}
                    freeText
                    error={errors.city}
                    touched={touched.city}
                  />
                </div>
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
              <div className="pt-1">
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileTap={isValid ? { scale: 0.97 } : {}}
                  className="w-full py-3 text-sm font-semibold tracking-widest uppercase transition-all duration-300"
                  style={{
                    backgroundColor: isValid ? C.orange : "rgba(255,91,46,0.3)",
                    color: isValid ? C.bg : `rgba(8,8,8,0.5)`,
                    cursor: isValid ? "pointer" : "not-allowed",
                    boxShadow: isValid ? `0 0 32px rgba(255,91,46,0.28)` : "none",
                    border: "none",
                    ...SANS,
                  }}
                >
                  {submitting ? "Creating account…" : "Create Account →"}
                </motion.button>
              </div>

            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

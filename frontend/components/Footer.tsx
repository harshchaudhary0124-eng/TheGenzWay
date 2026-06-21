import { C, DISPLAY, SANS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="px-6 md:px-16 lg:px-24 pt-5 pb-4 md:pt-6 md:pb-5 relative overflow-hidden" style={{ ...SANS }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-60%", left: "30%",
          width: "50vw", height: "50vw",
          background: `radial-gradient(ellipse, rgba(255,91,46,0.09) 0%, rgba(199,67,67,0.04) 45%, transparent 70%)`,
          filter: "blur(52px)",
          pointerEvents: "none",
          zIndex: 0,
          animation: "footerGlow 12s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes footerGlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.08); }
        }
      `}</style>
      <div className="max-w-screen-xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
          <div>
            <p
              className="uppercase leading-none mb-2"
              style={{
                ...DISPLAY,
                fontSize: "clamp(1.5rem, 3.5vw, 3rem)",
                color: C.cream,
              }}
            >
              THE GENZ WAY
            </p>
            <p className="text-sm" style={{ color: C.muted }}>
              Build. Connect. Ship. Repeat.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            {["About", "Contact", "X (Twitter)", "LinkedIn"].map((l) => (
              <a
                key={l}
                href="#"
                className="text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ color: C.muted }}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

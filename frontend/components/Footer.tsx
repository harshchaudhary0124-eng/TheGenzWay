import { C, DISPLAY, SANS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="px-6 md:px-16 lg:px-24 py-16 md:py-20" style={{ ...SANS }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-12 md:gap-8">
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

          <div className="flex gap-12 md:gap-16">
            <div className="flex flex-col gap-3">
              {["About", "Projects", "Community", "Contact"].map((l) => (
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
            <div className="flex flex-col gap-3">
              {["X (Twitter)", "LinkedIn", "Discord", "GitHub"].map((l) => (
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

        <div
          className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(245,242,235,0.05)" }}
        >
          <p className="text-xs" style={{ color: C.muted, opacity: 0.45 }}>
            © 2024 The GenZ Way. Built by builders, for builders.
          </p>
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: C.muted, opacity: 0.35 }}
          >
            A movement. Not a product.
          </p>
        </div>
      </div>
    </footer>
  );
}

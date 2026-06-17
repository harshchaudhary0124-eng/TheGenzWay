export default function GlobalBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none select-none"
      style={{
        zIndex: -1,
        background:
          "radial-gradient(ellipse 65% 55% at 50% 45%, rgba(255,91,46,0.07) 0%, transparent 65%)",
      }}
    />
  );
}

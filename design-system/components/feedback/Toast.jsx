import React from "react";

/**
 * Toast — the "filed under nonsense" confirmation that pops after you save.
 * Dark ink pill with a mini mascot, UPPERCASE mono label. Self-dismisses if
 * `duration` is set and onDone provided; otherwise render conditionally.
 */
export function Toast({
  label = "FILED UNDER NONSENSE.",
  show = true,
  duration = 0,
  onDone,
  style = {},
}) {
  React.useEffect(() => {
    if (show && duration > 0 && onDone) {
      const t = setTimeout(onDone, duration);
      return () => clearTimeout(t);
    }
  }, [show, duration, onDone]);

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      background: "var(--bn-ink, #141414)",
      border: "2.5px solid var(--bn-ink, #141414)",
      borderRadius: "var(--bn-radius-pill, 999px)",
      boxShadow: "4px 4px 0 rgba(0,0,0,.25)",
      padding: "9px 16px 9px 11px",
      opacity: show ? 1 : 0,
      transform: show ? "translateY(0)" : "translateY(8px)",
      transition: "opacity .2s ease, transform .25s var(--bn-ease-pop, cubic-bezier(.34,1.56,.64,1))",
      ...style,
    }}>
      <span style={{ position: "relative", width: 26, height: 24, flexShrink: 0, display: "inline-block" }}>
        <span style={{ position: "absolute", inset: 0, background: "var(--bn-mascot, #FF4438)", border: "2px solid #fff", borderRadius: "var(--bn-blob, 50% 50% 47% 47% / 56% 56% 44% 44%)" }} />
        <span style={{ position: "absolute", top: 8, left: 6, width: 4, height: 4, background: "#fff", borderRadius: "50%" }} />
        <span style={{ position: "absolute", top: 8, left: 15, width: 4, height: 4, background: "#fff", borderRadius: "50%" }} />
        <span style={{ position: "absolute", top: 14, left: 9, width: 8, height: 4, background: "#fff", borderRadius: "0 0 5px 5px" }} />
      </span>
      <span style={{ font: '700 13px var(--bn-font-label, "Space Mono"), monospace', letterSpacing: "1px", color: "#fff" }}>{label}</span>
    </div>
  );
}

import React from "react";

/**
 * EmptyState — shown when Greatest Hits has nothing yet. A flat-frowning mascot
 * over a deadpan line. Optional CTA passed as children.
 */
export function EmptyState({
  title = "Nothing here. Shocking.",
  sub = "Answer a prompt and it gets filed here. Allegedly.",
  children,
  style = {},
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      padding: "40px 24px", ...style,
    }}>
      <div style={{ position: "relative", width: 80, height: 74, marginBottom: 18, transform: "rotate(-4deg)" }}>
        <div style={{ position: "absolute", inset: 0, background: "var(--bn-mascot, #FF4438)", border: "3px solid var(--bn-ink, #141414)", borderRadius: "var(--bn-blob, 50% 50% 47% 47% / 56% 56% 44% 44%)" }} />
        <div style={{ position: "absolute", top: 26, left: 18, width: 14, height: 14, background: "#fff", border: "2px solid var(--bn-ink, #141414)", borderRadius: "50%" }}><div style={{ position: "absolute", top: 4, left: 4, width: 6, height: 6, background: "var(--bn-ink, #141414)", borderRadius: "50%" }} /></div>
        <div style={{ position: "absolute", top: 26, left: 46, width: 14, height: 14, background: "#fff", border: "2px solid var(--bn-ink, #141414)", borderRadius: "50%" }}><div style={{ position: "absolute", top: 4, left: 4, width: 6, height: 6, background: "var(--bn-ink, #141414)", borderRadius: "50%" }} /></div>
        {/* flat frown */}
        <div style={{ position: "absolute", top: 54, left: 28, width: 24, height: 3, background: "var(--bn-ink, #141414)", borderRadius: 3 }} />
      </div>
      <div style={{ font: '800 20px/1.1 var(--bn-font-display, "Bricolage Grotesque"), sans-serif', color: "var(--bn-text, #141414)", letterSpacing: "-0.3px" }}>{title}</div>
      <div style={{ font: '400 14px/1.5 var(--bn-font-body, "Hanken Grotesk"), sans-serif', color: "var(--bn-text-muted, #86847d)", marginTop: 8, maxWidth: 240 }}>{sub}</div>
      {children && <div style={{ marginTop: 20 }}>{children}</div>}
    </div>
  );
}

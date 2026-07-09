import React from "react";

/**
 * ShareTile — the export card you screenshot for the group chat. A colored
 * sticker that quotes the prompt + answer with the wordmark footer. Aspect is
 * fixed-ish; size it via width.
 */
export function ShareTile({
  cat = "CONFESS",
  color = "var(--bn-cat-confess, #8B3DF5)",
  prompt = "",
  answer = "",
  width = 300,
  style = {},
}) {
  return (
    <div style={{
      width,
      background: color,
      border: "3px solid var(--bn-ink, #141414)",
      borderRadius: "var(--bn-radius-sticker, 20px)",
      boxShadow: "6px 6px 0 var(--bn-shadow-ink, #141414)",
      padding: "20px 20px 16px",
      boxSizing: "border-box",
      ...style,
    }}>
      <span style={{
        display: "inline-block", background: "rgba(0,0,0,.22)", color: "#fff",
        font: '700 10px var(--bn-font-label, "Space Mono"), monospace', letterSpacing: "1px",
        padding: "3px 8px", borderRadius: "var(--bn-radius-chip, 6px)",
      }}>{cat}</span>
      <div style={{ font: '600 13px/1.3 var(--bn-font-body, "Hanken Grotesk"), sans-serif', color: "rgba(255,255,255,.7)", marginTop: 14 }}>{prompt}</div>
      <div style={{ font: '800 22px/1.12 var(--bn-font-display, "Bricolage Grotesque"), sans-serif', color: "#fff", marginTop: 6, letterSpacing: "-0.3px" }}>{answer}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, borderTop: "2px solid rgba(255,255,255,.25)", paddingTop: 12 }}>
        <span style={{ font: '700 12px var(--bn-font-label, "Space Mono"), monospace', letterSpacing: "1px", color: "#fff" }}>BOREDNOTES</span>
        <span style={{ font: '400 11px var(--bn-font-body, "Hanken Grotesk"), sans-serif', color: "rgba(255,255,255,.7)" }}>made the group chat's problem</span>
      </div>
    </div>
  );
}

import React from "react";

/** Small CSS mascot that peeks over the prompt sticker's corner. */
function PeekMascot({ color = "var(--bn-action, #FFD23E)" }) {
  return (
    <div style={{ position: "absolute", bottom: -15, right: 16 }}>
      <div style={{ position: "relative", width: 50, height: 46 }}>
        <div style={{ position: "absolute", inset: 0, background: color, border: "2.5px solid var(--bn-ink, #141414)", borderRadius: "var(--bn-blob, 50% 50% 47% 47% / 56% 56% 44% 44%)" }} />
        <div style={{ position: "absolute", top: 15, left: 11, width: 11, height: 11, background: "#fff", border: "1.5px solid var(--bn-ink, #141414)", borderRadius: "50%" }}><div style={{ position: "absolute", top: 3, left: 3, width: 5, height: 5, background: "var(--bn-ink, #141414)", borderRadius: "50%" }} /></div>
        <div style={{ position: "absolute", top: 15, left: 29, width: 11, height: 11, background: "#fff", border: "1.5px solid var(--bn-ink, #141414)", borderRadius: "50%" }}><div style={{ position: "absolute", top: 3, left: 3, width: 5, height: 5, background: "var(--bn-ink, #141414)", borderRadius: "50%" }} /></div>
        <div style={{ position: "absolute", top: 31, left: 19, width: 13, height: 9, background: "var(--bn-ink, #141414)", borderRadius: "0 0 8px 8px" }} />
      </div>
    </div>
  );
}

/**
 * PromptSticker — the headline surface on Reply. Bigger radius (20) and a
 * heavier 5px shadow than cards; the mascot peeks over the bottom-right corner.
 * Brain-dump mode uses the yellow fill with ink text (set ink="#141414").
 */
export function PromptSticker({
  cat = "REFLECT",
  color = "var(--bn-cat-reflect, #2E5BFF)",
  text = "",
  ink = "#fff",
  peekColor = "var(--bn-action, #FFD23E)",
  chipScrim = "rgba(0,0,0,.22)",
  chipFg = "#fff",
  style = {},
}) {
  return (
    <div style={{
      position: "relative",
      background: color,
      border: "3px solid var(--bn-ink, #141414)",
      borderRadius: "var(--bn-radius-sticker, 20px)",
      boxShadow: "5px 5px 0 var(--bn-shadow-ink, #141414)",
      padding: "18px 18px 20px",
      ...style,
    }}>
      <span style={{
        display: "inline-block", background: chipScrim, color: chipFg,
        font: '700 10px var(--bn-font-label, "Space Mono"), monospace', letterSpacing: "1px",
        padding: "3px 8px", borderRadius: "var(--bn-radius-chip, 6px)",
      }}>{cat}</span>
      <div style={{
        font: '800 23px/1.06 var(--bn-font-display, "Bricolage Grotesque"), sans-serif',
        color: ink, marginTop: 9, letterSpacing: "-0.3px", maxWidth: 250,
      }}>{text}</div>
      <PeekMascot color={peekColor} />
    </div>
  );
}

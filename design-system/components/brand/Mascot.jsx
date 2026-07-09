import React from "react";

/**
 * Mascot — the bored heckler placeholder. A CSS blob with eyes, brows, and a
 * frown that idly bobs and blinks. PLACEHOLDER ONLY: the production mascot
 * should be an illustrated/animated character that reacts to typing. Use this
 * to reserve space and set the personality.
 *
 * size scales everything; mood swaps the mouth.
 */
export function Mascot({
  size = 96,
  color = "var(--bn-mascot, #FF4438)",
  mood = "bored",    // 'bored' | 'peek' | 'flat'
  animate = true,
  style = {},
}) {
  const s = size / 96; // scale factor against the 96px reference
  const px = (n) => Math.round(n * s);

  const mouth =
    mood === "flat" ? (
      <div style={{ position: "absolute", top: px(58), left: px(36), width: px(24), height: px(3), background: "var(--bn-ink, #141414)", borderRadius: 3 }} />
    ) : (
      <>
        <div style={{ position: "absolute", top: px(50), left: px(35), width: px(26), height: px(18), background: "var(--bn-ink, #141414)", borderRadius: "0 0 12px 12px" }} />
        <div style={{ position: "absolute", top: px(59), left: px(42), width: px(12), height: px(8), background: "var(--bn-mascot-mouth, #FF7A6E)", borderRadius: "0 0 8px 8px" }} />
      </>
    );

  return (
    <div style={{ display: "inline-block", ...style }}>
      <style>{`
        @keyframes bn-bob { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-${px(7)}px) rotate(2deg)} }
        @keyframes bn-blink { 0%,92%,100%{transform:scaleY(1)} 96%{transform:scaleY(.1)} }
      `}</style>
      <div style={{ animation: animate ? "bn-bob 3s ease-in-out infinite" : "none", display: "inline-block" }}>
        <div style={{ position: "relative", width: px(96), height: px(87) }}>
          <div style={{ position: "absolute", inset: 0, background: color, border: `${px(3)}px solid var(--bn-ink, #141414)`, borderRadius: "var(--bn-blob, 50% 50% 47% 47% / 56% 56% 44% 44%)" }} />
          {/* brows */}
          <div style={{ position: "absolute", top: px(15), left: px(22), width: px(8), height: px(3), background: "var(--bn-ink, #141414)", borderRadius: 3, transform: "rotate(-22deg)" }} />
          <div style={{ position: "absolute", top: px(15), left: px(61), width: px(8), height: px(3), background: "var(--bn-ink, #141414)", borderRadius: 3, transform: "rotate(22deg)" }} />
          {/* eyes */}
          <div style={{ position: "absolute", top: px(24), left: px(22), width: px(17), height: px(17), background: "#fff", border: `${px(2)}px solid var(--bn-ink, #141414)`, borderRadius: "50%", overflow: "hidden", animation: animate ? "bn-blink 5.5s infinite" : "none" }}>
            <div style={{ position: "absolute", top: px(5), left: px(6), width: px(8), height: px(8), background: "var(--bn-ink, #141414)", borderRadius: "50%" }} />
          </div>
          <div style={{ position: "absolute", top: px(24), left: px(54), width: px(17), height: px(17), background: "#fff", border: `${px(2)}px solid var(--bn-ink, #141414)`, borderRadius: "50%", overflow: "hidden", animation: animate ? "bn-blink 5.5s infinite" : "none" }}>
            <div style={{ position: "absolute", top: px(5), left: px(6), width: px(8), height: px(8), background: "var(--bn-ink, #141414)", borderRadius: "50%" }} />
          </div>
          {mouth}
        </div>
      </div>
    </div>
  );
}

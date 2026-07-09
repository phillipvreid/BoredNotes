import React from "react";

/**
 * SpeechBubble — the mascot's heckle bubble. White sticker with a keyline, a
 * constant -2° tilt, and a little tail. Pairs with <Mascot> on the home screen.
 */
export function SpeechBubble({
  children,
  tail = "left",     // 'left' | 'right' | 'none'
  style = {},
}) {
  return (
    <div style={{
      position: "relative", display: "inline-block",
      background: "var(--bn-surface-card, #fff)",
      border: "2.5px solid var(--bn-ink, #141414)",
      borderRadius: 14,
      boxShadow: "3px 3px 0 var(--bn-shadow-ink, #141414)",
      transform: "rotate(var(--bn-tilt-bubble, -2deg))",
      padding: "10px 14px",
      font: '700 14px/1.25 var(--bn-font-display, "Bricolage Grotesque"), sans-serif',
      color: "var(--bn-ink, #141414)", letterSpacing: "-0.2px",
      ...style,
    }}>
      {children}
      {tail !== "none" && (
        <>
          <div style={{ position: "absolute", bottom: -11, [tail]: 20, width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: "12px solid var(--bn-ink, #141414)" }} />
          <div style={{ position: "absolute", bottom: -6, [tail]: 23, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid var(--bn-surface-card, #fff)" }} />
        </>
      )}
    </div>
  );
}

import React from "react";

/**
 * CategoryCard — a tappable prompt card on Home. Background is the category
 * hue, white ink throughout: category chip + kind label + the prompt question.
 * Presses into its shadow.
 */
export function CategoryCard({
  cat = "REFLECT",
  kind = "introspect",
  color = "var(--bn-cat-reflect, #2E5BFF)",
  text = "",
  tilt = 0,
  onClick,
  style = {},
}) {
  const [pressed, setPressed] = React.useState(false);
  const shadowInk = "var(--bn-shadow-ink, #141414)";
  return (
    <div
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={onClick}
      style={{
        background: color,
        border: "3px solid var(--bn-ink, #141414)",
        borderRadius: "var(--bn-radius-card, 16px)",
        boxShadow: pressed ? `2px 2px 0 ${shadowInk}` : `4px 4px 0 ${shadowInk}`,
        transform: pressed ? "translate(2px,2px)" : `rotate(${tilt}deg)`,
        padding: "13px 15px",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{
          background: "var(--bn-chip-scrim, rgba(0,0,0,.22))", color: "#fff",
          font: '700 10px var(--bn-font-label, "Space Mono"), monospace', letterSpacing: "1px",
          padding: "3px 7px", borderRadius: "var(--bn-radius-chip, 6px)",
        }}>{cat}</span>
        <span style={{ font: '700 10px var(--bn-font-label, "Space Mono"), monospace', color: "rgba(255,255,255,.6)" }}>{kind}</span>
      </div>
      <div style={{
        font: '800 18px/1.08 var(--bn-font-display, "Bricolage Grotesque"), sans-serif',
        color: "#fff", marginTop: 7, letterSpacing: "-0.2px",
      }}>{text}</div>
    </div>
  );
}

import React from "react";

/**
 * IconButton — square white sticker button used for back / menu affordances.
 * Same press behavior as Button.
 */
export function IconButton({
  glyph = "back", // 'back' | 'menu' | string (any character)
  size = 46,
  onClick,
  style = {},
}) {
  const [pressed, setPressed] = React.useState(false);
  const shadowInk = "var(--bn-shadow-ink, #141414)";

  const content =
    glyph === "menu" ? (
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--bn-ink, #141414)" }} />
        ))}
      </div>
    ) : glyph === "back" ? (
      <span style={{ fontFamily: 'var(--bn-font-body, "Hanken Grotesk")', fontWeight: 800, fontSize: size * 0.42, color: "var(--bn-ink, #141414)" }}>&larr;</span>
    ) : (
      <span style={{ fontFamily: 'var(--bn-font-body, "Hanken Grotesk")', fontWeight: 800, fontSize: size * 0.42, color: "var(--bn-ink, #141414)" }}>{glyph}</span>
    );

  return (
    <div
      role="button"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bn-surface-card, #fff)",
        border: "2.5px solid var(--bn-ink, #141414)",
        borderRadius: "var(--bn-radius-btn, 11px)",
        boxShadow: pressed ? `1px 1px 0 ${shadowInk}` : `3px 3px 0 ${shadowInk}`,
        transform: pressed ? "translate(2px,2px)" : "none",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      {content}
    </div>
  );
}

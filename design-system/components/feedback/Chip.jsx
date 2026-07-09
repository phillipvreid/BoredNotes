import React from "react";

/**
 * Chip — a small pill. Two roles:
 *  • filter (default): a category/filter selector. Selected = ink fill / white
 *    text; unselected = white sticker with ink keyline.
 *  • meta: a static label (category tag) on a colored or paper surface.
 * Always Space Mono, UPPERCASE.
 */
export function Chip({
  children,
  role = "filter",      // 'filter' | 'meta'
  selected = false,
  color,                // optional accent for the selected/meta fill
  onClick,
  style = {},
}) {
  const accent = color || "var(--bn-ink, #141414)";
  let bg, fg, border, shadow;

  if (role === "meta") {
    bg = color || "var(--bn-chip-scrim, rgba(0,0,0,.22))";
    fg = "#fff";
    border = "none";
    shadow = "none";
  } else if (selected) {
    bg = accent;
    fg = "#fff";
    border = `2.5px solid var(--bn-ink, #141414)`;
    shadow = "2px 2px 0 var(--bn-shadow-ink, #141414)";
  } else {
    bg = "var(--bn-surface-card, #fff)";
    fg = "var(--bn-ink, #141414)";
    border = "2.5px solid var(--bn-ink, #141414)";
    shadow = "2px 2px 0 var(--bn-shadow-ink, #141414)";
  }

  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center",
        background: bg, color: fg, border,
        boxShadow: shadow,
        borderRadius: role === "meta" ? "var(--bn-radius-chip, 6px)" : "var(--bn-radius-pill, 999px)",
        padding: role === "meta" ? "3px 8px" : "7px 13px",
        font: role === "meta"
          ? '700 10px var(--bn-font-label, "Space Mono"), monospace'
          : '700 12px var(--bn-font-label, "Space Mono"), monospace',
        letterSpacing: "1px",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none", WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

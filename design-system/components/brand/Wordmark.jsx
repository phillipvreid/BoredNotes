import React from "react";

/**
 * Wordmark — the BOREDNOTES lockup. Space Mono 700, UPPERCASE, tight tracking,
 * with the "O" optionally dotted as a tiny mascot eye. Two sizes.
 */
export function Wordmark({
  size = "md",       // 'sm' | 'md'
  color = "var(--bn-ink, #141414)",
  style = {},
}) {
  const fs = size === "sm" ? 13 : 18;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      font: `700 ${fs}px var(--bn-font-label, "Space Mono"), monospace`,
      letterSpacing: "1.5px", color, userSelect: "none",
      ...style,
    }}>
      BOREDNOTES
    </span>
  );
}

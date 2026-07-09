import React from "react";

/**
 * Button — the primary "sticker" action button.
 * Black keyline + flat offset shadow; on press it translates into its own
 * shadow (the core Borednotes feel). Yellow is the action color and is the
 * default; use variant="ghost" for a neutral white sticker.
 */
export function Button({
  children,
  arrow = false,
  variant = "action", // 'action' | 'ghost' | 'dark'
  size = "md",        // 'md' | 'lg'
  disabled = false,
  block = false,
  onClick,
  style = {},
}) {
  const [pressed, setPressed] = React.useState(false);

  const pads = { md: "13px 24px", lg: "15px 18px" };
  const fontSize = size === "lg" ? 20 : 18;

  const fills = {
    action: { bg: "var(--bn-action, #FFD23E)", fg: "var(--bn-ink, #141414)", bd: "var(--bn-ink, #141414)" },
    ghost: { bg: "var(--bn-surface-card, #fff)", fg: "var(--bn-ink, #141414)", bd: "var(--bn-ink, #141414)" },
    dark: { bg: "var(--bn-ink, #141414)", fg: "#fff", bd: "var(--bn-ink, #141414)" },
  };
  const f = disabled
    ? { bg: "#EFEADB", fg: "#b6ad95", bd: "#c9c2ad" }
    : fills[variant] || fills.action;

  const shadowInk = disabled ? "#d8d1bd" : "var(--bn-shadow-ink, #141414)";

  return (
    <div
      role="button"
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={disabled ? undefined : onClick}
      style={{
        display: block ? "flex" : "inline-flex",
        alignItems: "center",
        justifyContent: arrow ? "space-between" : "center",
        gap: 8,
        boxSizing: "border-box",
        width: block ? "100%" : undefined,
        background: f.bg,
        color: f.fg,
        border: `3px solid ${f.bd}`,
        borderRadius: size === "lg" ? "var(--bn-radius-card, 16px)" : "var(--bn-radius-card-sm, 14px)",
        boxShadow: pressed ? `2px 2px 0 ${shadowInk}` : `4px 4px 0 ${shadowInk}`,
        transform: pressed ? "translate(2px,2px)" : "none",
        padding: pads[size] || pads.md,
        cursor: disabled ? "default" : "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        fontFamily: 'var(--bn-font-display, "Bricolage Grotesque"), sans-serif',
        fontWeight: 800,
        fontSize,
        letterSpacing: "-0.3px",
        ...style,
      }}
    >
      <span style={{ whiteSpace: "nowrap" }}>{children}</span>
      {arrow && <span style={{ fontWeight: 800, fontSize: fontSize + 2 }}>&rarr;</span>}
    </div>
  );
}

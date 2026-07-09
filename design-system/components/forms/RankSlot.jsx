import React from "react";

// Hand-placed numeral tilts (gold, silver, bronze) — matches the shipping frame.
const ROTS = [-6, 5, -4];

/**
 * RankSlot — one of the three podium rows in a RANK prompt. The place number is
 * a large hollow (outlined) Bricolage numeral, slightly tilted, bleeding into
 * the box. Either a filled answer or a tappable empty state. No scoring — the
 * order itself is the answer.
 */
export function RankSlot({
  place = 0, // 0,1,2
  value,
  placeholder = "tap to fill",
  onClick,
  style = {},
}) {
  const filled = !!value;
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        height: 48, padding: "0 13px", overflow: "hidden",
        background: "var(--bn-surface-card, #fff)",
        border: "3px solid var(--bn-border, #141414)",
        borderRadius: "var(--bn-radius-card-sm, 14px)",
        boxShadow: "3px 3px 0 var(--bn-shadow-ink, #141414)",
        cursor: "pointer", userSelect: "none", WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      <div style={{
        width: 46, height: 34, flexShrink: 0, overflow: "visible",
        display: "flex", alignItems: "center", justifyContent: "center",
        font: '800 74px var(--bn-font-display, "Bricolage Grotesque"), sans-serif',
        lineHeight: 1, color: "transparent",
        WebkitTextStroke: "2.5px var(--bn-ink, #141414)",
        transform: `rotate(${ROTS[place]}deg)`,
      }}>{place + 1}</div>
      <div style={{
        flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        font: filled
          ? '600 16px var(--bn-font-body, "Hanken Grotesk"), sans-serif'
          : '400 16px var(--bn-font-body, "Hanken Grotesk"), sans-serif',
        color: filled ? "var(--bn-text, #141414)" : "var(--bn-text-placeholder, #b6b3a6)",
      }}>{filled ? value : placeholder}</div>
    </div>
  );
}

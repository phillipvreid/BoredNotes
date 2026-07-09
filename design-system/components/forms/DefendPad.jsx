import React from "react";

/**
 * DefendPad — the soft-yellow "defend your ranking" note field that appears
 * under a RANK podium. Optional, low-stakes; the label leans into the bit.
 */
export function DefendPad({
  value = "",
  onChange,
  label = "DEFEND YOURSELF",
  placeholder = "no scoring. just commit to the bit.",
  style = {},
}) {
  return (
    <div style={{
      background: "var(--bn-defend-pad, #FFF6D6)",
      border: "2.5px solid var(--bn-ink, #141414)",
      borderRadius: "var(--bn-radius-card-sm, 14px)",
      boxShadow: "3px 3px 0 var(--bn-shadow-ink, #141414)",
      padding: "11px 13px",
      ...style,
    }}>
      <div style={{ font: '700 10px var(--bn-font-label, "Space Mono"), monospace', letterSpacing: "1px", color: "var(--bn-ink, #141414)", marginBottom: 6 }}>{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", minHeight: 46, resize: "none", border: "none", outline: "none",
          background: "transparent", boxSizing: "border-box",
          font: '600 15px/1.4 var(--bn-font-body, "Hanken Grotesk"), sans-serif',
          color: "var(--bn-ink, #141414)",
        }}
      />
    </div>
  );
}

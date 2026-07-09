import React from "react";

const STAGES = [
  { at: 0, label: "type here, genius…", color: "var(--bn-text-placeholder, #b6b3a6)" },
  { at: 1, label: "ok, a start.", color: "var(--bn-text-muted-2, #9b988c)" },
  { at: 8, label: "now you're cooking.", color: "var(--bn-cat-rank, #15A150)" },
  { at: 25, label: "okay, you're writing a memoir.", color: "var(--bn-cat-take, #FF7A1A)" },
  { at: 60, label: "respectfully, wrap it up.", color: "var(--bn-mascot, #FF4438)" },
];

/**
 * Textarea — the answer input. Paper card with a keyline; the WordCounter line
 * below it heckles based on how much you've written. Controlled component.
 */
export function Textarea({
  value = "",
  onChange,
  placeholder = "type here, genius…",
  minHeight = 132,
  showCounter = true,
  style = {},
}) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  let stage = STAGES[0];
  for (const s of STAGES) if (words >= s.at) stage = s;

  return (
    <div style={style}>
      <div style={{
        background: "var(--bn-surface-card, #fff)",
        border: "3px solid var(--bn-ink, #141414)",
        borderRadius: "var(--bn-radius-card, 16px)",
        boxShadow: "4px 4px 0 var(--bn-shadow-ink, #141414)",
        padding: "14px 15px",
      }}>
        <textarea
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", minHeight, resize: "none", border: "none", outline: "none",
            background: "transparent", boxSizing: "border-box",
            font: '600 18px/1.45 var(--bn-font-body, "Hanken Grotesk"), sans-serif',
            color: "var(--bn-text, #141414)",
          }}
        />
      </div>
      {showCounter && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 9, padding: "0 4px" }}>
          <span style={{ font: '600 14px var(--bn-font-body, "Hanken Grotesk"), sans-serif', color: stage.color, fontStyle: "italic" }}>{stage.label}</span>
          <span style={{ font: '700 12px var(--bn-font-label, "Space Mono"), monospace', color: "var(--bn-text-placeholder, #b6b3a6)" }}>{words} {words === 1 ? "WORD" : "WORDS"}</span>
        </div>
      )}
    </div>
  );
}

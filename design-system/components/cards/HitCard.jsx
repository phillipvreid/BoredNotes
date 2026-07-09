import React from "react";

// Gold / silver / bronze rank chips (saved-hit treatment) — matches the shipping frame.
const MEDALS = ["#EFBF04", "#C4C4C4", "#CE8946"];

/**
 * HitCard — a saved "banger" in Greatest Hits. White sticker, slight tilt.
 * Renders one of three shapes by `type`: text answer, rank result, brain dump.
 * Long-press fires onLongPress (wire the gesture in the host; this just styles
 * the soft press at scale .985).
 */
export function HitCard({
  cat = "CONFESS",
  color = "var(--bn-cat-confess, #8B3DF5)",
  chipFg = "#fff",
  when = "",
  type = "text", // 'text' | 'rank' | 'brain'
  prompt,
  answer,
  items = [],
  defense,
  tilt = 0,
  onLongPress,
  style = {},
}) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <div
      onPointerDown={() => { setPressed(true); }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onContextMenu={(e) => { e.preventDefault(); onLongPress && onLongPress(); }}
      style={{
        background: "var(--bn-surface-card, #fff)",
        border: "2.5px solid var(--bn-border, #141414)",
        borderRadius: "var(--bn-radius-card, 16px)",
        boxShadow: "4px 4px 0 var(--bn-shadow-ink, #141414)",
        transform: pressed ? "scale(.985)" : `rotate(${tilt}deg)`,
        padding: "13px 14px",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ background: color, color: chipFg, font: '700 10px var(--bn-font-label, "Space Mono"), monospace', letterSpacing: "1px", padding: "3px 8px", borderRadius: "var(--bn-radius-chip, 6px)" }}>{cat}</span>
        <span style={{ font: '700 11px var(--bn-font-label, "Space Mono"), monospace', color: "var(--bn-text-placeholder, #b6b3a6)" }}>{when}</span>
      </div>

      {type !== "brain" && prompt && (
        <div style={{ font: '600 13px/1.3 var(--bn-font-body, "Hanken Grotesk"), sans-serif', color: "var(--bn-text-muted-2, #9b988c)", marginTop: 9 }}>{prompt}</div>
      )}

      {type !== "rank" && (
        <div style={{ font: '600 16px/1.42 var(--bn-font-body, "Hanken Grotesk"), sans-serif', color: "var(--bn-text, #141414)", marginTop: 7 }}>{answer}</div>
      )}

      {type === "rank" && (
        <>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ flexShrink: 0, background: MEDALS[i], padding: "3px 8px", borderRadius: 6, font: '700 10px var(--bn-font-label, "Space Mono"), monospace', letterSpacing: "1px", color: "#fff" }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", font: '600 15px var(--bn-font-body, "Hanken Grotesk"), sans-serif', color: "var(--bn-text, #141414)" }}>{t}</div>
              </div>
            ))}
          </div>
          {defense && (
            <div style={{ marginTop: 10, background: "var(--bn-defend-pad, #FFF6D6)", border: "2px solid var(--bn-ink, #141414)", borderRadius: 10, padding: "9px 11px" }}>
              <div style={{ font: '700 9px var(--bn-font-label, "Space Mono"), monospace', letterSpacing: "1px", color: "var(--bn-ink, #141414)" }}>DEFENSE</div>
              <div style={{ font: '600 14px/1.35 var(--bn-font-body, "Hanken Grotesk"), sans-serif', color: "var(--bn-ink, #141414)", marginTop: 3 }}>{defense}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

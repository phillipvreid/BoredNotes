import * as React from "react";

/**
 * One podium row in a RANK prompt. Medal number + a filled answer or a tappable
 * empty state. There is no scoring — the order is the answer.
 *
 * @startingPoint section="Forms" subtitle="Rank podium slot (gold/silver/bronze)" viewport="320x60"
 */
export interface RankSlotProps {
  /** 0, 1, 2 — the podium position, shown as a large hollow numeral. */
  place?: 0 | 1 | 2;
  /** Filled answer text; omit for the empty/tap state. */
  value?: string;
  placeholder?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function RankSlot(props: RankSlotProps): JSX.Element;

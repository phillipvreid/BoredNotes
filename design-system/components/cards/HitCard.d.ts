import * as React from "react";

/**
 * A saved "banger" in Greatest Hits. White sticker with a slight tilt; renders
 * one of three shapes by `type`. Long-press (right-click here) fires
 * onLongPress for the action sheet.
 *
 * @startingPoint section="Cards" subtitle="Saved hit card (3 types)" viewport="320x190"
 */
export interface HitCardProps {
  cat?: string;
  /** Category hue for the chip. */
  color?: string;
  /** Chip text color. */
  chipFg?: string;
  /** Timestamp string, e.g. "wed · 4:03pm". */
  when?: string;
  /** 'text' answer, 'rank' top-3 + defense, or 'brain' dump. */
  type?: "text" | "rank" | "brain";
  /** Recalled prompt line (text/rank). */
  prompt?: string;
  /** The saved answer (text/brain). */
  answer?: string;
  /** Ranked items, gold→bronze (rank). */
  items?: string[];
  /** Optional defense note shown in the yellow pad (rank). */
  defense?: string;
  tilt?: number;
  onLongPress?: () => void;
  style?: React.CSSProperties;
}

export function HitCard(props: HitCardProps): JSX.Element;

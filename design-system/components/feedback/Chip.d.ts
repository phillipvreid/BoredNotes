import * as React from "react";

/**
 * A small UPPERCASE pill. role="filter" is a selectable filter (ink fill when
 * selected); role="meta" is a static category tag on a card.
 *
 * @startingPoint section="Feedback" subtitle="Filter & meta chips" viewport="340x60"
 */
export interface ChipProps {
  children: React.ReactNode;
  role?: "filter" | "meta";
  selected?: boolean;
  /** Accent fill for the selected filter / meta tag. */
  color?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Chip(props: ChipProps): JSX.Element;

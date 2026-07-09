import * as React from "react";

/**
 * The soft-yellow "defend your ranking" note under a RANK podium. Optional,
 * low-stakes.
 *
 * @startingPoint section="Forms" subtitle="Defend-your-ranking pad" viewport="320x110"
 */
export interface DefendPadProps {
  value?: string;
  onChange?: (next: string) => void;
  label?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function DefendPad(props: DefendPadProps): JSX.Element;

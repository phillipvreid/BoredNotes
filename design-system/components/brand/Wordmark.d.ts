import * as React from "react";

/**
 * The BOREDNOTES wordmark — Space Mono 700, UPPERCASE, tight tracking.
 *
 * @startingPoint section="Brand" subtitle="Wordmark lockup" viewport="320x70"
 */
export interface WordmarkProps {
  size?: "sm" | "md";
  color?: string;
  style?: React.CSSProperties;
}

export function Wordmark(props: WordmarkProps): JSX.Element;

import * as React from "react";

/**
 * The mascot's heckle bubble — white sticker, constant -2° tilt, with a tail.
 *
 * @startingPoint section="Brand" subtitle="Mascot speech bubble" viewport="340x110"
 */
export interface SpeechBubbleProps {
  children: React.ReactNode;
  /** Which side the tail drops from. */
  tail?: "left" | "right" | "none";
  style?: React.CSSProperties;
}

export function SpeechBubble(props: SpeechBubbleProps): JSX.Element;

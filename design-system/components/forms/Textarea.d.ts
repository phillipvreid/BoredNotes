import * as React from "react";

/**
 * The answer input — paper card with a keyline and a heckling word counter
 * below it. Controlled.
 *
 * @startingPoint section="Forms" subtitle="Answer textarea + heckling counter" viewport="340x210"
 */
export interface TextareaProps {
  value?: string;
  onChange?: (next: string) => void;
  placeholder?: string;
  minHeight?: number;
  /** Show the word count + escalating heckle line. Default true. */
  showCounter?: boolean;
  style?: React.CSSProperties;
}

export function Textarea(props: TextareaProps): JSX.Element;

import * as React from "react";

/**
 * The primary sticker action button (CTA / send). Yellow = the action; press
 * slides it into its hard shadow.
 *
 * @startingPoint section="Buttons" subtitle="Sticker CTA + send button" viewport="360x80"
 */
export interface ButtonProps {
  children: React.ReactNode;
  /** Show a trailing → and push label/arrow apart (space-between). */
  arrow?: boolean;
  /** action = reserved yellow (default), ghost = white, dark = ink. */
  variant?: "action" | "ghost" | "dark";
  /** md = standard send button, lg = full-width home CTA. */
  size?: "md" | "lg";
  disabled?: boolean;
  /** Stretch to full width (use with size="lg" for the home CTA). */
  block?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;

import * as React from "react";

/**
 * The bored-heckler mascot — a CSS blob that bobs and blinks. PLACEHOLDER for
 * the production illustrated character; use it to reserve space and personality.
 *
 * @startingPoint section="Brand" subtitle="Mascot placeholder (bored/peek/flat)" viewport="360x200"
 */
export interface MascotProps {
  /** Reference height is 96px; everything scales from `size`. */
  size?: number;
  color?: string;
  /** 'bored' (frown), 'peek' (sticker corner), 'flat' (empty state). */
  mood?: "bored" | "peek" | "flat";
  /** Idle bob + blink. Turn off for reduced motion. */
  animate?: boolean;
  style?: React.CSSProperties;
}

export function Mascot(props: MascotProps): JSX.Element;

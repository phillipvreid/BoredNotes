import * as React from "react";

/** Square white sticker button for back / menu affordances. */
export interface IconButtonProps {
  /** 'back' (←), 'menu' (three dots), or any single character/glyph. */
  glyph?: "back" | "menu" | string;
  /** Edge length in px (40 in-app, 46 on spec sheets). */
  size?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function IconButton(props: IconButtonProps): JSX.Element;

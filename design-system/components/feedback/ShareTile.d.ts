import * as React from "react";

/**
 * The share/export card you screenshot for the group chat. A colored sticker
 * quoting prompt + answer with the wordmark footer.
 *
 * @startingPoint section="Feedback" subtitle="Shareable export tile" viewport="340x300"
 */
export interface ShareTileProps {
  cat?: string;
  color?: string;
  prompt?: string;
  answer?: string;
  width?: number;
  style?: React.CSSProperties;
}

export function ShareTile(props: ShareTileProps): JSX.Element;

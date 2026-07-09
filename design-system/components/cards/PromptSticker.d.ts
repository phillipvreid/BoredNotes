import * as React from "react";

/**
 * The headline prompt surface on the Reply screen. Larger radius (20) and a
 * heavier 5px shadow than a card; the mascot peeks over the bottom-right
 * corner. For brain-dump mode pass the yellow fill with ink text.
 *
 * @startingPoint section="Cards" subtitle="Prompt sticker (Reply headline)" viewport="320x150"
 */
export interface PromptStickerProps {
  cat?: string;
  /** Fill color — a --bn-cat-* hue, or --bn-action for brain-dump. */
  color?: string;
  text?: string;
  /** Text color over the fill. "#fff" on hues, "#141414" on yellow. */
  ink?: string;
  /** The peeking mascot's body color. */
  peekColor?: string;
  /** Background of the category chip pill. */
  chipScrim?: string;
  /** Text color of the category chip. */
  chipFg?: string;
  style?: React.CSSProperties;
}

export function PromptSticker(props: PromptStickerProps): JSX.Element;

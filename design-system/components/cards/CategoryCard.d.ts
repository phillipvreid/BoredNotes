import * as React from "react";

/**
 * A tappable prompt card on Home. Background is the category hue; chip, kind
 * label, and question are all white ink. Presses into its shadow.
 *
 * @startingPoint section="Cards" subtitle="Category prompt card (Home)" viewport="300x120"
 */
export interface CategoryCardProps {
  /** UPPERCASE category label shown in the chip, e.g. "REFLECT". */
  cat?: string;
  /** lowercase kind descriptor, e.g. "introspect". */
  kind?: string;
  /** The category hue (use the matching --bn-cat-* token). */
  color?: string;
  /** The prompt question. */
  text?: string;
  /** Hand-placed rotation in degrees (e.g. -1.5). */
  tilt?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function CategoryCard(props: CategoryCardProps): JSX.Element;

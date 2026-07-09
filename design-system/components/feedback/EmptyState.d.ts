import * as React from "react";

/**
 * The Greatest Hits empty state — a flat-frowning mascot over a deadpan line.
 * Pass a CTA as children.
 *
 * @startingPoint section="Feedback" subtitle="Empty state" viewport="360x300"
 */
export interface EmptyStateProps {
  title?: string;
  sub?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function EmptyState(props: EmptyStateProps): JSX.Element;

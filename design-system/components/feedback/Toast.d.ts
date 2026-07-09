import * as React from "react";

/**
 * The "filed under nonsense" save confirmation — dark ink pill with a mini
 * mascot. Pass duration + onDone to auto-dismiss, or control via `show`.
 *
 * @startingPoint section="Feedback" subtitle="Save toast" viewport="320x70"
 */
export interface ToastProps {
  label?: string;
  show?: boolean;
  /** ms before onDone fires; 0 = stay until host hides it. */
  duration?: number;
  onDone?: () => void;
  style?: React.CSSProperties;
}

export function Toast(props: ToastProps): JSX.Element;

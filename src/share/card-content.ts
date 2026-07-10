import type { CategoryStyle } from '../theme/tokens';
import type { PromptCategory } from '../types';

export interface BandContent {
  kicker: string;
  setupLine: string | null;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// Prompted entries put the prompt in the band; freeform entries put a playful
// kicker there and drop the setup line (the answer is the whole point).
export function resolveBand(
  entryMode: 'prompted' | 'freeform',
  category: PromptCategory | null,
  promptText: string,
  freeformKicker: string,
): BandContent {
  if (entryMode === 'freeform') {
    return { kicker: freeformKicker, setupLine: null };
  }
  return { kicker: category ? "TODAY'S PROMPT" : 'PROMPTED', setupLine: promptText };
}

// The band always carries white text, so its color must stay dark enough for
// contrast in both light and dark themes. Category hues qualify; null (legacy)
// rows fall back to the REFLECT hue rather than raw ink, which would flip light
// in dark mode and break the white band text.
export function resolveBandColor(
  category: PromptCategory | null,
  categoryStyles: Record<PromptCategory, CategoryStyle>,
): string {
  return categoryStyles[category ?? 'reflective'].color;
}

// Footer meta line: "MMM D", "MMM D · Location", "Location", or "".
export function footerMeta(
  createdAt: string | null,
  location: string | null,
  showDate: boolean,
  showLocation: boolean,
): string {
  const parts: string[] = [];
  if (showDate && createdAt) {
    const d = new Date(createdAt);
    parts.push(`${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`);
  }
  if (showLocation && location) {
    parts.push(location);
  }
  return parts.join(' · ');
}

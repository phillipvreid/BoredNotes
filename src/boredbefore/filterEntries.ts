import type { Entry, PromptCategory } from '../types';

export type FormatToken =
  | 'brainDump' | 'observe' | 'reflect' | 'confess' | 'imagine' | 'rank' | 'loveHate';

export interface FeedFilters {
  formats: FormatToken[];
  startDate: string | null; // 'YYYY-MM-DD'
  endDate: string | null;   // 'YYYY-MM-DD', inclusive
}

export const EMPTY_FILTERS: FeedFilters = { formats: [], startDate: null, endDate: null };

// Chip order matches the design; labels match the card pills.
export const FORMAT_OPTIONS: ReadonlyArray<{ token: FormatToken; label: string }> = [
  { token: 'brainDump', label: 'Brain Dump' },
  { token: 'observe', label: 'Observe' },
  { token: 'reflect', label: 'Reflect' },
  { token: 'confess', label: 'Confess' },
  { token: 'imagine', label: 'Imagine' },
  { token: 'rank', label: 'Rank + Defend' },
  { token: 'loveHate', label: 'Love + Hate' },
];

const CATEGORY_TO_FORMAT: Record<PromptCategory, FormatToken> = {
  observational: 'observe',
  reflective: 'reflect',
  personal: 'confess',
  creative: 'imagine',
  game: 'rank', // 'game' prompts are saved as rank/loveHate kinds; handled above.
};

// Mirrors the pill-selection logic in FeedTab: game kinds first, then freeform,
// then prompt category. A prompted entry with no category (dev-only pre-release
// data) falls back to 'observe' so the function stays total.
export function formatOf(entry: Entry): FormatToken {
  if (entry.entry_kind === 'loveHate') return 'loveHate';
  if (entry.entry_kind === 'rank') return 'rank';
  if (entry.entry_mode === 'freeform') return 'brainDump';
  return entry.category ? CATEGORY_TO_FORMAT[entry.category] : 'observe';
}

export function filterEntries(entries: Entry[], filters: FeedFilters): Entry[] {
  return entries.filter(e => {
    if (filters.formats.length > 0 && !filters.formats.includes(formatOf(e))) return false;
    const day = e.created_at.slice(0, 10);
    if (filters.startDate && day < filters.startDate) return false;
    if (filters.endDate && day > filters.endDate) return false;
    return true;
  });
}

export function activeFilterCount(filters: FeedFilters): number {
  return filters.formats.length + (filters.startDate || filters.endDate ? 1 : 0);
}

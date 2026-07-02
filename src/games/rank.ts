import type { RankGameConfig, RankGameData } from '../types';

// Slot placeholders when a rank prompt doesn't bring its own.
export const DEFAULT_RANK_SLOTS = ['your undisputed #1…', 'the runner-up…', 'third place, sorry…'];

export const RANK_SLOT_COUNT = 3;

export function parseRankConfig(json: string | null | undefined): RankGameConfig | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed?.slots) && parsed.slots.every((s: unknown) => typeof s === 'string')) {
      return { slots: parsed.slots };
    }
  } catch {}
  return null;
}

export function parseRankData(json: string | null | undefined): RankGameData | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (
      Array.isArray(parsed?.items) &&
      parsed.items.every((s: unknown) => typeof s === 'string') &&
      typeof parsed?.defense === 'string'
    ) {
      return { items: parsed.items, defense: parsed.defense };
    }
  } catch {}
  return null;
}

// Plain-text rendering stored in response_text so search, CSV export, and
// share cards work on rank entries without knowing about game_data.
export function renderRankResponseText(data: RankGameData): string {
  const lines = data.items.map((item, i) => `${i + 1}. ${item}`);
  return `${lines.join('\n')}\n\nDefend #1: ${data.defense}`;
}

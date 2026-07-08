import type { LoveHateGameConfig, LoveHateGameData } from '../types';

// Fallback pool when a loveHate prompt's game_config is missing or malformed —
// the game must never open onto a blank theme.
export const DEFAULT_LOVE_HATE_THEMES = [
  'Fruit', 'Condiments', 'Weather', 'Breakfast foods', 'Small talk topics',
];

// Framing line shown under the dealt theme on the respond card. (The library
// prompt's own text is what the home card shows.)
export const LOVE_HATE_FRAMING = 'one you love, one you hate. no takebacks.';

export function parseLoveHateConfig(json: string | null | undefined): LoveHateGameConfig | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed?.themes) && parsed.themes.every((t: unknown) => typeof t === 'string')) {
      return { themes: parsed.themes };
    }
  } catch {}
  return null;
}

export function parseLoveHateData(json: string | null | undefined): LoveHateGameData | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (
      typeof parsed?.theme === 'string' &&
      typeof parsed?.love === 'string' &&
      typeof parsed?.hate === 'string'
    ) {
      return { theme: parsed.theme, love: parsed.love, hate: parsed.hate };
    }
  } catch {}
  return null;
}

export function pickLoveHateTheme(themes: string[] | null | undefined): string {
  const pool = themes && themes.length > 0 ? themes : DEFAULT_LOVE_HATE_THEMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Plain-text rendering stored in response_text so search, CSV export, and
// share cards work on loveHate entries without knowing about game_data.
export function renderLoveHateResponseText(data: LoveHateGameData): string {
  return `${data.theme}\nLove it: ${data.love}\nHate it: ${data.hate}`;
}

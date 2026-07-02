import type { SQLiteDatabase } from 'expo-sqlite';
import type { CurrentPrompt, PromptCategory, PromptModifiers } from '../types';
import { getSetting, setSetting } from '../db/settings';
import { getRecentEntries } from '../db/entries';
import { getEligiblePrompts } from '../db/prompts';
import { selectPrompt } from './selection';
import { generateAiPrompt } from './ai';
import { getCurrentPrompt, getNextPrompt, peekNextLibraryPrompt } from './next';
import { gatherContext } from '../context/gather';

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const THROTTLE_MS = 60 * 60 * 1000;

async function _getContextualPrompt(
  db: SQLiteDatabase,
  skipThrottle: boolean,
  modifiers: PromptModifiers,
): Promise<CurrentPrompt> {
  const offlineMode = (await getSetting(db, 'offline_mode')) === 'true';
  if (offlineMode) {
    if (skipThrottle) return await peekNextLibraryPrompt(db);
    return (await getCurrentPrompt(db)) ?? await getNextPrompt(db);
  }

  if (!skipThrottle) {
    const lastGenAt = await getSetting(db, 'contextual_prompt_generated_at');
    if (lastGenAt) {
      const elapsed = Date.now() - new Date(lastGenAt).getTime();
      if (elapsed < THROTTLE_MS) {
        const text = await getSetting(db, 'contextual_prompt_text');
        const category = await getSetting(db, 'contextual_prompt_category') as PromptCategory | null;
        if (text && category) {
          const source = (await getSetting(db, 'contextual_prompt_source') as 'ai' | 'library') ?? 'ai';
          return { text, category, source };
        }
      }
    }
  }

  if (!API_KEY) {
    if (skipThrottle) return await peekNextLibraryPrompt(db);
    return (await getCurrentPrompt(db)) ?? await getNextPrompt(db);
  }

  try {
    const recentEntries = await getRecentEntries(db, 30);
    const recentCategories = JSON.parse(
      (await getSetting(db, 'recent_categories')) ?? '[]'
    ) as PromptCategory[];
    const recentDepths = JSON.parse(
      (await getSetting(db, 'recent_depths')) ?? '[]'
    ) as number[];

    const eligible = await getEligiblePrompts(db, {
      onlyKind: 'text',
      excludeTexts: recentEntries.map(e => e.prompt_text),
      excludeCategories: recentCategories.slice(-2),
      excludeDepth:
        recentDepths.slice(-3).length === 3 &&
        recentDepths.slice(-3).every(d => d === recentDepths[recentDepths.length - 1])
          ? recentDepths[recentDepths.length - 1]
          : null,
    });
    const allFallback = await getEligiblePrompts(db, { onlyKind: 'text' });
    const pool = eligible.length > 0 ? eligible : allFallback;
    const selected = selectPrompt(pool, recentCategories, recentDepths);

    const recentTopics = modifiers.memory
      ? recentEntries.slice(0, 3).map(e => e.response_text.slice(0, 40).replace(/\n/g, ' '))
      : [];

    const context = await gatherContext();
    const aiText = await generateAiPrompt(
      {
        category: selected.category,
        depth: selected.depth,
        recentTopics,
        context,
        modifiers: { time: modifiers.time, place: modifiers.place, weather: modifiers.weather },
      },
      API_KEY
    );

    if (aiText) {
      await setSetting(db, 'contextual_prompt_text', aiText);
      await setSetting(db, 'contextual_prompt_category', selected.category);
      await setSetting(db, 'contextual_prompt_generated_at', new Date().toISOString());
      await setSetting(db, 'contextual_prompt_source', 'ai');
      return { text: aiText, category: selected.category, source: 'ai' };
    }
  } catch {
    // fall through to DB fallback
  }

  if (skipThrottle) return await peekNextLibraryPrompt(db);
  return (await getCurrentPrompt(db)) ?? await getNextPrompt(db);
}

export async function getContextualPrompt(
  db: SQLiteDatabase,
  modifiers: PromptModifiers,
): Promise<CurrentPrompt> {
  return _getContextualPrompt(db, false, modifiers);
}

export async function forceRefreshContextualPrompt(
  db: SQLiteDatabase,
  modifiers: PromptModifiers,
): Promise<CurrentPrompt> {
  await setSetting(db, 'contextual_prompt_generated_at', '');
  return _getContextualPrompt(db, true, modifiers);
}

import type { SQLiteDatabase } from 'expo-sqlite';
import type { CurrentPrompt, PromptCategory } from '../types';
import { getRecentEntries } from '../db/entries';
import { getEligiblePrompts, markPromptUsed } from '../db/prompts';
import { getSetting, setSetting } from '../db/settings';
import { selectPrompt } from './selection';
import { generateAiPrompt } from './ai';

const AI_FREQUENCY = 4;
const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

export async function getNextPrompt(db: SQLiteDatabase): Promise<CurrentPrompt> {
  const recentEntries = await getRecentEntries(db, 30);
  const recentTexts = recentEntries.map(e => e.prompt_text);
  const recentCategories = (
    JSON.parse((await getSetting(db, 'recent_categories')) ?? '[]') as PromptCategory[]
  );
  const recentDepths = (
    JSON.parse((await getSetting(db, 'recent_depths')) ?? '[]') as number[]
  );

  const eligible = await getEligiblePrompts(db, {
    excludeTexts: recentTexts,
    excludeCategories: recentCategories.slice(-2),
    excludeDepth:
      recentDepths.slice(-3).length === 3 &&
      recentDepths.slice(-3).every(d => d === recentDepths[recentDepths.length - 1])
        ? recentDepths[recentDepths.length - 1]
        : null,
  });

  // If all criteria knock out every prompt (rare: user has been writing a lot),
  // fall back to the unfiltered pool. selectPrompt will still try to apply
  // category/depth variety, and has its own internal fallback to any prompt.
  const allFallback = await getEligiblePrompts(db, {});
  const pool = eligible.length > 0 ? eligible : allFallback;
  const chosenLibraryPrompt = selectPrompt(pool, recentCategories, recentDepths);

  const callCount = parseInt((await getSetting(db, 'prompt_call_count')) ?? '0', 10);
  const useAi = callCount % AI_FREQUENCY === AI_FREQUENCY - 1; // true on call 3, 7, 11, ...
  await setSetting(db, 'prompt_call_count', String(callCount + 1));

  const offlineMode = (await getSetting(db, 'offline_mode')) === 'true';

  let finalText = chosenLibraryPrompt.text;
  const finalCategory = chosenLibraryPrompt.category;

  if (!offlineMode && useAi && API_KEY) {
    const recentTopics = recentEntries.slice(0, 3).map(e =>
      e.response_text.slice(0, 40).replace(/\n/g, ' ')
    );
    const aiText = await generateAiPrompt(
      { category: finalCategory, depth: chosenLibraryPrompt.depth, recentTopics },
      API_KEY
    );
    if (aiText) finalText = aiText;
  }

  await markPromptUsed(db, chosenLibraryPrompt.id);

  const newCategories = [...recentCategories, finalCategory].slice(-6);
  const newDepths = [...recentDepths, chosenLibraryPrompt.depth].slice(-6);
  await setSetting(db, 'recent_categories', JSON.stringify(newCategories));
  await setSetting(db, 'recent_depths', JSON.stringify(newDepths));

  await setSetting(db, 'current_prompt_text', finalText);
  await setSetting(db, 'current_prompt_category', finalCategory);

  return { text: finalText, category: finalCategory };
}

export async function getCurrentPrompt(db: SQLiteDatabase): Promise<CurrentPrompt | null> {
  const text = await getSetting(db, 'current_prompt_text');
  const category = await getSetting(db, 'current_prompt_category') as PromptCategory | null;
  if (!text || !category) return null;
  return { text, category };
}

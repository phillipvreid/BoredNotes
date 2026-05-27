import type { SQLiteDatabase } from 'expo-sqlite';
import { getPromptCount, insertPrompt } from '../db/prompts';
import type { PromptCategory } from '../types';
import library from './library.json';

export async function seedLibraryIfNeeded(db: SQLiteDatabase): Promise<void> {
  const count = await getPromptCount(db);
  if (count > 0) return;

  for (const prompt of library) {
    await insertPrompt(
      db,
      prompt.text,
      prompt.category as PromptCategory,
      prompt.depth as 1 | 2 | 3,
      'library'
    );
  }
}

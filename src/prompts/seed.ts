import type { SQLiteDatabase } from 'expo-sqlite';
import { insertPrompt } from '../db/prompts';
import type { PromptCategory, PromptKind } from '../types';
import library from './library.json';

interface LibraryPrompt {
  text: string;
  category: string;
  depth: number;
  kind?: string;
  slots?: string[];
  themes?: string[];
}

// Top-up seeding: insert any library prompt whose text isn't in the DB yet,
// so new prompts (e.g. micro-games) reach existing installs too.
export async function seedLibraryIfNeeded(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<{ text: string }>('SELECT text FROM prompts', []);
  const existing = new Set(rows.map(r => r.text));

  for (const prompt of library as LibraryPrompt[]) {
    if (existing.has(prompt.text)) continue;
    await insertPrompt(
      db,
      prompt.text,
      prompt.category as PromptCategory,
      prompt.depth as 1 | 2 | 3,
      'library',
      (prompt.kind ?? 'text') as PromptKind,
      prompt.slots
        ? JSON.stringify({ slots: prompt.slots })
        : prompt.themes
          ? JSON.stringify({ themes: prompt.themes })
          : null
    );
  }
}

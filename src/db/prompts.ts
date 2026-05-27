import type { SQLiteDatabase } from 'expo-sqlite';
import type { Prompt, PromptCategory } from '../types';

export async function insertPrompt(
  db: SQLiteDatabase,
  text: string,
  category: PromptCategory,
  depth: 1 | 2 | 3,
  source: 'library' | 'custom' = 'library'
): Promise<void> {
  await db.runAsync(
    'INSERT INTO prompts (text, category, depth, source) VALUES (?, ?, ?, ?)',
    [text, category, depth, source]
  );
}

export async function getPromptCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM prompts', []);
  return row?.n ?? 0;
}

export interface PromptFilter {
  excludeTexts?: string[];
  excludeCategories?: PromptCategory[];
  excludeDepth?: number | null;
}

export async function getEligiblePrompts(
  db: SQLiteDatabase,
  filter: PromptFilter
): Promise<Prompt[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filter.excludeTexts && filter.excludeTexts.length > 0) {
    const placeholders = filter.excludeTexts.map(() => '?').join(',');
    conditions.push(`text NOT IN (${placeholders})`);
    params.push(...filter.excludeTexts);
  }

  if (filter.excludeCategories && filter.excludeCategories.length > 0) {
    const placeholders = filter.excludeCategories.map(() => '?').join(',');
    conditions.push(`category NOT IN (${placeholders})`);
    params.push(...filter.excludeCategories);
  }

  if (filter.excludeDepth != null) {
    conditions.push('depth != ?');
    params.push(filter.excludeDepth);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return db.getAllAsync<Prompt>(`SELECT * FROM prompts ${where}`, params);
}

export async function markPromptUsed(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(
    "UPDATE prompts SET last_used_at = datetime('now') WHERE id = ?",
    [id]
  );
}

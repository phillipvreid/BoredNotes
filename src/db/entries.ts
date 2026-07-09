import type { SQLiteDatabase } from 'expo-sqlite';
import type { Entry, EntryKind, PromptCategory } from '../types';

export interface CreateEntryInput {
  prompt_text: string;
  response_text: string;
  location_label?: string;
  location_lat?: number;
  location_lng?: number;
  entry_mode?: 'prompted' | 'freeform';
  entry_kind?: EntryKind;
  game_data?: string | null;
  category?: PromptCategory | null;
}

export async function createEntry(db: SQLiteDatabase, input: CreateEntryInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO entries (prompt_text, response_text, location_label, location_lat, location_lng, entry_mode, entry_kind, game_data, category)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.prompt_text,
      input.response_text,
      input.location_label ?? null,
      input.location_lat ?? null,
      input.location_lng ?? null,
      input.entry_mode ?? 'prompted',
      input.entry_kind ?? 'text',
      input.game_data ?? null,
      input.category ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export async function getEntry(db: SQLiteDatabase, id: number): Promise<Entry | null> {
  return db.getFirstAsync<Entry>('SELECT * FROM entries WHERE id = ?', [id]);
}

export async function getRecentEntries(db: SQLiteDatabase, limit: number): Promise<Entry[]> {
  return db.getAllAsync<Entry>(
    'SELECT * FROM entries ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
}

export async function countEntries(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM entries', []);
  return row?.n ?? 0;
}

export async function getAllEntries(db: SQLiteDatabase): Promise<Entry[]> {
  return db.getAllAsync<Entry>(
    `SELECT e.*, EXISTS(SELECT 1 FROM media m WHERE m.entry_id = e.id AND m.type = 'photo') as has_photo
     FROM entries e ORDER BY e.created_at DESC`,
    []
  );
}

export async function searchEntries(db: SQLiteDatabase, query: string): Promise<Entry[]> {
  const term = `%${query}%`;
  return db.getAllAsync<Entry>(
    `SELECT e.*, EXISTS(SELECT 1 FROM media m WHERE m.entry_id = e.id AND m.type = 'photo') as has_photo
     FROM entries e
     WHERE e.response_text LIKE ? OR e.prompt_text LIKE ? OR e.location_label LIKE ?
     ORDER BY e.created_at DESC`,
    [term, term, term]
  );
}

export async function getEntriesForMonthDay(db: SQLiteDatabase, month: number, day: number): Promise<Entry[]> {
  return db.getAllAsync<Entry>(
    `SELECT * FROM entries
     WHERE strftime('%m', created_at) = ? AND strftime('%d', created_at) = ?
     ORDER BY created_at DESC`,
    [String(month).padStart(2, '0'), String(day).padStart(2, '0')]
  );
}

export async function getEntriesInRange(db: SQLiteDatabase, from: string, to: string): Promise<Entry[]> {
  return db.getAllAsync<Entry>(
    `SELECT * FROM entries WHERE date(created_at) BETWEEN ? AND ? ORDER BY created_at DESC`,
    [from, to]
  );
}

export async function updateEntryLocation(
  db: SQLiteDatabase,
  id: number,
  label: string
): Promise<void> {
  await db.runAsync('UPDATE entries SET location_label = ? WHERE id = ?', [label, id]);
}

export async function getMonthsWithEntries(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ ym: string }>(
    `SELECT DISTINCT strftime('%Y-%m', created_at) as ym FROM entries ORDER BY ym DESC`,
    []
  );
  return rows.map(r => r.ym);
}

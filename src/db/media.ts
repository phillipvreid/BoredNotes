import type { SQLiteDatabase } from 'expo-sqlite';
import type { MediaItem, MediaType } from '../types';

export async function createMedia(
  db: SQLiteDatabase,
  entryId: number,
  type: MediaType,
  filePath: string
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO media (entry_id, type, file_path) VALUES (?, ?, ?)',
    [entryId, type, filePath]
  );
  return result.lastInsertRowId;
}

export async function getMediaForEntry(db: SQLiteDatabase, entryId: number): Promise<MediaItem[]> {
  return db.getAllAsync<MediaItem>(
    'SELECT * FROM media WHERE entry_id = ? ORDER BY created_at ASC',
    [entryId]
  );
}

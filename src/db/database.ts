import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('borednotes.db');
  await _db.execAsync(CREATE_TABLES_SQL);
  try {
    await _db.execAsync(
      `ALTER TABLE entries ADD COLUMN entry_mode TEXT NOT NULL DEFAULT 'prompted'`
    );
  } catch (e: any) {
    if (!String(e?.message ?? '').includes('duplicate column name')) throw e;
  }
  return _db;
}

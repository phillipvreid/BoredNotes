import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('borednotes.db');
  await _db.execAsync(CREATE_TABLES_SQL);
  await _db.execAsync('PRAGMA foreign_keys = ON');
  try {
    await _db.execAsync(
      `ALTER TABLE entries ADD COLUMN entry_mode TEXT NOT NULL DEFAULT 'prompted'`
    );
  } catch (e: any) {
    if (!String(e?.message ?? '').includes('duplicate column name')) throw e;
  }
  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      radius_m REAL NOT NULL DEFAULT 100,
      created_at DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);
  try {
    await _db.execAsync(
      `ALTER TABLE entries ADD COLUMN place_id INTEGER REFERENCES places(id) ON DELETE SET NULL`
    );
  } catch (e: any) {
    if (!String(e?.message ?? '').includes('duplicate column name')) throw e;
  }
  return _db;
}

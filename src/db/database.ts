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
  // Micro-game columns (rank + defend, and future game kinds).
  const gameColumns = [
    `ALTER TABLE entries ADD COLUMN entry_kind TEXT NOT NULL DEFAULT 'text'`,
    `ALTER TABLE entries ADD COLUMN game_data TEXT`,
    `ALTER TABLE prompts ADD COLUMN kind TEXT NOT NULL DEFAULT 'text'`,
    `ALTER TABLE prompts ADD COLUMN game_config TEXT`,
  ];
  for (const sql of gameColumns) {
    try {
      await _db.execAsync(sql);
    } catch (e: any) {
      if (!String(e?.message ?? '').includes('duplicate column name')) throw e;
    }
  }
  await migratePromptsCategoryCheck(_db);
  return _db;
}

// Older installs created prompts with a CHECK that forbids the 'game' category.
// SQLite can't alter a CHECK, so rebuild the table once when needed.
async function migratePromptsCategoryCheck(db: SQLite.SQLiteDatabase): Promise<void> {
  const master = await db.getFirstAsync<{ sql: string }>(
    `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'prompts'`,
    []
  );
  if (!master?.sql || master.sql.includes(`'game'`)) return;
  await db.execAsync(`
    BEGIN;
    ALTER TABLE prompts RENAME TO prompts_old;
    CREATE TABLE prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('observational','reflective','personal','creative','game')),
      depth INTEGER NOT NULL CHECK (depth IN (1,2,3)),
      source TEXT NOT NULL DEFAULT 'library' CHECK (source IN ('library','custom')),
      last_used_at DATETIME,
      kind TEXT NOT NULL DEFAULT 'text',
      game_config TEXT
    );
    INSERT INTO prompts (id, text, category, depth, source, last_used_at, kind, game_config)
      SELECT id, text, category, depth, source, last_used_at, kind, game_config FROM prompts_old;
    DROP TABLE prompts_old;
    COMMIT;
  `);
}

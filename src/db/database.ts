import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('borednotes.db');
  await _db.execAsync(CREATE_TABLES_SQL);
  return _db;
}

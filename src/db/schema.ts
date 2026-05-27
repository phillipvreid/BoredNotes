export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    location_label TEXT,
    location_lat REAL,
    location_lng REAL
  );

  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('photo', 'voice')),
    file_path TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('observational','reflective','personal','creative')),
    depth INTEGER NOT NULL CHECK (depth IN (1,2,3)),
    source TEXT NOT NULL DEFAULT 'library' CHECK (source IN ('library','custom')),
    last_used_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  PRAGMA foreign_keys = ON;
`;

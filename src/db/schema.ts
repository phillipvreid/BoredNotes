export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    radius_m REAL NOT NULL DEFAULT 100,
    created_at DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    location_label TEXT,
    location_lat REAL,
    location_lng REAL,
    entry_mode TEXT NOT NULL DEFAULT 'prompted' CHECK (entry_mode IN ('prompted', 'freeform')),
    place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
    entry_kind TEXT NOT NULL DEFAULT 'text',
    game_data TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('observational','reflective','personal','creative','game')),
    depth INTEGER NOT NULL CHECK (depth IN (1,2,3)),
    source TEXT NOT NULL DEFAULT 'library' CHECK (source IN ('library','custom')),
    last_used_at DATETIME,
    kind TEXT NOT NULL DEFAULT 'text',
    game_config TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

`;

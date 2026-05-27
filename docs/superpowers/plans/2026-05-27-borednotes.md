# BoredNotes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first iOS journaling app that presents prompts, captures text/photo/voice responses, stores them in SQLite, and lets users browse their history and share styled cards.

**Architecture:** React Native + Expo (managed workflow) with Expo Router for navigation. All data lives in a local SQLite database (`expo-sqlite`) in the app's Documents directory, which iOS backs up to iCloud automatically. AI prompt enhancement calls the Anthropic Claude API with a 2-second timeout and silent fallback to the curated library.

**Tech Stack:** React Native, Expo SDK 52, Expo Router, expo-sqlite, expo-location, expo-image-picker, expo-av, expo-file-system, expo-sharing, react-native-view-shot, @anthropic-ai/sdk, TypeScript, Jest (jest-expo preset), @testing-library/react-native

---

## File Map

```
BoredNotes/
├── app/
│   ├── _layout.tsx          # Root layout: DB init, navigation shell
│   ├── index.tsx            # Home Dashboard screen
│   ├── respond.tsx          # Respond screen (prompt → text/photo/voice → submit)
│   ├── timeline.tsx         # Timeline screen (calendar dot view)
│   ├── entries.tsx          # Entries screen (reverse-chron list + search)
│   ├── reflect.tsx          # Reflect screen ("on this day" + period browser)
│   ├── entry/
│   │   └── [id].tsx         # Entry Detail screen
│   └── share/
│       └── [id].tsx         # Share Card screen
├── src/
│   ├── types.ts             # Shared TypeScript interfaces
│   ├── db/
│   │   ├── database.ts      # DB singleton: open connection, run migrations
│   │   ├── schema.ts        # CREATE TABLE SQL strings
│   │   ├── entries.ts       # Entry CRUD
│   │   ├── media.ts         # Media CRUD
│   │   ├── prompts.ts       # Prompt CRUD + eligibility query
│   │   └── settings.ts      # Settings get/set
│   ├── prompts/
│   │   ├── library.json     # ~70 curated prompts (expand to 200+)
│   │   ├── seed.ts          # Seeds library.json into DB on first launch
│   │   ├── selection.ts     # Pure prompt-selection algorithm
│   │   └── ai.ts            # Claude API call + 2s timeout + fallback
│   ├── location/
│   │   └── location.ts      # GPS capture + reverse geocode + offline queue
│   ├── media/
│   │   └── capture.ts       # Photo picker/camera + voice recorder
│   └── share/
│       ├── templates.ts     # 4 template definitions (colours, fonts, layout flags)
│       └── renderer.tsx     # ShareCard component + captureRef export
├── __tests__/
│   ├── prompts/
│   │   └── selection.test.ts
│   └── prompts/
│       └── ai.test.ts
└── .env                     # EXPO_PUBLIC_ANTHROPIC_API_KEY=...
```

---

## Task 1: Dev Environment Setup

**Files:** none (machine setup only)

- [ ] **Step 1: Install Node.js**

  Download and install Node.js LTS from https://nodejs.org. Verify:
  ```bash
  node --version   # should print v20.x or later
  npm --version    # should print 10.x or later
  ```

- [ ] **Step 2: Install Expo CLI**

  ```bash
  npm install -g expo-cli eas-cli
  expo --version   # should print 7.x or later
  ```

- [ ] **Step 3: Install Xcode**

  Open the Mac App Store, install Xcode (≥ 15). After install:
  ```bash
  sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
  xcodebuild -version   # should print Xcode 15.x
  ```

- [ ] **Step 4: Install Expo Go on your iPhone**

  Search "Expo Go" in the App Store and install it. You'll use this to test the app on your real device during development.

- [ ] **Step 5: Get an Anthropic API key**

  Go to https://console.anthropic.com, sign up, and create an API key. Save it — you'll add it to `.env` in Task 2.

---

## Task 2: Create Expo Project + Install Dependencies

**Files:** Creates the entire project scaffold

- [ ] **Step 1: Create the Expo project**

  From `C:\Users\PVR12\BoredNotes` (the repo root, which already has git):
  ```bash
  npx create-expo-app@latest BoredNotes --template blank-typescript
  # When prompted, move everything into the repo root:
  # Actually run from a temp location, then copy contents into C:\Users\PVR12\BoredNotes
  ```

  **Simpler approach** — scaffold directly into the existing directory:
  ```bash
  cd C:\Users\PVR12\BoredNotes
  npx create-expo-app@latest . --template blank-typescript
  ```
  Answer "yes" when asked if you want to use the current directory.

- [ ] **Step 2: Install Expo Router**

  ```bash
  npx expo install expo-router
  ```

  Update `app.json` to add the scheme and entry point:
  ```json
  {
    "expo": {
      "name": "BoredNotes",
      "slug": "borednotes",
      "scheme": "borednotes",
      "version": "1.0.0",
      "orientation": "portrait",
      "ios": {
        "supportsTablet": false,
        "bundleIdentifier": "com.yourname.borednotes"
      },
      "plugins": ["expo-router"],
      "experiments": {
        "typedRoutes": true
      }
    }
  }
  ```

  Update `package.json` main field:
  ```json
  "main": "expo-router/entry"
  ```

- [ ] **Step 3: Install all dependencies**

  ```bash
  npx expo install expo-sqlite expo-location expo-image-picker expo-av \
    expo-file-system expo-sharing expo-media-library
  npm install react-native-view-shot @anthropic-ai/sdk
  npx expo install --fix
  ```

- [ ] **Step 4: Install dev/test dependencies**

  ```bash
  npm install -D jest jest-expo @testing-library/react-native \
    @testing-library/jest-native @types/jest
  ```

  Add to `package.json`:
  ```json
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"],
    "moduleNameMapper": {
      "^expo-sqlite$": "<rootDir>/__mocks__/expo-sqlite.ts"
    }
  },
  "scripts": {
    "test": "jest"
  }
  ```

- [ ] **Step 5: Create .env file**

  Create `C:\Users\PVR12\BoredNotes\.env`:
  ```
  EXPO_PUBLIC_ANTHROPIC_API_KEY=your_api_key_here
  ```
  Add `.env` to `.gitignore`:
  ```bash
  echo ".env" >> .gitignore
  ```

- [ ] **Step 6: Create src directory structure**

  ```bash
  mkdir -p src/db src/prompts src/location src/media src/share
  mkdir -p __tests__/prompts app/entry app/share
  ```

- [ ] **Step 7: Verify the app runs**

  ```bash
  npx expo start
  ```
  Scan the QR code with your iPhone's camera. Expo Go should open and show "Welcome to Expo". If it does, the scaffold is working.

- [ ] **Step 8: Commit**

  ```bash
  git add -A
  git commit -m "feat: scaffold Expo project with dependencies"
  ```

---

## Task 3: TypeScript Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write types**

  Create `src/types.ts`:
  ```typescript
  export type PromptCategory = 'observational' | 'reflective' | 'personal' | 'creative';
  export type PromptSource = 'library' | 'custom';
  export type MediaType = 'photo' | 'voice';

  export interface Entry {
    id: number;
    prompt_text: string;
    response_text: string;
    created_at: string; // ISO 8601
    location_label: string | null;
    location_lat: number | null;
    location_lng: number | null;
  }

  export interface MediaItem {
    id: number;
    entry_id: number;
    type: MediaType;
    file_path: string;
    created_at: string;
  }

  export interface Prompt {
    id: number;
    text: string;
    category: PromptCategory;
    depth: 1 | 2 | 3;
    source: PromptSource;
    last_used_at: string | null;
  }

  export interface CurrentPrompt {
    text: string;
    category: PromptCategory;
  }

  export interface EntryWithMedia extends Entry {
    media: MediaItem[];
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/types.ts
  git commit -m "feat: add shared TypeScript types"
  ```

---

## Task 4: Database Schema + Connection

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/database.ts`
- Create: `__mocks__/expo-sqlite.ts`

- [ ] **Step 1: Write schema SQL**

  Create `src/db/schema.ts`:
  ```typescript
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
  ```

- [ ] **Step 2: Write DB singleton**

  Create `src/db/database.ts`:
  ```typescript
  import * as SQLite from 'expo-sqlite';
  import { CREATE_TABLES_SQL } from './schema';

  let _db: SQLite.SQLiteDatabase | null = null;

  export async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (_db) return _db;
    _db = await SQLite.openDatabaseAsync('borednotes.db');
    await _db.execAsync(CREATE_TABLES_SQL);
    return _db;
  }
  ```

- [ ] **Step 3: Create expo-sqlite mock for Jest**

  Create `__mocks__/expo-sqlite.ts`:
  ```typescript
  // In-memory stub for Jest — keeps tests fast without native modules
  const rows: Record<string, any[]> = {};

  const db = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    withTransactionAsync: jest.fn().mockImplementation(async (fn: () => Promise<void>) => fn()),
  };

  export const openDatabaseAsync = jest.fn().mockResolvedValue(db);
  export type SQLiteDatabase = typeof db;
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/db/schema.ts src/db/database.ts __mocks__/expo-sqlite.ts
  git commit -m "feat: add database schema and connection singleton"
  ```

---

## Task 5: Settings DB Layer

**Files:**
- Create: `src/db/settings.ts`

- [ ] **Step 1: Write settings module**

  Create `src/db/settings.ts`:
  ```typescript
  import type { SQLiteDatabase } from 'expo-sqlite';

  export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    return row?.value ?? null;
  }

  export async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/db/settings.ts
  git commit -m "feat: add settings DB layer"
  ```

---

## Task 6: Entries DB Layer

**Files:**
- Create: `src/db/entries.ts`

- [ ] **Step 1: Write entries module**

  Create `src/db/entries.ts`:
  ```typescript
  import type { SQLiteDatabase } from 'expo-sqlite';
  import type { Entry } from '../types';

  export interface CreateEntryInput {
    prompt_text: string;
    response_text: string;
    location_label?: string;
    location_lat?: number;
    location_lng?: number;
  }

  export async function createEntry(db: SQLiteDatabase, input: CreateEntryInput): Promise<number> {
    const result = await db.runAsync(
      `INSERT INTO entries (prompt_text, response_text, location_label, location_lat, location_lng)
       VALUES (?, ?, ?, ?, ?)`,
      [
        input.prompt_text,
        input.response_text,
        input.location_label ?? null,
        input.location_lat ?? null,
        input.location_lng ?? null,
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

  export async function getAllEntries(db: SQLiteDatabase): Promise<Entry[]> {
    return db.getAllAsync<Entry>('SELECT * FROM entries ORDER BY created_at DESC', []);
  }

  export async function searchEntries(db: SQLiteDatabase, query: string): Promise<Entry[]> {
    const term = `%${query}%`;
    return db.getAllAsync<Entry>(
      `SELECT * FROM entries
       WHERE response_text LIKE ? OR prompt_text LIKE ? OR location_label LIKE ?
       ORDER BY created_at DESC`,
      [term, term, term]
    );
  }

  export async function getEntriesForDate(db: SQLiteDatabase, dateStr: string): Promise<Entry[]> {
    // dateStr format: 'YYYY-MM-DD'
    return db.getAllAsync<Entry>(
      `SELECT * FROM entries WHERE date(created_at) = ? ORDER BY created_at ASC`,
      [dateStr]
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

  export async function getDatesWithEntries(db: SQLiteDatabase, yearMonth: string): Promise<string[]> {
    // yearMonth format: 'YYYY-MM'
    const rows = await db.getAllAsync<{ d: string }>(
      `SELECT DISTINCT date(created_at) as d FROM entries
       WHERE strftime('%Y-%m', created_at) = ? ORDER BY d`,
      [yearMonth]
    );
    return rows.map(r => r.d);
  }

  export async function updateEntryLocation(
    db: SQLiteDatabase,
    id: number,
    label: string
  ): Promise<void> {
    await db.runAsync('UPDATE entries SET location_label = ? WHERE id = ?', [label, id]);
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/db/entries.ts
  git commit -m "feat: add entries DB layer"
  ```

---

## Task 7: Media DB Layer

**Files:**
- Create: `src/db/media.ts`

- [ ] **Step 1: Write media module**

  Create `src/db/media.ts`:
  ```typescript
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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/db/media.ts
  git commit -m "feat: add media DB layer"
  ```

---

## Task 8: Prompts DB Layer

**Files:**
- Create: `src/db/prompts.ts`

- [ ] **Step 1: Write prompts module**

  Create `src/db/prompts.ts`:
  ```typescript
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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/db/prompts.ts
  git commit -m "feat: add prompts DB layer"
  ```

---

## Task 9: Prompt Selection Algorithm

**Files:**
- Create: `src/prompts/selection.ts`
- Create: `__tests__/prompts/selection.test.ts`

- [ ] **Step 1: Write the failing tests**

  Create `__tests__/prompts/selection.test.ts`:
  ```typescript
  import { selectPrompt } from '../../src/prompts/selection';
  import type { Prompt } from '../../src/types';

  const makePrompt = (overrides: Partial<Prompt>): Prompt => ({
    id: 1, text: 'Test prompt', category: 'observational', depth: 1,
    source: 'library', last_used_at: null, ...overrides,
  });

  describe('selectPrompt', () => {
    it('picks a prompt from the available list', () => {
      const prompts = [makePrompt({ id: 1 }), makePrompt({ id: 2 })];
      const result = selectPrompt(prompts, [], []);
      expect(prompts).toContain(result);
    });

    it('avoids categories used in last 2 entries', () => {
      const obs = makePrompt({ id: 1, category: 'observational' });
      const ref = makePrompt({ id: 2, category: 'reflective' });
      const prompts = [obs, ref];
      // last 2 categories were observational — should pick reflective
      const result = selectPrompt(prompts, ['observational', 'observational'], []);
      expect(result.category).toBe('reflective');
    });

    it('avoids depth repeated 3 times in a row', () => {
      const depth1 = makePrompt({ id: 1, depth: 1, category: 'observational' });
      const depth2 = makePrompt({ id: 2, depth: 2, category: 'reflective' });
      const prompts = [depth1, depth2];
      const result = selectPrompt(prompts, [], [1, 1, 1]);
      expect(result.depth).toBe(2);
    });

    it('falls back to full list if no candidates after filtering', () => {
      const obs = makePrompt({ id: 1, category: 'observational' });
      // All candidates filtered, should fall back
      const result = selectPrompt([obs], ['observational', 'observational'], []);
      expect(result).toBe(obs);
    });

    it('throws if available list is empty', () => {
      expect(() => selectPrompt([], [], [])).toThrow('No prompts available');
    });
  });
  ```

- [ ] **Step 2: Run tests — verify they fail**

  ```bash
  npx jest __tests__/prompts/selection.test.ts
  ```
  Expected: FAIL — `Cannot find module '../../src/prompts/selection'`

- [ ] **Step 3: Implement selection algorithm**

  Create `src/prompts/selection.ts`:
  ```typescript
  import type { Prompt, PromptCategory } from '../types';

  export function selectPrompt(
    available: Prompt[],
    recentCategories: PromptCategory[],
    recentDepths: number[]
  ): Prompt {
    if (available.length === 0) throw new Error('No prompts available');

    const lastTwoCategories = recentCategories.slice(-2);
    const lastThreeDepths = recentDepths.slice(-3);
    const forbiddenDepth =
      lastThreeDepths.length === 3 && lastThreeDepths.every(d => d === lastThreeDepths[0])
        ? lastThreeDepths[0]
        : null;

    let candidates = available.filter(p => {
      if (lastTwoCategories.includes(p.category)) return false;
      if (forbiddenDepth !== null && p.depth === forbiddenDepth) return false;
      return true;
    });

    if (candidates.length === 0) candidates = available;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  ```

- [ ] **Step 4: Run tests — verify they pass**

  ```bash
  npx jest __tests__/prompts/selection.test.ts
  ```
  Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

  ```bash
  git add src/prompts/selection.ts __tests__/prompts/selection.test.ts
  git commit -m "feat: add prompt selection algorithm with tests"
  ```

---

## Task 10: Prompt Library JSON + Seed Function

**Files:**
- Create: `src/prompts/library.json`
- Create: `src/prompts/seed.ts`

- [ ] **Step 1: Create the prompt library**

  Create `src/prompts/library.json`:
  ```json
  [
    {"text": "What's one sound you can hear right now that you'd normally tune out?", "category": "observational", "depth": 1},
    {"text": "What colour appears most in your immediate surroundings?", "category": "observational", "depth": 1},
    {"text": "What's the closest object to your left hand?", "category": "observational", "depth": 1},
    {"text": "What does the light look like where you are right now?", "category": "observational", "depth": 1},
    {"text": "Name three things you can smell, even faintly.", "category": "observational", "depth": 1},
    {"text": "What's the temperature of the air on your skin?", "category": "observational", "depth": 1},
    {"text": "What are two people near you doing right now?", "category": "observational", "depth": 1},
    {"text": "What's the first thing your eyes land on when you look up?", "category": "observational", "depth": 1},
    {"text": "What would a stranger notice about this place that you've stopped noticing?", "category": "observational", "depth": 1},
    {"text": "What's the weather doing outside right now?", "category": "observational", "depth": 1},
    {"text": "What's something around you that tells a story about the person who made it?", "category": "observational", "depth": 2},
    {"text": "If you had to describe this moment to someone who's never been here, what would you say?", "category": "observational", "depth": 2},
    {"text": "What's the most worn, weathered thing in your current environment?", "category": "observational", "depth": 2},
    {"text": "What's something in your field of view that wasn't there a year ago?", "category": "observational", "depth": 2},
    {"text": "If you had to photograph one thing right now to remember this moment, what would it be?", "category": "observational", "depth": 2},
    {"text": "What's the most human-made thing you can see, and who might have made it?", "category": "observational", "depth": 2},
    {"text": "What does this place smell like, and what does that remind you of?", "category": "observational", "depth": 2},
    {"text": "What about your current surroundings would surprise the version of you from ten years ago?", "category": "observational", "depth": 3},
    {"text": "If this location had a mood, what would it be and why?", "category": "observational", "depth": 3},
    {"text": "What's something around you that feels out of place, and what does that say?", "category": "observational", "depth": 3},
    {"text": "What's one thing that went well today, however small?", "category": "reflective", "depth": 1},
    {"text": "What's the last thing that made you laugh?", "category": "reflective", "depth": 1},
    {"text": "What's something you're looking forward to in the next 24 hours?", "category": "reflective", "depth": 1},
    {"text": "What's one decision you made today?", "category": "reflective", "depth": 1},
    {"text": "What's a song stuck in your head right now?", "category": "reflective", "depth": 1},
    {"text": "What did you eat last, and did you enjoy it?", "category": "reflective", "depth": 1},
    {"text": "Name one person you thought about today.", "category": "reflective", "depth": 1},
    {"text": "What time did you wake up, and was that intentional?", "category": "reflective", "depth": 1},
    {"text": "What's something you said today that you're glad you said?", "category": "reflective", "depth": 2},
    {"text": "What's something you meant to do today that didn't happen?", "category": "reflective", "depth": 2},
    {"text": "What's been on your mind most this week?", "category": "reflective", "depth": 2},
    {"text": "What's a small habit you've been trying to build or break lately?", "category": "reflective", "depth": 2},
    {"text": "What's something you're putting off, and what would it take to start?", "category": "reflective", "depth": 2},
    {"text": "Who did you talk to today, and how did those interactions leave you feeling?", "category": "reflective", "depth": 2},
    {"text": "What's something you learned or realized in the past few days?", "category": "reflective", "depth": 2},
    {"text": "What's a belief you hold now that you didn't hold five years ago?", "category": "reflective", "depth": 3},
    {"text": "What's something you've been avoiding thinking about?", "category": "reflective", "depth": 3},
    {"text": "If this week were a chapter in a book, what would you title it?", "category": "reflective", "depth": 3},
    {"text": "What's something you wish you could say to someone, but haven't?", "category": "reflective", "depth": 3},
    {"text": "What does 'a good day' mean to you right now, and does your life have many of them?", "category": "reflective", "depth": 3},
    {"text": "What's your current comfort food, and when did it become that?", "category": "personal", "depth": 1},
    {"text": "What's a show, book, or podcast you've been into lately?", "category": "personal", "depth": 1},
    {"text": "What's something you've bought recently that was worth it?", "category": "personal", "depth": 1},
    {"text": "What's the most-used app on your phone right now, and how do you feel about that?", "category": "personal", "depth": 1},
    {"text": "What's a skill you're proud of that most people don't know about?", "category": "personal", "depth": 1},
    {"text": "What's your go-to order at a coffee shop?", "category": "personal", "depth": 1},
    {"text": "What's something you do differently from how most people do it?", "category": "personal", "depth": 2},
    {"text": "What's a goal you had at the start of this year? How's it going?", "category": "personal", "depth": 2},
    {"text": "What's a place you've been that you'd return to immediately if you could?", "category": "personal", "depth": 2},
    {"text": "What's a compliment you've received that stuck with you?", "category": "personal", "depth": 2},
    {"text": "What's something you've changed your mind about in the last year?", "category": "personal", "depth": 2},
    {"text": "What's a quality you admire in others that you wish you had more of?", "category": "personal", "depth": 2},
    {"text": "What does your ideal ordinary Tuesday look like?", "category": "personal", "depth": 3},
    {"text": "What's something you've been carrying that you'd like to put down?", "category": "personal", "depth": 3},
    {"text": "What's a version of yourself that you've outgrown?", "category": "personal", "depth": 3},
    {"text": "What's something you're genuinely proud of that you don't talk about enough?", "category": "personal", "depth": 3},
    {"text": "What would you do differently if no one was watching?", "category": "personal", "depth": 3},
    {"text": "What's a fear you've gotten better at living with?", "category": "personal", "depth": 3},
    {"text": "If this moment were a movie scene, what genre would it be?", "category": "creative", "depth": 1},
    {"text": "Give the person nearest to you a superhero name based only on what you can observe.", "category": "creative", "depth": 1},
    {"text": "If the sounds around you were a song, what would it be called?", "category": "creative", "depth": 1},
    {"text": "What animal would best describe your energy right now?", "category": "creative", "depth": 1},
    {"text": "If you had to write one sentence about today for a future historian, what would it say?", "category": "creative", "depth": 1},
    {"text": "Describe your current mood as a weather system.", "category": "creative", "depth": 2},
    {"text": "If your life right now were a book, what section of the bookstore would it be in?", "category": "creative", "depth": 2},
    {"text": "Write a two-sentence story about a stranger you've seen today.", "category": "creative", "depth": 2},
    {"text": "If you could redesign one thing about where you are right now, what would it be?", "category": "creative", "depth": 2},
    {"text": "What would a documentary crew find interesting about the last hour of your life?", "category": "creative", "depth": 2},
    {"text": "If your past self from five years ago were watching you right now, what would they think?", "category": "creative", "depth": 3},
    {"text": "What's a story you keep telling about yourself that might not be true anymore?", "category": "creative", "depth": 3},
    {"text": "If you could send a postcard from this exact moment to your future self, what would it say?", "category": "creative", "depth": 3},
    {"text": "Describe the version of yourself you're becoming.", "category": "creative", "depth": 3}
  ]
  ```

- [ ] **Step 2: Write seed function**

  Create `src/prompts/seed.ts`:
  ```typescript
  import type { SQLiteDatabase } from 'expo-sqlite';
  import { getPromptCount, insertPrompt } from '../db/prompts';
  import type { PromptCategory } from '../types';
  import library from './library.json';

  export async function seedLibraryIfNeeded(db: SQLiteDatabase): Promise<void> {
    const count = await getPromptCount(db);
    if (count > 0) return;

    for (const prompt of library) {
      await insertPrompt(
        db,
        prompt.text,
        prompt.category as PromptCategory,
        prompt.depth as 1 | 2 | 3,
        'library'
      );
    }
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/prompts/library.json src/prompts/seed.ts
  git commit -m "feat: add prompt library (70 prompts) and seed function"
  ```

---

## Task 11: AI Prompt Service

**Files:**
- Create: `src/prompts/ai.ts`
- Create: `__tests__/prompts/ai.test.ts`

- [ ] **Step 1: Write failing tests**

  Create `__tests__/prompts/ai.test.ts`:
  ```typescript
  import { generateAiPrompt } from '../../src/prompts/ai';

  const MOCK_KEY = 'test-key';

  describe('generateAiPrompt', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
    });
    afterEach(() => jest.useRealTimers());

    it('returns a prompt string on success', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'What is the texture of the surface beneath you?' }],
        }),
      } as any);

      const result = await generateAiPrompt(
        { category: 'observational', depth: 1, recentTopics: [] },
        MOCK_KEY
      );
      expect(result).toBe('What is the texture of the surface beneath you?');
    });

    it('returns null on network error', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));
      const result = await generateAiPrompt(
        { category: 'reflective', depth: 2, recentTopics: [] },
        MOCK_KEY
      );
      expect(result).toBeNull();
    });

    it('returns null on non-ok response', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({ ok: false } as any);
      const result = await generateAiPrompt(
        { category: 'personal', depth: 1, recentTopics: [] },
        MOCK_KEY
      );
      expect(result).toBeNull();
    });
  });
  ```

- [ ] **Step 2: Run tests — verify they fail**

  ```bash
  npx jest __tests__/prompts/ai.test.ts
  ```
  Expected: FAIL — `Cannot find module '../../src/prompts/ai'`

- [ ] **Step 3: Implement AI prompt service**

  Create `src/prompts/ai.ts`:
  ```typescript
  import type { PromptCategory } from '../types';

  export interface AiPromptInput {
    category: PromptCategory;
    depth: 1 | 2 | 3;
    recentTopics: string[];
  }

  const TIMEOUT_MS = 2000;

  export async function generateAiPrompt(
    input: AiPromptInput,
    apiKey: string
  ): Promise<string | null> {
    const depthLabel = ['light and quick', 'moderately thoughtful', 'deep and personal'][input.depth - 1];
    const topicsLine = input.recentTopics.length > 0
      ? `Recent topics the user has responded to: ${input.recentTopics.join(', ')}.`
      : '';

    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `Generate one ${depthLabel} journaling prompt in the "${input.category}" category. ${topicsLine} The prompt should be a single question, under 20 words, written in second person. Return only the prompt text, no quotes, no explanation.`,
      }],
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body,
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.content?.[0]?.text?.trim() ?? null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  ```

- [ ] **Step 4: Run tests — verify they pass**

  ```bash
  npx jest __tests__/prompts/ai.test.ts
  ```
  Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

  ```bash
  git add src/prompts/ai.ts __tests__/prompts/ai.test.ts
  git commit -m "feat: add AI prompt service with timeout and fallback"
  ```

---

## Task 12: Prompt Orchestrator

**Files:**
- Create: `src/prompts/next.ts`

This module ties together the DB query, selection algorithm, AI call, and settings persistence into a single `getNextPrompt()` function called after every entry submission.

- [ ] **Step 1: Write the orchestrator**

  Create `src/prompts/next.ts`:
  ```typescript
  import type { SQLiteDatabase } from 'expo-sqlite';
  import type { CurrentPrompt, PromptCategory } from '../types';
  import { getRecentEntries } from '../db/entries';
  import { getEligiblePrompts, markPromptUsed } from '../db/prompts';
  import { getSetting, setSetting } from '../db/settings';
  import { selectPrompt } from './selection';
  import { generateAiPrompt } from './ai';

  const AI_FREQUENCY = 4; // every 4th prompt is AI-generated
  const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

  export async function getNextPrompt(db: SQLiteDatabase): Promise<CurrentPrompt> {
    // Load context for selection
    const recentEntries = await getRecentEntries(db, 30);
    const recentTexts = recentEntries.map(e => e.prompt_text);
    const recentCategories = (
      JSON.parse((await getSetting(db, 'recent_categories')) ?? '[]') as PromptCategory[]
    );
    const recentDepths = (
      JSON.parse((await getSetting(db, 'recent_depths')) ?? '[]') as number[]
    );

    // Determine target category/depth from selection algorithm
    const eligible = await getEligiblePrompts(db, {
      excludeTexts: recentTexts,
      excludeCategories: recentCategories.slice(-2),
      excludeDepth:
        recentDepths.slice(-3).length === 3 &&
        recentDepths.slice(-3).every(d => d === recentDepths[recentDepths.length - 1])
          ? recentDepths[recentDepths.length - 1]
          : null,
    });

    const allFallback = await getEligiblePrompts(db, {});
    const pool = eligible.length > 0 ? eligible : allFallback;
    const chosenLibraryPrompt = selectPrompt(pool, recentCategories, recentDepths);

    // Decide whether to try AI (~1 in AI_FREQUENCY)
    const callCount = parseInt((await getSetting(db, 'prompt_call_count')) ?? '0', 10);
    const useAi = callCount % AI_FREQUENCY === AI_FREQUENCY - 1;
    await setSetting(db, 'prompt_call_count', String(callCount + 1));

    let finalText = chosenLibraryPrompt.text;
    const finalCategory = chosenLibraryPrompt.category;

    if (useAi && API_KEY) {
      const recentTopics = recentEntries.slice(0, 3).map(e =>
        e.response_text.slice(0, 40).replace(/\n/g, ' ')
      );
      const aiText = await generateAiPrompt(
        { category: finalCategory, depth: chosenLibraryPrompt.depth, recentTopics },
        API_KEY
      );
      if (aiText) finalText = aiText;
    }

    // Mark library prompt used (even if we ended up using AI text for same category/depth)
    await markPromptUsed(db, chosenLibraryPrompt.id);

    // Persist for next selection
    const newCategories = [...recentCategories, finalCategory].slice(-6);
    const newDepths = [...recentDepths, chosenLibraryPrompt.depth].slice(-6);
    await setSetting(db, 'recent_categories', JSON.stringify(newCategories));
    await setSetting(db, 'recent_depths', JSON.stringify(newDepths));

    // Persist current prompt so it survives app restarts
    await setSetting(db, 'current_prompt_text', finalText);
    await setSetting(db, 'current_prompt_category', finalCategory);

    return { text: finalText, category: finalCategory };
  }

  export async function getCurrentPrompt(db: SQLiteDatabase): Promise<CurrentPrompt | null> {
    const text = await getSetting(db, 'current_prompt_text');
    const category = await getSetting(db, 'current_prompt_category') as PromptCategory | null;
    if (!text || !category) return null;
    return { text, category };
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/prompts/next.ts
  git commit -m "feat: add prompt orchestrator (selection + AI + persistence)"
  ```

---

## Task 13: Location Service

**Files:**
- Create: `src/location/location.ts`

- [ ] **Step 1: Write location service**

  Create `src/location/location.ts`:
  ```typescript
  import * as Location from 'expo-location';
  import type { SQLiteDatabase } from 'expo-sqlite';
  import { updateEntryLocation } from '../db/entries';
  import { getSetting, setSetting } from '../db/settings';

  export interface CapturedLocation {
    lat: number;
    lng: number;
    label: string | null;
  }

  export async function requestLocationPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  export async function captureLocation(): Promise<CapturedLocation | null> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = loc.coords;
      const label = await reverseGeocode(lat, lng);
      return { lat, lng, label };
    } catch {
      return null;
    }
  }

  async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const place = results[0];
      if (!place) return null;
      const parts = [place.name, place.city, place.region].filter(Boolean);
      return parts.slice(0, 2).join(', ') || null;
    } catch {
      return null;
    }
  }

  // Queue an entry whose location label needs resolving (was offline at submission)
  export async function queuePendingGeocode(
    db: SQLiteDatabase,
    entryId: number,
    lat: number,
    lng: number
  ): Promise<void> {
    const existing = JSON.parse((await getSetting(db, 'pending_geocodes')) ?? '[]');
    existing.push({ entryId, lat, lng });
    await setSetting(db, 'pending_geocodes', JSON.stringify(existing));
  }

  // Called on app open when online — resolves any queued geocodes
  export async function flushPendingGeocodes(db: SQLiteDatabase): Promise<void> {
    const raw = await getSetting(db, 'pending_geocodes');
    if (!raw) return;
    const queue: { entryId: number; lat: number; lng: number }[] = JSON.parse(raw);
    if (queue.length === 0) return;

    const remaining = [];
    for (const item of queue) {
      const label = await reverseGeocode(item.lat, item.lng);
      if (label) {
        await updateEntryLocation(db, item.entryId, label);
      } else {
        remaining.push(item);
      }
    }
    await setSetting(db, 'pending_geocodes', JSON.stringify(remaining));
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/location/location.ts
  git commit -m "feat: add location service with offline geocode queue"
  ```

---

## Task 14: Media Capture Service

**Files:**
- Create: `src/media/capture.ts`

- [ ] **Step 1: Write media capture module**

  Create `src/media/capture.ts`:
  ```typescript
  import * as ImagePicker from 'expo-image-picker';
  import { Audio } from 'expo-av';
  import * as FileSystem from 'expo-file-system';

  const MEDIA_DIR = `${FileSystem.documentDirectory}bn_media/`;

  async function ensureMediaDir(): Promise<void> {
    const info = await FileSystem.getInfoAsync(MEDIA_DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  }

  export async function pickPhoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return null;

    await ensureMediaDir();
    const src = result.assets[0].uri;
    const dest = `${MEDIA_DIR}photo_${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: src, to: dest });
    return dest;
  }

  export async function takePhoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return null;

    await ensureMediaDir();
    const src = result.assets[0].uri;
    const dest = `${MEDIA_DIR}photo_${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: src, to: dest });
    return dest;
  }

  export async function startVoiceRecording(): Promise<Audio.Recording> {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    return recording;
  }

  export async function stopVoiceRecording(recording: Audio.Recording): Promise<string | null> {
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    if (!uri) return null;

    await ensureMediaDir();
    const dest = `${MEDIA_DIR}voice_${Date.now()}.m4a`;
    await FileSystem.moveAsync({ from: uri, to: dest });
    return dest;
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/media/capture.ts
  git commit -m "feat: add media capture service (photo + voice)"
  ```

---

## Task 15: Share Card Templates + Renderer

**Files:**
- Create: `src/share/templates.ts`
- Create: `src/share/renderer.tsx`

- [ ] **Step 1: Define templates**

  Create `src/share/templates.ts`:
  ```typescript
  export interface ShareTemplate {
    id: string;
    label: string;
    bg: string;
    textColor: string;
    promptColor: string;
    metaColor: string;
    fontFamily: 'serif' | 'sans-serif';
    accentColor?: string;
    accentStyle?: 'sidebar' | 'topbar' | 'none';
    cardBg?: string;
  }

  export const TEMPLATES: ShareTemplate[] = [
    {
      id: 'minimal',
      label: 'Minimal',
      bg: '#ffffff',
      textColor: '#222222',
      promptColor: '#888888',
      metaColor: '#bbbbbb',
      fontFamily: 'serif',
      accentStyle: 'none',
    },
    {
      id: 'warm',
      label: 'Warm',
      bg: '#f5e6d3',
      textColor: '#4a3728',
      promptColor: '#8a6a50',
      metaColor: '#b8956e',
      fontFamily: 'serif',
      accentColor: '#c9a96e',
      accentStyle: 'sidebar',
    },
    {
      id: 'dark',
      label: 'Dark',
      bg: '#0f0f1a',
      textColor: '#dddddd',
      promptColor: '#6060a0',
      metaColor: '#3a3a6a',
      fontFamily: 'sans-serif',
      accentColor: '#4040a0',
      accentStyle: 'sidebar',
    },
    {
      id: 'bold',
      label: 'Bold',
      bg: '#1a1a1a',
      textColor: '#ffffff',
      promptColor: '#666666',
      metaColor: '#555555',
      fontFamily: 'sans-serif',
      accentStyle: 'topbar',
      accentColor: '#f59e0b',
    },
  ];

  export const DEFAULT_TEMPLATE_ID = 'minimal';
  ```

- [ ] **Step 2: Write the share card renderer component**

  Create `src/share/renderer.tsx`:
  ```typescript
  import React from 'react';
  import { View, Text, Image, StyleSheet } from 'react-native';
  import type { ShareTemplate } from './templates';

  interface ShareCardProps {
    template: ShareTemplate;
    promptText: string;
    responseText: string;
    date: string | null;
    location: string | null;
    photoUri: string | null;
    showDate: boolean;
    showLocation: boolean;
  }

  export const ShareCard = React.forwardRef<View, ShareCardProps>(
    ({ template, promptText, responseText, date, location, photoUri, showDate, showLocation }, ref) => {
      const isSerif = template.fontFamily === 'serif';

      return (
        <View ref={ref} style={[styles.card, { backgroundColor: template.bg, width: 320 }]}>
          {template.accentStyle === 'topbar' && (
            <View style={[styles.topbar, { backgroundColor: template.accentColor }]} />
          )}
          <View style={styles.inner}>
            {template.accentStyle === 'sidebar' && (
              <View style={[styles.sidebar, { backgroundColor: template.accentColor }]} />
            )}
            <View style={styles.body}>
              <Text style={[styles.appLabel, { color: template.metaColor }]}>BORED NOTES</Text>
              <Text style={[styles.prompt, { color: template.promptColor, fontStyle: isSerif ? 'italic' : 'normal' }]}>
                {`"${promptText}"`}
              </Text>
              {photoUri && (
                <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
              )}
              <Text style={[styles.response, { color: template.textColor, fontFamily: isSerif ? 'Georgia' : undefined }]}>
                {responseText}
              </Text>
              {(showDate || showLocation) && (
                <Text style={[styles.meta, { color: template.metaColor }]}>
                  {[showDate && date, showLocation && location].filter(Boolean).join('  ·  ')}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    }
  );

  const styles = StyleSheet.create({
    card: { borderRadius: 12, overflow: 'hidden' },
    topbar: { height: 4 },
    inner: { flexDirection: 'row' },
    sidebar: { width: 4 },
    body: { flex: 1, padding: 20, gap: 10 },
    appLabel: { fontSize: 9, letterSpacing: 2 },
    prompt: { fontSize: 11 },
    photo: { width: '100%', height: 140, borderRadius: 6 },
    response: { fontSize: 14, lineHeight: 22 },
    meta: { fontSize: 10, marginTop: 4 },
  });
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/share/templates.ts src/share/renderer.tsx
  git commit -m "feat: add share card templates and renderer component"
  ```

---

## Task 16: App Root Layout + DB Initialization

**Files:**
- Create/replace: `app/_layout.tsx`

- [ ] **Step 1: Write root layout**

  Create `app/_layout.tsx`:
  ```typescript
  import { useEffect, useState } from 'react';
  import { Stack } from 'expo-router';
  import { View, ActivityIndicator } from 'react-native';
  import { getDb } from '../src/db/database';
  import { seedLibraryIfNeeded } from '../src/prompts/seed';
  import { flushPendingGeocodes } from '../src/location/location';

  export default function RootLayout() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
      (async () => {
        const db = await getDb();
        await seedLibraryIfNeeded(db);
        // Best-effort: don't block startup if geocoding fails
        flushPendingGeocodes(db).catch(() => {});
        setReady(true);
      })();
    }, []);

    if (!ready) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="respond" options={{ presentation: 'modal' }} />
        <Stack.Screen name="timeline" />
        <Stack.Screen name="entries" />
        <Stack.Screen name="reflect" />
        <Stack.Screen name="entry/[id]" />
        <Stack.Screen name="share/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    );
  }
  ```

- [ ] **Step 2: Run the app and verify it starts without crashing**

  ```bash
  npx expo start
  ```
  Scan with Expo Go on your iPhone. You should see a loading spinner briefly, then a blank white screen (no Home screen yet). No red error overlay means DB init is working.

- [ ] **Step 3: Commit**

  ```bash
  git add app/_layout.tsx
  git commit -m "feat: add root layout with DB init and library seed"
  ```

---

## Task 17: Home Dashboard Screen

**Files:**
- Create: `app/index.tsx`

- [ ] **Step 1: Write Home Dashboard**

  Create `app/index.tsx`:
  ```typescript
  import { useEffect, useState, useCallback } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
  import { router, useFocusEffect } from 'expo-router';
  import { getDb } from '../src/db/database';
  import { getCurrentPrompt, getNextPrompt } from '../src/prompts/next';
  import type { CurrentPrompt } from '../src/types';

  export default function HomeScreen() {
    const [prompt, setPrompt] = useState<CurrentPrompt | null>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
      useCallback(() => {
        (async () => {
          setLoading(true);
          const db = await getDb();
          let current = await getCurrentPrompt(db);
          if (!current) current = await getNextPrompt(db);
          setPrompt(current);
          setLoading(false);
        })();
      }, [])
    );

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.appName}>BoredNotes</Text>

          {/* Prompt Card */}
          <TouchableOpacity
            style={styles.promptCard}
            onPress={() => router.push('/respond')}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#888" />
            ) : (
              <>
                <Text style={styles.promptLabel}>Today's prompt</Text>
                <Text style={styles.promptText}>{prompt?.text}</Text>
                <Text style={styles.tapHint}>Tap to respond →</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Tile row */}
          <View style={styles.tileRow}>
            <TouchableOpacity style={styles.tile} onPress={() => router.push('/timeline')}>
              <Text style={styles.tileIcon}>📅</Text>
              <Text style={styles.tileLabel}>Timeline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tile} onPress={() => router.push('/entries')}>
              <Text style={styles.tileIcon}>💭</Text>
              <Text style={styles.tileLabel}>Entries</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tile} onPress={() => router.push('/reflect')}>
              <Text style={styles.tileIcon}>✨</Text>
              <Text style={styles.tileLabel}>Reflect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, padding: 20, gap: 20 },
    appName: { fontSize: 13, fontWeight: '600', color: '#aaa', letterSpacing: 2, textTransform: 'uppercase', marginTop: 8 },
    promptCard: {
      flex: 1, backgroundColor: '#f8f8f8', borderRadius: 16, padding: 24,
      justifyContent: 'center', gap: 12,
    },
    promptLabel: { fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 },
    promptText: { fontSize: 20, color: '#1a1a1a', lineHeight: 28, fontWeight: '400' },
    tapHint: { fontSize: 13, color: '#bbb', marginTop: 8 },
    tileRow: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
    tile: {
      flex: 1, backgroundColor: '#f4f4f4', borderRadius: 12,
      paddingVertical: 18, alignItems: 'center', gap: 6,
    },
    tileIcon: { fontSize: 24 },
    tileLabel: { fontSize: 12, color: '#555', fontWeight: '500' },
  });
  ```

- [ ] **Step 2: Test on device**

  ```bash
  npx expo start
  ```
  Open on iPhone. You should see the BoredNotes home screen with a prompt card and three tiles. Tapping the tiles should navigate (even if the screens are blank for now).

- [ ] **Step 3: Commit**

  ```bash
  git add app/index.tsx
  git commit -m "feat: add Home Dashboard screen"
  ```

---

## Task 18: Respond Screen

**Files:**
- Create: `app/respond.tsx`

- [ ] **Step 1: Write the Respond screen**

  Create `app/respond.tsx`:
  ```typescript
  import { useState, useRef } from 'react';
  import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, KeyboardAvoidingView, Platform, Image, SafeAreaView,
  } from 'react-native';
  import { router } from 'expo-router';
  import { Audio } from 'expo-av';
  import { getDb } from '../src/db/database';
  import { createEntry } from '../src/db/entries';
  import { createMedia } from '../src/db/media';
  import { getNextPrompt, getCurrentPrompt } from '../src/prompts/next';
  import { captureLocation, queuePendingGeocode } from '../src/location/location';
  import { pickPhoto, takePhoto, startVoiceRecording, stopVoiceRecording } from '../src/media/capture';

  export default function RespondScreen() {
    const [response, setResponse] = useState('');
    const [locationLabel, setLocationLabel] = useState('');
    const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [voiceUri, setVoiceUri] = useState<string | null>(null);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [prompt, setPrompt] = useState<string>('');

    // Load current prompt on mount
    useState(() => {
      (async () => {
        const db = await getDb();
        const current = await getCurrentPrompt(db);
        setPrompt(current?.text ?? '');
      })();
    });

    async function handleAddLocation() {
      const loc = await captureLocation();
      if (loc) {
        setLocationLabel(loc.label ?? '');
        setLocationCoords({ lat: loc.lat, lng: loc.lng });
      }
    }

    async function handlePickPhoto() {
      const uri = await pickPhoto();
      if (uri) setPhotoUri(uri);
    }

    async function handleTakePhoto() {
      const uri = await takePhoto();
      if (uri) setPhotoUri(uri);
    }

    async function handleToggleRecording() {
      if (isRecording && recording) {
        const uri = await stopVoiceRecording(recording);
        setRecording(null);
        setIsRecording(false);
        if (uri) setVoiceUri(uri);
      } else {
        const rec = await startVoiceRecording();
        setRecording(rec);
        setIsRecording(true);
      }
    }

    async function handleSubmit() {
      if (!response.trim()) {
        Alert.alert('Write something first', 'Your response cannot be empty.');
        return;
      }
      setSubmitting(true);
      try {
        const db = await getDb();
        const entryId = await createEntry(db, {
          prompt_text: prompt,
          response_text: response.trim(),
          location_label: locationLabel || undefined,
          location_lat: locationCoords?.lat,
          location_lng: locationCoords?.lng,
        });

        // If we have coords but no label (offline), queue for later
        if (locationCoords && !locationLabel) {
          await queuePendingGeocode(db, entryId, locationCoords.lat, locationCoords.lng);
        }

        if (photoUri) await createMedia(db, entryId, 'photo', photoUri);
        if (voiceUri) await createMedia(db, entryId, 'voice', voiceUri);

        // Generate next prompt before navigating back
        await getNextPrompt(db);
        router.back();
      } catch (e) {
        Alert.alert('Error', 'Could not save your entry. Please try again.');
        setSubmitting(false);
      }
    }

    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.prompt}>{prompt}</Text>

            <TextInput
              style={styles.input}
              placeholder="What's on your mind…"
              placeholderTextColor="#bbb"
              multiline
              autoFocus
              value={response}
              onChangeText={setResponse}
            />

            {photoUri && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoUri }} style={styles.photoImg} />
                <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.removeBtn}>
                  <Text style={styles.removeTxt}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}

            {voiceUri && !isRecording && (
              <View style={styles.voiceBadge}>
                <Text style={styles.voiceTxt}>🎙 Voice memo attached</Text>
                <TouchableOpacity onPress={() => setVoiceUri(null)}>
                  <Text style={styles.removeTxt}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Metadata row */}
            <View style={styles.metaRow}>
              <TouchableOpacity onPress={handleAddLocation} style={styles.metaBtn}>
                <Text style={styles.metaBtnTxt}>{locationLabel ? `📍 ${locationLabel}` : '📍 Add place'}</Text>
              </TouchableOpacity>
              {locationLabel !== '' && (
                <TextInput
                  style={styles.locationInput}
                  value={locationLabel}
                  onChangeText={setLocationLabel}
                  placeholder="Edit place name"
                  placeholderTextColor="#bbb"
                />
              )}
            </View>

            {/* Attachment row */}
            <View style={styles.attachRow}>
              <TouchableOpacity onPress={handlePickPhoto} style={styles.attachBtn}>
                <Text style={styles.attachTxt}>🖼 Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTakePhoto} style={styles.attachBtn}>
                <Text style={styles.attachTxt}>📷 Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleToggleRecording} style={[styles.attachBtn, isRecording && styles.recording]}>
                <Text style={styles.attachTxt}>{isRecording ? '⏹ Stop' : '🎙 Record'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, (!response.trim() || submitting) && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={!response.trim() || submitting}
            >
              <Text style={styles.submitTxt}>{submitting ? 'Saving…' : 'Save entry →'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { padding: 20, gap: 16, paddingBottom: 40 },
    closeBtn: { alignSelf: 'flex-end', padding: 4 },
    closeTxt: { fontSize: 18, color: '#aaa' },
    prompt: { fontSize: 20, color: '#1a1a1a', lineHeight: 28, fontWeight: '400', marginTop: 8 },
    input: { fontSize: 16, color: '#222', lineHeight: 24, minHeight: 160, textAlignVertical: 'top', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 12 },
    photoPreview: { gap: 6 },
    photoImg: { width: '100%', height: 180, borderRadius: 8 },
    voiceBadge: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    voiceTxt: { color: '#555' },
    removeBtn: {},
    removeTxt: { color: '#f87171', fontSize: 13 },
    metaRow: { gap: 6 },
    metaBtn: {},
    metaBtnTxt: { color: '#888', fontSize: 14 },
    locationInput: { fontSize: 14, color: '#333', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 4 },
    attachRow: { flexDirection: 'row', gap: 10 },
    attachBtn: { flex: 1, backgroundColor: '#f4f4f4', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    recording: { backgroundColor: '#fee2e2' },
    attachTxt: { fontSize: 13, color: '#555' },
    submitBtn: { backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    submitDisabled: { backgroundColor: '#ccc' },
    submitTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
  ```

- [ ] **Step 2: Test on device**

  Open the app, tap the prompt card. The respond screen should slide up as a modal. Type a response, tap "Save entry →". You should return to Home with the prompt updated to a new one.

- [ ] **Step 3: Commit**

  ```bash
  git add app/respond.tsx
  git commit -m "feat: add Respond screen with text/photo/voice/location"
  ```

---

## Task 19: Timeline Screen

**Files:**
- Create: `app/timeline.tsx`

- [ ] **Step 1: Write Timeline screen**

  Create `app/timeline.tsx`:
  ```typescript
  import { useState, useEffect, useCallback } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, FlatList } from 'react-native';
  import { router } from 'expo-router';
  import { getDb } from '../src/db/database';
  import { getDatesWithEntries, getEntriesForDate } from '../src/db/entries';
  import type { Entry } from '../src/types';

  function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay(); // 0=Sun
  }

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  export default function TimelineScreen() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [datesWithEntries, setDatesWithEntries] = useState<Set<string>>(new Set());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dayEntries, setDayEntries] = useState<Entry[]>([]);

    useEffect(() => {
      (async () => {
        const db = await getDb();
        const ym = `${year}-${String(month + 1).padStart(2, '0')}`;
        const dates = await getDatesWithEntries(db, ym);
        setDatesWithEntries(new Set(dates));
        setSelectedDate(null);
        setDayEntries([]);
      })();
    }, [year, month]);

    async function handleDayPress(dateStr: string) {
      setSelectedDate(dateStr);
      const db = await getDb();
      const entries = await getEntriesForDate(db, dateStr);
      setDayEntries(entries);
    }

    function prevMonth() {
      if (month === 0) { setYear(y => y - 1); setMonth(11); }
      else setMonth(m => m - 1);
    }

    function nextMonth() {
      if (month === 11) { setYear(y => y + 1); setMonth(0); }
      else setMonth(m => m + 1);
    }

    const days = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    const cells = Array.from({ length: startDay + days }, (_, i) =>
      i < startDay ? null : i - startDay + 1
    );

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backTxt}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Timeline</Text>

          {/* Month navigator */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth}><Text style={styles.navArrow}>‹</Text></TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth}><Text style={styles.navArrow}>›</Text></TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.grid}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <Text key={d} style={styles.dayHeader}>{d}</Text>
            ))}
            {cells.map((day, i) => {
              if (!day) return <View key={`e${i}`} style={styles.cell} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasEntry = datesWithEntries.has(dateStr);
              const isSelected = selectedDate === dateStr;
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.cell, isSelected && styles.selectedCell]}
                  onPress={() => hasEntry && handleDayPress(dateStr)}
                  disabled={!hasEntry}
                >
                  <Text style={[styles.dayNum, !hasEntry && styles.emptyDay, isSelected && styles.selectedDayNum]}>
                    {day}
                  </Text>
                  {hasEntry && <View style={[styles.dot, isSelected && styles.selectedDot]} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Day entries */}
          {selectedDate && dayEntries.map(entry => (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryCard}
              onPress={() => router.push(`/entry/${entry.id}`)}
            >
              <Text style={styles.entryPrompt}>{entry.prompt_text}</Text>
              <Text style={styles.entryResponse} numberOfLines={3}>{entry.response_text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { padding: 20, gap: 16, paddingBottom: 40 },
    back: { paddingVertical: 4 },
    backTxt: { color: '#888', fontSize: 15 },
    title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navArrow: { fontSize: 28, color: '#555', paddingHorizontal: 12 },
    monthLabel: { fontSize: 17, fontWeight: '600', color: '#222' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
    selectedCell: { backgroundColor: '#1a1a1a', borderRadius: 8 },
    dayHeader: { width: '14.28%', textAlign: 'center', fontSize: 11, color: '#aaa', paddingVertical: 6 },
    dayNum: { fontSize: 14, color: '#333' },
    emptyDay: { color: '#ccc' },
    selectedDayNum: { color: '#fff' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#555' },
    selectedDot: { backgroundColor: '#fff' },
    entryCard: { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16, gap: 6 },
    entryPrompt: { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
    entryResponse: { fontSize: 15, color: '#333', lineHeight: 22 },
  });
  ```

- [ ] **Step 2: Test on device**

  Add a few entries, then tap Timeline. You should see dots on the days you wrote entries. Tapping a day should show your entries for that day.

- [ ] **Step 3: Commit**

  ```bash
  git add app/timeline.tsx
  git commit -m "feat: add Timeline screen with calendar dot view"
  ```

---

## Task 20: Entries Screen

**Files:**
- Create: `app/entries.tsx`

- [ ] **Step 1: Write Entries screen**

  Create `app/entries.tsx`:
  ```typescript
  import { useState, useEffect, useCallback } from 'react';
  import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput } from 'react-native';
  import { router, useFocusEffect } from 'expo-router';
  import { getDb } from '../src/db/database';
  import { getAllEntries, searchEntries } from '../src/db/entries';
  import type { Entry } from '../src/types';

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function groupByDate(entries: Entry[]): { date: string; items: Entry[] }[] {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const d = e.created_at.slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(e);
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }

  export default function EntriesScreen() {
    const [query, setQuery] = useState('');
    const [entries, setEntries] = useState<Entry[]>([]);

    useFocusEffect(
      useCallback(() => {
        loadEntries('');
      }, [])
    );

    async function loadEntries(q: string) {
      const db = await getDb();
      const results = q.trim() ? await searchEntries(db, q) : await getAllEntries(db);
      setEntries(results);
    }

    function handleSearch(q: string) {
      setQuery(q);
      loadEntries(q);
    }

    const grouped = groupByDate(entries);

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backTxt}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Entries</Text>

          <TextInput
            style={styles.search}
            placeholder="Search…"
            placeholderTextColor="#bbb"
            value={query}
            onChangeText={handleSearch}
            clearButtonMode="while-editing"
          />

          <FlatList
            data={grouped}
            keyExtractor={g => g.date}
            renderItem={({ item: group }) => (
              <View style={styles.group}>
                <Text style={styles.dateHeader}>{formatDate(group.date)}</Text>
                {group.items.map(entry => (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.card}
                    onPress={() => router.push(`/entry/${entry.id}`)}
                  >
                    <Text style={styles.cardPrompt} numberOfLines={1}>{entry.prompt_text}</Text>
                    <Text style={styles.cardResponse} numberOfLines={3}>{entry.response_text}</Text>
                    {entry.location_label && (
                      <Text style={styles.cardMeta}>📍 {entry.location_label}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>{query ? 'No entries match your search.' : 'No entries yet. Respond to a prompt!'}</Text>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, padding: 20, gap: 12 },
    back: { paddingVertical: 4 },
    backTxt: { color: '#888', fontSize: 15 },
    title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
    search: { backgroundColor: '#f4f4f4', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#222' },
    group: { gap: 10, marginBottom: 24 },
    dateHeader: { fontSize: 13, fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 },
    card: { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16, gap: 6 },
    cardPrompt: { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
    cardResponse: { fontSize: 15, color: '#333', lineHeight: 22 },
    cardMeta: { fontSize: 11, color: '#bbb' },
    empty: { color: '#aaa', textAlign: 'center', marginTop: 60, fontSize: 15 },
  });
  ```

- [ ] **Step 2: Test on device**

  Add several entries, then tap Entries. Your entries should appear grouped by date, most recent first. Search should filter them live.

- [ ] **Step 3: Commit**

  ```bash
  git add app/entries.tsx
  git commit -m "feat: add Entries screen with search and date grouping"
  ```

---

## Task 21: Reflect Screen

**Files:**
- Create: `app/reflect.tsx`

- [ ] **Step 1: Write Reflect screen**

  Create `app/reflect.tsx`:
  ```typescript
  import { useState, useEffect } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
  import { router } from 'expo-router';
  import { getDb } from '../src/db/database';
  import { getEntriesForMonthDay, getEntriesInRange } from '../src/db/entries';
  import type { Entry } from '../src/types';

  type Period = 'week' | 'month' | 'year';

  function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  function periodRange(period: Period): { from: string; to: string } {
    const now = new Date();
    const to = isoDate(now);
    if (period === 'week') {
      const from = new Date(now); from.setDate(now.getDate() - 7);
      return { from: isoDate(from), to };
    }
    if (period === 'month') {
      const from = new Date(now); from.setMonth(now.getMonth() - 1);
      return { from: isoDate(from), to };
    }
    const from = new Date(now); from.setFullYear(now.getFullYear() - 1);
    return { from: isoDate(from), to };
  }

  export default function ReflectScreen() {
    const [onThisDay, setOnThisDay] = useState<Entry[]>([]);
    const [period, setPeriod] = useState<Period>('week');
    const [periodEntries, setPeriodEntries] = useState<Entry[]>([]);
    const now = new Date();

    useEffect(() => {
      (async () => {
        const db = await getDb();
        const otd = await getEntriesForMonthDay(db, now.getMonth() + 1, now.getDate());
        // Exclude today's entries
        const today = isoDate(now);
        setOnThisDay(otd.filter(e => e.created_at.slice(0, 10) !== today));
      })();
    }, []);

    useEffect(() => {
      (async () => {
        const db = await getDb();
        const { from, to } = periodRange(period);
        setPeriodEntries(await getEntriesInRange(db, from, to));
      })();
    }, [period]);

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backTxt}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Reflect</Text>

          {/* On This Day */}
          <Text style={styles.sectionHead}>On this day</Text>
          {onThisDay.length === 0 ? (
            <Text style={styles.empty}>No entries from this date in past years yet.</Text>
          ) : (
            onThisDay.map(entry => (
              <TouchableOpacity
                key={entry.id}
                style={styles.card}
                onPress={() => router.push(`/entry/${entry.id}`)}
              >
                <Text style={styles.yearBadge}>{entry.created_at.slice(0, 4)}</Text>
                <Text style={styles.cardPrompt} numberOfLines={1}>{entry.prompt_text}</Text>
                <Text style={styles.cardResponse} numberOfLines={3}>{entry.response_text}</Text>
              </TouchableOpacity>
            ))
          )}

          {/* Period browser */}
          <Text style={styles.sectionHead}>Browse</Text>
          <View style={styles.tabs}>
            {(['week','month','year'] as Period[]).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.tab, period === p && styles.activeTab]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.tabTxt, period === p && styles.activeTabTxt]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.periodCount}>{periodEntries.length} {periodEntries.length === 1 ? 'entry' : 'entries'} this {period}</Text>
          {periodEntries.map(entry => (
            <TouchableOpacity
              key={entry.id}
              style={styles.card}
              onPress={() => router.push(`/entry/${entry.id}`)}
            >
              <Text style={styles.cardDate}>{entry.created_at.slice(0, 10)}</Text>
              <Text style={styles.cardPrompt} numberOfLines={1}>{entry.prompt_text}</Text>
              <Text style={styles.cardResponse} numberOfLines={3}>{entry.response_text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { padding: 20, gap: 14, paddingBottom: 40 },
    back: { paddingVertical: 4 },
    backTxt: { color: '#888', fontSize: 15 },
    title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
    sectionHead: { fontSize: 13, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
    card: { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16, gap: 6 },
    yearBadge: { fontSize: 11, fontWeight: '700', color: '#7c6af7' },
    cardDate: { fontSize: 11, color: '#bbb' },
    cardPrompt: { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
    cardResponse: { fontSize: 15, color: '#333', lineHeight: 22 },
    empty: { color: '#bbb', fontSize: 14 },
    tabs: { flexDirection: 'row', gap: 8 },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f4f4f4', alignItems: 'center' },
    activeTab: { backgroundColor: '#1a1a1a' },
    tabTxt: { fontSize: 13, color: '#555', fontWeight: '500' },
    activeTabTxt: { color: '#fff' },
    periodCount: { fontSize: 13, color: '#aaa' },
  });
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/reflect.tsx
  git commit -m "feat: add Reflect screen with on-this-day and period browser"
  ```

---

## Task 22: Entry Detail Screen

**Files:**
- Create: `app/entry/[id].tsx`

- [ ] **Step 1: Write Entry Detail screen**

  Create `app/entry/[id].tsx`:
  ```typescript
  import { useState, useEffect } from 'react';
  import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
  import { router, useLocalSearchParams } from 'expo-router';
  import { Audio } from 'expo-av';
  import { getDb } from '../../src/db/database';
  import { getEntry } from '../../src/db/entries';
  import { getMediaForEntry } from '../../src/db/media';
  import type { Entry, MediaItem } from '../../src/types';

  function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
      year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  export default function EntryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [entry, setEntry] = useState<Entry | null>(null);
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
      (async () => {
        const db = await getDb();
        const e = await getEntry(db, Number(id));
        setEntry(e);
        if (e) setMedia(await getMediaForEntry(db, e.id));
      })();
      return () => { sound?.unloadAsync(); };
    }, [id]);

    const photo = media.find(m => m.type === 'photo');
    const voice = media.find(m => m.type === 'voice');

    async function togglePlayback() {
      if (!voice) return;
      if (playing && sound) {
        await sound.pauseAsync();
        setPlaying(false);
      } else if (sound) {
        await sound.playAsync();
        setPlaying(true);
      } else {
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: voice.file_path },
          { shouldPlay: true }
        );
        s.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) setPlaying(false);
        });
        setSound(s);
        setPlaying(true);
      }
    }

    if (!entry) return null;

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backTxt}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.dateTime}>{formatDateTime(entry.created_at)}</Text>
          {entry.location_label && (
            <Text style={styles.location}>📍 {entry.location_label}</Text>
          )}

          <Text style={styles.prompt}>{entry.prompt_text}</Text>

          {photo && (
            <Image source={{ uri: photo.file_path }} style={styles.photo} resizeMode="cover" />
          )}

          <Text style={styles.response}>{entry.response_text}</Text>

          {voice && (
            <TouchableOpacity style={styles.voiceBtn} onPress={togglePlayback}>
              <Text style={styles.voiceTxt}>{playing ? '⏸ Pause voice memo' : '▶ Play voice memo'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => router.push(`/share/${entry.id}`)}
          >
            <Text style={styles.shareTxt}>Share this entry</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { padding: 20, gap: 16, paddingBottom: 40 },
    back: { paddingVertical: 4 },
    backTxt: { color: '#888', fontSize: 15 },
    dateTime: { fontSize: 13, color: '#aaa' },
    location: { fontSize: 13, color: '#aaa' },
    prompt: { fontSize: 16, color: '#888', fontStyle: 'italic', lineHeight: 24 },
    photo: { width: '100%', height: 220, borderRadius: 12 },
    response: { fontSize: 18, color: '#1a1a1a', lineHeight: 28 },
    voiceBtn: { backgroundColor: '#f4f4f4', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    voiceTxt: { color: '#555', fontSize: 15 },
    shareBtn: { backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    shareTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  });
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add "app/entry/[id].tsx"
  git commit -m "feat: add Entry Detail screen with voice playback"
  ```

---

## Task 23: Share Card Screen

**Files:**
- Create: `app/share/[id].tsx`

- [ ] **Step 1: Write Share Card screen**

  Create `app/share/[id].tsx`:
  ```typescript
  import { useState, useEffect, useRef } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Switch, Alert } from 'react-native';
  import { router, useLocalSearchParams } from 'expo-router';
  import { captureRef } from 'react-native-view-shot';
  import * as Sharing from 'expo-sharing';
  import { getDb } from '../../src/db/database';
  import { getEntry } from '../../src/db/entries';
  import { getMediaForEntry } from '../../src/db/media';
  import { ShareCard } from '../../src/share/renderer';
  import { TEMPLATES, DEFAULT_TEMPLATE_ID } from '../../src/share/templates';
  import type { Entry, MediaItem } from '../../src/types';
  import type { ShareTemplate } from '../../src/share/templates';

  export default function ShareCardScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const cardRef = useRef<View>(null);
    const [entry, setEntry] = useState<Entry | null>(null);
    const [photo, setPhoto] = useState<MediaItem | null>(null);
    const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
    const [showDate, setShowDate] = useState(true);
    const [showLocation, setShowLocation] = useState(true);
    const [sharing, setSharing] = useState(false);

    useEffect(() => {
      (async () => {
        const db = await getDb();
        const e = await getEntry(db, Number(id));
        setEntry(e);
        if (e) {
          const media = await getMediaForEntry(db, e.id);
          setPhoto(media.find(m => m.type === 'photo') ?? null);
        }
      })();
    }, [id]);

    async function handleShare() {
      if (!cardRef.current) return;
      setSharing(true);
      try {
        const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      } catch {
        Alert.alert('Could not share', 'Please try again.');
      } finally {
        setSharing(false);
      }
    }

    const template = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0];

    if (!entry) return null;

    const dateStr = new Date(entry.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.close}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Share</Text>

          {/* Card preview */}
          <View style={styles.preview}>
            <ShareCard
              ref={cardRef}
              template={template}
              promptText={entry.prompt_text}
              responseText={entry.response_text}
              date={dateStr}
              location={entry.location_label}
              photoUri={photo?.file_path ?? null}
              showDate={showDate}
              showLocation={showLocation}
            />
          </View>

          {/* Template picker */}
          <Text style={styles.label}>Template</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
            {TEMPLATES.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.templateChip, templateId === t.id && styles.templateChipActive]}
                onPress={() => setTemplateId(t.id)}
              >
                <View style={[styles.templateSwatch, { backgroundColor: t.bg }]} />
                <Text style={styles.templateLabel}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Toggles */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show date</Text>
            <Switch value={showDate} onValueChange={setShowDate} />
          </View>
          {entry.location_label && (
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Show location</Text>
              <Switch value={showLocation} onValueChange={setShowLocation} />
            </View>
          )}

          <TouchableOpacity
            style={[styles.shareBtn, sharing && styles.shareBtnDisabled]}
            onPress={handleShare}
            disabled={sharing}
          >
            <Text style={styles.shareTxt}>{sharing ? 'Preparing…' : 'Share →'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { padding: 20, gap: 16, paddingBottom: 40 },
    close: { alignSelf: 'flex-end' },
    closeTxt: { fontSize: 18, color: '#aaa' },
    title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
    preview: { alignItems: 'center', paddingVertical: 8 },
    label: { fontSize: 13, fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 },
    templateScroll: { flexGrow: 0 },
    templateChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f4f4f4', marginRight: 10 },
    templateChipActive: { backgroundColor: '#1a1a1a' },
    templateSwatch: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: '#ddd' },
    templateLabel: { fontSize: 13, color: '#444' },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toggleLabel: { fontSize: 15, color: '#333' },
    shareBtn: { backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    shareBtnDisabled: { backgroundColor: '#ccc' },
    shareTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
  ```

- [ ] **Step 2: Test on device**

  Navigate to an entry's detail, tap "Share this entry". The share card screen should appear as a modal with the card preview, template picker, and toggles. Tapping "Share →" should invoke the iOS share sheet with your card as a PNG image.

- [ ] **Step 3: Commit**

  ```bash
  git add "app/share/[id].tsx"
  git commit -m "feat: add Share Card screen with template picker and iOS export"
  ```

---

## Task 24: Final Wiring + App Icon

**Files:**
- Modify: `app.json`

- [ ] **Step 1: Add required iOS permissions to app.json**

  Update the `ios` section in `app.json`:
  ```json
  "ios": {
    "supportsTablet": false,
    "bundleIdentifier": "com.yourname.borednotes",
    "infoPlist": {
      "NSCameraUsageDescription": "BoredNotes uses the camera to attach photos to your entries.",
      "NSPhotoLibraryUsageDescription": "BoredNotes accesses your photo library to attach images to entries.",
      "NSMicrophoneUsageDescription": "BoredNotes uses the microphone to record voice memos for your entries.",
      "NSLocationWhenInUseUsageDescription": "BoredNotes can tag your entries with where you wrote them."
    }
  }
  ```

- [ ] **Step 2: Test all permissions on device**

  Run the app and test each flow in turn:
  - Respond → tap 📍 → approve location permission → should auto-fill a place name
  - Respond → tap 🖼 Photo → approve photo library → select a photo → should appear in preview
  - Respond → tap 📷 Camera → approve camera → take a photo → should appear
  - Respond → tap 🎙 Record → approve mic → record 5 seconds → tap ⏹ Stop → "Voice memo attached" should appear
  - Submit the entry, navigate to Entries, open it, tap ▶ Play voice memo — should play back

- [ ] **Step 3: Run all tests**

  ```bash
  npx jest
  ```
  Expected: all tests pass (selection algorithm + AI service tests)

- [ ] **Step 4: Final commit**

  ```bash
  git add app.json
  git commit -m "feat: add iOS permission descriptions — BoredNotes v1 complete"
  ```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 7 screens implemented. Hybrid prompt system (curated + AI). Location with GPS + editable label + offline queue. Media: photo (picker + camera) + voice recorder. 4 share card templates (Minimal default). iCloud backup via Documents dir (Expo default). No notifications, no backend, no accounts.
- [x] **No placeholders:** All steps contain actual code.
- [x] **Type consistency:** `Entry`, `MediaItem`, `Prompt`, `CurrentPrompt`, `ShareTemplate` defined once in `types.ts` and `templates.ts`; used consistently across all tasks. `PromptCategory` is `'observational' | 'reflective' | 'personal' | 'creative'` throughout.
- [x] **Method names consistent:** `getNextPrompt`/`getCurrentPrompt` in `next.ts`; `selectPrompt` in `selection.ts`; `createEntry`/`getEntry`/`getRecentEntries` in `entries.ts`. All match their usage in screen files.

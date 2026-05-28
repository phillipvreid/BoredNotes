# Freeform Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sticky freeform writing mode that removes the prompt from the Respond screen, toggled via Settings, with all attachment tools remaining available.

**Architecture:** A new `respond_mode` setting key (`'prompted'` | `'freeform'`) drives UI branching across the Home, Respond, Entry Detail, and Share Card screens. A new `entry_mode` column on the `entries` table records which mode each entry was written in, so past freeform entries display correctly without a prompt.

**Tech Stack:** React Native + Expo, expo-sqlite (SQLite), expo-router, Jest for tests.

---

## File Map

| File | Change |
|------|--------|
| `src/types.ts` | Add `entry_mode: 'prompted' \| 'freeform'` to `Entry` interface |
| `src/db/schema.ts` | Add `entry_mode` column to entries `CREATE TABLE` (new installs) |
| `src/db/database.ts` | Add `ALTER TABLE` migration try/catch (existing installs) |
| `src/db/entries.ts` | Add `entry_mode` to `CreateEntryInput` + `INSERT` |
| `app/settings.tsx` | New WRITING section with Freeform toggle |
| `app/index.tsx` | Read `respond_mode`; swap card label/body/hint |
| `app/respond.tsx` | Read `respond_mode`; hide prompt; show "writing freely"; pass `entry_mode` on save |
| `app/entry/[id].tsx` | Guard prompt block — skip for freeform entries |
| `src/share/renderer.tsx` | Guard prompt `Text` — only render when `promptText` non-empty |
| `__tests__/db/entries.test.ts` | New: tests for `createEntry` with `entry_mode` |
| `__tests__/db/database.test.ts` | New: tests for `getDb` migration idempotency |

---

## Task 1: Types and schema

**Files:**
- Modify: `src/types.ts`
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add `entry_mode` to the `Entry` interface in `src/types.ts`**

  Replace the existing `Entry` interface:

  ```ts
  export interface Entry {
    id: number;
    prompt_text: string;
    response_text: string;
    created_at: string; // ISO 8601
    location_label: string | null;
    location_lat: number | null;
    location_lng: number | null;
    entry_mode: 'prompted' | 'freeform';
  }
  ```

- [ ] **Step 2: Add `entry_mode` column to the entries `CREATE TABLE` in `src/db/schema.ts`**

  Replace the entries table definition inside `CREATE_TABLES_SQL` (keep all other tables unchanged):

  ```sql
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
    location_label TEXT,
    location_lat REAL,
    location_lng REAL,
    entry_mode TEXT NOT NULL DEFAULT 'prompted'
  );
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/types.ts src/db/schema.ts
  git commit -m "feat: add entry_mode to Entry type and schema"
  ```

---

## Task 2: Update `createEntry`

**Files:**
- Modify: `src/db/entries.ts`
- Create: `__tests__/db/entries.test.ts`

- [ ] **Step 1: Write the failing tests**

  Create `__tests__/db/entries.test.ts`:

  ```ts
  import { createEntry } from '../../src/db/entries';
  import { openDatabaseAsync } from 'expo-sqlite';

  describe('createEntry', () => {
    let db: any;

    beforeEach(async () => {
      jest.clearAllMocks();
      db = await openDatabaseAsync('test.db');
      db.runAsync.mockResolvedValue({ lastInsertRowId: 42, changes: 1 });
    });

    it('inserts a prompted entry with entry_mode = prompted', async () => {
      await createEntry(db, {
        prompt_text: 'What did you notice today?',
        response_text: 'A red door.',
      });
      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO entries'),
        ['What did you notice today?', 'A red door.', null, null, null, 'prompted']
      );
    });

    it('inserts a freeform entry with entry_mode = freeform', async () => {
      await createEntry(db, {
        prompt_text: '',
        response_text: 'Just a quiet morning.',
        entry_mode: 'freeform',
      });
      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO entries'),
        ['', 'Just a quiet morning.', null, null, null, 'freeform']
      );
    });

    it('defaults entry_mode to prompted when omitted', async () => {
      await createEntry(db, {
        prompt_text: 'Test prompt',
        response_text: 'Test response',
      });
      const callArgs = db.runAsync.mock.calls[0][1];
      expect(callArgs[5]).toBe('prompted');
    });

    it('returns the new entry id', async () => {
      const id = await createEntry(db, { prompt_text: 'p', response_text: 'r' });
      expect(id).toBe(42);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  ```bash
  npx jest __tests__/db/entries.test.ts --no-coverage
  ```

  Expected: FAIL — `entry_mode` not yet in the INSERT, params array length mismatch.

- [ ] **Step 3: Update `CreateEntryInput` and `createEntry` in `src/db/entries.ts`**

  Replace the `CreateEntryInput` interface and `createEntry` function (leave all other functions untouched):

  ```ts
  export interface CreateEntryInput {
    prompt_text: string;
    response_text: string;
    location_label?: string;
    location_lat?: number;
    location_lng?: number;
    entry_mode?: 'prompted' | 'freeform';
  }

  export async function createEntry(db: SQLiteDatabase, input: CreateEntryInput): Promise<number> {
    const result = await db.runAsync(
      `INSERT INTO entries (prompt_text, response_text, location_label, location_lat, location_lng, entry_mode)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.prompt_text,
        input.response_text,
        input.location_label ?? null,
        input.location_lat ?? null,
        input.location_lng ?? null,
        input.entry_mode ?? 'prompted',
      ]
    );
    return result.lastInsertRowId;
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  npx jest __tests__/db/entries.test.ts --no-coverage
  ```

  Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

  ```bash
  git add src/db/entries.ts __tests__/db/entries.test.ts
  git commit -m "feat: add entry_mode to createEntry"
  ```

---

## Task 3: DB migration

**Files:**
- Modify: `src/db/database.ts`
- Create: `__tests__/db/database.test.ts`

- [ ] **Step 1: Write the failing tests**

  Create `__tests__/db/database.test.ts`:

  ```ts
  import { openDatabaseAsync } from 'expo-sqlite';

  describe('getDb', () => {
    let db: any;

    beforeEach(async () => {
      jest.resetModules();
      jest.clearAllMocks();
      db = await openDatabaseAsync('test.db');
    });

    it('runs the entry_mode migration on init', async () => {
      db.execAsync.mockResolvedValue(undefined);
      const { getDb } = await import('../../src/db/database');
      await getDb();
      const calls = db.execAsync.mock.calls.map((c: any[]) => c[0] as string);
      expect(calls.some(sql => sql.includes('entry_mode'))).toBe(true);
    });

    it('silently ignores duplicate column error from migration', async () => {
      db.execAsync
        .mockResolvedValueOnce(undefined) // CREATE_TABLES_SQL succeeds
        .mockRejectedValueOnce(new Error('duplicate column name: entry_mode'));
      const { getDb } = await import('../../src/db/database');
      await expect(getDb()).resolves.not.toThrow();
    });

    it('returns the same db instance on repeated calls', async () => {
      db.execAsync.mockResolvedValue(undefined);
      const { getDb } = await import('../../src/db/database');
      const first = await getDb();
      const second = await getDb();
      expect(first).toBe(second);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  ```bash
  npx jest __tests__/db/database.test.ts --no-coverage
  ```

  Expected: FAIL — migration SQL not present yet.

- [ ] **Step 3: Add the migration to `src/db/database.ts`**

  Replace the full file:

  ```ts
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
    } catch {}
    return _db;
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  npx jest __tests__/db/database.test.ts --no-coverage
  ```

  Expected: PASS (3 tests).

- [ ] **Step 5: Run the full test suite to confirm nothing is broken**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests PASS.

- [ ] **Step 6: Commit**

  ```bash
  git add src/db/database.ts __tests__/db/database.test.ts
  git commit -m "feat: migrate entries table to add entry_mode column"
  ```

---

## Task 4: Settings screen — freeform toggle

**Files:**
- Modify: `app/settings.tsx`

- [ ] **Step 1: Add imports, state, and handler to `app/settings.tsx`**

  Add these imports at the top (alongside existing imports):

  ```ts
  import { useState, useEffect } from 'react';
  import { getDb } from '../src/db/database';
  import { getSetting, setSetting } from '../src/db/settings';
  ```

  Add state and handler inside `SettingsScreen`, before the `return`:

  ```ts
  const [isFreeform, setIsFreeform] = useState(false);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const mode = await getSetting(db, 'respond_mode');
      setIsFreeform(mode === 'freeform');
    })();
  }, []);

  async function handleFreeformToggle(value: boolean) {
    setIsFreeform(value);
    const db = await getDb();
    await setSetting(db, 'respond_mode', value ? 'freeform' : 'prompted');
  }
  ```

- [ ] **Step 2: Add the WRITING section to the JSX in `app/settings.tsx`**

  Insert this block **between** the APPEARANCE section and the ABOUT section (i.e., after the Dark Mode row's closing `</View>` and before `{/* About section */}`):

  ```tsx
  {/* Writing section */}
  <Text style={[styles.sectionHead, { color: colors.textMuted }]}>WRITING</Text>

  <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
    <View style={styles.rowTextBlock}>
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Freeform mode</Text>
      <Text style={[styles.rowSubLabel, { color: colors.textMuted }]}>Write without a prompt</Text>
    </View>
    <Switch
      value={isFreeform}
      onValueChange={handleFreeformToggle}
      trackColor={{ true: accent.buttonColor }}
    />
  </View>
  ```

- [ ] **Step 3: Add the new styles to the `StyleSheet.create` call in `app/settings.tsx`**

  Inside the existing `StyleSheet.create({...})`, add:

  ```ts
  rowTextBlock: { flex: 1 },
  rowSubLabel: { fontSize: 12, marginTop: 2 },
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add app/settings.tsx
  git commit -m "feat: add freeform mode toggle to Settings"
  ```

---

## Task 5: Home Dashboard — mode-aware card

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Add `respondMode` state and read it in the existing `useFocusEffect` in `app/index.tsx`**

  Add this import (alongside the existing `getSetting`-less imports — you'll need to add it):

  ```ts
  import { getSetting } from '../src/db/settings';
  ```

  Add state below the existing `useState` declarations:

  ```ts
  const [respondMode, setRespondMode] = useState<'prompted' | 'freeform'>('prompted');
  ```

  Inside the existing `useFocusEffect` async block, after `setPrompt(current)` and before `setLoading(false)`, add:

  ```ts
  const mode = await getSetting(db, 'respond_mode');
  setRespondMode((mode as 'prompted' | 'freeform') ?? 'prompted');
  ```

- [ ] **Step 2: Update the prompt card JSX in `app/index.tsx`**

  Replace the inner content of the `{loading ? ... : ...}` block inside the prompt card:

  ```tsx
  {loading ? (
    <ActivityIndicator color={accent.labelColor} />
  ) : (
    <>
      <Text style={[styles.promptLabel, { color: accent.labelColor }]}>
        {respondMode === 'freeform' ? "Today's entry" : "Today's prompt"}
      </Text>
      {respondMode === 'freeform' ? (
        <Text style={[styles.promptText, { color: colors.textMuted }]}>
          {"What's on your mind…"}
        </Text>
      ) : (
        <Text style={[styles.promptText, { color: colors.textPrimary }]}>
          {prompt?.text}
        </Text>
      )}
      <Text style={[styles.tapHint, { color: colors.textMuted }]}>
        {respondMode === 'freeform' ? 'Tap to write →' : 'Tap to respond →'}
      </Text>
    </>
  )}
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add app/index.tsx
  git commit -m "feat: home card reflects freeform mode"
  ```

---

## Task 6: Respond screen — freeform writing mode

**Files:**
- Modify: `app/respond.tsx`

- [ ] **Step 1: Add `respondMode` state and read it on mount in `app/respond.tsx`**

  Add this import (alongside existing imports):

  ```ts
  import { getSetting } from '../src/db/settings';
  ```

  Add state below the existing `useState` declarations:

  ```ts
  const [respondMode, setRespondMode] = useState<'prompted' | 'freeform'>('prompted');
  ```

  Inside the existing `useEffect` async block, after `setPrompt(current?.text ?? '')`, add:

  ```ts
  const mode = await getSetting(db, 'respond_mode');
  setRespondMode((mode as 'prompted' | 'freeform') ?? 'prompted');
  ```

- [ ] **Step 2: Update `handleSubmit` in `app/respond.tsx` to pass `entry_mode` and `prompt_text` correctly**

  Replace the `createEntry` call inside `handleSubmit`:

  ```ts
  const entryId = await createEntry(db, {
    prompt_text: respondMode === 'freeform' ? '' : prompt,
    response_text: response.trim(),
    location_label: locationLabel || undefined,
    location_lat: locationCoords?.lat,
    location_lng: locationCoords?.lng,
    entry_mode: respondMode,
  });
  ```

- [ ] **Step 3: Update the JSX in `app/respond.tsx` — hide prompt and add "writing freely" indicator**

  Replace the existing `<Text style={[styles.prompt, ...]}>{prompt}</Text>` line with:

  ```tsx
  {respondMode === 'prompted' && (
    <Text style={[styles.prompt, { color: colors.textPrimary }]}>{prompt}</Text>
  )}
  ```

  After the closing `/>` of `<TextInput ... />` and before the `{photoUri && ...}` block, add:

  ```tsx
  {respondMode === 'freeform' && (
    <Text style={[styles.freeformHint, { color: colors.textMuted }]}>writing freely</Text>
  )}
  ```

- [ ] **Step 4: Add the `freeformHint` style to the `StyleSheet.create` call in `app/respond.tsx`**

  Inside the existing `StyleSheet.create({...})`, add:

  ```ts
  freeformHint: { fontSize: 12, fontStyle: 'italic', textAlign: 'right', marginTop: -8 },
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add app/respond.tsx
  git commit -m "feat: respond screen supports freeform mode"
  ```

---

## Task 7: Entry Detail — guard prompt block

**Files:**
- Modify: `app/entry/[id].tsx`

- [ ] **Step 1: Guard the prompt `Text` in `app/entry/[id].tsx`**

  Find this line (currently line 73):

  ```tsx
  <Text style={[styles.prompt, { color: colors.textSecondary }]}>{entry.prompt_text}</Text>
  ```

  Replace it with:

  ```tsx
  {entry.entry_mode !== 'freeform' && (
    <Text style={[styles.prompt, { color: colors.textSecondary }]}>{entry.prompt_text}</Text>
  )}
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/entry/[id].tsx
  git commit -m "feat: hide prompt block for freeform entries in Entry Detail"
  ```

---

## Task 8: Share Card renderer — guard prompt text

**Files:**
- Modify: `src/share/renderer.tsx`

- [ ] **Step 1: Guard the prompt `Text` in `src/share/renderer.tsx`**

  Find these lines (currently lines 31–33):

  ```tsx
  <Text style={[styles.prompt, { color: template.promptColor, fontStyle: isSerif ? 'italic' : 'normal' }]}>
    {`"${promptText}"`}
  </Text>
  ```

  Replace with:

  ```tsx
  {!!promptText && (
    <Text style={[styles.prompt, { color: template.promptColor, fontStyle: isSerif ? 'italic' : 'normal' }]}>
      {`"${promptText}"`}
    </Text>
  )}
  ```

- [ ] **Step 2: Run the full test suite one final time**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests PASS.

- [ ] **Step 3: Commit**

  ```bash
  git add src/share/renderer.tsx
  git commit -m "feat: hide prompt from share card for freeform entries"
  ```

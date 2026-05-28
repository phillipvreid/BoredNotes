# Offline-Only Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Settings toggle that disables AI prompt generation, making BoredNotes draw exclusively from the built-in curated library with no network calls.

**Architecture:** A new `offline_mode` key in the existing `settings` SQLite table controls the flag. The prompt orchestrator (`src/prompts/next.ts`) reads it before the AI branch and skips `generateAiPrompt` when set. The Settings screen writes the flag and immediately triggers a prompt refresh via `getNextPrompt`.

**Tech Stack:** React Native / Expo, expo-sqlite, TypeScript, Jest 29

---

## File Map

| Action | Path |
|--------|------|
| Create | `__tests__/setup.ts` |
| Modify | `package.json` (jest config only) |
| Create | `__tests__/prompts/next.test.ts` |
| Modify | `src/prompts/next.ts` |
| Modify | `app/settings.tsx` |

---

## Task 1: Add jest setup file so API key is available during tests

`src/prompts/next.ts` reads `process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY` at module load time into a constant. Tests run without this env var, so `API_KEY` is `''` and the AI branch is never entered — making it impossible to test that offline mode actually suppresses an AI call that would otherwise happen. A `setupFiles` entry fixes this by setting the env var before any module loads.

**Files:**
- Create: `__tests__/setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Create the setup file**

```ts
// __tests__/setup.ts
process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY = 'test-key';
```

- [ ] **Step 2: Register it in the jest config inside `package.json`**

Locate the `"jest"` block and add `"setupFiles"`:

```json
"jest": {
  "preset": "jest-expo",
  "setupFiles": [
    "<rootDir>/__tests__/setup.ts"
  ],
  "setupFilesAfterEnv": [
    "@testing-library/jest-native/extend-expect"
  ],
  "moduleNameMapper": {
    "^expo-sqlite$": "<rootDir>/__mocks__/expo-sqlite.ts"
  }
}
```

- [ ] **Step 3: Run the existing tests to confirm no regression**

```bash
npx jest --passWithNoTests
```

Expected: all existing tests pass (same as before).

- [ ] **Step 4: Commit**

```bash
git add __tests__/setup.ts package.json
git commit -m "test: add jest setup file to expose API key env var in tests"
```

---

## Task 2: Test and implement offline_mode check in the prompt orchestrator

**Files:**
- Create: `__tests__/prompts/next.test.ts`
- Modify: `src/prompts/next.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/prompts/next.test.ts
import { getNextPrompt } from '../../src/prompts/next';
import { generateAiPrompt } from '../../src/prompts/ai';

jest.mock('../../src/prompts/ai');

const mockGenerateAiPrompt = generateAiPrompt as jest.Mock;

const samplePrompt = {
  id: 1,
  text: 'What small thing made you smile today?',
  category: 'reflective' as const,
  depth: 1 as const,
  source: 'library' as const,
  last_used_at: null,
};

function makeMockDb() {
  return {
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    execAsync: jest.fn(),
    withTransactionAsync: jest.fn().mockImplementation(async (fn: () => Promise<void>) => fn()),
  };
}

describe('getNextPrompt', () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    db = makeMockDb();
    // getAllAsync call order inside getNextPrompt:
    // 1. getRecentEntries  2. getEligiblePrompts (filtered)  3. getEligiblePrompts (fallback)
    db.getAllAsync
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([samplePrompt])
      .mockResolvedValueOnce([samplePrompt]);
  });

  it('skips AI when offline_mode is true', async () => {
    // getFirstAsync call order: recent_categories, recent_depths, prompt_call_count, offline_mode
    // prompt_call_count = 3 → 3 % 4 === 3 → useAi = true (would trigger AI without offline flag)
    db.getFirstAsync
      .mockResolvedValueOnce(null)             // recent_categories
      .mockResolvedValueOnce(null)             // recent_depths
      .mockResolvedValueOnce({ value: '3' })   // prompt_call_count
      .mockResolvedValueOnce({ value: 'true' }); // offline_mode

    const result = await getNextPrompt(db as any);

    expect(mockGenerateAiPrompt).not.toHaveBeenCalled();
    expect(result.text).toBe(samplePrompt.text);
    expect(result.category).toBe(samplePrompt.category);
  });

  it('calls AI when offline_mode is false and conditions are met', async () => {
    mockGenerateAiPrompt.mockResolvedValueOnce('AI-generated question');
    db.getFirstAsync
      .mockResolvedValueOnce(null)              // recent_categories
      .mockResolvedValueOnce(null)              // recent_depths
      .mockResolvedValueOnce({ value: '3' })    // prompt_call_count
      .mockResolvedValueOnce({ value: 'false' }); // offline_mode

    const result = await getNextPrompt(db as any);

    expect(mockGenerateAiPrompt).toHaveBeenCalledTimes(1);
    expect(result.text).toBe('AI-generated question');
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
npx jest __tests__/prompts/next.test.ts --verbose
```

Expected: both tests FAIL — `offline_mode` logic doesn't exist yet. The first test fails because `mockGenerateAiPrompt` IS called (no check prevents it). The second test likely fails with a mock mismatch.

- [ ] **Step 3: Implement the offline_mode check in `src/prompts/next.ts`**

Add the `offline_mode` read after line 41 (`setSetting(db, 'prompt_call_count', ...)`), and update the AI condition on line 46:

```ts
// src/prompts/next.ts  (full file)
import type { SQLiteDatabase } from 'expo-sqlite';
import type { CurrentPrompt, PromptCategory } from '../types';
import { getRecentEntries } from '../db/entries';
import { getEligiblePrompts, markPromptUsed } from '../db/prompts';
import { getSetting, setSetting } from '../db/settings';
import { selectPrompt } from './selection';
import { generateAiPrompt } from './ai';

const AI_FREQUENCY = 4;
const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

export async function getNextPrompt(db: SQLiteDatabase): Promise<CurrentPrompt> {
  const recentEntries = await getRecentEntries(db, 30);
  const recentTexts = recentEntries.map(e => e.prompt_text);
  const recentCategories = (
    JSON.parse((await getSetting(db, 'recent_categories')) ?? '[]') as PromptCategory[]
  );
  const recentDepths = (
    JSON.parse((await getSetting(db, 'recent_depths')) ?? '[]') as number[]
  );

  const eligible = await getEligiblePrompts(db, {
    excludeTexts: recentTexts,
    excludeCategories: recentCategories.slice(-2),
    excludeDepth:
      recentDepths.slice(-3).length === 3 &&
      recentDepths.slice(-3).every(d => d === recentDepths[recentDepths.length - 1])
        ? recentDepths[recentDepths.length - 1]
        : null,
  });

  // If all criteria knock out every prompt (rare: user has been writing a lot),
  // fall back to the unfiltered pool. selectPrompt will still try to apply
  // category/depth variety, and has its own internal fallback to any prompt.
  const allFallback = await getEligiblePrompts(db, {});
  const pool = eligible.length > 0 ? eligible : allFallback;
  const chosenLibraryPrompt = selectPrompt(pool, recentCategories, recentDepths);

  const callCount = parseInt((await getSetting(db, 'prompt_call_count')) ?? '0', 10);
  const useAi = callCount % AI_FREQUENCY === AI_FREQUENCY - 1; // true on call 3, 7, 11, ...
  await setSetting(db, 'prompt_call_count', String(callCount + 1));

  const offlineMode = (await getSetting(db, 'offline_mode')) === 'true';

  let finalText = chosenLibraryPrompt.text;
  const finalCategory = chosenLibraryPrompt.category;

  if (!offlineMode && useAi && API_KEY) {
    const recentTopics = recentEntries.slice(0, 3).map(e =>
      e.response_text.slice(0, 40).replace(/\n/g, ' ')
    );
    const aiText = await generateAiPrompt(
      { category: finalCategory, depth: chosenLibraryPrompt.depth, recentTopics },
      API_KEY
    );
    if (aiText) finalText = aiText;
  }

  await markPromptUsed(db, chosenLibraryPrompt.id);

  const newCategories = [...recentCategories, finalCategory].slice(-6);
  const newDepths = [...recentDepths, chosenLibraryPrompt.depth].slice(-6);
  await setSetting(db, 'recent_categories', JSON.stringify(newCategories));
  await setSetting(db, 'recent_depths', JSON.stringify(newDepths));

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

- [ ] **Step 4: Run all tests to confirm they pass**

```bash
npx jest --verbose
```

Expected: all tests pass, including both new `next.test.ts` tests.

- [ ] **Step 5: Commit**

```bash
git add __tests__/prompts/next.test.ts src/prompts/next.ts
git commit -m "feat: skip AI prompt generation when offline_mode is enabled"
```

---

## Task 3: Add offline mode toggle to the Settings screen

**Files:**
- Modify: `app/settings.tsx`

- [ ] **Step 1: Implement the toggle in `app/settings.tsx`**

Replace the entire file with:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../src/theme/ThemeContext';
import { ACCENTS } from '../src/theme/tokens';
import { getDb } from '../src/db/database';
import { getSetting, setSetting } from '../src/db/settings';
import { getNextPrompt } from '../src/prompts/next';

const version = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const { colors, accent, isDark, setAccent, setDarkMode } = useTheme();
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const val = await getSetting(db, 'offline_mode');
      setOfflineMode(val === 'true');
    })();
  }, []);

  async function handleOfflineToggle(value: boolean) {
    const db = await getDb();
    await setSetting(db, 'offline_mode', String(value));
    await getNextPrompt(db);
    setOfflineMode(value);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backTxt, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>

        {/* Appearance section */}
        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>APPEARANCE</Text>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Theme</Text>
          <View style={styles.swatches}>
            {ACCENTS.map(swatch => (
              <TouchableOpacity
                key={swatch.id}
                style={[styles.swatch, { backgroundColor: swatch.buttonColor }]}
                onPress={() => setAccent(swatch.id)}
              >
                {accent.id === swatch.id && (
                  <Feather name="check" size={14} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={setDarkMode}
            trackColor={{ true: accent.buttonColor }}
          />
        </View>

        {/* Prompts section */}
        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>PROMPTS</Text>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Offline Mode</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>Use built-in prompts only, no AI</Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={handleOfflineToggle}
            trackColor={{ true: accent.buttonColor }}
          />
        </View>

        {/* About section */}
        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>ABOUT</Text>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Version</Text>
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{version}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 8, paddingBottom: 40 },
  back: { paddingVertical: 4, marginBottom: 4 },
  backTxt: { fontSize: 15 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  sectionHead: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 16, marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 12, borderWidth: 1,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  rowLabel: { fontSize: 15 },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  rowValue: { fontSize: 15 },
  swatches: { flexDirection: 'row', gap: 10 },
  swatch: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Run the app and manually verify**

```bash
npx expo start --ios
```

Verify all of the following:
1. Open Settings — an "Offline Mode" toggle appears under a new "PROMPTS" section, below the dark mode toggle. It is OFF by default.
2. Toggle Offline Mode ON. Navigate back to Home. The prompt has refreshed (new text).
3. Close and relaunch the app. Open Settings — the Offline Mode toggle is still ON.
4. Navigate to Home — prompt is still showing (persisted from last refresh).
5. Toggle Offline Mode OFF. Navigate back to Home. The prompt has refreshed again.

- [ ] **Step 3: Commit**

```bash
git add app/settings.tsx
git commit -m "feat: add offline mode toggle to Settings screen"
```

---

## Verification

Run the full test suite one final time:

```bash
npx jest --verbose
```

Expected: all tests pass, including the two new `next.test.ts` tests.

Manual end-to-end: follow the verification steps in Task 3, Step 2. Pay particular attention to step 3 (persistence across restarts) — this confirms `offline_mode` is stored in SQLite and not just component state.

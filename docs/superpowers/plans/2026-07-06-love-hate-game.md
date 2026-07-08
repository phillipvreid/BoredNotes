# Love it / Hate it Micro-Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A second micro-game alongside Rank It: the app deals a random theme (e.g. "Fruit") and the user names one thing they love and one they hate in that theme.

**Architecture:** A new prompt kind `loveHate` rides the existing micro-game plumbing: one library prompt carries a theme pool in `game_config`, the respond screen deals a theme on mount and renders two tagged input rows, and the saved entry stores structured `game_data` plus a plain-text `response_text` so search/CSV/share need no changes. No DB schema changes (`kind`/`entry_kind` have no CHECK constraints).

**Tech Stack:** Expo / React Native, TypeScript (strict), expo-sqlite, Jest via jest-expo.

**Spec:** `docs/superpowers/specs/2026-07-06-love-hate-game-design.md`

## Global Constraints

- Strict TypeScript; no `any` in new code except test mocks (existing tests use `db: any`).
- Yellow (`ACTION` #FFD23E) is reserved for the send button — never use it for game elements.
- LOVE IT tag hue: theme `catHues.rank` (green, #15A150 in Classic). HATE IT tag hue: theme `catHues.gossip` (red, #FF4438 in Classic). Feed pill hue: `catHues.nostalgia` (pink, #F5468C in Classic). Always via `useTheme()`, never hardcoded hex.
- Library prompt text (default copy, verbatim): `Love it / Hate it. The theme decides, you commit.`
- In-game framing line (default copy, verbatim): `one you love, one you hate. no takebacks.`
- Feed pill label: `LOVE + HATE`. Respond/home card pill label: `LOVE IT / HATE IT`.
- No footer quip on the loveHate respond screen (empty string, not new copy).
- No reshuffle affordance; the dealt theme is stable for the life of the screen.
- Run all commands from the worktree root: `/Users/phillipreid/Borednotes/.claude/worktrees/love-hate-game`.
- Tests: `npm test -- --runInBand`. Type check: `npx tsc --noEmit`.

---

### Task 1: Types + `loveHate` game module (TDD)

**Files:**
- Modify: `src/types.ts:8-9` (widen `PromptKind`/`EntryKind`) and add two interfaces after `RankGameData` (line 18)
- Create: `src/games/loveHate.ts`
- Test: `__tests__/games/loveHate.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces (later tasks import these exact names):
  - `types.ts`: `PromptKind`/`EntryKind` now include `'loveHate'`; `interface LoveHateGameConfig { themes: string[] }`; `interface LoveHateGameData { theme: string; love: string; hate: string }`
  - `src/games/loveHate.ts`: `DEFAULT_LOVE_HATE_THEMES: string[]`, `LOVE_HATE_FRAMING: string`, `parseLoveHateConfig(json: string | null | undefined): LoveHateGameConfig | null`, `parseLoveHateData(json: string | null | undefined): LoveHateGameData | null`, `pickLoveHateTheme(themes: string[] | null | undefined): string`, `renderLoveHateResponseText(data: LoveHateGameData): string`

- [ ] **Step 1: Write the failing test**

Create `__tests__/games/loveHate.test.ts`:

```ts
import {
  parseLoveHateConfig, parseLoveHateData, pickLoveHateTheme,
  renderLoveHateResponseText, DEFAULT_LOVE_HATE_THEMES, LOVE_HATE_FRAMING,
} from '../../src/games/loveHate';

describe('parseLoveHateConfig', () => {
  it('parses a valid config', () => {
    expect(parseLoveHateConfig('{"themes":["Fruit","Weather"]}')).toEqual({
      themes: ['Fruit', 'Weather'],
    });
  });

  it('returns null for null, invalid JSON, and wrong shapes', () => {
    expect(parseLoveHateConfig(null)).toBeNull();
    expect(parseLoveHateConfig(undefined)).toBeNull();
    expect(parseLoveHateConfig('')).toBeNull();
    expect(parseLoveHateConfig('not json')).toBeNull();
    expect(parseLoveHateConfig('{"themes":"nope"}')).toBeNull();
    expect(parseLoveHateConfig('{"themes":[1,2]}')).toBeNull();
    expect(parseLoveHateConfig('{"slots":["a"]}')).toBeNull();
  });
});

describe('parseLoveHateData', () => {
  it('parses valid data', () => {
    expect(parseLoveHateData('{"theme":"Fruit","love":"Grapes","hate":"Pears"}')).toEqual({
      theme: 'Fruit', love: 'Grapes', hate: 'Pears',
    });
  });

  it('returns null for null, invalid JSON, and wrong shapes', () => {
    expect(parseLoveHateData(null)).toBeNull();
    expect(parseLoveHateData('not json')).toBeNull();
    expect(parseLoveHateData('{"theme":"Fruit","love":"Grapes"}')).toBeNull();
    expect(parseLoveHateData('{"theme":1,"love":"a","hate":"b"}')).toBeNull();
  });
});

describe('pickLoveHateTheme', () => {
  it('returns a member of the given pool', () => {
    const pool = ['Fruit', 'Weather', 'Condiments'];
    for (let i = 0; i < 20; i++) {
      expect(pool).toContain(pickLoveHateTheme(pool));
    }
  });

  it('falls back to the default themes for empty or missing pools', () => {
    expect(DEFAULT_LOVE_HATE_THEMES).toContain(pickLoveHateTheme([]));
    expect(DEFAULT_LOVE_HATE_THEMES).toContain(pickLoveHateTheme(null));
    expect(DEFAULT_LOVE_HATE_THEMES).toContain(pickLoveHateTheme(undefined));
  });
});

describe('renderLoveHateResponseText', () => {
  it('renders theme plus both lines', () => {
    expect(renderLoveHateResponseText({ theme: 'Fruit', love: 'Grapes', hate: 'Pears' })).toBe(
      'Fruit\nLove it: Grapes\nHate it: Pears'
    );
  });

  it('round-trips through parseLoveHateData JSON', () => {
    const data = { theme: 'Weather', love: 'first snow', hate: 'wind for no reason' };
    const parsed = parseLoveHateData(JSON.stringify(data));
    expect(parsed).toEqual(data);
    expect(renderLoveHateResponseText(parsed!)).toContain('Hate it: wind for no reason');
  });
});

describe('constants', () => {
  it('has a non-empty default pool and framing line', () => {
    expect(DEFAULT_LOVE_HATE_THEMES.length).toBeGreaterThanOrEqual(5);
    expect(LOVE_HATE_FRAMING.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/games/loveHate.test.ts`
Expected: FAIL — `Cannot find module '../../src/games/loveHate'`

- [ ] **Step 3: Widen the types**

In `src/types.ts`, change lines 8–9:

```ts
export type PromptKind = 'text' | 'rank' | 'loveHate';
export type EntryKind = 'text' | 'rank' | 'loveHate';
```

and add after the `RankGameData` interface (after line 18):

```ts
export interface LoveHateGameConfig {
  themes: string[];  // theme pool; one is dealt at random when the game opens
}

export interface LoveHateGameData {
  theme: string;     // the dealt theme
  love: string;
  hate: string;
}
```

- [ ] **Step 4: Write the game module**

Create `src/games/loveHate.ts`:

```ts
import type { LoveHateGameConfig, LoveHateGameData } from '../types';

// Fallback pool when a loveHate prompt's game_config is missing or malformed —
// the game must never open onto a blank theme.
export const DEFAULT_LOVE_HATE_THEMES = [
  'Fruit', 'Condiments', 'Weather', 'Breakfast foods', 'Small talk topics',
];

// Framing line shown under the dealt theme on the respond card. (The library
// prompt's own text is what the home card shows.)
export const LOVE_HATE_FRAMING = 'one you love, one you hate. no takebacks.';

export function parseLoveHateConfig(json: string | null | undefined): LoveHateGameConfig | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed?.themes) && parsed.themes.every((t: unknown) => typeof t === 'string')) {
      return { themes: parsed.themes };
    }
  } catch {}
  return null;
}

export function parseLoveHateData(json: string | null | undefined): LoveHateGameData | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (
      typeof parsed?.theme === 'string' &&
      typeof parsed?.love === 'string' &&
      typeof parsed?.hate === 'string'
    ) {
      return { theme: parsed.theme, love: parsed.love, hate: parsed.hate };
    }
  } catch {}
  return null;
}

export function pickLoveHateTheme(themes: string[] | null | undefined): string {
  const pool = themes && themes.length > 0 ? themes : DEFAULT_LOVE_HATE_THEMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Plain-text rendering stored in response_text so search, CSV export, and
// share cards work on loveHate entries without knowing about game_data.
export function renderLoveHateResponseText(data: LoveHateGameData): string {
  return `${data.theme}\nLove it: ${data.love}\nHate it: ${data.hate}`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/games/loveHate.test.ts`
Expected: PASS (all suites)

- [ ] **Step 6: Full test suite + type check**

Run: `npm test -- --runInBand && npx tsc --noEmit`
Expected: all tests pass, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/games/loveHate.ts __tests__/games/loveHate.test.ts
git commit -m "feat: loveHate game module — types, parsing, theme deal, response rendering"
```

---

### Task 2: Library prompt + seed mapping (TDD)

**Files:**
- Modify: `src/prompts/library.json` (append one entry at the end of the array)
- Modify: `src/prompts/seed.ts` (add `themes` to `LibraryPrompt`, map to `game_config`)
- Test: `__tests__/prompts/seed.test.ts` (add one test)

**Interfaces:**
- Consumes: nothing from Task 1 (seed passes JSON strings through; it never parses them).
- Produces: a seeded prompt row with `kind = 'loveHate'`, `category = 'game'`, `game_config = '{"themes":[...]}'`. Tasks 3+ read this via the existing `Prompt.game_config`.

- [ ] **Step 1: Add the failing seed test**

In `__tests__/prompts/seed.test.ts`, add inside the existing `describe('seedLibraryIfNeeded', ...)` block, after the first `it`:

```ts
  it('seeds the loveHate prompt with a themes config', async () => {
    db.getAllAsync.mockResolvedValueOnce([]);
    await seedLibraryIfNeeded(db);

    const lhCalls = db.runAsync.mock.calls.filter((c: any[]) => c[1][4] === 'loveHate');
    expect(lhCalls).toHaveLength(1);
    expect(lhCalls[0][1][1]).toBe('game'); // category
    const config = JSON.parse(lhCalls[0][1][5]);
    expect(config.themes.length).toBeGreaterThanOrEqual(20);
    expect(config.themes.every((t: unknown) => typeof t === 'string')).toBe(true);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/prompts/seed.test.ts`
Expected: FAIL — `expect(lhCalls).toHaveLength(1)` receives length 0.

- [ ] **Step 3: Append the library entry**

In `src/prompts/library.json`, append this object at the end of the top-level array (after the last rank prompt):

```json
{
  "text": "Love it / Hate it. The theme decides, you commit.",
  "category": "game",
  "depth": 1,
  "kind": "loveHate",
  "themes": [
    "Fruit", "Condiments", "Weather", "Breakfast foods", "Small talk topics",
    "Pizza toppings", "Cereal", "Coffee orders", "Sandwiches", "Soup",
    "Ice cream flavors", "Vegetables", "Candy", "Road trip snacks", "Cheese",
    "Household chores", "Sounds", "Smells", "Textures", "Apps on your phone",
    "Kitchen gadgets", "Holidays", "Karaoke songs", "Exercise", "Shoes",
    "Airport rituals", "Group chat behavior", "Salad ingredients"
  ]
}
```

(28 themes; JSON must stay valid — watch the comma after the previous entry.)

- [ ] **Step 4: Map `themes` in the seeder**

In `src/prompts/seed.ts`, extend the interface:

```ts
interface LibraryPrompt {
  text: string;
  category: string;
  depth: number;
  kind?: string;
  slots?: string[];
  themes?: string[];
}
```

and replace the `game_config` argument in the `insertPrompt` call (currently `prompt.slots ? JSON.stringify({ slots: prompt.slots }) : null`):

```ts
      prompt.slots
        ? JSON.stringify({ slots: prompt.slots })
        : prompt.themes
          ? JSON.stringify({ themes: prompt.themes })
          : null
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/prompts/seed.test.ts`
Expected: PASS — including the pre-existing tests (`toHaveBeenCalledTimes(library.length)` self-adjusts to the new length).

- [ ] **Step 6: Full test suite + type check**

Run: `npm test -- --runInBand && npx tsc --noEmit`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/prompts/library.json src/prompts/seed.ts __tests__/prompts/seed.test.ts
git commit -m "feat: seed Love it / Hate it library prompt with theme pool"
```

---

### Task 3: Respond screen — play the game

**Files:**
- Modify: `app/respond.tsx` (loveHate branch: theme deal, card content, input rows, validation, save)
- Modify: `app/index.tsx:104-108` (home card pill label override)

**Interfaces:**
- Consumes (from Task 1): `parseLoveHateConfig`, `pickLoveHateTheme`, `renderLoveHateResponseText`, `LOVE_HATE_FRAMING` from `../src/games/loveHate`.
- Produces: saved entries with `entry_kind: 'loveHate'` and `game_data` JSON `{"theme":"…","love":"…","hate":"…"}` — exactly what `parseLoveHateData` (Tasks 4–5) expects.

There is no unit-test harness for screens in this codebase; this task is verified by type check + simulator (Step 8). Keep the diff tight and pattern-matched to the existing `isRank` branches.

- [ ] **Step 1: Imports and flags**

In `app/respond.tsx`:

Add after the rank import (line 17–19):

```ts
import {
  LOVE_HATE_FRAMING, parseLoveHateConfig, pickLoveHateTheme, renderLoveHateResponseText,
} from '../src/games/loveHate';
```

Change the `useTheme` destructure (line 44) to include the theme's category hues:

```ts
  const { colors, categoryStyles, catHues } = useTheme();
```

Add after `const isRank = ...` (line 62):

```ts
  const isLoveHate = cardPrompt?.kind === 'loveHate';
```

- [ ] **Step 2: State — deal the theme once, hold the two lines**

Add after the `defense` state (line 69). The `useState` initializer runs exactly once, so the dealt theme survives re-renders and keyboard events:

```ts
  // Deal the theme once per screen life — re-renders never reshuffle it.
  const [dealtTheme] = useState(() =>
    isLoveHate ? pickLoveHateTheme(parseLoveHateConfig(cardPrompt?.game_config)?.themes) : ''
  );
  const [love, setLove] = useState('');
  const [hate, setHate] = useState('');
```

- [ ] **Step 3: Unsaved-content guard**

Replace the `hasUnsavedContent` expression (lines 110–112):

```ts
  const hasUnsavedContent = isRank
    ? rankItems.some(i => i.trim() !== '') || defense.trim() !== ''
    : isLoveHate
      ? love.trim() !== '' || hate.trim() !== ''
      : responseWordCount >= DISCARD_WARN_MIN_WORDS;
```

- [ ] **Step 4: Save path**

In `handleSubmit` (line 194), add after the `rankComplete` line:

```ts
    const loveHateData = { theme: dealtTheme, love: love.trim(), hate: hate.trim() };
    const loveHateComplete = loveHateData.love !== '' && loveHateData.hate !== '';
```

Replace the validation `if` (lines 197–202):

```ts
    if (isRank ? !rankComplete : isLoveHate ? !loveHateComplete : !response.trim()) {
      Alert.alert('Write something first', isRank
        ? 'Fill all three slots and defend your #1.'
        : isLoveHate
          ? 'One love, one hate. Both. That\'s the game.'
          : 'Your response cannot be empty.');
      return;
    }
```

Replace the three game-aware fields in the `createEntry` call (lines 208, 213, 214):

```ts
        response_text: isRank
          ? renderRankResponseText(rankData)
          : isLoveHate
            ? renderLoveHateResponseText(loveHateData)
            : response.trim(),
```

```ts
        entry_kind: isRank ? 'rank' : isLoveHate ? 'loveHate' : 'text',
        game_data: isRank
          ? JSON.stringify(rankData)
          : isLoveHate
            ? JSON.stringify(loveHateData)
            : null,
```

- [ ] **Step 5: Pill label, send gating, footer line**

Replace `promptPillLabel` (lines 246–248):

```ts
  const promptPillLabel = cardPrompt
    ? (isLoveHate ? 'LOVE IT / HATE IT' : catStyle?.label)
    : (activeChipLabels.length > 0 ? activeChipLabels.join(' + ') : 'SPARK');
```

Replace `rankFilled`/`sendDisabled` (lines 251–253):

```ts
  const rankFilled = rankItems.every(i => i.trim() !== '') && defense.trim() !== '';
  const loveHateFilled = love.trim() !== '' && hate.trim() !== '';
  const sendDisabled = (isRank ? !rankFilled : isLoveHate ? !loveHateFilled : !response.trim())
    || submitting || (helpMeWriteOpen && promptLoading);
```

Replace the footer counter text (line 388) — loveHate gets no quip:

```tsx
              {isLoveHate ? '' : isRank ? (rankFilled ? 'committed to the bit' : 'no scoring. just commit.') : wordCounterLine(response)}
```

- [ ] **Step 6: Card content — theme headline instead of prompt text**

Replace the prompt text element (lines 292–294):

```tsx
              {isLoveHate ? (
                <>
                  <Text style={styles.lhTheme}>{dealtTheme}</Text>
                  <Text style={styles.lhFraming}>{LOVE_HATE_FRAMING}</Text>
                </>
              ) : (
                <Text style={styles.promptTxt}>
                  {promptLoading ? '…' : activePrompt.text}
                </Text>
              )}
```

- [ ] **Step 7: Input rows — LOVE IT / HATE IT stack**

Change the reply-area ternary (line 325 `{isRank ? (` … line 354 `) : (` … line 366 `)}`): keep the rank block as-is, and replace the final `else` leg so the chain reads `isRank ? (…rank stack…) : isLoveHate ? (…new block…) : (…existing text input card…)`:

```tsx
          ) : isLoveHate ? (
            <View style={styles.lhStack}>
              <Sticker borderWidth={KEYLINE_HEAVY} shadow={SHADOW_SM} radius={14} style={styles.lhRow}>
                <View style={[styles.lhTag, { backgroundColor: catHues.rank }]}>
                  <Text style={styles.lhTagTxt}>LOVE IT</Text>
                </View>
                <TextInput
                  style={[styles.lhInput, { color: colors.textPrimary }]}
                  placeholder="the one you'd defend in court…"
                  placeholderTextColor={colors.when}
                  autoFocus
                  value={love}
                  onChangeText={setLove}
                />
              </Sticker>
              <Sticker borderWidth={KEYLINE_HEAVY} shadow={SHADOW_SM} radius={14} style={styles.lhRow}>
                <View style={[styles.lhTag, { backgroundColor: catHues.gossip }]}>
                  <Text style={styles.lhTagTxt}>HATE IT</Text>
                </View>
                <TextInput
                  style={[styles.lhInput, { color: colors.textPrimary }]}
                  placeholder="the one that should apologize…"
                  placeholderTextColor={colors.when}
                  value={hate}
                  onChangeText={setHate}
                />
              </Sticker>
            </View>
          ) : (
```

Add to the `StyleSheet.create` block (after `rankInput`, line 428):

```ts
  lhStack: { gap: 12 },
  lhRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 52, paddingHorizontal: 13,
  },
  lhTag: {
    borderWidth: 2, borderColor: INK, borderRadius: 7,
    paddingVertical: 4, paddingHorizontal: 7,
  },
  lhTagTxt: { fontFamily: FONTS.label, fontSize: 9, letterSpacing: 0.5, color: '#fff' },
  lhInput: { flex: 1, fontFamily: FONTS.bodySemiBold, fontSize: 16, paddingVertical: 0 },
  lhTheme: {
    fontFamily: FONTS.display, fontSize: 30, lineHeight: 33, letterSpacing: -0.3,
    color: '#fff', marginTop: 8,
  },
  lhFraming: {
    fontFamily: FONTS.body, fontSize: 13, lineHeight: 17, color: 'rgba(255,255,255,.9)',
    marginTop: 3, maxWidth: 220,
  },
```

- [ ] **Step 8: Home card pill label**

In `app/index.tsx`, inside the card-stack `map` (lines 90–113), the pill currently renders `{cat.label}` (line 106). Add above the `return` (after `const cat = categoryStyles[prompt.category];`):

```ts
            const pillLabel = prompt.kind === 'loveHate' ? 'LOVE IT / HATE IT' : cat.label;
```

and change line 106 to:

```tsx
                    <Text style={styles.catPillTxt}>{pillLabel}</Text>
```

- [ ] **Step 9: Type check + full tests**

Run: `npx tsc --noEmit && npm test -- --runInBand`
Expected: no type errors, all tests pass.

- [ ] **Step 10: Commit**

```bash
git add app/respond.tsx app/index.tsx
git commit -m "feat: Love it / Hate it respond screen — theme deal, tagged inputs, save path"
```

Simulator verification (user-run, not in-session): `npx expo run:ios`, tap the Love it / Hate it card on Home when it appears in the stack; confirm the theme stays put while typing, send is disabled until both lines are filled, and the saved entry shows in the feed.

---

### Task 4: Feed rendering (`src/boredbefore/FeedTab.tsx`)

**Files:**
- Modify: `src/boredbefore/FeedTab.tsx`

**Interfaces:**
- Consumes (from Task 1): `parseLoveHateData` from `../games/loveHate`.
- Produces: nothing downstream.

- [ ] **Step 1: Import and parse**

Add next to the rank import (line 13):

```ts
import { parseLoveHateData } from '../games/loveHate';
```

Inside the entry `map` (line 94), add after the `rank` line and fold the new flag into `catStyle`:

```ts
              const loveHate = entry.entry_kind === 'loveHate' ? parseLoveHateData(entry.game_data) : null;
              const catStyle = !freeform && !rank && !loveHate && entry.category ? categoryStyles[entry.category] : null;
```

(The `catStyle` line replaces the existing one at line 95.)

- [ ] **Step 2: Pill hue and label**

Replace the pill lines (96–98):

```ts
              const pillBg = loveHate ? catHues.nostalgia : rank ? catHues.rank : freeform ? colors.action : catStyle ? catStyle.color : colors.badgeBg;
              const pillFg = loveHate || rank ? '#fff' : freeform ? colors.actionInk : catStyle ? '#fff' : colors.badgeFg;
              const pillLabel = loveHate ? 'LOVE + HATE' : rank ? 'RANK + DEFEND' : freeform ? 'BRAIN DUMP' : catStyle ? catStyle.label : 'PROMPTED';
```

- [ ] **Step 3: Card body**

The body is currently `{rank ? (<>…rank list…</>) : (<Text …response…/>)}` (line 120). Make it a three-way chain — keep the rank leg untouched and insert before the final else:

```tsx
                  ) : loveHate ? (
                    <View style={styles.lhList}>
                      <Text style={[styles.lhTheme, { color: colors.textPrimary }]}>{loveHate.theme}</Text>
                      <View style={styles.lhRow}>
                        <View style={[styles.lhTag, { backgroundColor: catHues.rank }]}>
                          <Text style={styles.lhTagTxt}>LOVE IT</Text>
                        </View>
                        <Text style={[styles.lhItem, { color: colors.textPrimary }]} numberOfLines={1}>
                          {loveHate.love}
                        </Text>
                      </View>
                      <View style={styles.lhRow}>
                        <View style={[styles.lhTag, { backgroundColor: catHues.gossip }]}>
                          <Text style={styles.lhTagTxt}>HATE IT</Text>
                        </View>
                        <Text style={[styles.lhItem, { color: colors.textPrimary }]} numberOfLines={1}>
                          {loveHate.hate}
                        </Text>
                      </View>
                    </View>
                  ) : (
```

Note: `parseLoveHateData` returning `null` (malformed `game_data`) falls through to the plain `response_text` leg automatically — that's the designed fallback.

- [ ] **Step 4: Styles**

Add to the `StyleSheet.create` block (after `rankItem`, line 192):

```ts
  lhList: { gap: 6, marginTop: 3 },
  lhTheme: { fontFamily: FONTS.bodyExtraBold, fontSize: 15 },
  lhRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  lhTag: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  lhTagTxt: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 1, color: '#fff' },
  lhItem: { fontFamily: FONTS.bodySemiBold, fontSize: 15, flex: 1 },
```

- [ ] **Step 5: Type check + tests**

Run: `npx tsc --noEmit && npm test -- --runInBand`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/boredbefore/FeedTab.tsx
git commit -m "feat: LOVE + HATE feed pill and compact love/hate card rendering"
```

---

### Task 5: Entry detail rendering (`app/entry/[id].tsx`)

**Files:**
- Modify: `app/entry/[id].tsx`

**Interfaces:**
- Consumes (from Task 1): `parseLoveHateData` from `../../src/games/loveHate`.
- Produces: nothing downstream.

- [ ] **Step 1: Import, hue access, parse**

Add next to the rank import (line 9):

```ts
import { parseLoveHateData } from '../../src/games/loveHate';
```

Change the `useTheme` destructure (line 23):

```ts
  const { colors, catHues } = useTheme();
```

Add after the `rank` line (line 43):

```ts
  const loveHate = entry.entry_kind === 'loveHate' ? parseLoveHateData(entry.game_data) : null;
```

- [ ] **Step 2: Render block**

The body is `{rank ? (…) : (<Text …response…/>)}` (lines 83–100). Insert a `loveHate` leg before the final else (same three-way chain shape as the feed):

```tsx
        ) : loveHate ? (
          <View style={styles.lhBlock}>
            <Text style={[styles.lhTheme, { color: colors.textPrimary }]}>{loveHate.theme}</Text>
            <View style={styles.lhRow}>
              <View style={[styles.lhTag, { backgroundColor: catHues.rank }]}>
                <Text style={styles.lhTagTxt}>LOVE IT</Text>
              </View>
              <Text style={[styles.lhItem, { color: colors.textPrimary }]}>{loveHate.love}</Text>
            </View>
            <View style={styles.lhRow}>
              <View style={[styles.lhTag, { backgroundColor: catHues.gossip }]}>
                <Text style={styles.lhTagTxt}>HATE IT</Text>
              </View>
              <Text style={[styles.lhItem, { color: colors.textPrimary }]}>{loveHate.hate}</Text>
            </View>
          </View>
        ) : (
```

- [ ] **Step 3: Styles**

Add to the `StyleSheet.create` block (after `rankItem`, line 141):

```ts
  lhBlock: { gap: 10 },
  lhTheme: { fontFamily: FONTS.display, fontSize: 24, letterSpacing: -0.3 },
  lhRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lhTag: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 9 },
  lhTagTxt: { fontFamily: FONTS.label, fontSize: 11, letterSpacing: 1, color: '#fff' },
  lhItem: { fontFamily: FONTS.bodySemiBold, fontSize: 17, flex: 1 },
```

- [ ] **Step 4: Type check + tests**

Run: `npx tsc --noEmit && npm test -- --runInBand`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add "app/entry/[id].tsx"
git commit -m "feat: love/hate entry detail rendering with theme headline"
```

---

### Task 6: Final verification

**Files:** none created or modified (fix-forward only if a check fails).

- [ ] **Step 1: Full suite, strict types, config sanity**

Run, from the worktree root:

```bash
npm test -- --runInBand
npx tsc --noEmit
npx expo config --type introspect > /dev/null && echo "expo config OK"
```

Expected: all tests pass, zero type errors, `expo config OK`.

- [ ] **Step 2: Spec cross-check**

Re-read `docs/superpowers/specs/2026-07-06-love-hate-game-design.md` section by section and confirm each is implemented: types/config/data ✓ (Task 1), library + seed ✓ (Task 2), respond screen incl. stable theme deal, validation, no quip, pill labels ✓ (Task 3), feed ✓ (Task 4), detail ✓ (Task 5), search/CSV/share untouched ✓, delivery untouched ✓.

- [ ] **Step 3: Commit any fixes, then hand off**

If Steps 1–2 surfaced fixes, commit them (`git add -A && git commit -m "fix: <what>"`). On-device verification checklist for the user (simulator, `npx expo run:ios`, run in a separate terminal):

1. Home: Love it / Hate it card appears in the stack (may take a few reshuffles — it shares the game slot with 3 Rank prompts) with the `LOVE IT / HATE IT` pill.
2. Respond: theme headlines the green card, mascot peeks over the corner, no footer quip; typing/keyboard never changes the theme; SEND disabled until both lines are filled; back-swipe with text warns.
3. After save: feed shows the pink `LOVE + HATE` pill with theme + both lines; entry detail renders the tagged rows; share card and CSV export show the plain-text `Theme / Love it: … / Hate it: …` rendering.

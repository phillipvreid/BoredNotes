# Help Me Write Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the global freeform/prompted Settings toggle with a per-entry "Help me write" pill in Respond, with Place/Time/Weather/Memory chips controlling what context feeds AI prompt generation.

**Architecture:** `src/types.ts` gains a `PromptModifiers` type. `src/prompts/ai.ts`'s `buildContextLine` becomes modifier-aware (builds only the sentence fragments for active chips) and appends a soft steering instruction instead of any code-level randomization. `src/prompts/contextual.ts`'s two exports take a required `modifiers` param and thread it through, zeroing out `recentTopics` when the Memory chip is off. `app/index.tsx` drops all prompt-fetching and becomes a static tile. `app/respond.tsx` owns the new pill/chip UI, chip persistence (`help_me_write_chips` setting), and per-entry `entry_mode` derivation. `app/settings.tsx` drops the "Freeform mode" row and corrects the offline-mode privacy disclosure copy.

**Tech Stack:** Expo Router, React Native, TypeScript, expo-sqlite, Jest + jest-expo + @testing-library/react-native (installed but not currently used for screen-level tests in this repo — this plan keeps that existing convention and does not introduce new screen-render tests).

## Global Constraints

- No backend, no analytics (per CLAUDE.md) — everything here is local SQLite settings + existing Anthropic API call path.
- Do not send full private notes to AI — `recentTopics` (snippets of past entries) must only be included in the AI request when the Memory chip is on.
- Offline Mode must disable AI prompt generation entirely — when on, Respond's prompt block must not show chips and must not call the AI.
- Preserve strict TypeScript — no `any` beyond what already exists in the codebase (e.g. mocked `db as any` in tests).
- Keep changes small and focused; do not touch `src/prompts/next.ts`, `src/context/gather.ts`, `src/context/weather.ts`, schema/migrations, `src/db/entries.ts`, entry detail screen, or share rendering — confirmed unaffected during spec review.

---

### Task 1: Add `PromptModifiers` type

**Files:**
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `PromptModifiers` interface (`time`, `place`, `weather`, `memory`: all `boolean`) and `DEFAULT_MODIFIERS` constant (all `true`), used by Tasks 2, 3, 6.

- [ ] **Step 1: Add the type and constant**

Add after the `CurrentPrompt` interface (after line 53) in `src/types.ts`:

```ts
export interface PromptModifiers {
  time: boolean;
  place: boolean;
  weather: boolean;
  memory: boolean;
}

export const DEFAULT_MODIFIERS: PromptModifiers = {
  time: true,
  place: true,
  weather: true,
  memory: true,
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors (existing errors, if any, are unrelated — note them but don't fix here).

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add PromptModifiers type for Help Me Write chips"
```

---

### Task 2: Modifier-aware context line in `ai.ts`

**Files:**
- Modify: `src/prompts/ai.ts`
- Modify: `__tests__/prompts/ai.test.ts`

**Interfaces:**
- Consumes: nothing new from Task 1 directly (uses a local `Pick<PromptModifiers, 'time'|'place'|'weather'>` shape, kept structural so `next.ts`'s existing calls — which never pass `modifiers` — keep compiling unchanged).
- Produces: `AiPromptInput.modifiers?: Pick<PromptModifiers, 'time'|'place'|'weather'>` (optional, defaults internally to all-true). Task 3 will pass this explicitly from `contextual.ts`.

- [ ] **Step 1: Write the failing tests**

Add these cases to `__tests__/prompts/ai.test.ts` (after the existing `'omits context line when no context is provided'` test, before the closing `});`):

```ts
  it('includes only the weather fragment when only the weather modifier is on', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'What does the air feel like?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'observational',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'evening', dayOfWeek: 'Thursday', season: 'autumn',
          locationLabel: 'Edinburgh, Scotland', weatherCondition: 'rainy', temperatureCelsius: 11,
        },
        modifiers: { time: false, place: false, weather: true },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain("It's rainy, 11°C.");
    expect(body.messages[0].content).not.toContain('Edinburgh');
    expect(body.messages[0].content).not.toContain('Thursday');
  });

  it('includes only the place fragment when only the place modifier is on', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'What do you notice around you?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'observational',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'evening', dayOfWeek: 'Thursday', season: 'autumn',
          locationLabel: 'Edinburgh, Scotland', weatherCondition: 'rainy', temperatureCelsius: 11,
        },
        modifiers: { time: false, place: true, weather: false },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('The user is currently in Edinburgh, Scotland.');
    expect(body.messages[0].content).not.toContain('rainy');
  });

  it('falls back to season when time is on but place is off, even if a location is available', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'What season feeling stands out?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'reflective',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'evening', dayOfWeek: 'Thursday', season: 'autumn',
          locationLabel: 'Edinburgh, Scotland', weatherCondition: 'rainy', temperatureCelsius: 11,
        },
        modifiers: { time: true, place: false, weather: false },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain("It's a Thursday evening in autumn.");
  });

  it('omits the context line entirely when all modifiers are off', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'A bare prompt?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'reflective',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'evening', dayOfWeek: 'Thursday', season: 'autumn',
          locationLabel: 'Edinburgh, Scotland', weatherCondition: 'rainy', temperatureCelsius: 11,
        },
        modifiers: { time: false, place: false, weather: false },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).not.toContain("It's");
    expect(body.messages[0].content).not.toContain('force every detail');
  });

  it('appends a soft steering line only when a context line is present', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'A steered prompt?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'reflective',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'evening', dayOfWeek: 'Thursday', season: 'autumn',
          locationLabel: 'Edinburgh, Scotland', weatherCondition: 'rainy', temperatureCelsius: 11,
        },
        modifiers: { time: true, place: false, weather: false },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('only use what makes it feel timely or personal');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/prompts/ai.test.ts`
Expected: FAIL — `AiPromptInput` has no `modifiers` field yet (TypeScript error) and the new fragment text doesn't exist.

- [ ] **Step 3: Implement the modifier-aware context line**

Replace the full contents of `src/prompts/ai.ts` with:

```ts
import type { PromptCategory, PromptModifiers } from '../types';
import type { PromptContext } from '../context/types';

export interface AiPromptInput {
  category: PromptCategory;
  depth: 1 | 2 | 3;
  recentTopics: string[];
  context?: PromptContext;
  modifiers?: Pick<PromptModifiers, 'time' | 'place' | 'weather'>;
}

const TIMEOUT_MS = 2000;
const DEFAULT_CONTEXT_MODIFIERS: Pick<PromptModifiers, 'time' | 'place' | 'weather'> = {
  time: true,
  place: true,
  weather: true,
};

function buildContextLine(
  ctx: PromptContext,
  modifiers: Pick<PromptModifiers, 'time' | 'place' | 'weather'>
): string {
  const hasWeather = modifiers.weather && !!ctx.weatherCondition && ctx.temperatureCelsius !== null;
  const hasPlace = modifiers.place && !!ctx.locationLabel;
  const hasTime = modifiers.time;

  if (!hasWeather && !hasPlace && !hasTime) return '';

  if (hasTime && hasPlace && hasWeather) {
    return `It's a ${ctx.weatherCondition} ${ctx.dayOfWeek} ${ctx.timeOfDay} in ${ctx.locationLabel}, ${ctx.temperatureCelsius}°C.`;
  }
  if (hasTime && hasPlace) {
    return `It's a ${ctx.dayOfWeek} ${ctx.timeOfDay} in ${ctx.locationLabel}.`;
  }
  if (hasTime) {
    return `It's a ${ctx.dayOfWeek} ${ctx.timeOfDay} in ${ctx.season}.`;
  }
  if (hasPlace && hasWeather) {
    return `It's ${ctx.weatherCondition} in ${ctx.locationLabel}, ${ctx.temperatureCelsius}°C.`;
  }
  if (hasPlace) {
    return `The user is currently in ${ctx.locationLabel}.`;
  }
  return `It's ${ctx.weatherCondition}, ${ctx.temperatureCelsius}°C.`;
}

export async function generateAiPrompt(
  input: AiPromptInput,
  apiKey: string
): Promise<string | null> {
  const depthLabel = ['light and quick', 'moderately thoughtful', 'deep and personal'][input.depth - 1];
  const topicsLine = input.recentTopics.length > 0
    ? `Recent topics the user has responded to: ${input.recentTopics.join(', ')}.`
    : '';
  const modifiers = input.modifiers ?? DEFAULT_CONTEXT_MODIFIERS;
  const contextLine = input.context ? buildContextLine(input.context, modifiers) : '';
  const steeringLine = contextLine
    ? " Don't force every detail into one short question — only use what makes it feel timely or personal."
    : '';

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [{
      role: 'user',
      content: `${contextLine ? contextLine + ' ' : ''}Generate one ${depthLabel} journaling prompt in the "${input.category}" category.${steeringLine} ${topicsLine} The prompt should be a single question, under 20 words, written in second person. Return only the prompt text, no quotes, no explanation.`,
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/prompts/ai.test.ts`
Expected: PASS — all tests including the pre-existing `'includes rich context line when all rich signals are present'` and `'includes light context line when rich signals are absent'` (both still pass with no changes, since omitting `modifiers` defaults to all-true, reproducing the old behavior exactly).

- [ ] **Step 5: Commit**

```bash
git add src/prompts/ai.ts __tests__/prompts/ai.test.ts
git commit -m "feat: make AI prompt context line modifier-aware"
```

---

### Task 3: Thread modifiers through `contextual.ts`

**Files:**
- Modify: `src/prompts/contextual.ts`
- Modify: `__tests__/prompts/contextual.test.ts`

**Interfaces:**
- Consumes: `PromptModifiers`, `DEFAULT_MODIFIERS` from `src/types.ts` (Task 1); `generateAiPrompt`'s `modifiers` field (Task 2).
- Produces: `getContextualPrompt(db, modifiers: PromptModifiers): Promise<CurrentPrompt>` and `forceRefreshContextualPrompt(db, modifiers: PromptModifiers): Promise<CurrentPrompt>` — both now take a **required** second argument. Task 6 (`app/respond.tsx`) is the only real caller.

- [ ] **Step 1: Write the failing tests**

In `__tests__/prompts/contextual.test.ts`, update every existing call site to pass `DEFAULT_MODIFIERS`. First add the import at the top:

```ts
import { DEFAULT_MODIFIERS } from '../../src/types';
```

Then change every call from `getContextualPrompt(db as any)` to `getContextualPrompt(db as any, DEFAULT_MODIFIERS)`, and `forceRefreshContextualPrompt(db as any)` to `forceRefreshContextualPrompt(db as any, DEFAULT_MODIFIERS)` (5 call sites total — one per `it()` block).

Add this new test inside the `describe('getContextualPrompt', ...)` block, after the existing `'returns the AI-generated prompt on success'` test:

```ts
  it('omits recentTopics from the AI call when the memory modifier is off', async () => {
    const db = makeMockDb();
    mockGenerateAiPrompt.mockResolvedValue('What small joy surprised you this morning?');

    await getContextualPrompt(db as any, { ...DEFAULT_MODIFIERS, memory: false });

    expect(mockGenerateAiPrompt).toHaveBeenCalledWith(
      expect.objectContaining({ recentTopics: [] }),
      expect.any(String)
    );
  });

  it('passes time/place/weather modifiers through to the AI call', async () => {
    const db = makeMockDb();
    mockGenerateAiPrompt.mockResolvedValue('A prompt');

    await getContextualPrompt(db as any, { time: true, place: false, weather: false, memory: true });

    expect(mockGenerateAiPrompt).toHaveBeenCalledWith(
      expect.objectContaining({ modifiers: { time: true, place: false, weather: false } }),
      expect.any(String)
    );
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/prompts/contextual.test.ts`
Expected: FAIL — TypeScript error, `getContextualPrompt`/`forceRefreshContextualPrompt` don't accept a second argument yet, and the new assertions have nothing to match.

- [ ] **Step 3: Implement modifier threading**

In `src/prompts/contextual.ts`, replace the import line and the three exported/internal functions. First, update the import at the top of the file:

```ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { CurrentPrompt, PromptCategory, PromptModifiers } from '../types';
import { getSetting, setSetting } from '../db/settings';
import { getRecentEntries } from '../db/entries';
import { getEligiblePrompts } from '../db/prompts';
import { selectPrompt } from './selection';
import { generateAiPrompt } from './ai';
import { getCurrentPrompt, getNextPrompt, peekNextLibraryPrompt } from './next';
import { gatherContext } from '../context/gather';
```

Then replace `_getContextualPrompt` and the two exports (the rest of the file, from `async function _getContextualPrompt` to the end) with:

```ts
async function _getContextualPrompt(
  db: SQLiteDatabase,
  skipThrottle: boolean,
  modifiers: PromptModifiers,
): Promise<CurrentPrompt> {
  const offlineMode = (await getSetting(db, 'offline_mode')) === 'true';
  if (offlineMode) {
    if (skipThrottle) return await peekNextLibraryPrompt(db);
    return (await getCurrentPrompt(db)) ?? await getNextPrompt(db);
  }

  if (!skipThrottle) {
    const lastGenAt = await getSetting(db, 'contextual_prompt_generated_at');
    if (lastGenAt) {
      const elapsed = Date.now() - new Date(lastGenAt).getTime();
      if (elapsed < THROTTLE_MS) {
        const text = await getSetting(db, 'contextual_prompt_text');
        const category = await getSetting(db, 'contextual_prompt_category') as PromptCategory | null;
        if (text && category) {
          const source = (await getSetting(db, 'contextual_prompt_source') as 'ai' | 'library') ?? 'ai';
          return { text, category, source };
        }
      }
    }
  }

  if (!API_KEY) {
    if (skipThrottle) return await peekNextLibraryPrompt(db);
    return (await getCurrentPrompt(db)) ?? await getNextPrompt(db);
  }

  try {
    const recentEntries = await getRecentEntries(db, 30);
    const recentCategories = JSON.parse(
      (await getSetting(db, 'recent_categories')) ?? '[]'
    ) as PromptCategory[];
    const recentDepths = JSON.parse(
      (await getSetting(db, 'recent_depths')) ?? '[]'
    ) as number[];

    const eligible = await getEligiblePrompts(db, {
      excludeTexts: recentEntries.map(e => e.prompt_text),
      excludeCategories: recentCategories.slice(-2),
      excludeDepth:
        recentDepths.slice(-3).length === 3 &&
        recentDepths.slice(-3).every(d => d === recentDepths[recentDepths.length - 1])
          ? recentDepths[recentDepths.length - 1]
          : null,
    });
    const allFallback = await getEligiblePrompts(db, {});
    const pool = eligible.length > 0 ? eligible : allFallback;
    const selected = selectPrompt(pool, recentCategories, recentDepths);

    const recentTopics = modifiers.memory
      ? recentEntries.slice(0, 3).map(e => e.response_text.slice(0, 40).replace(/\n/g, ' '))
      : [];

    const context = await gatherContext();
    const aiText = await generateAiPrompt(
      {
        category: selected.category,
        depth: selected.depth,
        recentTopics,
        context,
        modifiers: { time: modifiers.time, place: modifiers.place, weather: modifiers.weather },
      },
      API_KEY
    );

    if (aiText) {
      await setSetting(db, 'contextual_prompt_text', aiText);
      await setSetting(db, 'contextual_prompt_category', selected.category);
      await setSetting(db, 'contextual_prompt_generated_at', new Date().toISOString());
      await setSetting(db, 'contextual_prompt_source', 'ai');
      return { text: aiText, category: selected.category, source: 'ai' };
    }
  } catch {
    // fall through to DB fallback
  }

  if (skipThrottle) return await peekNextLibraryPrompt(db);
  return (await getCurrentPrompt(db)) ?? await getNextPrompt(db);
}

export async function getContextualPrompt(
  db: SQLiteDatabase,
  modifiers: PromptModifiers,
): Promise<CurrentPrompt> {
  return _getContextualPrompt(db, false, modifiers);
}

export async function forceRefreshContextualPrompt(
  db: SQLiteDatabase,
  modifiers: PromptModifiers,
): Promise<CurrentPrompt> {
  await setSetting(db, 'contextual_prompt_generated_at', '');
  return _getContextualPrompt(db, true, modifiers);
}
```

(`API_KEY` and `THROTTLE_MS` constants above `_getContextualPrompt` are unchanged — leave them as-is.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/prompts/contextual.test.ts`
Expected: PASS — all 7 tests (5 updated + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/prompts/contextual.ts __tests__/prompts/contextual.test.ts
git commit -m "feat: require modifiers param on contextual prompt functions"
```

---

### Task 4: Settings screen cleanup

**Files:**
- Modify: `app/settings.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks — this is a leaf change.

- [ ] **Step 1: Remove the Freeform mode state and toggle**

In `app/settings.tsx`, delete lines 44–64 (the `isFreeform` state, its `useEffect`, and `handleFreeformToggle`):

```ts
  const [isFreeform, setIsFreeform] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        const mode = await getSetting(db, 'respond_mode');
        setIsFreeform(mode === 'freeform');
      } catch {}
    })();
  }, []);

  async function handleFreeformToggle(value: boolean) {
    setIsFreeform(value);
    try {
      const db = await getDb();
      await setSetting(db, 'respond_mode', value ? 'freeform' : 'prompted');
    } catch {
      setIsFreeform(!value);
    }
  }
```

- [ ] **Step 2: Remove the Freeform mode row and update the Offline Mode subtitle**

Replace this block (the Offline Mode row's subtitle plus the entire Freeform mode row that follows it):

```tsx
        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Offline Mode</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>AI-generated prompts use short snippets from your recent notes for context. Enable offline mode to disable this.</Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={handleOfflineToggle}
            trackColor={{ true: accent.buttonColor }}
            disabled={toggling}
          />
        </View>

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

with:

```tsx
        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Offline Mode</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>AI-generated prompts can use short snippets from your recent notes when the Memory option is on. Enable offline mode to disable AI prompts entirely.</Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={handleOfflineToggle}
            trackColor={{ true: accent.buttonColor }}
            disabled={toggling}
          />
        </View>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (`rowTextBlock`/`rowSubLabel` styles become unused by this row but are still used elsewhere in the file by the Auto-location row — leave the `styles` object untouched.)

- [ ] **Step 4: Commit**

```bash
git add app/settings.tsx
git commit -m "feat: remove global freeform toggle, fix offline-mode disclosure copy"
```

---

### Task 5: Simplify Home screen

**Files:**
- Modify: `app/index.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks — leaf change, but must land before/independently of Task 6 since both touch navigation between Home and Respond (Home now passes no params, Respond no longer reads any).

- [ ] **Step 1: Replace the file**

Replace the full contents of `app/index.tsx` with:

```tsx
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext';

export default function HomeScreen() {
  const { colors, accent } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.appName, { color: accent.labelColor }]}>BoredNotes</Text>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={[styles.settingsBtn, { backgroundColor: colors.surface, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
          >
            <Feather name="settings" size={18} color={accent.labelColor} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.promptCard, {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.shadowOpacity,
          }]}
          onPress={() => router.push('/respond')}
          activeOpacity={0.85}
        >
          <Text style={[styles.promptLabel, { color: accent.labelColor }]}>Today's entry</Text>
          <Text style={[styles.promptText, { color: colors.textMuted }]}>
            {"What's on your mind…"}
          </Text>
          <Text style={[styles.tapHint, { color: colors.textMuted }]}>Tap to write →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boredBeforeTile, {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.shadowOpacity,
          }]}
          onPress={() => router.push('/boredbefore')}
        >
          <Feather name="clock" size={22} color={colors.textSecondary} />
          <View>
            <Text style={[styles.boredBeforeTitle, { color: accent.labelColor }]}>BoredBefore</Text>
            <Text style={[styles.boredBeforeSubtitle, { color: colors.textMuted }]}>Look into your bored past</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 20, gap: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  appName: { fontSize: 13, fontFamily: 'DEM-MOMono', letterSpacing: 2, textTransform: 'uppercase' },
  settingsBtn: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  promptCard: {
    flex: 1, borderRadius: 16, padding: 24,
    justifyContent: 'center', gap: 12,
    borderWidth: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  promptLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  promptText: { fontSize: 20, lineHeight: 30, fontFamily: 'Georgia', fontStyle: 'italic' },
  tapHint: { fontSize: 13, marginTop: 8 },
  boredBeforeTile: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 12, padding: 18, borderWidth: 1,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  boredBeforeTitle: { fontSize: 15, fontWeight: '600' },
  boredBeforeSubtitle: { fontSize: 12, marginTop: 2 },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "feat: simplify Home to a static freeform entry tile"
```

---

### Task 6: "Help me write" pill, chips, and submit logic in Respond

**Files:**
- Modify: `app/respond.tsx`

**Interfaces:**
- Consumes: `PromptModifiers`, `DEFAULT_MODIFIERS` (Task 1); `getContextualPrompt(db, modifiers)`, `forceRefreshContextualPrompt(db, modifiers)` (Task 3).
- Produces: nothing consumed by later tasks — leaf change.

- [ ] **Step 1: Replace the file**

Replace the full contents of `app/respond.tsx` with:

```tsx
import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Image, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getDb } from '../src/db/database';
import { createEntry } from '../src/db/entries';
import { createMedia } from '../src/db/media';
import { getNextPrompt } from '../src/prompts/next';
import { getContextualPrompt, forceRefreshContextualPrompt } from '../src/prompts/contextual';
import { getSetting, setSetting } from '../src/db/settings';
import { captureLocation, queuePendingGeocode } from '../src/location/location';
import { pickPhoto, takePhoto } from '../src/media/capture';
import { useTheme } from '../src/theme/ThemeContext';
import { checkEntryAgainstPlaces } from '../src/db/places';
import { DEFAULT_MODIFIERS } from '../src/types';
import type { CurrentPrompt, PromptModifiers } from '../src/types';

const CHIP_LABELS: Record<keyof PromptModifiers, string> = {
  place: 'Place',
  time: 'Time',
  weather: 'Weather',
  memory: 'Memory',
};
const CHIP_KEYS: (keyof PromptModifiers)[] = ['place', 'time', 'weather', 'memory'];

export default function RespondScreen() {
  const { colors, accent } = useTheme();
  const [response, setResponse] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [helpMeWriteOpen, setHelpMeWriteOpen] = useState(false);
  const [prompt, setPrompt] = useState<CurrentPrompt | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [modifiers, setModifiers] = useState<PromptModifiers>(DEFAULT_MODIFIERS);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      setOfflineMode((await getSetting(db, 'offline_mode')) === 'true');

      const storedChips = await getSetting(db, 'help_me_write_chips');
      if (storedChips) {
        try {
          setModifiers(JSON.parse(storedChips));
        } catch {}
      }

      const shouldAutoLocate = (await getSetting(db, 'auto_location')) === 'true';
      if (shouldAutoLocate) {
        try {
          const loc = await captureLocation();
          if (loc) {
            setLocationLabel(loc.label ?? '');
            setLocationCoords({ lat: loc.lat, lng: loc.lng });
          }
        } catch {}
      }
    })();
  }, []);

  async function loadPrompt(activeModifiers: PromptModifiers) {
    setPromptLoading(true);
    try {
      const db = await getDb();
      const result = await getContextualPrompt(db, activeModifiers);
      setPrompt(result);
    } finally {
      setPromptLoading(false);
    }
  }

  async function handleToggleHelpMeWrite() {
    if (helpMeWriteOpen) {
      setHelpMeWriteOpen(false);
      return;
    }
    setHelpMeWriteOpen(true);
    if (!prompt) {
      await loadPrompt(modifiers);
    }
  }

  async function handleRefreshPrompt() {
    setPromptLoading(true);
    try {
      const db = await getDb();
      const fresh = await forceRefreshContextualPrompt(db, modifiers);
      setPrompt(fresh);
    } catch {
      Alert.alert('Could not refresh prompt', 'Please try again.');
    } finally {
      setPromptLoading(false);
    }
  }

  async function handleToggleModifier(key: keyof PromptModifiers) {
    const next = { ...modifiers, [key]: !modifiers[key] };
    setModifiers(next);
    setPromptLoading(true);
    try {
      const db = await getDb();
      await setSetting(db, 'help_me_write_chips', JSON.stringify(next));
      const fresh = await forceRefreshContextualPrompt(db, next);
      setPrompt(fresh);
    } catch {
      Alert.alert('Could not update prompt', 'Please try again.');
    } finally {
      setPromptLoading(false);
    }
  }

  async function handleAddLocation() {
    const loc = await captureLocation();
    if (loc) {
      setLocationLabel(loc.label ?? '');
      setLocationCoords({ lat: loc.lat, lng: loc.lng });
    }
  }

  async function handlePickPhoto() {
    try {
      const uri = await pickPhoto();
      if (uri) setPhotoUri(uri);
    } catch (e) {
      if (e instanceof Error && e.message === 'permission_denied') {
        Alert.alert('Permission needed', 'Please allow photo library access in Settings to attach photos.');
      } else {
        Alert.alert('Photo error', 'Could not attach the photo. Please try again.');
      }
    }
  }

  async function handleTakePhoto() {
    try {
      const uri = await takePhoto();
      if (uri) setPhotoUri(uri);
    } catch (e) {
      if (e instanceof Error && e.message === 'permission_denied') {
        Alert.alert('Permission needed', 'Please allow camera access in Settings to take photos.');
      } else {
        Alert.alert('Camera error', 'Could not attach the photo. Please try again.');
      }
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
        prompt_text: helpMeWriteOpen ? (prompt?.text ?? '') : '',
        response_text: response.trim(),
        location_label: locationLabel || undefined,
        location_lat: locationCoords?.lat,
        location_lng: locationCoords?.lng,
        entry_mode: helpMeWriteOpen ? 'prompted' : 'freeform',
      });
      if (locationCoords && !locationLabel) {
        await queuePendingGeocode(db, entryId, locationCoords.lat, locationCoords.lng);
      }
      if (locationCoords) {
        try {
          await checkEntryAgainstPlaces(db, {
            id: entryId,
            lat: locationCoords.lat,
            lng: locationCoords.lng,
          });
        } catch (e) {
          console.warn('checkEntryAgainstPlaces failed:', e);
        }
      }
      if (photoUri) await createMedia(db, entryId, 'photo', photoUri);
      await getNextPrompt(db);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save your entry. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={[styles.closeTxt, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>

          {!helpMeWriteOpen && (
            <TouchableOpacity onPress={handleToggleHelpMeWrite} style={styles.helpPill}>
              <Text style={[styles.helpPillTxt, { color: accent.buttonColor }]}>✨ Help me write</Text>
            </TouchableOpacity>
          )}

          {helpMeWriteOpen && (
            <View style={styles.promptBlock}>
              <View style={styles.promptRow}>
                {promptLoading ? (
                  <Text style={[styles.prompt, { color: colors.textMuted, flex: 1 }]}>…</Text>
                ) : (
                  <>
                    <Text style={[styles.prompt, { color: colors.textPrimary, flex: 1 }]}>{prompt?.text}</Text>
                    {!offlineMode && prompt?.source === 'ai' && (
                      <View style={[styles.aiBadge, { backgroundColor: accent.buttonColor + '20' }]}>
                        <Text style={[styles.aiBadgeText, { color: accent.buttonColor }]}>AI</Text>
                      </View>
                    )}
                  </>
                )}
                <TouchableOpacity onPress={handleRefreshPrompt} disabled={promptLoading} hitSlop={8} style={styles.refreshBtn}>
                  <Feather name="refresh-cw" size={14} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleToggleHelpMeWrite} hitSlop={8} style={styles.refreshBtn}>
                  <Feather name="x" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {!offlineMode && (
                <View style={styles.chipRow}>
                  {CHIP_KEYS.map(key => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => handleToggleModifier(key)}
                      disabled={promptLoading}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: modifiers[key] ? accent.buttonColor : colors.surface,
                          borderColor: modifiers[key] ? accent.buttonColor : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipTxt, { color: modifiers[key] ? '#fff' : colors.textSecondary }]}>
                        {CHIP_LABELS[key]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderBottomColor: colors.border }]}
            placeholder="What's on your mind…"
            placeholderTextColor={colors.textMuted}
            multiline
            autoFocus
            value={response}
            onChangeText={setResponse}
          />

          {photoUri && (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photoUri }} style={styles.photoImg} />
              <TouchableOpacity onPress={() => setPhotoUri(null)}>
                <Text style={styles.removeTxt}>Remove photo</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.metaRow}>
            <View style={styles.locationRow}>
              <TouchableOpacity onPress={handleAddLocation}>
                <Text style={[styles.metaBtnTxt, { color: colors.textSecondary }]}>
                  {locationLabel ? `📍 ${locationLabel}` : '📍 Add place'}
                </Text>
              </TouchableOpacity>
              {locationLabel !== '' && (
                <TouchableOpacity onPress={() => { setLocationLabel(''); setLocationCoords(null); }}>
                  <Text style={styles.removeTxt}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {locationLabel !== '' && (
              <TextInput
                style={[styles.locationInput, { color: colors.textPrimary, borderBottomColor: colors.border }]}
                value={locationLabel}
                onChangeText={setLocationLabel}
                placeholder="Edit place name"
                placeholderTextColor={colors.textMuted}
              />
            )}
          </View>

          <View style={styles.attachRow}>
            <TouchableOpacity
              onPress={handlePickPhoto}
              style={[styles.attachBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.attachTxt, { color: colors.textSecondary }]}>🖼 Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleTakePhoto}
              style={[styles.attachBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.attachTxt, { color: colors.textSecondary }]}>📷 Camera</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: (!response.trim() || submitting) ? colors.border : accent.buttonColor }]}
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
  safe: { flex: 1 },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  closeBtn: { alignSelf: 'flex-end', padding: 4 },
  closeTxt: { fontSize: 18 },
  helpPill: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4 },
  helpPillTxt: { fontSize: 15, fontWeight: '600' },
  promptBlock: { gap: 10 },
  promptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  prompt: { fontSize: 20, lineHeight: 30, fontFamily: 'Georgia', fontStyle: 'italic' },
  refreshBtn: { marginTop: 8 },
  aiBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginTop: 6 },
  aiBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderRadius: 14, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12 },
  chipTxt: { fontSize: 12, fontWeight: '600' },
  input: { fontSize: 16, lineHeight: 26, minHeight: 160, textAlignVertical: 'top', borderBottomWidth: 1, paddingBottom: 12, fontFamily: 'Georgia', fontStyle: 'italic' },
  photoPreview: { gap: 6 },
  photoImg: { width: '100%', height: 180, borderRadius: 8 },
  removeTxt: { color: '#f87171', fontSize: 13 },
  metaRow: { gap: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaBtnTxt: { fontSize: 14 },
  locationInput: { fontSize: 14, borderBottomWidth: 1, paddingVertical: 4 },
  attachRow: { flexDirection: 'row', gap: 10 },
  attachBtn: { flex: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  attachTxt: { fontSize: 13 },
  submitBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification (no automated screen tests exist for this file today — see Global Constraints)**

Run: `npm run start` (or your usual dev-build flow per CLAUDE.md — this needs an EAS dev build, not Expo Go, since the project uses native modules)

Check on-device or in the dev build:
1. Home shows a static "What's on your mind…" tile only — tapping it opens Respond directly into freeform with no prompt visible.
2. In Respond, tapping "✨ Help me write" expands a prompt with Place/Time/Weather/Memory chips (when online and not in Offline Mode) and a refresh icon.
3. Toggling a chip regenerates the prompt immediately (loading indicator briefly shows `…`).
4. Tapping the "x" next to the prompt collapses back to the pill; any text already typed in the box is unchanged.
5. With Offline Mode on (Settings), opening "Help me write" shows a library prompt with no chip row.
6. Submitting an entry with the prompt block open saves `entry_mode: 'prompted'` and the shown prompt text; submitting collapsed saves `entry_mode: 'freeform'` and empty `prompt_text` — confirm via the entry detail screen after saving each kind.

- [ ] **Step 4: Commit**

```bash
git add app/respond.tsx
git commit -m "feat: add Help Me Write pill and context chips to Respond"
```

---

### Task 7: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test -- --runInBand`
Expected: all tests pass, including the updated `ai.test.ts` and `contextual.test.ts` from Tasks 2–3 and every pre-existing suite (selection, next, gather, weather, db, share, export, theme, boredbefore).

- [ ] **Step 2: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Validate Expo config**

Run: `npx expo config --type introspect`
Expected: exits cleanly (this change touches no native config, `app.json`, or dependencies, so this is a sanity check, not expected to surface anything).

- [ ] **Step 4: Grep for orphaned references**

Run: `grep -rn "respond_mode\|respondMode\|isFreeform" app/ src/ __tests__/`
Expected: no matches (confirms the global toggle is fully removed from all live code, not just the three files touched above).

- [ ] **Step 5: Commit (only if Step 4 found and fixed something — otherwise skip)**

```bash
git add -A
git commit -m "fix: remove remaining respond_mode references"
```

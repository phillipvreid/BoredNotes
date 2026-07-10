# Settings Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a wonky-tilt toggle and a three-way Light/Dark/System appearance selector to the Settings screen.

**Architecture:** Both preferences live in the existing key-value `settings` table and are exposed through `ThemeContext`. Appearance mode replaces the old boolean dark-mode flag; `isDark` becomes a value derived each render from the mode plus the live OS color scheme. Two pure helpers isolate the derivation and migration logic so they can be unit-tested without rendering.

**Tech Stack:** React Native, TypeScript, Expo, `expo-sqlite`, Jest / jest-expo, `@testing-library/react-native`.

## Global Constraints

- Strict TypeScript — no `any` in production code, no non-null assertions on new code paths.
- No new dependencies.
- No schema change or migration on the `settings` table (already key-value).
- Do not modify `Sticker`, `SpeechBubble`, or `OutlinedNumber` — the wonky toggle gates only the Home/Feed card stacks.
- Settings persisted via existing `getSetting(db, key)` / `setSetting(db, key, value)` helpers in `src/db/settings.ts`.
- Run tests with `npm test -- --runInBand`; typecheck with `npx tsc --noEmit`.

---

### Task 1: Pure appearance helpers

**Files:**
- Create: `src/theme/appearance.ts`
- Test: `__tests__/theme/appearance.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type AppearanceMode = 'light' | 'dark' | 'system'`
  - `resolveIsDark(mode: AppearanceMode, systemScheme: 'light' | 'dark' | null | undefined): boolean`
  - `resolveInitialMode(storedAppearance: string | null, legacyDark: string | null): AppearanceMode`

- [ ] **Step 1: Write the failing test**

Create `__tests__/theme/appearance.test.ts`:

```ts
import { resolveIsDark, resolveInitialMode } from '../../src/theme/appearance';

describe('resolveIsDark', () => {
  it('system mode follows a dark system scheme', () => {
    expect(resolveIsDark('system', 'dark')).toBe(true);
  });
  it('system mode follows a light system scheme', () => {
    expect(resolveIsDark('system', 'light')).toBe(false);
  });
  it('system mode treats a null scheme as light', () => {
    expect(resolveIsDark('system', null)).toBe(false);
    expect(resolveIsDark('system', undefined)).toBe(false);
  });
  it('dark mode is always dark regardless of system', () => {
    expect(resolveIsDark('dark', 'light')).toBe(true);
    expect(resolveIsDark('dark', null)).toBe(true);
  });
  it('light mode is always light regardless of system', () => {
    expect(resolveIsDark('light', 'dark')).toBe(false);
    expect(resolveIsDark('light', null)).toBe(false);
  });
});

describe('resolveInitialMode', () => {
  it('uses a stored appearance value when valid', () => {
    expect(resolveInitialMode('dark', null)).toBe('dark');
    expect(resolveInitialMode('light', null)).toBe('light');
    expect(resolveInitialMode('system', null)).toBe('system');
  });
  it('stored appearance wins over a legacy dark flag', () => {
    expect(resolveInitialMode('light', 'true')).toBe('light');
  });
  it('migrates a legacy dark flag when no appearance is stored', () => {
    expect(resolveInitialMode(null, 'true')).toBe('dark');
    expect(resolveInitialMode(null, 'false')).toBe('light');
  });
  it('defaults to system when nothing is stored', () => {
    expect(resolveInitialMode(null, null)).toBe('system');
  });
  it('falls back to system for an unknown stored appearance value', () => {
    expect(resolveInitialMode('parchment', null)).toBe('system');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/theme/appearance.test.ts`
Expected: FAIL — cannot find module `../../src/theme/appearance`.

- [ ] **Step 3: Write minimal implementation**

Create `src/theme/appearance.ts`:

```ts
export type AppearanceMode = 'light' | 'dark' | 'system';

// isDark is derived, never stored: system tracks the live OS scheme,
// light/dark are explicit overrides.
export function resolveIsDark(
  mode: AppearanceMode,
  systemScheme: 'light' | 'dark' | null | undefined,
): boolean {
  if (mode === 'system') return systemScheme === 'dark';
  return mode === 'dark';
}

// Picks the mode to start with on mount. A stored appearance_mode wins;
// otherwise a legacy theme_dark_mode boolean is migrated; otherwise system.
export function resolveInitialMode(
  storedAppearance: string | null,
  legacyDark: string | null,
): AppearanceMode {
  if (storedAppearance === 'light' || storedAppearance === 'dark' || storedAppearance === 'system') {
    return storedAppearance;
  }
  if (legacyDark === 'true') return 'dark';
  if (legacyDark === 'false') return 'light';
  return 'system';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/theme/appearance.test.ts`
Expected: PASS (11 assertions across 2 describe blocks).

- [ ] **Step 5: Commit**

```bash
git add src/theme/appearance.ts __tests__/theme/appearance.test.ts
git commit -m "feat: pure appearance mode helpers (resolveIsDark, resolveInitialMode)"
```

---

### Task 2: Wire appearance mode + wonky into ThemeContext

**Files:**
- Modify: `src/theme/ThemeContext.tsx`
- Test: `__tests__/theme/ThemeContext.test.tsx` (rewrite)

**Interfaces:**
- Consumes (from Task 1): `AppearanceMode`, `resolveIsDark`, `resolveInitialMode`.
- Produces (new `useTheme()` fields, on top of the existing `colors`, `theme`, `catHues`, `categoryStyles`, `isDark`, `setTheme`):
  - `appearanceMode: AppearanceMode`
  - `wonky: boolean`
  - `setAppearance: (mode: AppearanceMode) => void`
  - `setWonky: (on: boolean) => void`
  - `setDarkMode` is **removed**.

- [ ] **Step 1: Rewrite the ThemeContext test file**

The load order changes and `setDarkMode` is gone, so replace `__tests__/theme/ThemeContext.test.tsx` entirely. The new file uses a keyed settings mock (order-independent) instead of `mockResolvedValueOnce` chains:

```tsx
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../../src/theme/ThemeContext';
import { openDatabaseAsync } from 'expo-sqlite';
import { DEFAULT_THEME_ID, THEMES } from '../../src/theme/tokens';

describe('ThemeContext', () => {
  let db: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
  });

  // Keyed mock: getSetting reads `SELECT value ... WHERE key = ?` with [key].
  function mockSettings(store: Record<string, string> = {}) {
    db.getFirstAsync.mockImplementation((_sql: string, params: any[]) => {
      const key = params?.[0];
      return Promise.resolve(key in store ? { value: store[key] } : null);
    });
  }

  function wrapper({ children }: { children: React.ReactNode }) {
    return <ThemeProvider db={db}>{children}</ThemeProvider>;
  }

  it('defaults to classic when no stored value', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe(DEFAULT_THEME_ID);
  });

  it('loads stored theme from DB on mount', async () => {
    mockSettings({ theme_id: 'grape-soda' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe('grape-soda');
  });

  it('migrates a legacy paper setting to its nearest theme', async () => {
    mockSettings({ theme_paper: 'mint' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe('sour-apple');
  });

  it('stored theme_id wins over any legacy paper setting', async () => {
    mockSettings({ theme_id: 'cherry-cola', theme_paper: 'mint' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe('cherry-cola');
  });

  it('ignores an unknown legacy paper value', async () => {
    mockSettings({ theme_paper: 'parchment' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe(DEFAULT_THEME_ID);
  });

  it('setTheme updates theme synchronously', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setTheme('bubblegum'); });
    expect(result.current.theme.id).toBe('bubblegum');
  });

  it('setTheme persists to DB under theme_id', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    await act(async () => { result.current.setTheme('bubblegum'); });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO settings'),
      ['theme_id', 'bubblegum']
    );
  });

  it('categoryStyles and catHues follow the active theme', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    const grape = THEMES.find(t => t.id === 'grape-soda')!;
    act(() => { result.current.setTheme('grape-soda'); });
    expect(result.current.catHues).toEqual(grape.cats);
    expect(result.current.categoryStyles.reflective.color).toBe(grape.cats.reflect);
    expect(result.current.colors.action).toBe(grape.action);
  });

  // --- Appearance mode ---

  it('appearanceMode defaults to system when nothing stored', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.appearanceMode).toBe('system');
  });

  it('loads a stored appearance_mode', async () => {
    mockSettings({ appearance_mode: 'dark' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.appearanceMode).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('migrates a legacy dark flag when no appearance_mode is stored', async () => {
    mockSettings({ theme_dark_mode: 'true' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.appearanceMode).toBe('dark');
  });

  it('stored appearance_mode wins over a legacy dark flag', async () => {
    mockSettings({ appearance_mode: 'light', theme_dark_mode: 'true' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.appearanceMode).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('setAppearance updates mode and isDark synchronously', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setAppearance('dark'); });
    expect(result.current.appearanceMode).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('setAppearance persists to DB under appearance_mode', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    await act(async () => { result.current.setAppearance('dark'); });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO settings'),
      ['appearance_mode', 'dark']
    );
  });

  it('colors change when appearance flips to dark', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    const lightBg = result.current.colors.bg;
    act(() => { result.current.setAppearance('dark'); });
    expect(result.current.colors.bg).not.toBe(lightBg);
  });

  // --- Wonky ---

  it('wonky defaults to true when nothing stored', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.wonky).toBe(true);
  });

  it('loads a stored wonky_tilt of false', async () => {
    mockSettings({ wonky_tilt: 'false' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.wonky).toBe(false);
  });

  it('setWonky updates synchronously and persists', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    await act(async () => { result.current.setWonky(false); });
    expect(result.current.wonky).toBe(false);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO settings'),
      ['wonky_tilt', 'false']
    );
  });

  it('throws when useTheme is called outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within ThemeProvider'
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- --runInBand __tests__/theme/ThemeContext.test.tsx`
Expected: FAIL — `appearanceMode` / `wonky` / `setAppearance` / `setWonky` are undefined on the context value.

- [ ] **Step 3: Update ThemeContext**

Replace `src/theme/ThemeContext.tsx` with:

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getSetting, setSetting } from '../db/settings';
import {
  THEMES, DEFAULT_THEME_ID, LEGACY_PAPER_TO_THEME, makePalette, makeCategoryStyles,
  type ThemeDef, type Palette, type CatHues, type CategoryStyle,
} from './tokens';
import { resolveIsDark, resolveInitialMode, type AppearanceMode } from './appearance';
import type { PromptCategory } from '../types';

interface ThemeContextValue {
  colors: Palette;
  theme: ThemeDef;
  catHues: CatHues;
  categoryStyles: Record<PromptCategory, CategoryStyle>;
  isDark: boolean;
  appearanceMode: AppearanceMode;
  wonky: boolean;
  setTheme: (id: string) => void;
  setAppearance: (mode: AppearanceMode) => void;
  setWonky: (on: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  db: SQLiteDatabase;
  children: React.ReactNode;
}

export function ThemeProvider({ db, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>('system');
  const [wonky, setWonkyState] = useState(true);

  useEffect(() => {
    (async () => {
      const storedTheme = await getSetting(db, 'theme_id');
      const legacyPaper = storedTheme ? null : await getSetting(db, 'theme_paper');
      const storedAppearance = await getSetting(db, 'appearance_mode');
      const legacyDark = storedAppearance ? null : await getSetting(db, 'theme_dark_mode');
      const storedWonky = await getSetting(db, 'wonky_tilt');
      if (storedTheme) setThemeId(storedTheme);
      else if (legacyPaper && LEGACY_PAPER_TO_THEME[legacyPaper]) {
        setThemeId(LEGACY_PAPER_TO_THEME[legacyPaper]);
      }
      setAppearanceMode(resolveInitialMode(storedAppearance, legacyDark));
      if (storedWonky !== null) setWonkyState(storedWonky === 'true');
    })();
  }, []);

  function setTheme(id: string) {
    setThemeId(id);
    setSetting(db, 'theme_id', id);
  }

  function setAppearance(mode: AppearanceMode) {
    setAppearanceMode(mode);
    setSetting(db, 'appearance_mode', mode);
  }

  function setWonky(on: boolean) {
    setWonkyState(on);
    setSetting(db, 'wonky_tilt', String(on));
  }

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
  const isDark = resolveIsDark(appearanceMode, systemScheme);
  const colors = makePalette(theme, isDark);
  const categoryStyles = makeCategoryStyles(theme.cats);

  return (
    <ThemeContext.Provider value={{ colors, theme, catHues: theme.cats, categoryStyles, isDark, appearanceMode, wonky, setTheme, setAppearance, setWonky }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- --runInBand __tests__/theme/ThemeContext.test.tsx`
Expected: PASS (all tests, including the new appearance and wonky cases).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: `app/settings.tsx` fails — it still destructures `setDarkMode`, which no longer exists. This is expected and fixed in Task 4. No other errors.

- [ ] **Step 6: Commit**

```bash
git add src/theme/ThemeContext.tsx __tests__/theme/ThemeContext.test.tsx
git commit -m "feat: appearance mode + wonky flag in ThemeContext"
```

---

### Task 3: Gate the Home/Feed card tilts on wonky

**Files:**
- Modify: `app/index.tsx:101`
- Modify: `src/boredbefore/FeedTab.tsx:116`

**Interfaces:**
- Consumes (from Task 2): `wonky` from `useTheme()`.
- Produces: nothing new.

This task is thin wiring on rendered card stacks; it is verified by typecheck and on device (CI proves logic, not rendered UI).

- [ ] **Step 1: Gate the home card tilt**

In `app/index.tsx`, confirm `wonky` is available from the existing `useTheme()` destructure (add it if not), then change the card tilt at line ~101:

```tsx
// before:
tilt={TILTS[i % TILTS.length]}
// after:
tilt={wonky ? TILTS[i % TILTS.length] : 0}
```

Ensure the component's `useTheme()` call includes `wonky`, e.g. `const { ..., wonky } = useTheme();`.

- [ ] **Step 2: Gate the feed card tilt**

In `src/boredbefore/FeedTab.tsx`, add `wonky` to the `useTheme()` destructure and change the card tilt at line ~116:

```tsx
// before:
tilt={CARD_TILTS[i % CARD_TILTS.length]}
// after:
tilt={wonky ? CARD_TILTS[i % CARD_TILTS.length] : 0}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: only the known `app/settings.tsx` `setDarkMode` error remains (fixed in Task 4); no new errors from `index.tsx` or `FeedTab.tsx`.

- [ ] **Step 4: Run the full suite**

Run: `npm test -- --runInBand`
Expected: PASS — no regressions.

- [ ] **Step 5: Commit**

```bash
git add app/index.tsx src/boredbefore/FeedTab.tsx
git commit -m "feat: gate Home/Feed card tilts on the wonky setting"
```

---

### Task 4: Settings UI — wonky switch + appearance segments

**Files:**
- Modify: `app/settings.tsx`

**Interfaces:**
- Consumes (from Task 2): `appearanceMode`, `wonky`, `setAppearance`, `setWonky` from `useTheme()`; `AppearanceMode` from `src/theme/appearance`.
- Produces: nothing new.

Thin wiring; verified by typecheck and on device.

- [ ] **Step 1: Update the useTheme destructure and imports**

In `app/settings.tsx`, change the hook destructure (line ~17) from:

```tsx
const { colors, theme, isDark, setTheme, setDarkMode } = useTheme();
```

to:

```tsx
const { colors, theme, isDark, setTheme, appearanceMode, wonky, setAppearance, setWonky } = useTheme();
```

Add the import near the other theme imports:

```tsx
import type { AppearanceMode } from '../src/theme/appearance';
```

- [ ] **Step 2: Replace the Dark Mode switch row with an appearance segmented control**

Replace the Dark Mode `View` row (the block containing `<Switch value={isDark} onValueChange={setDarkMode} .../>`, lines ~112-119) with:

```tsx
<View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
  <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Appearance</Text>
  <View style={[styles.segments, { borderColor: colors.border }]}>
    {(['light', 'dark', 'system'] as AppearanceMode[]).map(mode => {
      const active = appearanceMode === mode;
      return (
        <TouchableOpacity
          key={mode}
          onPress={() => setAppearance(mode)}
          style={[
            styles.segment,
            { backgroundColor: active ? colors.action : colors.surface },
          ]}
        >
          <Text style={[styles.segmentText, { color: active ? colors.bg : colors.textPrimary }]}>
            {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
</View>
```

- [ ] **Step 3: Add the Wonky tilt switch row**

Directly below the appearance row (still inside the APPEARANCE section), add:

```tsx
<View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
  <View style={{ flex: 1 }}>
    <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Wonky tilt</Text>
    <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>Let the cards lean. Off = everything sits up straight.</Text>
  </View>
  <Switch
    value={wonky}
    onValueChange={setWonky}
    trackColor={{ true: colors.action }}
  />
</View>
```

- [ ] **Step 4: Add the segment styles**

Add these entries to the `StyleSheet.create({...})` object at the bottom of the file:

```tsx
segments: { flexDirection: 'row', borderWidth: 2, borderRadius: 10, overflow: 'hidden' },
segment: { paddingHorizontal: 12, paddingVertical: 7 },
segmentText: { fontSize: 13 },
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean — the `setDarkMode` error from Tasks 2/3 is now resolved and no new errors.

- [ ] **Step 6: Run the full suite**

Run: `npm test -- --runInBand`
Expected: PASS — full suite green.

- [ ] **Step 7: Commit**

```bash
git add app/settings.tsx
git commit -m "feat: Settings appearance selector + wonky tilt toggle"
```

---

## On-device verification (after all tasks)

CI proves logic, not the rendered UI. On simulator/device (`npx expo run:ios`):

1. Settings → APPEARANCE shows an **Appearance** row with Light · Dark · System segments and a **Wonky tilt** switch.
2. Tapping **Dark** / **Light** flips the whole app immediately; the active segment is tinted with the theme action color.
3. With **System** selected, changing the iOS appearance (Control Center / Settings) flips the app live while it's open.
4. The chosen appearance and wonky state survive an app restart.
5. Wonky **off** → Home and Feed card stacks sit straight; the mascot speech bubble and Rank numerals stay tilted. Wonky **on** → cards lean again.
6. Existing users who had dark mode on/off before the update keep that as an explicit Dark/Light choice (migration).

## Self-review notes

- **Spec coverage:** wonky setting + gating (Tasks 2, 3), appearance mode + derivation + migration (Tasks 1, 2), `setDarkMode` removal (Task 2), UI for both (Task 4), pure helpers + tests (Task 1). All spec sections mapped.
- **Type consistency:** `AppearanceMode`, `resolveIsDark`, `resolveInitialMode`, `appearanceMode`, `wonky`, `setAppearance`, `setWonky` used identically across tasks.
- **No new deps, no schema change** per Global Constraints.

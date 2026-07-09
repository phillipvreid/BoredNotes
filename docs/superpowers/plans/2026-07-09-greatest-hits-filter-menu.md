# Greatest Hits Filter Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Feed tab's "Date" button with a "Filter" button that opens one sheet holding a multi-select Format filter and a manual When date range, filtering the feed live.

**Architecture:** Pure filter logic lives in a new testable module `src/boredbefore/filterEntries.ts`. A new `src/boredbefore/FilterSheet.tsx` owns the trigger button, the modal sheet, and the native date picker. `FeedTab.tsx` holds the filter state, renders `<FilterSheet>`, and derives the visible list via `filterEntries()`.

**Tech Stack:** Expo / React Native, TypeScript, Jest (jest-expo), `@react-native-community/datetimepicker` for the native iOS date wheel.

## Global Constraints

- Strict TypeScript — no `any`, keep `npx tsc --noEmit` clean.
- Add native deps with `npx expo install`, never `npm install`; run `npx expo install --check` before a build.
- `@react-native-community/datetimepicker` is a native module → requires a fresh `npx expo run:ios` build (run by the developer, not in-session), not just a JS reload.
- Follow the "Arcade Sticker" design system via `useTheme()` colors and `FONTS` from `src/theme/tokens.ts`. Action color = active/selected state; keyline width 2.5; offset shadows are flat.
- Copy is fixed: button `FILTER` / `FILTER · N`; sheet title `Narrow it down`; section labels `FORMAT`, `WHEN`; field captions `START`, `END`; empty value `Any`; `Clear all`.
- Format chips and tokens (in order): Brain Dump (`brainDump`), Observe (`observe`), Reflect (`reflect`), Confess (`confess`), Imagine (`imagine`), Rank + Defend (`rank`), Love + Hate (`loveHate`).
- Both date bounds start empty (`null`). `endDate` is inclusive.
- Filters + search combine with AND. All filter state resets on screen focus.
- Keep changes small and focused; do not refactor unrelated code.

---

## File Structure

- **Create** `src/boredbefore/filterEntries.ts` — pure types + helpers (`FormatToken`, `FeedFilters`, `EMPTY_FILTERS`, `FORMAT_OPTIONS`, `formatOf`, `filterEntries`, `activeFilterCount`).
- **Create** `__tests__/boredbefore/filterEntries.test.ts` — unit tests for the module.
- **Create** `src/boredbefore/FilterSheet.tsx` — trigger button + modal sheet + native date picker.
- **Modify** `src/boredbefore/FeedTab.tsx` — swap month-picker state/UI for `FilterSheet` + `filterEntries`.
- **Leave as-is** `src/db/entries.ts` `getMonthsWithEntries` and its tests — the helper is small and tested; just stop importing it in `FeedTab`.

---

## Task 1: Pure filter logic + tests

**Files:**
- Create: `src/boredbefore/filterEntries.ts`
- Test: `__tests__/boredbefore/filterEntries.test.ts`

**Interfaces:**
- Consumes: `Entry`, `PromptCategory` from `src/types.ts`.
- Produces:
  - `type FormatToken = 'brainDump' | 'observe' | 'reflect' | 'confess' | 'imagine' | 'rank' | 'loveHate'`
  - `interface FeedFilters { formats: FormatToken[]; startDate: string | null; endDate: string | null }`
  - `const EMPTY_FILTERS: FeedFilters`
  - `const FORMAT_OPTIONS: ReadonlyArray<{ token: FormatToken; label: string }>`
  - `function formatOf(entry: Entry): FormatToken`
  - `function filterEntries(entries: Entry[], filters: FeedFilters): Entry[]`
  - `function activeFilterCount(filters: FeedFilters): number`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/boredbefore/filterEntries.test.ts`:

```ts
import {
  EMPTY_FILTERS,
  FORMAT_OPTIONS,
  formatOf,
  filterEntries,
  activeFilterCount,
  type FeedFilters,
} from '../../src/boredbefore/filterEntries';
import type { Entry } from '../../src/types';

function makeEntry(over: Partial<Entry>): Entry {
  return {
    id: 1,
    prompt_text: '',
    response_text: '',
    entry_kind: 'text',
    game_data: null,
    created_at: '2026-06-15T12:00:00.000Z',
    location_label: null,
    location_lat: null,
    location_lng: null,
    entry_mode: 'prompted',
    place_id: null,
    category: 'reflective',
    ...over,
  };
}

describe('formatOf', () => {
  it('maps loveHate kind before anything else', () => {
    expect(formatOf(makeEntry({ entry_kind: 'loveHate', entry_mode: 'freeform' }))).toBe('loveHate');
  });
  it('maps rank kind', () => {
    expect(formatOf(makeEntry({ entry_kind: 'rank' }))).toBe('rank');
  });
  it('maps freeform text to brainDump', () => {
    expect(formatOf(makeEntry({ entry_mode: 'freeform', category: null }))).toBe('brainDump');
  });
  it('maps prompted categories to their tokens', () => {
    expect(formatOf(makeEntry({ category: 'observational' }))).toBe('observe');
    expect(formatOf(makeEntry({ category: 'reflective' }))).toBe('reflect');
    expect(formatOf(makeEntry({ category: 'personal' }))).toBe('confess');
    expect(formatOf(makeEntry({ category: 'creative' }))).toBe('imagine');
  });
  it('falls back to observe for a prompted entry with no category', () => {
    expect(formatOf(makeEntry({ category: null }))).toBe('observe');
  });
});

describe('FORMAT_OPTIONS', () => {
  it('lists all seven tokens in order', () => {
    expect(FORMAT_OPTIONS.map(o => o.token)).toEqual([
      'brainDump', 'observe', 'reflect', 'confess', 'imagine', 'rank', 'loveHate',
    ]);
  });
});

describe('filterEntries', () => {
  const brain = makeEntry({ id: 1, entry_mode: 'freeform', category: null, created_at: '2026-05-01T09:00:00.000Z' });
  const reflect = makeEntry({ id: 2, category: 'reflective', created_at: '2026-06-15T09:00:00.000Z' });
  const rank = makeEntry({ id: 3, entry_kind: 'rank', created_at: '2026-07-20T09:00:00.000Z' });
  const all = [brain, reflect, rank];

  it('returns everything with empty filters', () => {
    expect(filterEntries(all, EMPTY_FILTERS)).toEqual(all);
  });
  it('keeps only entries whose format is selected (formats OR within section)', () => {
    const f: FeedFilters = { formats: ['brainDump', 'rank'], startDate: null, endDate: null };
    expect(filterEntries(all, f).map(e => e.id)).toEqual([1, 3]);
  });
  it('filters by start date inclusive', () => {
    const f: FeedFilters = { formats: [], startDate: '2026-06-15', endDate: null };
    expect(filterEntries(all, f).map(e => e.id)).toEqual([2, 3]);
  });
  it('filters by end date inclusive', () => {
    const f: FeedFilters = { formats: [], startDate: null, endDate: '2026-06-15' };
    expect(filterEntries(all, f).map(e => e.id)).toEqual([1, 2]);
  });
  it('filters by a closed range', () => {
    const f: FeedFilters = { formats: [], startDate: '2026-05-15', endDate: '2026-07-01' };
    expect(filterEntries(all, f).map(e => e.id)).toEqual([2]);
  });
  it('combines format and date with AND', () => {
    const f: FeedFilters = { formats: ['reflect', 'rank'], startDate: '2026-07-01', endDate: null };
    expect(filterEntries(all, f).map(e => e.id)).toEqual([3]);
  });
});

describe('activeFilterCount', () => {
  it('counts selected formats', () => {
    expect(activeFilterCount({ formats: ['brainDump', 'rank'], startDate: null, endDate: null })).toBe(2);
  });
  it('adds one when a range bound is set', () => {
    expect(activeFilterCount({ formats: ['rank'], startDate: '2026-01-01', endDate: null })).toBe(2);
    expect(activeFilterCount({ formats: [], startDate: null, endDate: '2026-01-01' })).toBe(1);
  });
  it('is zero for empty filters', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --runInBand filterEntries`
Expected: FAIL — cannot find module `../../src/boredbefore/filterEntries`.

- [ ] **Step 3: Write the implementation**

Create `src/boredbefore/filterEntries.ts`:

```ts
import type { Entry, PromptCategory } from '../types';

export type FormatToken =
  | 'brainDump' | 'observe' | 'reflect' | 'confess' | 'imagine' | 'rank' | 'loveHate';

export interface FeedFilters {
  formats: FormatToken[];
  startDate: string | null; // 'YYYY-MM-DD'
  endDate: string | null;   // 'YYYY-MM-DD', inclusive
}

export const EMPTY_FILTERS: FeedFilters = { formats: [], startDate: null, endDate: null };

// Chip order matches the design; labels match the card pills.
export const FORMAT_OPTIONS: ReadonlyArray<{ token: FormatToken; label: string }> = [
  { token: 'brainDump', label: 'Brain Dump' },
  { token: 'observe', label: 'Observe' },
  { token: 'reflect', label: 'Reflect' },
  { token: 'confess', label: 'Confess' },
  { token: 'imagine', label: 'Imagine' },
  { token: 'rank', label: 'Rank + Defend' },
  { token: 'loveHate', label: 'Love + Hate' },
];

const CATEGORY_TO_FORMAT: Record<PromptCategory, FormatToken> = {
  observational: 'observe',
  reflective: 'reflect',
  personal: 'confess',
  creative: 'imagine',
  game: 'rank', // 'game' prompts are saved as rank/loveHate kinds; handled above.
};

// Mirrors the pill-selection logic in FeedTab: game kinds first, then freeform,
// then prompt category. A prompted entry with no category (dev-only pre-release
// data) falls back to 'observe' so the function stays total.
export function formatOf(entry: Entry): FormatToken {
  if (entry.entry_kind === 'loveHate') return 'loveHate';
  if (entry.entry_kind === 'rank') return 'rank';
  if (entry.entry_mode === 'freeform') return 'brainDump';
  return entry.category ? CATEGORY_TO_FORMAT[entry.category] : 'observe';
}

export function filterEntries(entries: Entry[], filters: FeedFilters): Entry[] {
  return entries.filter(e => {
    if (filters.formats.length > 0 && !filters.formats.includes(formatOf(e))) return false;
    const day = e.created_at.slice(0, 10);
    if (filters.startDate && day < filters.startDate) return false;
    if (filters.endDate && day > filters.endDate) return false;
    return true;
  });
}

export function activeFilterCount(filters: FeedFilters): number {
  return filters.formats.length + (filters.startDate || filters.endDate ? 1 : 0);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --runInBand filterEntries`
Expected: PASS (all cases green).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/boredbefore/filterEntries.ts __tests__/boredbefore/filterEntries.test.ts
git commit -m "feat: pure feed filter logic (format + date range)"
```

---

## Task 2: FilterSheet component + date-picker dependency

**Files:**
- Create: `src/boredbefore/FilterSheet.tsx`
- Modify: `package.json` (via `npx expo install`)

**Interfaces:**
- Consumes: `FeedFilters`, `FORMAT_OPTIONS`, `activeFilterCount` from `./filterEntries`; `useTheme` from `../theme/ThemeContext`; `FONTS` from `../theme/tokens`.
- Produces:
  - `interface FilterSheetProps { filters: FeedFilters; onChange: (next: FeedFilters) => void }`
  - `export function FilterSheet(props: FilterSheetProps): JSX.Element` — renders the trigger button and its modal; owns open/close and date-picker state internally.

- [ ] **Step 1: Install the native date picker**

Run: `npx expo install @react-native-community/datetimepicker`
Then: `npx expo install --check`
Expected: package added to `package.json` dependencies; `--check` reports no mismatches.

- [ ] **Step 2: Write the component**

Create `src/boredbefore/FilterSheet.tsx`:

```tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/tokens';
import { FeedFilters, FORMAT_OPTIONS, FormatToken, activeFilterCount } from './filterEntries';

interface FilterSheetProps {
  filters: FeedFilters;
  onChange: (next: FeedFilters) => void;
}

type EditingField = 'start' | 'end' | null;

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatYMD(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function FilterSheet({ filters, onChange }: FilterSheetProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditingField>(null);

  const count = activeFilterCount(filters);
  const active = count > 0;

  function toggleFormat(token: FormatToken) {
    const has = filters.formats.includes(token);
    onChange({
      ...filters,
      formats: has ? filters.formats.filter(t => t !== token) : [...filters.formats, token],
    });
  }

  function clearAll() {
    onChange({ formats: [], startDate: null, endDate: null });
  }

  function onPickDate(field: 'start' | 'end', event: { type: string }, date?: Date) {
    // On Android the picker fires a dismiss event; close it and honor 'set' only.
    setEditing(null);
    if (event.type !== 'set' || !date) return;
    const ymd = toYMD(date);
    onChange(field === 'start' ? { ...filters, startDate: ymd } : { ...filters, endDate: ymd });
  }

  const editingValue = editing === 'end'
    ? (filters.endDate ? new Date(filters.endDate) : new Date())
    : (filters.startDate ? new Date(filters.startDate) : new Date());

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          { backgroundColor: active ? colors.action : colors.surface, borderColor: colors.border },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerTxt, { color: active ? colors.actionInk : colors.textSecondary }]}>
          {active ? `FILTER · ${count}` : 'FILTER'}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.head}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Narrow it down</Text>
              {active && (
                <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
                  <Text style={[styles.clearAll, { color: colors.textSecondary }]}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLbl, { color: colors.textMuted }]}>FORMAT</Text>
              <View style={styles.chips}>
                {FORMAT_OPTIONS.map(opt => {
                  const on = filters.formats.includes(opt.token);
                  return (
                    <TouchableOpacity
                      key={opt.token}
                      onPress={() => toggleFormat(opt.token)}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        { borderColor: colors.border },
                        on && { backgroundColor: colors.action, borderColor: colors.action },
                      ]}
                    >
                      <Text style={[
                        styles.chipTxt,
                        { color: colors.textPrimary },
                        on && { color: colors.actionInk },
                      ]}>
                        {on ? `✓ ${opt.label}` : opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLbl, { color: colors.textMuted }]}>WHEN</Text>
              <View style={styles.rangeRow}>
                <View style={styles.field}>
                  <Text style={[styles.cap, { color: colors.textMuted }]}>START</Text>
                  <TouchableOpacity
                    style={[styles.dateBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setEditing('start')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dateTxt, { color: filters.startDate ? colors.textPrimary : colors.textMuted }]}>
                      {filters.startDate ? formatYMD(filters.startDate) : 'Any'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.dash, { color: colors.textMuted }]}>–</Text>
                <View style={styles.field}>
                  <Text style={[styles.cap, { color: colors.textMuted }]}>END</Text>
                  <TouchableOpacity
                    style={[styles.dateBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setEditing('end')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dateTxt, { color: filters.endDate ? colors.textPrimary : colors.textMuted }]}>
                      {filters.endDate ? formatYMD(filters.endDate) : 'Any'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {editing && (
              <DateTimePicker
                value={editingValue}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(e, date) => onPickDate(editing, e as { type: string }, date)}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderRadius: 12, borderWidth: 2.5, paddingHorizontal: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  triggerTxt: { fontFamily: FONTS.label, fontSize: 12, letterSpacing: 0.5 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 28 },
  sheet: { borderRadius: 18, borderWidth: 2.5, padding: 20, gap: 18 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: FONTS.display, fontSize: 20, letterSpacing: -0.4 },
  clearAll: { fontFamily: FONTS.label, fontSize: 11, letterSpacing: 0.5, textDecorationLine: 'underline' },
  section: { gap: 10 },
  sectionLbl: { fontFamily: FONTS.label, fontSize: 10.5, letterSpacing: 1.4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 2.5, paddingHorizontal: 12, paddingVertical: 8 },
  chipTxt: { fontFamily: FONTS.label, fontSize: 11.5 },
  rangeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  field: { flex: 1, gap: 6 },
  cap: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 1 },
  dateBox: { borderRadius: 12, borderWidth: 2.5, paddingHorizontal: 12, paddingVertical: 11 },
  dateTxt: { fontFamily: FONTS.bodySemiBold, fontSize: 14.5 },
  dash: { fontFamily: FONTS.bodyBold, fontSize: 16, paddingBottom: 12 },
});
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/boredbefore/FilterSheet.tsx package.json package-lock.json
git commit -m "feat: FilterSheet component with format chips and date range"
```

- [ ] **Step 5: On-device verification (developer, separate terminal)**

Run `npx expo run:ios`. This task's UI is confirmed in the next task once wired into FeedTab; the fresh native build here is required because a native module was added.

---

## Task 3: Wire FilterSheet + filterEntries into FeedTab

**Files:**
- Modify: `src/boredbefore/FeedTab.tsx`

**Interfaces:**
- Consumes: `FilterSheet` from `./FilterSheet`; `FeedFilters`, `EMPTY_FILTERS`, `filterEntries` from `./filterEntries`.
- Produces: no new exports; `FeedTab` behavior changes only.

- [ ] **Step 1: Update imports**

In `src/boredbefore/FeedTab.tsx`, change the db import to drop `getMonthsWithEntries`:

```tsx
import { getAllEntries, searchEntries } from '../db/entries';
```

Add below the existing imports:

```tsx
import { FilterSheet } from './FilterSheet';
import { FeedFilters, EMPTY_FILTERS, filterEntries } from './filterEntries';
```

- [ ] **Step 2: Replace month-picker state with filter state**

Remove these state hooks and helpers:
- `months`, `selectedMonth`, `pickerOpen`, `pickerYear` state
- `loadMonths`, `availableYears`, `openPicker`, `pickMonth`
- the `formatMonthLabel` and `MONTHS_ABBR` module constants (no longer used)

Add a single filter state hook alongside `query` and `entries`:

```tsx
const [filters, setFilters] = useState<FeedFilters>(EMPTY_FILTERS);
```

- [ ] **Step 3: Update the focus effect**

Replace the `useFocusEffect` body so it resets filters instead of month/picker state:

```tsx
useFocusEffect(
  useCallback(() => {
    setQuery('');
    setFilters(EMPTY_FILTERS);
    loadEntries('');
  }, [])
);
```

Delete the now-unused `loadMonths()` call.

- [ ] **Step 4: Derive the visible list via filterEntries**

Replace the `visible` computation:

```tsx
const visible = filterEntries(entries, filters);
const grouped = groupByDate(visible);
```

- [ ] **Step 5: Replace the trigger + delete the month-picker Modal**

In the `searchRow`, replace the `monthTrigger` `TouchableOpacity` block with:

```tsx
<FilterSheet filters={filters} onChange={setFilters} />
```

Delete the entire month-picker `<Modal>…</Modal>` block (the "Jump to a month" sheet, year nav, and month grid).

- [ ] **Step 6: Remove dead styles**

Delete these now-unused entries from the `StyleSheet.create` block: `monthTrigger`, `monthTriggerTxt`, `sheet`, `sheetHead`, `sheetTitle`, `allTimeBtn`, `yearNav`, `yearArrow`, `yearLabel`, `monthGrid`, `monthCell`, `monthCellTxt`, `backdrop`. Keep `searchRow` and `search`.

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (no unused-variable or missing-import errors; confirm no leftover references to removed names).

- [ ] **Step 8: Run the full test suite**

Run: `npm test -- --runInBand`
Expected: PASS. `getMonthsWithEntries` tests still pass (function retained); no test imported the removed FeedTab month state.

- [ ] **Step 9: Commit**

```bash
git add src/boredbefore/FeedTab.tsx
git commit -m "feat: use Filter menu on Greatest Hits feed"
```

- [ ] **Step 10: On-device verification (developer, separate terminal)**

Run `npx expo run:ios`. Confirm:
- Feed shows a `FILTER` button where `Date` used to be.
- Selecting format chips filters the feed live; button reads `FILTER · N` and turns yellow.
- Tapping START/END opens the native date wheel; picking dates filters inclusively; boxes start on `Any`.
- `Clear all` appears only when a filter is active and resets everything.
- Leaving and returning to the screen resets all filters.

---

## Self-Review Notes

- **Spec coverage:** trigger + badge (Task 2/3), Format all-categories chips (Task 1 options + Task 2 UI), When start/end range starting empty + native picker (Task 2), inclusive end date (Task 1), live AND filtering + search (Task 1 + Task 3), reset on focus (Task 3), Clear all conditional (Task 2), format mapping table (Task 1 `formatOf`), dependency + build note (Global Constraints + Task 2), unit tests (Task 1). All covered.
- **No-category case:** intentionally handled with a documented `'observe'` fallback in `formatOf` (waived in spec; kept total for type-safety).
- **`getMonthsWithEntries`:** retained with its tests to avoid unrelated churn; only its FeedTab usage is removed.
- **Type consistency:** `FeedFilters`, `FormatToken`, `FORMAT_OPTIONS`, `filterEntries`, `activeFilterCount`, `EMPTY_FILTERS` names identical across Tasks 1–3.

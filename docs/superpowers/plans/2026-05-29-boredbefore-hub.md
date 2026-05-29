# BoredBefore Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three Home screen tiles (Timeline, Entries, Reflect) with a single BoredBefore hub screen containing Feed and Calendar tabs (Map tab is a stub here — implemented in the follow-up Map + Auto-GPS plan).

**Architecture:** A new `app/boredbefore.tsx` screen owns a pill-style tab bar built with `expo-blur`. Each tab's content lives in a focused component under `src/boredbefore/`. The three old screens are deleted once their content is migrated.

**Tech Stack:** React Native + Expo, expo-blur (new), expo-router, expo-sqlite, Jest.

---

## File Map

| File | Change |
|------|--------|
| `app/index.tsx` | Remove 3 tiles; add single BoredBefore tile |
| `app/boredbefore.tsx` | **New** — screen shell + BlurView tab bar |
| `src/boredbefore/FeedTab.tsx` | **New** — Feed tab content (migrated from entries.tsx) |
| `src/boredbefore/CalendarTab.tsx` | **New** — Calendar tab content (migrated from timeline.tsx + year jump) |
| `src/boredbefore/MapTab.tsx` | **New** — Map stub (replaced in Plan 2) |
| `src/db/entries.ts` | Add `getYearsWithEntries` function |
| `__tests__/db/entries.test.ts` | Add tests for `getYearsWithEntries` |
| `app/timeline.tsx` | **Deleted** |
| `app/entries.tsx` | **Deleted** |
| `app/reflect.tsx` | **Deleted** |

---

## Task 1: Install expo-blur

**Files:**
- Modify: `package.json` (via expo install)

- [ ] **Step 1: Install the package**

  ```bash
  npx expo install expo-blur
  ```

  Expected: package added to `package.json` and `node_modules`.

- [ ] **Step 2: Verify the install**

  ```bash
  npx jest --no-coverage 2>&1 | tail -5
  ```

  Expected: all existing tests still pass.

- [ ] **Step 3: Commit**

  ```bash
  git add package.json
  git commit -m "chore: install expo-blur"
  ```

---

## Task 2: Add `getYearsWithEntries` to the DB layer

**Files:**
- Modify: `src/db/entries.ts`
- Modify: `__tests__/db/entries.test.ts`

- [ ] **Step 1: Write the failing tests**

  Open `__tests__/db/entries.test.ts` and add a new `describe` block at the bottom:

  ```ts
  describe('getYearsWithEntries', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      db = await openDatabaseAsync('test.db');
    });

    it('returns distinct years in descending order', async () => {
      db.getAllAsync.mockResolvedValueOnce([
        { y: '2026' }, { y: '2025' }, { y: '2024' },
      ]);
      const result = await getYearsWithEntries(db);
      expect(result).toEqual([2026, 2025, 2024]);
    });

    it('returns empty array when no entries exist', async () => {
      db.getAllAsync.mockResolvedValueOnce([]);
      const result = await getYearsWithEntries(db);
      expect(result).toEqual([]);
    });
  });
  ```

  Also add `getYearsWithEntries` to the import at the top of the test file:

  ```ts
  import { createEntry, getYearsWithEntries } from '../../src/db/entries';
  ```

- [ ] **Step 2: Run tests to verify they fail**

  ```bash
  npx jest __tests__/db/entries.test.ts --no-coverage
  ```

  Expected: FAIL — `getYearsWithEntries` is not exported.

- [ ] **Step 3: Add `getYearsWithEntries` to `src/db/entries.ts`**

  Add this function at the bottom of the file (after `updateEntryLocation`):

  ```ts
  export async function getYearsWithEntries(db: SQLiteDatabase): Promise<number[]> {
    const rows = await db.getAllAsync<{ y: string }>(
      `SELECT DISTINCT strftime('%Y', created_at) as y FROM entries ORDER BY y DESC`,
      []
    );
    return rows.map(r => parseInt(r.y, 10));
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  npx jest __tests__/db/entries.test.ts --no-coverage
  ```

  Expected: PASS (all existing + 2 new tests).

- [ ] **Step 5: Commit**

  ```bash
  git add src/db/entries.ts __tests__/db/entries.test.ts
  git commit -m "feat: add getYearsWithEntries DB function"
  ```

---

## Task 3: Replace Home screen tiles with BoredBefore tile

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Replace the tile row in `app/index.tsx`**

  Find the `{/* Tile row */}` section and replace the entire `<View style={styles.tileRow}>` block with:

  ```tsx
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
      <Text style={[styles.boredBeforeTitle, { color: colors.textPrimary }]}>BoredBefore</Text>
      <Text style={[styles.boredBeforeSubtitle, { color: colors.textMuted }]}>look into your bored past</Text>
    </View>
  </TouchableOpacity>
  ```

- [ ] **Step 2: Update the StyleSheet in `app/index.tsx`**

  Remove the `tileRow`, `tile`, and `tileLabel` style entries and add:

  ```ts
  boredBeforeTile: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 12, padding: 18, borderWidth: 1,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  boredBeforeTitle: { fontSize: 15, fontWeight: '600' },
  boredBeforeSubtitle: { fontSize: 12, marginTop: 2 },
  ```

- [ ] **Step 3: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add app/index.tsx
  git commit -m "feat: replace Home tiles with BoredBefore tile"
  ```

---

## Task 4: MapTab stub

**Files:**
- Create: `src/boredbefore/MapTab.tsx` (stub — replaced in Plan 2)

- [ ] **Step 1: Create the MapTab stub at `src/boredbefore/MapTab.tsx`**

  ```tsx
  import { View, Text, StyleSheet } from 'react-native';
  import { useTheme } from '../theme/ThemeContext';

  export function MapTab() {
    const { colors } = useTheme();
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: colors.textMuted }]}>Map coming soon.</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    text: { fontSize: 15, fontStyle: 'italic', fontFamily: 'Georgia' },
  });
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/boredbefore/MapTab.tsx
  git commit -m "feat: add MapTab stub"
  ```

---

## Task 5: Feed tab

**Files:**
- Create: `src/boredbefore/FeedTab.tsx`

- [ ] **Step 1: Create `src/boredbefore/FeedTab.tsx`**

  This is the body of the old `app/entries.tsx` extracted into a component. The `SafeAreaView`, back button, and title are removed — those belong to the parent screen.

  ```tsx
  import { useState, useEffect } from 'react';
  import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, TextInput,
  } from 'react-native';
  import { router } from 'expo-router';
  import { getDb } from '../db/database';
  import { getAllEntries, searchEntries } from '../db/entries';
  import { useTheme } from '../theme/ThemeContext';
  import type { Entry } from '../types';

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
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

  export function FeedTab() {
    const { colors, accent } = useTheme();
    const [query, setQuery] = useState('');
    const [entries, setEntries] = useState<Entry[]>([]);

    useEffect(() => { loadEntries(''); }, []);

    async function loadEntries(q: string) {
      const db = await getDb();
      const results = q.trim()
        ? await searchEntries(db, q)
        : await getAllEntries(db);
      setEntries(results);
    }

    function handleSearch(q: string) {
      setQuery(q);
      loadEntries(q);
    }

    const grouped = groupByDate(entries);

    return (
      <View style={styles.container}>
        <TextInput
          style={[styles.search, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textPrimary,
          }]}
          placeholder="Search…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
        <FlatList
          data={grouped}
          keyExtractor={g => g.date}
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <Text style={[styles.dateHeader, { color: colors.textMuted }]}>
                {formatDate(group.date)}
              </Text>
              {group.items.map(entry => (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.card, {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    shadowColor: colors.shadowColor,
                    shadowOpacity: colors.shadowOpacity,
                  }]}
                  onPress={() => router.push(`/entry/${entry.id}`)}
                >
                  {entry.entry_mode !== 'freeform' && (
                    <Text
                      style={[styles.cardPrompt, { color: accent.labelColor }]}
                      numberOfLines={1}
                    >
                      {entry.prompt_text}
                    </Text>
                  )}
                  <Text
                    style={[styles.cardResponse, { color: colors.textPrimary }]}
                    numberOfLines={3}
                  >
                    {entry.response_text}
                  </Text>
                  {entry.location_label && (
                    <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                      📍 {entry.location_label}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {query ? 'No entries match your search.' : 'No entries yet. Respond to a prompt!'}
            </Text>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16 },
    search: {
      borderRadius: 10, borderWidth: 1,
      paddingHorizontal: 14, paddingVertical: 10,
      fontSize: 15, marginBottom: 12,
    },
    listContent: { paddingBottom: 32 },
    group: { gap: 10, marginBottom: 24 },
    dateHeader: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    card: {
      borderRadius: 12, padding: 16, gap: 6, borderWidth: 1,
      shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
    },
    cardPrompt: { fontSize: 11, fontStyle: 'italic' },
    cardResponse: { fontSize: 15, lineHeight: 22, fontFamily: 'Georgia', fontStyle: 'italic' },
    cardMeta: { fontSize: 11 },
    empty: { textAlign: 'center', marginTop: 60, fontSize: 15 },
  });
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass.

- [ ] **Step 3: Commit**

  ```bash
  git add src/boredbefore/FeedTab.tsx
  git commit -m "feat: add Feed tab to BoredBefore"
  ```

---

## Task 6: Calendar tab with year jump

**Files:**
- Create: `src/boredbefore/CalendarTab.tsx`

- [ ] **Step 1: Create `src/boredbefore/CalendarTab.tsx`**

  This migrates `app/timeline.tsx` into a component and adds a tappable year label that opens an inline year scroller.

  ```tsx
  import { useState, useEffect } from 'react';
  import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
  } from 'react-native';
  import { router } from 'expo-router';
  import { getDb } from '../db/database';
  import {
    getDatesWithEntries,
    getEntriesForDate,
    getYearsWithEntries,
  } from '../db/entries';
  import { useTheme } from '../theme/ThemeContext';
  import type { Entry } from '../types';

  function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
  }

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  export function CalendarTab() {
    const { colors, accent } = useTheme();
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [datesWithEntries, setDatesWithEntries] = useState<Set<string>>(new Set());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dayEntries, setDayEntries] = useState<Entry[]>([]);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [availableYears, setAvailableYears] = useState<number[]>([now.getFullYear()]);

    useEffect(() => {
      (async () => {
        const db = await getDb();
        const years = await getYearsWithEntries(db);
        const currentYear = now.getFullYear();
        const withCurrent = years.includes(currentYear)
          ? years
          : [currentYear, ...years];
        setAvailableYears(withCurrent);
      })();
    }, []);

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

    function handleYearSelect(y: number) {
      setYear(y);
      setMonth(0);
      setShowYearPicker(false);
    }

    const days = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    const cells = Array.from({ length: startDay + days }, (_, i) =>
      i < startDay ? null : i - startDay + 1
    );

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth}>
            <Text style={[styles.navArrow, { color: colors.textSecondary }]}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowYearPicker(v => !v)}>
            <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>
              {MONTH_NAMES[month]}{' '}
              <Text style={{ color: accent.buttonColor }}>{year} ↕</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth}>
            <Text style={[styles.navArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {showYearPicker && (
          <View style={[styles.yearPicker, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            {availableYears.map(y => (
              <TouchableOpacity
                key={y}
                style={[styles.yearRow, y === year && { backgroundColor: accent.buttonColor + '22' }]}
                onPress={() => handleYearSelect(y)}
              >
                <Text style={[styles.yearTxt, {
                  color: y === year ? accent.buttonColor : colors.textPrimary,
                  fontWeight: y === year ? '700' : '400',
                }]}>
                  {y}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.grid}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <Text key={d} style={[styles.dayHeader, { color: colors.textMuted }]}>{d}</Text>
          ))}
          {cells.map((day, i) => {
            if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEntry = datesWithEntries.has(dateStr);
            const isSelected = selectedDate === dateStr;
            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.cell,
                  isSelected && { backgroundColor: accent.buttonColor, borderRadius: 8 },
                ]}
                onPress={() => hasEntry && handleDayPress(dateStr)}
                disabled={!hasEntry}
              >
                <Text style={[
                  styles.dayNum,
                  { color: colors.textPrimary },
                  !hasEntry && { color: colors.textMuted },
                  isSelected && styles.selectedDayNum,
                ]}>
                  {day}
                </Text>
                {hasEntry && (
                  <View style={[
                    styles.dot,
                    { backgroundColor: accent.labelColor },
                    isSelected && styles.selectedDot,
                  ]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDate && dayEntries.map(entry => (
          <TouchableOpacity
            key={entry.id}
            style={[styles.entryCard, {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
              shadowOpacity: colors.shadowOpacity,
            }]}
            onPress={() => router.push(`/entry/${entry.id}`)}
          >
            {entry.entry_mode !== 'freeform' && (
              <Text style={[styles.entryPrompt, { color: colors.textMuted }]}>
                {entry.prompt_text}
              </Text>
            )}
            <Text style={[styles.entryResponse, { color: colors.textPrimary }]} numberOfLines={3}>
              {entry.response_text}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { padding: 16, gap: 16, paddingBottom: 40 },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navArrow: { fontSize: 28, paddingHorizontal: 12 },
    monthLabel: { fontSize: 17, fontWeight: '600' },
    yearPicker: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginTop: -8 },
    yearRow: { paddingVertical: 10, paddingHorizontal: 16 },
    yearTxt: { fontSize: 15 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
    dayHeader: { width: '14.28%', textAlign: 'center', fontSize: 11, paddingVertical: 6 },
    dayNum: { fontSize: 14 },
    selectedDayNum: { color: '#fff' },
    dot: { width: 4, height: 4, borderRadius: 2 },
    selectedDot: { backgroundColor: '#fff' },
    entryCard: {
      borderRadius: 12, padding: 16, gap: 6,
      shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
    },
    entryPrompt: { fontSize: 11, fontStyle: 'italic' },
    entryResponse: { fontSize: 15, lineHeight: 22 },
  });
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass.

- [ ] **Step 3: Commit**

  ```bash
  git add src/boredbefore/CalendarTab.tsx
  git commit -m "feat: add Calendar tab to BoredBefore"
  ```

---

## Task 7: BoredBefore shell and tab bar

**Files:**
- Create: `app/boredbefore.tsx`

All three tab components now exist, so there are no missing imports.

- [ ] **Step 1: Create `app/boredbefore.tsx`**

  ```tsx
  import { useState } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
  import { BlurView } from 'expo-blur';
  import { router } from 'expo-router';
  import { useTheme } from '../src/theme/ThemeContext';
  import { FeedTab } from '../src/boredbefore/FeedTab';
  import { CalendarTab } from '../src/boredbefore/CalendarTab';
  import { MapTab } from '../src/boredbefore/MapTab';

  type Tab = 'Feed' | 'Calendar' | 'Map';
  const TABS: Tab[] = ['Feed', 'Calendar', 'Map'];

  export default function BoredBeforeScreen() {
    const { colors, accent, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<Tab>('Feed');

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: colors.textSecondary }]}>← Back</Text>
          </TouchableOpacity>
        </View>

        <BlurView
          intensity={50}
          tint={isDark ? 'dark' : 'light'}
          style={styles.tabBarBlur}
        >
          <View style={styles.tabBarInner}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[
                  styles.tabLabel,
                  { color: activeTab === tab ? accent.buttonColor : colors.textMuted },
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>

        <View style={styles.content}>
          {activeTab === 'Feed' && <FeedTab />}
          {activeTab === 'Calendar' && <CalendarTab />}
          {activeTab === 'Map' && <MapTab />}
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
    back: { fontSize: 15 },
    tabBarBlur: { marginHorizontal: 16, marginBottom: 8, borderRadius: 20, overflow: 'hidden' },
    tabBarInner: { flexDirection: 'row', padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
    tabBtnActive: {
      backgroundColor: '#fff',
      shadowColor: '#000', shadowOpacity: 0.08,
      shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
    },
    tabLabel: { fontSize: 14, fontWeight: '500' },
    content: { flex: 1 },
  });
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/boredbefore.tsx
  git commit -m "feat: add BoredBefore shell and tab bar"
  ```

---

## Task 8: Replace Home screen tiles with BoredBefore tile

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Replace the tile row in `app/index.tsx`**

  Find the `{/* Tile row */}` section and replace the entire `<View style={styles.tileRow}>` block with:

  ```tsx
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
      <Text style={[styles.boredBeforeTitle, { color: colors.textPrimary }]}>BoredBefore</Text>
      <Text style={[styles.boredBeforeSubtitle, { color: colors.textMuted }]}>look into your bored past</Text>
    </View>
  </TouchableOpacity>
  ```

- [ ] **Step 2: Update the StyleSheet in `app/index.tsx`**

  Remove the `tileRow`, `tile`, and `tileLabel` style entries and add:

  ```ts
  boredBeforeTile: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 12, padding: 18, borderWidth: 1,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  boredBeforeTitle: { fontSize: 15, fontWeight: '600' },
  boredBeforeSubtitle: { fontSize: 12, marginTop: 2 },
  ```

- [ ] **Step 3: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add app/index.tsx
  git commit -m "feat: replace Home tiles with BoredBefore tile"
  ```

---

## Task 9: Delete old screens and verify

**Files:**
- Delete: `app/timeline.tsx`
- Delete: `app/entries.tsx`
- Delete: `app/reflect.tsx`

- [ ] **Step 1: Delete the three old screen files**

  ```bash
  git rm app/timeline.tsx app/entries.tsx app/reflect.tsx
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass.

- [ ] **Step 3: Commit**

  ```bash
  git commit -m "feat: remove old Timeline, Entries, Reflect screens"
  ```

---

## Task 10: Final verification

- [ ] **Step 1: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass. Count should be ≥ 28.

- [ ] **Step 2: Confirm all expected files exist**

  ```bash
  ls src/boredbefore/
  ```

  Expected: `CalendarTab.tsx  FeedTab.tsx  MapTab.tsx`

  ```bash
  ls app/boredbefore.tsx app/index.tsx
  ```

  Expected: both files present.

  ```bash
  ls app/timeline.tsx app/entries.tsx app/reflect.tsx 2>&1
  ```

  Expected: "No such file" errors for all three.

  ```tsx
  import { useState } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
  import { BlurView } from 'expo-blur';
  import { router } from 'expo-router';
  import { useTheme } from '../src/theme/ThemeContext';
  import { FeedTab } from '../src/boredbefore/FeedTab';
  import { CalendarTab } from '../src/boredbefore/CalendarTab';
  import { MapTab } from '../src/boredbefore/MapTab';

  type Tab = 'Feed' | 'Calendar' | 'Map';
  const TABS: Tab[] = ['Feed', 'Calendar', 'Map'];

  export default function BoredBeforeScreen() {
    const { colors, accent, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<Tab>('Feed');

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: colors.textSecondary }]}>← Back</Text>
          </TouchableOpacity>
        </View>

        <BlurView
          intensity={50}
          tint={isDark ? 'dark' : 'light'}
          style={styles.tabBarBlur}
        >
          <View style={styles.tabBarInner}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabBtn,
                  activeTab === tab && styles.tabBtnActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[
                  styles.tabLabel,
                  { color: activeTab === tab ? accent.buttonColor : colors.textMuted },
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>

        <View style={styles.content}>
          {activeTab === 'Feed' && <FeedTab />}
          {activeTab === 'Calendar' && <CalendarTab />}
          {activeTab === 'Map' && <MapTab />}
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
    back: { fontSize: 15 },
    tabBarBlur: { marginHorizontal: 16, marginBottom: 8, borderRadius: 20, overflow: 'hidden' },
    tabBarInner: { flexDirection: 'row', padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
    tabBtnActive: {
      backgroundColor: '#fff',
      shadowColor: '#000', shadowOpacity: 0.08,
      shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
    },
    tabLabel: { fontSize: 14, fontWeight: '500' },
    content: { flex: 1 },
  });
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add app/boredbefore.tsx src/boredbefore/MapTab.tsx
  git commit -m "feat: add BoredBefore shell and tab bar"
  ```

---

## Task 5: Feed tab

**Files:**
- Create: `src/boredbefore/FeedTab.tsx`

- [ ] **Step 1: Create `src/boredbefore/FeedTab.tsx`**

  This is the body of the old `app/entries.tsx` extracted into a component. The `SafeAreaView`, back button, and title are removed — those belong to the parent screen.

  ```tsx
  import { useState, useEffect } from 'react';
  import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, TextInput,
  } from 'react-native';
  import { router } from 'expo-router';
  import { getDb } from '../db/database';
  import { getAllEntries, searchEntries } from '../db/entries';
  import { useTheme } from '../theme/ThemeContext';
  import type { Entry } from '../types';

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
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

  export function FeedTab() {
    const { colors, accent } = useTheme();
    const [query, setQuery] = useState('');
    const [entries, setEntries] = useState<Entry[]>([]);

    useEffect(() => { loadEntries(''); }, []);

    async function loadEntries(q: string) {
      const db = await getDb();
      const results = q.trim()
        ? await searchEntries(db, q)
        : await getAllEntries(db);
      setEntries(results);
    }

    function handleSearch(q: string) {
      setQuery(q);
      loadEntries(q);
    }

    const grouped = groupByDate(entries);

    return (
      <View style={styles.container}>
        <TextInput
          style={[styles.search, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textPrimary,
          }]}
          placeholder="Search…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
        <FlatList
          data={grouped}
          keyExtractor={g => g.date}
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <Text style={[styles.dateHeader, { color: colors.textMuted }]}>
                {formatDate(group.date)}
              </Text>
              {group.items.map(entry => (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.card, {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    shadowColor: colors.shadowColor,
                    shadowOpacity: colors.shadowOpacity,
                  }]}
                  onPress={() => router.push(`/entry/${entry.id}`)}
                >
                  {entry.entry_mode !== 'freeform' && (
                    <Text
                      style={[styles.cardPrompt, { color: accent.labelColor }]}
                      numberOfLines={1}
                    >
                      {entry.prompt_text}
                    </Text>
                  )}
                  <Text
                    style={[styles.cardResponse, { color: colors.textPrimary }]}
                    numberOfLines={3}
                  >
                    {entry.response_text}
                  </Text>
                  {entry.location_label && (
                    <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                      📍 {entry.location_label}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {query ? 'No entries match your search.' : 'No entries yet. Respond to a prompt!'}
            </Text>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16 },
    search: {
      borderRadius: 10, borderWidth: 1,
      paddingHorizontal: 14, paddingVertical: 10,
      fontSize: 15, marginBottom: 12,
    },
    listContent: { paddingBottom: 32 },
    group: { gap: 10, marginBottom: 24 },
    dateHeader: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    card: {
      borderRadius: 12, padding: 16, gap: 6, borderWidth: 1,
      shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
    },
    cardPrompt: { fontSize: 11, fontStyle: 'italic' },
    cardResponse: { fontSize: 15, lineHeight: 22, fontFamily: 'Georgia', fontStyle: 'italic' },
    cardMeta: { fontSize: 11 },
    empty: { textAlign: 'center', marginTop: 60, fontSize: 15 },
  });
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass.

- [ ] **Step 3: Commit**

  ```bash
  git add src/boredbefore/FeedTab.tsx
  git commit -m "feat: add Feed tab to BoredBefore"
  ```

---

## Task 6: Calendar tab with year jump

**Files:**
- Create: `src/boredbefore/CalendarTab.tsx`

- [ ] **Step 1: Create `src/boredbefore/CalendarTab.tsx`**

  This migrates `app/timeline.tsx` into a component and adds a tappable year label that opens an inline year scroller.

  ```tsx
  import { useState, useEffect } from 'react';
  import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, FlatList,
  } from 'react-native';
  import { router } from 'expo-router';
  import { getDb } from '../db/database';
  import {
    getDatesWithEntries,
    getEntriesForDate,
    getYearsWithEntries,
  } from '../db/entries';
  import { useTheme } from '../theme/ThemeContext';
  import type { Entry } from '../types';

  function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
  }

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  export function CalendarTab() {
    const { colors, accent } = useTheme();
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [datesWithEntries, setDatesWithEntries] = useState<Set<string>>(new Set());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dayEntries, setDayEntries] = useState<Entry[]>([]);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [availableYears, setAvailableYears] = useState<number[]>([now.getFullYear()]);

    useEffect(() => {
      (async () => {
        const db = await getDb();
        const years = await getYearsWithEntries(db);
        const currentYear = now.getFullYear();
        const withCurrent = years.includes(currentYear)
          ? years
          : [currentYear, ...years];
        setAvailableYears(withCurrent);
      })();
    }, []);

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

    function handleYearSelect(y: number) {
      setYear(y);
      setMonth(0);
      setShowYearPicker(false);
    }

    const days = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    const cells = Array.from({ length: startDay + days }, (_, i) =>
      i < startDay ? null : i - startDay + 1
    );

    return (
      <ScrollView contentContainerStyle={styles.container}>
        {/* Month navigation row */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth}>
            <Text style={[styles.navArrow, { color: colors.textSecondary }]}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowYearPicker(v => !v)}>
            <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>
              {MONTH_NAMES[month]}{' '}
              <Text style={{ color: accent.buttonColor }}>{year} ↕</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth}>
            <Text style={[styles.navArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Year picker */}
        {showYearPicker && (
          <View style={[styles.yearPicker, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            {availableYears.map(y => (
              <TouchableOpacity
                key={y}
                style={[styles.yearRow, y === year && { backgroundColor: accent.buttonColor + '22' }]}
                onPress={() => handleYearSelect(y)}
              >
                <Text style={[styles.yearTxt, {
                  color: y === year ? accent.buttonColor : colors.textPrimary,
                  fontWeight: y === year ? '700' : '400',
                }]}>
                  {y}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Day-of-week headers */}
        <View style={styles.grid}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <Text key={d} style={[styles.dayHeader, { color: colors.textMuted }]}>{d}</Text>
          ))}

          {/* Calendar cells */}
          {cells.map((day, i) => {
            if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEntry = datesWithEntries.has(dateStr);
            const isSelected = selectedDate === dateStr;
            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.cell,
                  isSelected && { backgroundColor: accent.buttonColor, borderRadius: 8 },
                ]}
                onPress={() => hasEntry && handleDayPress(dateStr)}
                disabled={!hasEntry}
              >
                <Text style={[
                  styles.dayNum,
                  { color: colors.textPrimary },
                  !hasEntry && { color: colors.textMuted },
                  isSelected && styles.selectedDayNum,
                ]}>
                  {day}
                </Text>
                {hasEntry && (
                  <View style={[
                    styles.dot,
                    { backgroundColor: accent.labelColor },
                    isSelected && styles.selectedDot,
                  ]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Day entries list */}
        {selectedDate && dayEntries.map(entry => (
          <TouchableOpacity
            key={entry.id}
            style={[styles.entryCard, {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
              shadowOpacity: colors.shadowOpacity,
            }]}
            onPress={() => router.push(`/entry/${entry.id}`)}
          >
            {entry.entry_mode !== 'freeform' && (
              <Text style={[styles.entryPrompt, { color: colors.textMuted }]}>
                {entry.prompt_text}
              </Text>
            )}
            <Text style={[styles.entryResponse, { color: colors.textPrimary }]} numberOfLines={3}>
              {entry.response_text}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { padding: 16, gap: 16, paddingBottom: 40 },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navArrow: { fontSize: 28, paddingHorizontal: 12 },
    monthLabel: { fontSize: 17, fontWeight: '600' },
    yearPicker: {
      borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginTop: -8,
    },
    yearRow: { paddingVertical: 10, paddingHorizontal: 16 },
    yearTxt: { fontSize: 15 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
    dayHeader: { width: '14.28%', textAlign: 'center', fontSize: 11, paddingVertical: 6 },
    dayNum: { fontSize: 14 },
    selectedDayNum: { color: '#fff' },
    dot: { width: 4, height: 4, borderRadius: 2 },
    selectedDot: { backgroundColor: '#fff' },
    entryCard: {
      borderRadius: 12, padding: 16, gap: 6,
      shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
    },
    entryPrompt: { fontSize: 11, fontStyle: 'italic' },
    entryResponse: { fontSize: 15, lineHeight: 22 },
  });
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass.

- [ ] **Step 3: Commit**

  ```bash
  git add src/boredbefore/CalendarTab.tsx
  git commit -m "feat: add Calendar tab to BoredBefore"
  ```

---

## Task 7: Delete old screens and verify

**Files:**
- Delete: `app/timeline.tsx`
- Delete: `app/entries.tsx`
- Delete: `app/reflect.tsx`

- [ ] **Step 1: Delete the three old screen files**

  ```bash
  git rm app/timeline.tsx app/entries.tsx app/reflect.tsx
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass. (No tests reference these screen files directly.)

- [ ] **Step 3: Commit**

  ```bash
  git commit -m "feat: remove old Timeline, Entries, Reflect screens"
  ```

---

## Task 8: Final verification and summary commit

- [ ] **Step 1: Run the full test suite one final time**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass. Note the test count — it should be ≥ 28.

- [ ] **Step 2: Verify the boredbefore directory exists with all four files**

  ```bash
  ls src/boredbefore/
  ```

  Expected output:
  ```
  CalendarTab.tsx  FeedTab.tsx  MapTab.tsx
  ```

- [ ] **Step 3: Commit**

  This task has no code changes — just verification. If all steps above passed, the hub is complete.

  ```bash
  git log --oneline -8
  ```

  You should see commits for: install expo-blur, getYearsWithEntries, home tile, boredbefore shell, feed tab, calendar tab, delete old screens.

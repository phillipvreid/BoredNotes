# PLACE Chip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a manual way to tag an entry's location from the respond screen, via a chip that opens a modal sheet offering "use current location," saving a new named place on the spot, or picking an existing saved place (nearest-first).

**Architecture:** A new `PlacePickerSheet` modal component (mirrors the existing `PlaceNameSheet` pattern) is opened from a chip on the respond screen. Selecting any option calls back into `respond.tsx` with a `(label, lat, lng)` tuple, which is set into the exact same `locationLabel`/`locationCoords` state the existing auto-location flow already populates — so `handleSubmit`, `createEntry`, and `checkEntryAgainstPlaces` need no changes at all. Sorting the saved-places list nearest-first is a pure function, unit-tested; everything else is thin RN wiring, verified on device per this project's existing convention.

**Tech Stack:** React Native, TypeScript, Expo, `expo-sqlite`, `expo-location`, Jest / jest-expo.

## Global Constraints

- Strict TypeScript — no `any` in production code, no non-null assertions on new code paths.
- No new dependencies — everything needed (`expo-location`, `expo-sqlite`) is already installed.
- Error handling is silent-fallback throughout (no new `Alert` patterns) — matches the existing quiet-failure convention for location capture: GPS/permission failures just no-op, same as today's on-mount auto-location behavior.
- `handleSubmit`, `createEntry`, and `checkEntryAgainstPlaces` in `app/respond.tsx` / `src/db/entries.ts` / `src/db/places.ts` are **not modified** — they already handle persistence and `place_id` proximity-matching correctly for any `locationLabel`/`locationCoords` pair, regardless of where it came from.
- The new chip never displays the bare word "PLACE" (collides with the existing Help Me Write `PLACE` context-modifier chip) — it shows only `◉` inactive, `◉ <NAME>` active.
- `PlaceNameSheet`'s existing visual styling is left as-is — out of scope for this pass.
- Run tests with `npm test -- --runInBand`; typecheck with `npx tsc --noEmit`.

---

### Task 1: `sortPlacesByDistance` pure helper

**Files:**
- Modify: `src/db/places.ts`
- Test: `__tests__/db/places.test.ts`

**Interfaces:**
- Consumes: nothing new (uses the existing `haversineMeters(lat1, lng1, lat2, lng2): number`, already in `src/db/places.ts`).
- Produces:
  - `sortPlacesByDistance<T extends { lat: number; lng: number }>(places: T[], coords: { lat: number; lng: number } | null): T[]`

- [ ] **Step 1: Write the failing tests**

Add to the bottom of `__tests__/db/places.test.ts` (after the existing `checkEntryAgainstPlaces` describe block):

```ts
describe('sortPlacesByDistance', () => {
  it('sorts places nearest-first when coords are given', () => {
    const places = [
      makePlace({ id: 1, name: 'Far', lat: 0.01, lng: 0 }),   // ~1111m
      makePlace({ id: 2, name: 'Near', lat: 0.001, lng: 0 }), // ~111m
      makePlace({ id: 3, name: 'Nearest', lat: 0, lng: 0 }),  // 0m
    ];
    const sorted = sortPlacesByDistance(places, { lat: 0, lng: 0 });
    expect(sorted.map(p => p.name)).toEqual(['Nearest', 'Near', 'Far']);
  });

  it('does not mutate the input array', () => {
    const places = [
      makePlace({ id: 1, name: 'Far', lat: 0.01, lng: 0 }),
      makePlace({ id: 2, name: 'Near', lat: 0.001, lng: 0 }),
    ];
    const original = [...places];
    sortPlacesByDistance(places, { lat: 0, lng: 0 });
    expect(places).toEqual(original);
  });

  it('passes the input order through unchanged when coords is null', () => {
    const places = [
      makePlace({ id: 1, name: 'B', lat: 5, lng: 5 }),
      makePlace({ id: 2, name: 'A', lat: 1, lng: 1 }),
    ];
    expect(sortPlacesByDistance(places, null)).toEqual(places);
  });

  it('returns an empty array for an empty input', () => {
    expect(sortPlacesByDistance([], { lat: 0, lng: 0 })).toEqual([]);
  });
});
```

Add `sortPlacesByDistance` to the existing import block at the top of the file:

```ts
import {
  getPlace,
  getAllPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  getAllPlacesWithCounts,
  syncPlaceToEntries,
  checkEntryAgainstPlaces,
  haversineMeters,
  sortPlacesByDistance,
} from '../../src/db/places';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --runInBand __tests__/db/places.test.ts`
Expected: FAIL — `sortPlacesByDistance` is not exported from `../../src/db/places`.

- [ ] **Step 3: Write minimal implementation**

Add to `src/db/places.ts`, after `haversineMeters`:

```ts
export function sortPlacesByDistance<T extends { lat: number; lng: number }>(
  places: T[],
  coords: { lat: number; lng: number } | null
): T[] {
  if (!coords) return places;
  return [...places].sort(
    (a, b) =>
      haversineMeters(coords.lat, coords.lng, a.lat, a.lng) -
      haversineMeters(coords.lat, coords.lng, b.lat, b.lng)
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --runInBand __tests__/db/places.test.ts`
Expected: PASS (4 new tests, plus all existing `places.test.ts` tests still passing).

- [ ] **Step 5: Commit**

```bash
git add src/db/places.ts __tests__/db/places.test.ts
git commit -m "feat: add sortPlacesByDistance helper"
```

---

### Task 2: `getCurrentCoords` — coords-only GPS fetch

**Files:**
- Modify: `src/location/location.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `getCurrentCoords(): Promise<{ lat: number; lng: number } | null>`
- `captureLocation(): Promise<CapturedLocation | null>` keeps its existing signature and behavior — it's refactored internally to call `getCurrentCoords()`, not changed externally.

This task is a small, behavior-preserving refactor plus one new export — thin wiring with no rendered UI, verified by typecheck and (indirectly) by every downstream task that exercises location capture on device. There's no existing test file for this module (`captureLocation` itself is untested today), so no new test infra is introduced here, consistent with that.

- [ ] **Step 1: Add `getCurrentCoords` and refactor `captureLocation`**

In `src/location/location.ts`, replace the `captureLocation` function with:

```ts
export async function getCurrentCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  } catch {
    return null;
  }
}

export async function captureLocation(): Promise<CapturedLocation | null> {
  const coords = await getCurrentCoords();
  if (!coords) return null;
  const label = await reverseGeocode(coords.lat, coords.lng);
  return { lat: coords.lat, lng: coords.lng, label };
}
```

(This replaces the old body of `captureLocation`, which inlined the permission check and `getCurrentPositionAsync` call directly. `reverseGeocode` is unchanged.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean — no callers of `captureLocation` need changes, since its signature is unchanged.

- [ ] **Step 3: Run the full test suite**

Run: `npm test -- --runInBand`
Expected: PASS — no regressions (no existing tests exercise this module).

- [ ] **Step 4: Commit**

```bash
git add src/location/location.ts
git commit -m "refactor: extract getCurrentCoords from captureLocation"
```

---

### Task 3: Widen `PlaceNameSheet.onSaved` to return the saved place

**Files:**
- Modify: `src/components/PlaceNameSheet.tsx`

**Interfaces:**
- Consumes: `Place` type from `../types` (already defined: `{ id, name, lat, lng, radius_m, created_at }`).
- Produces: `onSaved: (place: Place) => void` (was `onSaved: () => void`). Existing callers (`app/place/[id].tsx`, `app/entry/[id].tsx`) both pass `onSaved={() => ...}` handlers that ignore arguments — this widening is backward-compatible with both (a zero-arg function is a valid `(place: Place) => void` in TypeScript's structural typing) and needs no changes to either call site.

The new `PlacePickerSheet` (Task 4) needs to know the name of the place a user just created via "+", since `PlaceNameSheet` currently only reports success with no data. This task threads that through.

- [ ] **Step 1: Import the `Place` type**

In `src/components/PlaceNameSheet.tsx`, add to the imports:

```ts
import type { Place } from '../types';
```

- [ ] **Step 2: Widen the `onSaved` prop type**

Change the `Props` interface:

```ts
interface Props {
  visible: boolean;
  placeId?: number;
  coordinate: { lat: number; lng: number };
  initialName?: string;
  entryCount: number;
  onSaved: (place: Place) => void;
  onClose: () => void;
}
```

- [ ] **Step 3: Pass the saved record to `onSaved`**

In `handleSave`, replace:

```ts
      if (record) await syncPlaceToEntries(db, record);
      onSaved();
      onClose();
```

with:

```ts
      if (record) {
        await syncPlaceToEntries(db, record);
        onSaved(record);
      }
      onClose();
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean — `app/place/[id].tsx`'s `onSaved={() => load()}` and `app/entry/[id].tsx`'s `onSaved={async () => {...}}` both still satisfy the widened type.

- [ ] **Step 5: Run the full test suite**

Run: `npm test -- --runInBand`
Expected: PASS — no regressions (no test file exercises `PlaceNameSheet` directly today).

- [ ] **Step 6: Commit**

```bash
git add src/components/PlaceNameSheet.tsx
git commit -m "feat: pass the saved place record through PlaceNameSheet.onSaved"
```

---

### Task 4: `PlacePickerSheet` component

**Files:**
- Create: `src/components/PlacePickerSheet.tsx`

**Interfaces:**
- Consumes (from Tasks 1–3): `sortPlacesByDistance`, `getAllPlacesWithCounts` (from `src/db/places.ts`); `captureLocation`, `getCurrentCoords` (from `src/location/location.ts`); `PlaceNameSheet` with its widened `onSaved: (place: Place) => void`; `Place` type from `src/types`.
- Produces:
  ```ts
  interface PlacePickerSheetProps {
    visible: boolean;
    initialCoords: { lat: number; lng: number } | null;
    onPick: (label: string, lat: number, lng: number) => void;
    onClose: () => void;
  }
  export function PlacePickerSheet(props: PlacePickerSheetProps): JSX.Element
  ```

Thin wiring around already-tested/existing pieces (`sortPlacesByDistance`, `captureLocation`, `getCurrentCoords`, `getAllPlacesWithCounts`, `PlaceNameSheet`) — verified by typecheck and on device, matching this project's convention for modal/sheet components (`PlaceNameSheet` itself has no test file).

- [ ] **Step 1: Create the component**

Create `src/components/PlacePickerSheet.tsx`:

```tsx
import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, FlatList, StyleSheet,
} from 'react-native';
import { getDb } from '../db/database';
import { getAllPlacesWithCounts, sortPlacesByDistance } from '../db/places';
import { captureLocation, getCurrentCoords } from '../location/location';
import { useTheme } from '../theme/ThemeContext';
import { FONTS, KEYLINE_HEAVY, SHADOW_SM } from '../theme/tokens';
import { Sticker } from './ui/Sticker';
import { PlaceNameSheet } from './PlaceNameSheet';
import type { Place } from '../types';

interface Props {
  visible: boolean;
  initialCoords: { lat: number; lng: number } | null;
  onPick: (label: string, lat: number, lng: number) => void;
  onClose: () => void;
}

export function PlacePickerSheet({ visible, initialCoords, onPick, onClose }: Props) {
  const { colors } = useTheme();
  const [places, setPlaces] = useState<(Place & { entry_count: number })[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(initialCoords);
  const [locating, setLocating] = useState(false);
  const [newPlaceCoords, setNewPlaceCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!visible) return;
    setCoords(initialCoords);
    (async () => {
      const db = await getDb();
      setPlaces(await getAllPlacesWithCounts(db));
    })();
    if (!initialCoords) {
      (async () => {
        const fix = await getCurrentCoords();
        if (fix) setCoords(fix);
      })();
    }
  }, [visible, initialCoords]);

  function pickAndClose(label: string, lat: number, lng: number) {
    onPick(label, lat, lng);
    onClose();
  }

  async function handleUseCurrent() {
    setLocating(true);
    try {
      const loc = await captureLocation();
      if (loc) pickAndClose(loc.label ?? '', loc.lat, loc.lng);
    } finally {
      setLocating(false);
    }
  }

  async function handleAddNew() {
    if (coords) {
      setNewPlaceCoords(coords);
      return;
    }
    setLocating(true);
    const fix = await getCurrentCoords();
    setLocating(false);
    if (fix) {
      setCoords(fix);
      setNewPlaceCoords(fix);
    }
  }

  const sortedPlaces = sortPlacesByDistance(places, coords);

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.title, { color: colors.textMuted }]}>Tag a place</Text>

            <View style={styles.gpsRow}>
              <Sticker
                borderWidth={KEYLINE_HEAVY}
                shadow={SHADOW_SM}
                radius={10}
                onPress={handleUseCurrent}
                disabled={locating}
                style={styles.gpsBtn}
              >
                <Text style={[styles.gpsBtnTxt, { color: colors.textPrimary }]}>
                  {locating ? 'LOCATING…' : '◎ Use current location'}
                </Text>
              </Sticker>
              <Sticker
                color={colors.action}
                borderColor={colors.actionInk}
                borderWidth={KEYLINE_HEAVY}
                shadow={SHADOW_SM}
                radius={10}
                onPress={handleAddNew}
                disabled={locating}
                style={styles.addBtn}
              >
                <Text style={[styles.addBtnTxt, { color: colors.actionInk }]}>+</Text>
              </Sticker>
            </View>

            {sortedPlaces.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                Nothing saved yet — hit + to fix that.
              </Text>
            ) : (
              <FlatList
                data={sortedPlaces}
                keyExtractor={item => String(item.id)}
                style={styles.list}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.placeRow, { borderTopColor: colors.border }]}
                    onPress={() => pickAndClose(item.name, item.lat, item.lng)}
                  >
                    <Text
                      style={[styles.placeName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      📍 {item.name}
                    </Text>
                    <Text style={[styles.placeCount, { color: colors.textMuted }]}>
                      {item.entry_count} entr{item.entry_count === 1 ? 'y' : 'ies'}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {newPlaceCoords && (
        <PlaceNameSheet
          visible
          coordinate={newPlaceCoords}
          entryCount={0}
          onSaved={place => {
            setNewPlaceCoords(null);
            pickAndClose(place.name, place.lat, place.lng);
          }}
          onClose={() => setNewPlaceCoords(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingTop: 12, gap: 10,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 2 },
  title: { fontFamily: FONTS.label, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  gpsRow: { flexDirection: 'row', gap: 8 },
  gpsBtn: {
    flex: 1, paddingVertical: 13, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  gpsBtnTxt: { fontFamily: FONTS.bodySemiBold, fontSize: 13 },
  addBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addBtnTxt: { fontFamily: FONTS.display, fontSize: 20 },
  empty: { fontFamily: FONTS.body, fontSize: 13, paddingVertical: 24, textAlign: 'center' },
  list: { maxHeight: 260 },
  placeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1,
  },
  placeName: { fontFamily: FONTS.bodySemiBold, fontSize: 14, flex: 1, marginRight: 8 },
  placeCount: { fontFamily: FONTS.labelRegular, fontSize: 11 },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Run the full test suite**

Run: `npm test -- --runInBand`
Expected: PASS — no regressions (this file has no test; it's exercised on device in Task 5's verification pass).

- [ ] **Step 4: Commit**

```bash
git add src/components/PlacePickerSheet.tsx
git commit -m "feat: add PlacePickerSheet — GPS capture, new-place creation, saved-place picker"
```

---

### Task 5: Wire the PLACE chip into the respond screen

**Files:**
- Modify: `app/respond.tsx`

**Interfaces:**
- Consumes (from Task 4): `PlacePickerSheet` with props `{ visible, initialCoords, onPick, onClose }`.
- Produces: nothing new — `locationLabel`/`locationCoords` state and everything downstream (`handleSubmit`, the existing editable-label row) are unchanged.

Thin wiring; verified by typecheck and on device (CI proves logic, not rendered UI), same convention as this project's other chip/panel wiring tasks.

- [ ] **Step 1: Import `PlacePickerSheet` and add sheet-open state**

In `app/respond.tsx`, add to the imports (near the other `src/components` imports):

```tsx
import { PlacePickerSheet } from '../src/components/PlacePickerSheet';
```

Add state alongside the existing `locationLabel`/`locationCoords` declarations (around line 80-81):

```tsx
  const [placeSheetOpen, setPlaceSheetOpen] = useState(false);
```

- [ ] **Step 2: Replace the single HELP ME WRITE chip block with a row containing both chips**

Replace:

```tsx
          {/* Freeform gets the option to summon a prompt */}
          {!cardPrompt && !helpMeWriteOpen && (
            <Chip label="HELP ME WRITE" onPress={handleToggleHelpMeWrite} shadow={SHADOW_SM} style={styles.helpChip} />
          )}
```

with:

```tsx
          {/* Freeform gets the option to summon a prompt; PLACE tagging is
              always available regardless of prompt state. No "PLACE" text
              here — the Help Me Write modifiers row below can show its own
              PLACE context chip, and the two must never look like the same
              control. */}
          <View style={styles.topChipRow}>
            {!cardPrompt && !helpMeWriteOpen && (
              <Chip label="HELP ME WRITE" onPress={handleToggleHelpMeWrite} shadow={SHADOW_SM} />
            )}
            <Chip
              label={locationLabel ? `◉ ${locationLabel.toUpperCase()}` : '◉'}
              active={locationLabel !== ''}
              onPress={() => setPlaceSheetOpen(true)}
              shadow={SHADOW_SM}
            />
          </View>
```

- [ ] **Step 3: Render the sheet**

Replace the closing of the component's return block:

```tsx
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
```

with:

```tsx
        </ScrollView>
      </View>
      <PlacePickerSheet
        visible={placeSheetOpen}
        initialCoords={locationCoords}
        onPick={(label, lat, lng) => {
          setLocationLabel(label);
          setLocationCoords({ lat, lng });
        }}
        onClose={() => setPlaceSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Update the stylesheet**

Replace:

```tsx
  helpChip: { alignSelf: 'flex-start' },
```

with:

```tsx
  topChipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignSelf: 'flex-start' },
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Run the full test suite**

Run: `npm test -- --runInBand`
Expected: PASS — full suite green, no regressions.

- [ ] **Step 7: Commit**

```bash
git add app/respond.tsx
git commit -m "feat: wire PLACE chip + PlacePickerSheet into the respond screen"
```

---

## On-device verification (after all tasks)

CI proves logic, not the rendered UI. On simulator/device (`npx expo run:ios`):

1. Open Respond (freeform or prompted, including Rank & Defend and Love it/Hate it) — a `◉` chip appears alongside/instead of HELP ME WRITE.
2. With `auto_location` **off** (Settings): tap `◉` → sheet opens showing "Use current location," a `+`, and any saved places (nearest-first once a fix resolves, most-used order before that). Tap "Use current location" → chip becomes `◉ <PLACE NAME>`, editable label row appears below with its ✕ clear button (unchanged from today).
3. Tap `◉` again while active → sheet reopens; picking a different saved place swaps the label/coords; the editable row updates to match.
4. Tap `+` → the existing "Name this place" sheet appears stacked on top; saving it closes both sheets and sets the chip/label to the new place's name. Confirm the new place then also appears in the picker's list on a subsequent open.
5. With `auto_location` **on**: mount the respond screen away from any saved place — chip should already show the auto-captured label without tapping anything; tapping `◉` still opens the sheet and lets you override it.
6. Deny location permission (Settings → Borednotes → Location → Never), then tap "Use current location" and `+` — both should silently no-op (no crash, no alert), and the saved-places list should still render in most-used order.
7. Submit an entry tagged via a saved place — confirm in the entry's detail screen (or CSV export) that `place_id`/`location_label` are set correctly, same as an auto-located entry today.
8. Confirm the Help Me Write modifiers row (when open) still shows its own "PLACE" toggle chip with no visual confusion against the `◉` chip above it.

## Self-review notes

- **Spec coverage:** chip + existing editable row (Task 5), `PlacePickerSheet` layout/behavior (Task 4), data flow via `onPick` reusing existing `locationLabel`/`locationCoords` (Task 5, no changes to `handleSubmit`), error handling silent-fallback (Tasks 2 and 4 — no new `Alert` calls), nearest-first sort + tests (Task 1), "+" → `PlaceNameSheet` hand-off (Tasks 3–4). All spec sections mapped to a task.
- **Type consistency:** `sortPlacesByDistance<T extends { lat, lng }>`, `getCurrentCoords()`, `PlaceNameSheet`'s `onSaved: (place: Place) => void`, and `PlacePickerSheetProps` (`onPick: (label, lat, lng) => void`) are used identically across the tasks that reference them.
- **Naming collision caught and resolved:** the original spec/pre-removal chip text ("PLACE") would have collided with the existing Help Me Write modifier chip of the same name when both are visible at once. Resolved by dropping the word entirely — `◉` / `◉ <NAME>` only — captured in Task 5's inline comment so it isn't accidentally "fixed" back to text later.
- **No new dependencies, no changes to `handleSubmit`/`createEntry`/`checkEntryAgainstPlaces`** per Global Constraints.

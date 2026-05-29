# Map Tab + Auto-GPS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Map tab stub with a full react-native-maps pin view, add a densest-cluster camera focus algorithm, and add an Auto-location setting that captures GPS automatically when writing.

**Architecture:** `src/boredbefore/MapTab.tsx` is replaced with a full implementation using `react-native-maps`. A pure `findDenseCluster` utility function handles the initial camera position and is unit-tested. The Auto-GPS setting is a new `auto_location` key in the existing `settings` table, read by `app/settings.tsx` and `app/respond.tsx`.

**Tech Stack:** React Native + Expo, react-native-maps (new), expo-location (existing), expo-sqlite, Jest.

**Prerequisite:** The BoredBefore Hub plan (`2026-05-29-boredbefore-hub.md`) must be fully implemented before starting this plan.

---

## File Map

| File | Change |
|------|--------|
| `src/boredbefore/MapTab.tsx` | **Replace stub** — full map implementation |
| `src/boredbefore/mapUtils.ts` | **New** — `findDenseCluster` pure function |
| `__tests__/boredbefore/mapUtils.test.ts` | **New** — unit tests for cluster algorithm |
| `app/settings.tsx` | Add LOCATION section with Auto-location toggle |
| `app/respond.tsx` | Read `auto_location`; auto-capture GPS on mount; add ✕ remove button |

---

## Task 1: Install react-native-maps

**Files:**
- Modify: `package.json` (via expo install)

- [ ] **Step 1: Install the package**

  ```bash
  npx expo install react-native-maps
  ```

  Expected: package added to `package.json` and `node_modules`.

- [ ] **Step 2: Verify existing tests still pass**

  ```bash
  npx jest --no-coverage 2>&1 | tail -5
  ```

  Expected: all tests pass.

- [ ] **Step 3: Commit**

  ```bash
  git add package.json
  git commit -m "chore: install react-native-maps"
  ```

---

## Task 2: Cluster algorithm — `findDenseCluster`

**Files:**
- Create: `src/boredbefore/mapUtils.ts`
- Create: `__tests__/boredbefore/mapUtils.test.ts`

The algorithm: bucket pin coordinates into 0.5° lat/lng grid cells, find the cell with the most pins, return that cell's centre as a `{ latitude, longitude, latitudeDelta, longitudeDelta }` region. `latitudeDelta` and `longitudeDelta` are fixed at `0.5` (zoom to cell size).

- [ ] **Step 1: Write the failing tests**

  Create `__tests__/boredbefore/mapUtils.test.ts`:

  ```ts
  import { findDenseCluster } from '../../src/boredbefore/mapUtils';

  describe('findDenseCluster', () => {
    it('returns null when given an empty array', () => {
      expect(findDenseCluster([])).toBeNull();
    });

    it('centres on the single pin when only one exists', () => {
      const result = findDenseCluster([{ lat: 37.7749, lng: -122.4194 }]);
      expect(result).not.toBeNull();
      expect(result!.latitude).toBeCloseTo(37.75, 1);
      expect(result!.longitude).toBeCloseTo(-122.5, 1);
    });

    it('picks the denser cluster when pins span two cities', () => {
      const sf = Array.from({ length: 10 }, (_, i) => ({ lat: 37.77 + i * 0.01, lng: -122.41 }));
      const ny = [{ lat: 40.71, lng: -74.0 }];
      const result = findDenseCluster([...sf, ...ny]);
      expect(result).not.toBeNull();
      // SF cluster centre should be around lat 37.75 (cell [75] in 0.5° grid)
      expect(result!.latitude).toBeCloseTo(37.75, 0);
    });

    it('returns fixed deltas of 0.5 degrees', () => {
      const result = findDenseCluster([{ lat: 51.5, lng: -0.1 }]);
      expect(result!.latitudeDelta).toBe(0.5);
      expect(result!.longitudeDelta).toBe(0.5);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  ```bash
  npx jest __tests__/boredbefore/mapUtils.test.ts --no-coverage
  ```

  Expected: FAIL — `findDenseCluster` not found.

- [ ] **Step 3: Create `src/boredbefore/mapUtils.ts`**

  ```ts
  export interface LatLng {
    lat: number;
    lng: number;
  }

  export interface MapRegion {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }

  const CELL_SIZE = 0.5;

  export function findDenseCluster(pins: LatLng[]): MapRegion | null {
    if (pins.length === 0) return null;

    const counts = new Map<string, number>();
    for (const { lat, lng } of pins) {
      const key = `${Math.floor(lat / CELL_SIZE)},${Math.floor(lng / CELL_SIZE)}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    let bestKey = '';
    let bestCount = 0;
    for (const [key, count] of counts) {
      if (count > bestCount) { bestCount = count; bestKey = key; }
    }

    const [rowStr, colStr] = bestKey.split(',');
    const row = parseInt(rowStr, 10);
    const col = parseInt(colStr, 10);

    return {
      latitude: (row + 0.5) * CELL_SIZE,
      longitude: (col + 0.5) * CELL_SIZE,
      latitudeDelta: CELL_SIZE,
      longitudeDelta: CELL_SIZE,
    };
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  npx jest __tests__/boredbefore/mapUtils.test.ts --no-coverage
  ```

  Expected: PASS (4 tests).

- [ ] **Step 5: Run the full suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass.

- [ ] **Step 6: Commit**

  ```bash
  git add src/boredbefore/mapUtils.ts __tests__/boredbefore/mapUtils.test.ts
  git commit -m "feat: add findDenseCluster map utility"
  ```

---

## Task 3: Full Map tab implementation

**Files:**
- Modify: `src/boredbefore/MapTab.tsx` (replace stub)

- [ ] **Step 1: Replace `src/boredbefore/MapTab.tsx` with the full implementation**

  ```tsx
  import { useRef, useEffect, useState, useCallback } from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import MapView, { Marker, Callout, Region } from 'react-native-maps';
  import { router, useFocusEffect } from 'expo-router';
  import { getDb } from '../db/database';
  import { getAllEntries } from '../db/entries';
  import { useTheme } from '../theme/ThemeContext';
  import { findDenseCluster } from './mapUtils';
  import type { Entry } from '../types';

  interface PinnedEntry extends Entry {
    location_lat: number;
    location_lng: number;
  }

  function isPinned(e: Entry): e is PinnedEntry {
    return e.location_lat !== null && e.location_lng !== null;
  }

  export function MapTab() {
    const { colors, accent } = useTheme();
    const mapRef = useRef<MapView>(null);
    const savedRegion = useRef<Region | null>(null);
    const [pins, setPins] = useState<PinnedEntry[]>([]);
    const [loaded, setLoaded] = useState(false);
    const clusterFocused = useRef(false);

    useFocusEffect(
      useCallback(() => {
        (async () => {
          const db = await getDb();
          const all = await getAllEntries(db);
          setPins(all.filter(isPinned));
          setLoaded(true);
        })();
      }, [])
    );

    useEffect(() => {
      if (loaded && !clusterFocused.current && pins.length > 0 && mapRef.current) {
        const region = findDenseCluster(
          pins.map(p => ({ lat: p.location_lat, lng: p.location_lng }))
        );
        if (region) {
          mapRef.current.animateToRegion(region, 600);
        }
        clusterFocused.current = true;
      }
    }, [pins, loaded]);

    function handleRegionChangeComplete(region: Region) {
      savedRegion.current = region;
    }

    function handleMapReady() {
      if (savedRegion.current && mapRef.current) {
        mapRef.current.animateToRegion(savedRegion.current, 0);
      }
    }

    if (loaded && pins.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No places yet.
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
            Enable Auto-location in Settings to capture where you write.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          onRegionChangeComplete={handleRegionChangeComplete}
          onMapReady={handleMapReady}
        >
          {pins.map(entry => (
            <Marker
              key={entry.id}
              coordinate={{ latitude: entry.location_lat, longitude: entry.location_lng }}
              pinColor={accent.buttonColor}
            >
              <Callout onPress={() => router.push(`/entry/${entry.id}`)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutDate}>
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                    {entry.location_label ? `  ·  ${entry.location_label}` : ''}
                  </Text>
                  <Text style={styles.calloutSnippet} numberOfLines={2}>
                    {entry.response_text}
                  </Text>
                  <Text style={styles.calloutCta}>Open entry →</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        <Text style={[styles.mapLabel, { color: colors.textMuted }]}>
          places you've been bored
        </Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    mapLabel: {
      position: 'absolute', top: 12, alignSelf: 'center',
      fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13,
    },
    callout: { width: 220, padding: 8, gap: 4 },
    calloutDate: { fontSize: 11, color: '#9b8fa0' },
    calloutSnippet: { fontSize: 13, fontFamily: 'Georgia', fontStyle: 'italic', color: '#2d2b2e' },
    calloutCta: { fontSize: 12, color: '#8b7aad', fontWeight: '600', marginTop: 2 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
    emptyText: { fontSize: 16, fontFamily: 'Georgia', fontStyle: 'italic' },
    emptyHint: { fontSize: 13, textAlign: 'center' },
  });
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass.

- [ ] **Step 3: Commit**

  ```bash
  git add src/boredbefore/MapTab.tsx
  git commit -m "feat: implement Map tab with pins and cluster focus"
  ```

---

## Task 4: Auto-GPS — Settings screen

**Files:**
- Modify: `app/settings.tsx`

- [ ] **Step 1: Add `autoLocation` state, effect, and handler to `app/settings.tsx`**

  Add a new state variable below the existing `isFreeform` state:

  ```ts
  const [autoLocation, setAutoLocation] = useState(false);
  ```

  Add a new `useEffect` below the existing freeform `useEffect`:

  ```ts
  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        const val = await getSetting(db, 'auto_location');
        setAutoLocation(val === 'true');
      } catch {}
    })();
  }, []);
  ```

  Add the handler below `handleFreeformToggle`:

  ```ts
  async function handleAutoLocationToggle(value: boolean) {
    setAutoLocation(value);
    try {
      const db = await getDb();
      await setSetting(db, 'auto_location', String(value));
    } catch {
      setAutoLocation(!value);
    }
  }
  ```

- [ ] **Step 2: Add the LOCATION section to the JSX in `app/settings.tsx`**

  Insert this block after the WRITING section's closing `</View>` and before `{/* About section */}`:

  ```tsx
  {/* Location section */}
  <Text style={[styles.sectionHead, { color: colors.textMuted }]}>LOCATION</Text>

  <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
    <View style={styles.rowTextBlock}>
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Auto-location</Text>
      <Text style={[styles.rowSubLabel, { color: colors.textMuted }]}>Capture your location automatically when writing</Text>
    </View>
    <Switch
      value={autoLocation}
      onValueChange={handleAutoLocationToggle}
      trackColor={{ true: accent.buttonColor }}
    />
  </View>
  ```

- [ ] **Step 3: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add app/settings.tsx
  git commit -m "feat: add Auto-location toggle to Settings"
  ```

---

## Task 5: Auto-GPS — Respond screen

**Files:**
- Modify: `app/respond.tsx`

- [ ] **Step 1: Add `autoLocation` state and auto-capture to the `useEffect` in `app/respond.tsx`**

  Add a new state variable below the existing `respondMode` state:

  ```ts
  const [autoLocation, setAutoLocation] = useState(false);
  ```

  Inside the existing `useEffect` async block, after the `setRespondMode(...)` line, add:

  ```ts
  const autoLoc = await getSetting(db, 'auto_location');
  const shouldAutoLocate = autoLoc === 'true';
  setAutoLocation(shouldAutoLocate);
  if (shouldAutoLocate) {
    const loc = await captureLocation();
    if (loc) {
      setLocationLabel(loc.label ?? '');
      setLocationCoords({ lat: loc.lat, lng: loc.lng });
    }
  }
  ```

- [ ] **Step 2: Update the location row JSX in `app/respond.tsx` to show a remove button when auto-captured**

  Find the `<View style={styles.metaRow}>` block and replace it entirely with:

  ```tsx
  <View style={styles.metaRow}>
    <View style={styles.locationRow}>
      <TouchableOpacity onPress={handleAddLocation}>
        <Text style={[styles.metaBtnTxt, { color: colors.textSecondary }]}>
          {locationLabel ? `📍 ${locationLabel}` : '📍 Add place'}
        </Text>
      </TouchableOpacity>
      {locationLabel !== '' && (
        <TouchableOpacity onPress={() => { setLocationLabel(''); setLocationCoords(null); }}>
          <Text style={[styles.removeTxt]}>✕</Text>
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
  ```

- [ ] **Step 3: Add the `locationRow` style to `app/respond.tsx`**

  Inside the existing `StyleSheet.create({...})`, add:

  ```ts
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ```

- [ ] **Step 4: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add app/respond.tsx
  git commit -m "feat: auto-capture GPS on Respond screen when Auto-location enabled"
  ```

---

## Task 6: Version bump and final verification

**Files:**
- Modify: `app.json` (or `app.config.js` — whichever the project uses)

- [ ] **Step 1: Find the version field**

  ```bash
  grep -n "version" app.json
  ```

- [ ] **Step 2: Bump version from `1.0.0` to `1.1.0`**

  In `app.json`, change:
  ```json
  "version": "1.0.0"
  ```
  to:
  ```json
  "version": "1.1.0"
  ```

- [ ] **Step 3: Run the full test suite one final time**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add app.json
  git commit -m "chore: bump version to 1.1.0"
  ```

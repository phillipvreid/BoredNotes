# Design Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the visual design of all BoredNotes screens — elevated minimal aesthetic, Georgia serif italic for prompt/response text, Feather outline icons, and a theme system (4 accent colours + dark mode) surfaced via a new Settings screen.

**Architecture:** A `ThemeContext` wraps the entire app and provides resolved colour tokens + the active accent swatch to every screen via `useTheme()`. The context reads `theme_accent` and `theme_dark_mode` from the existing SQLite settings table and persists changes back there. Token definitions and the `ACCENTS` array live in `src/theme/tokens.ts` — adding a new theme requires only adding one object to that array.

**Tech Stack:** React Native, Expo, expo-sqlite (existing), `@expo/vector-icons` Feather (bundled with Expo SDK), `expo-constants` (bundled with Expo SDK), Georgia font (available on all iOS devices)

---

## File Map

```
src/theme/
├── tokens.ts          NEW — light/dark palette objects + ACCENTS array
└── ThemeContext.tsx   NEW — ThemeProvider component + useTheme hook

app/
├── _layout.tsx        CHANGED — store db in state, wrap Stack in ThemeProvider, add settings route
├── settings.tsx       NEW — Settings screen (theme swatches + dark mode toggle + version)
├── index.tsx          CHANGED — useTheme, Feather icons, settings gear button
├── respond.tsx        CHANGED — useTheme, serif prompt + input, accent submit button
├── entries.tsx        CHANGED — useTheme, serif card previews
├── reflect.tsx        CHANGED — useTheme, serif previews, accent tabs + year badge
├── timeline.tsx       CHANGED — useTheme, accent dots + selected day
├── entry/[id].tsx     CHANGED — useTheme, serif text, accent share button
└── share/[id].tsx     CHANGED — useTheme, accent share button + active template chip

__tests__/theme/
├── tokens.test.ts     NEW — sanity checks on token structure
└── ThemeContext.test.tsx  NEW — context defaults, DB read on mount, setters persist
```

---

## Task 1: Token System

**Files:**
- Create: `src/theme/tokens.ts`
- Create: `__tests__/theme/tokens.test.ts`

- [ ] **Step 1: Write the failing tests**

  Create `__tests__/theme/tokens.test.ts`:
  ```typescript
  import { ACCENTS, DEFAULT_ACCENT_ID, lightPalette, darkPalette } from '../../src/theme/tokens';

  describe('tokens', () => {
    it('ACCENTS contains DEFAULT_ACCENT_ID', () => {
      expect(ACCENTS.find(a => a.id === DEFAULT_ACCENT_ID)).toBeDefined();
    });

    it('every accent has all required fields with valid hex colours', () => {
      const hexPattern = /^#[0-9a-f]{6}$/i;
      for (const accent of ACCENTS) {
        expect(accent.id).toBeTruthy();
        expect(accent.label).toBeTruthy();
        expect(accent.labelColor).toMatch(hexPattern);
        expect(accent.buttonColor).toMatch(hexPattern);
      }
    });

    it('light palette has no shadow in dark palette', () => {
      expect(lightPalette.shadowOpacity).toBeGreaterThan(0);
      expect(darkPalette.shadowOpacity).toBe(0);
    });

    it('dark palette has visible cardBorder, light palette has transparent cardBorder', () => {
      expect(lightPalette.cardBorder).toBe('transparent');
      expect(darkPalette.cardBorder).not.toBe('transparent');
    });
  });
  ```

- [ ] **Step 2: Run tests — verify they fail**

  ```bash
  npx jest __tests__/theme/tokens.test.ts
  ```
  Expected: FAIL — `Cannot find module '../../src/theme/tokens'`

- [ ] **Step 3: Create the tokens file**

  Create `src/theme/tokens.ts`:
  ```typescript
  export interface AccentSwatch {
    id: string;
    label: string;
    labelColor: string;
    buttonColor: string;
  }

  export const ACCENTS: AccentSwatch[] = [
    { id: 'sage',       label: 'Sage',       labelColor: '#6a8f72', buttonColor: '#4a7a54' },
    { id: 'terracotta', label: 'Terracotta', labelColor: '#b5735a', buttonColor: '#9e5e47' },
    { id: 'indigo',     label: 'Indigo',     labelColor: '#6b6bbd', buttonColor: '#5252a8' },
    { id: 'mono',       label: 'Classic',    labelColor: '#666666', buttonColor: '#1a1a1a' },
  ];

  export const DEFAULT_ACCENT_ID = 'sage';

  export const lightPalette = {
    bg: '#fafaf9',
    surface: '#ffffff',
    border: '#e8e5e0',
    cardBorder: 'transparent' as const,
    textPrimary: '#1a1a1a',
    textSecondary: '#888888',
    textMuted: '#bbbbbb',
    shadowColor: '#000000',
    shadowOpacity: 0.07,
  };

  export const darkPalette = {
    bg: '#141412',
    surface: '#1f1f1c',
    border: '#2e2e2a',
    cardBorder: '#2e2e2a',
    textPrimary: '#e8e5e0',
    textSecondary: '#888888',
    textMuted: '#555555',
    shadowColor: '#000000',
    shadowOpacity: 0,
  };

  export type Palette = typeof lightPalette;
  ```

- [ ] **Step 4: Run tests — verify they pass**

  ```bash
  npx jest __tests__/theme/tokens.test.ts
  ```
  Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

  ```bash
  git add src/theme/tokens.ts __tests__/theme/tokens.test.ts
  git commit -m "feat: add theme token system with accent swatches and light/dark palettes"
  ```

---

## Task 2: ThemeContext

**Files:**
- Create: `src/theme/ThemeContext.tsx`
- Create: `__tests__/theme/ThemeContext.test.tsx`

- [ ] **Step 1: Write the failing tests**

  Create `__tests__/theme/ThemeContext.test.tsx`:
  ```typescript
  import React from 'react';
  import { renderHook, act } from '@testing-library/react-native';
  import { ThemeProvider, useTheme } from '../../src/theme/ThemeContext';
  import { openDatabaseAsync } from 'expo-sqlite';
  import { DEFAULT_ACCENT_ID } from '../../src/theme/tokens';

  describe('ThemeContext', () => {
    let db: any;

    beforeEach(async () => {
      jest.clearAllMocks();
      db = await openDatabaseAsync('test.db');
      db.getFirstAsync.mockResolvedValue(null);
    });

    function wrapper({ children }: { children: React.ReactNode }) {
      return <ThemeProvider db={db}>{children}</ThemeProvider>;
    }

    it('defaults to sage accent when no stored value', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(result.current.accent.id).toBe(DEFAULT_ACCENT_ID);
    });

    it('loads stored accent from DB on mount', async () => {
      db.getFirstAsync
        .mockResolvedValueOnce({ value: 'terracotta' })
        .mockResolvedValueOnce(null);
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      expect(result.current.accent.id).toBe('terracotta');
    });

    it('setAccent updates accent synchronously', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      act(() => { result.current.setAccent('indigo'); });
      expect(result.current.accent.id).toBe('indigo');
    });

    it('setAccent persists to DB', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      await act(async () => { result.current.setAccent('indigo'); });
      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO settings'),
        ['theme_accent', 'indigo']
      );
    });

    it('setDarkMode updates isDark synchronously', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      act(() => { result.current.setDarkMode(true); });
      expect(result.current.isDark).toBe(true);
    });

    it('setDarkMode persists to DB', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      await act(async () => {});
      await act(async () => { result.current.setDarkMode(true); });
      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO settings'),
        ['theme_dark_mode', 'true']
      );
    });

    it('throws when useTheme is called outside ThemeProvider', () => {
      expect(() => renderHook(() => useTheme())).toThrow(
        'useTheme must be used within ThemeProvider'
      );
    });
  });
  ```

- [ ] **Step 2: Run tests — verify they fail**

  ```bash
  npx jest __tests__/theme/ThemeContext.test.tsx
  ```
  Expected: FAIL — `Cannot find module '../../src/theme/ThemeContext'`

- [ ] **Step 3: Implement ThemeContext**

  Create `src/theme/ThemeContext.tsx`:
  ```typescript
  import React, { createContext, useContext, useEffect, useState } from 'react';
  import { useColorScheme } from 'react-native';
  import type { SQLiteDatabase } from 'expo-sqlite';
  import { getSetting, setSetting } from '../db/settings';
  import {
    ACCENTS, DEFAULT_ACCENT_ID, lightPalette, darkPalette,
    type AccentSwatch, type Palette,
  } from './tokens';

  interface ThemeContextValue {
    colors: Palette;
    accent: AccentSwatch;
    isDark: boolean;
    setAccent: (id: string) => void;
    setDarkMode: (on: boolean) => void;
  }

  const ThemeContext = createContext<ThemeContextValue | null>(null);

  interface ThemeProviderProps {
    db: SQLiteDatabase;
    children: React.ReactNode;
  }

  export function ThemeProvider({ db, children }: ThemeProviderProps) {
    const systemScheme = useColorScheme();
    const [accentId, setAccentId] = useState(DEFAULT_ACCENT_ID);
    const [isDark, setIsDark] = useState(systemScheme === 'dark');

    useEffect(() => {
      (async () => {
        const storedAccent = await getSetting(db, 'theme_accent');
        const storedDark = await getSetting(db, 'theme_dark_mode');
        if (storedAccent) setAccentId(storedAccent);
        if (storedDark !== null) setIsDark(storedDark === 'true');
      })();
    }, []);

    function setAccent(id: string) {
      setAccentId(id);
      setSetting(db, 'theme_accent', id);
    }

    function setDarkMode(on: boolean) {
      setIsDark(on);
      setSetting(db, 'theme_dark_mode', String(on));
    }

    const accent = ACCENTS.find(a => a.id === accentId) ?? ACCENTS[0];
    const colors = isDark ? darkPalette : lightPalette;

    return (
      <ThemeContext.Provider value={{ colors, accent, isDark, setAccent, setDarkMode }}>
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

- [ ] **Step 4: Run tests — verify they pass**

  ```bash
  npx jest __tests__/theme/ThemeContext.test.tsx
  ```
  Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

  ```bash
  git add src/theme/ThemeContext.tsx __tests__/theme/ThemeContext.test.tsx
  git commit -m "feat: add ThemeContext with accent + dark mode, persisted to settings DB"
  ```

---

## Task 3: Wire ThemeProvider into Root Layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update `app/_layout.tsx`**

  Replace the entire file with:
  ```typescript
  import { useEffect, useState } from 'react';
  import { Stack } from 'expo-router';
  import { View, ActivityIndicator } from 'react-native';
  import type { SQLiteDatabase } from 'expo-sqlite';
  import { getDb } from '../src/db/database';
  import { seedLibraryIfNeeded } from '../src/prompts/seed';
  import { flushPendingGeocodes } from '../src/location/location';
  import { ThemeProvider } from '../src/theme/ThemeContext';

  export default function RootLayout() {
    const [db, setDb] = useState<SQLiteDatabase | null>(null);

    useEffect(() => {
      (async () => {
        const database = await getDb();
        await seedLibraryIfNeeded(database);
        flushPendingGeocodes(database).catch(() => {});
        setDb(database);
      })();
    }, []);

    if (!db) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafaf9' }}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <ThemeProvider db={db}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="respond" options={{ presentation: 'modal' }} />
          <Stack.Screen name="timeline" />
          <Stack.Screen name="entries" />
          <Stack.Screen name="reflect" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="entry/[id]" />
          <Stack.Screen name="share/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    );
  }
  ```

- [ ] **Step 2: Run the app and verify it starts without error**

  ```bash
  npx expo start
  ```
  Open in Expo Go. The loading spinner should appear briefly (on off-white background), then the home screen should render as before. No red error overlay = ThemeProvider is wired correctly.

- [ ] **Step 3: Commit**

  ```bash
  git add app/_layout.tsx
  git commit -m "feat: wire ThemeProvider into root layout"
  ```

---

## Task 4: Settings Screen

**Files:**
- Create: `app/settings.tsx`

- [ ] **Step 1: Create `app/settings.tsx`**

  ```typescript
  import { View, Text, Switch, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
  import { router } from 'expo-router';
  import { Feather } from '@expo/vector-icons';
  import Constants from 'expo-constants';
  import { useTheme } from '../src/theme/ThemeContext';
  import { ACCENTS } from '../src/theme/tokens';

  const version = Constants.expoConfig?.version ?? '1.0.0';

  export default function SettingsScreen() {
    const { colors, accent, isDark, setAccent, setDarkMode } = useTheme();

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
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 }, elevation: 2,
    },
    rowLabel: { fontSize: 15 },
    rowValue: { fontSize: 15 },
    swatches: { flexDirection: 'row', gap: 10 },
    swatch: {
      width: 28, height: 28, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
    },
  });
  ```

- [ ] **Step 2: Test the Settings screen on device**

  ```bash
  npx expo start
  ```
  Open in Expo Go. Navigate to the home screen and manually type `/settings` in Expo Go's URL bar, or temporarily add a button to `app/index.tsx` to navigate to `/settings`. Verify:
  - Four coloured circles appear
  - Tapping a circle switches the accent across the whole app immediately
  - Dark Mode toggle flips the entire app between light/dark immediately
  - Back button returns to home

- [ ] **Step 3: Commit**

  ```bash
  git add app/settings.tsx
  git commit -m "feat: add Settings screen with theme swatches and dark mode toggle"
  ```

---

## Task 5: Home Dashboard

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Replace `app/index.tsx`**

  ```typescript
  import { useState, useCallback } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
  import { router, useFocusEffect } from 'expo-router';
  import { Feather } from '@expo/vector-icons';
  import { getDb } from '../src/db/database';
  import { getCurrentPrompt, getNextPrompt } from '../src/prompts/next';
  import { useTheme } from '../src/theme/ThemeContext';
  import type { CurrentPrompt } from '../src/types';

  export default function HomeScreen() {
    const { colors, accent } = useTheme();
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
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.container}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={[styles.appName, { color: accent.labelColor }]}>BoredNotes</Text>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={[styles.settingsBtn, { backgroundColor: colors.surface, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
            >
              <Feather name="settings" size={18} color={accent.labelColor} />
            </TouchableOpacity>
          </View>

          {/* Prompt card */}
          <TouchableOpacity
            style={[styles.promptCard, {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
              shadowOpacity: colors.shadowOpacity,
            }]}
            onPress={() => router.push('/respond')}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={accent.labelColor} />
            ) : (
              <>
                <Text style={[styles.promptLabel, { color: accent.labelColor }]}>Today's prompt</Text>
                <Text style={[styles.promptText, { color: colors.textPrimary }]}>{prompt?.text}</Text>
                <Text style={[styles.tapHint, { color: colors.textMuted }]}>Tap to respond →</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Tile row */}
          <View style={styles.tileRow}>
            <TouchableOpacity
              style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
              onPress={() => router.push('/timeline')}
            >
              <Feather name="calendar" size={22} color={colors.textSecondary} />
              <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>Timeline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
              onPress={() => router.push('/entries')}
            >
              <Feather name="file-text" size={22} color={colors.textSecondary} />
              <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>Entries</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
              onPress={() => router.push('/reflect')}
            >
              <Feather name="sun" size={22} color={colors.textSecondary} />
              <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>Reflect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1, padding: 20, gap: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    appName: { fontSize: 13, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
    settingsBtn: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
    promptCard: {
      flex: 1, borderRadius: 16, padding: 24,
      justifyContent: 'center', gap: 12,
      borderWidth: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
    },
    promptLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
    promptText: { fontSize: 20, lineHeight: 30, fontFamily: 'Georgia', fontStyle: 'italic' },
    tapHint: { fontSize: 13, marginTop: 8 },
    tileRow: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
    tile: {
      flex: 1, borderRadius: 12, paddingVertical: 18,
      alignItems: 'center', gap: 8, borderWidth: 1,
      shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
    },
    tileLabel: { fontSize: 12, fontWeight: '500' },
  });
  ```

- [ ] **Step 2: Verify on device**

  ```bash
  npx expo start
  ```
  Check: off-white background, serif italic prompt text, Feather icons on tiles, gear icon top-right navigates to Settings.

- [ ] **Step 3: Commit**

  ```bash
  git add app/index.tsx
  git commit -m "feat: apply theme polish to Home Dashboard — serif prompt, Feather icons, settings button"
  ```

---

## Task 6: Respond Screen

**Files:**
- Modify: `app/respond.tsx`

- [ ] **Step 1: Replace `app/respond.tsx`**

  ```typescript
  import { useState, useEffect } from 'react';
  import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, KeyboardAvoidingView, Platform, Image, SafeAreaView,
  } from 'react-native';
  import { router } from 'expo-router';
  import { getDb } from '../src/db/database';
  import { createEntry } from '../src/db/entries';
  import { createMedia } from '../src/db/media';
  import { getNextPrompt, getCurrentPrompt } from '../src/prompts/next';
  import { captureLocation, queuePendingGeocode } from '../src/location/location';
  import { pickPhoto, takePhoto, startVoiceRecording, stopVoiceRecording } from '../src/media/capture';
  import { useTheme } from '../src/theme/ThemeContext';

  export default function RespondScreen() {
    const { colors, accent } = useTheme();
    const [response, setResponse] = useState('');
    const [locationLabel, setLocationLabel] = useState('');
    const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [voiceUri, setVoiceUri] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [prompt, setPrompt] = useState<string>('');

    useEffect(() => {
      (async () => {
        const db = await getDb();
        const current = await getCurrentPrompt(db);
        setPrompt(current?.text ?? '');
      })();
    }, []);

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
      if (isRecording) {
        const uri = await stopVoiceRecording();
        setIsRecording(false);
        if (uri) setVoiceUri(uri);
      } else {
        try {
          await startVoiceRecording();
          setIsRecording(true);
        } catch {
          Alert.alert('Microphone access needed', 'Please allow microphone access in Settings to record voice memos.');
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
          prompt_text: prompt,
          response_text: response.trim(),
          location_label: locationLabel || undefined,
          location_lat: locationCoords?.lat,
          location_lng: locationCoords?.lng,
        });
        if (locationCoords && !locationLabel) {
          await queuePendingGeocode(db, entryId, locationCoords.lat, locationCoords.lng);
        }
        if (photoUri) await createMedia(db, entryId, 'photo', photoUri);
        if (voiceUri) await createMedia(db, entryId, 'voice', voiceUri);
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

            <Text style={[styles.prompt, { color: colors.textPrimary }]}>{prompt}</Text>

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

            {voiceUri && !isRecording && (
              <View style={styles.voiceBadge}>
                <Text style={[styles.voiceTxt, { color: colors.textSecondary }]}>🎙 Voice memo attached</Text>
                <TouchableOpacity onPress={() => setVoiceUri(null)}>
                  <Text style={styles.removeTxt}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.metaRow}>
              <TouchableOpacity onPress={handleAddLocation}>
                <Text style={[styles.metaBtnTxt, { color: colors.textSecondary }]}>
                  {locationLabel ? `📍 ${locationLabel}` : '📍 Add place'}
                </Text>
              </TouchableOpacity>
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
              <TouchableOpacity
                onPress={handleToggleRecording}
                style={[styles.attachBtn, { backgroundColor: isRecording ? '#fee2e2' : colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.attachTxt, { color: colors.textSecondary }]}>{isRecording ? '⏹ Stop' : '🎙 Record'}</Text>
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
    prompt: { fontSize: 20, lineHeight: 30, fontFamily: 'Georgia', fontStyle: 'italic', marginTop: 8 },
    input: { fontSize: 16, lineHeight: 26, minHeight: 160, textAlignVertical: 'top', borderBottomWidth: 1, paddingBottom: 12, fontFamily: 'Georgia', fontStyle: 'italic' },
    photoPreview: { gap: 6 },
    photoImg: { width: '100%', height: 180, borderRadius: 8 },
    voiceBadge: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    voiceTxt: {},
    removeTxt: { color: '#f87171', fontSize: 13 },
    metaRow: { gap: 6 },
    metaBtnTxt: { fontSize: 14 },
    locationInput: { fontSize: 14, borderBottomWidth: 1, paddingVertical: 4 },
    attachRow: { flexDirection: 'row', gap: 10 },
    attachBtn: { flex: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
    attachTxt: { fontSize: 13 },
    submitBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    submitTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
  ```

- [ ] **Step 2: Verify on device**

  Open the app, tap the prompt card. Check: off-white background, prompt text in Georgia italic, text input in Georgia italic, attachment buttons have border style, submit button uses accent colour.

- [ ] **Step 3: Commit**

  ```bash
  git add app/respond.tsx
  git commit -m "feat: apply theme polish to Respond screen"
  ```

---

## Task 7: Entries Screen

**Files:**
- Modify: `app/entries.tsx`

- [ ] **Step 1: Replace `app/entries.tsx`**

  ```typescript
  import { useState, useCallback } from 'react';
  import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput } from 'react-native';
  import { router, useFocusEffect } from 'expo-router';
  import { getDb } from '../src/db/database';
  import { getAllEntries, searchEntries } from '../src/db/entries';
  import { useTheme } from '../src/theme/ThemeContext';
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
    const { colors, accent } = useTheme();
    const [query, setQuery] = useState('');
    const [entries, setEntries] = useState<Entry[]>([]);

    useFocusEffect(
      useCallback(() => { loadEntries(''); }, [])
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
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={[styles.backTxt, { color: colors.textSecondary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Entries</Text>

          <TextInput
            style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
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
                <Text style={[styles.dateHeader, { color: colors.textMuted }]}>{formatDate(group.date)}</Text>
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
                    <Text style={[styles.cardPrompt, { color: accent.labelColor }]} numberOfLines={1}>{entry.prompt_text}</Text>
                    <Text style={[styles.cardResponse, { color: colors.textPrimary }]} numberOfLines={3}>{entry.response_text}</Text>
                    {entry.location_label && (
                      <Text style={[styles.cardMeta, { color: colors.textMuted }]}>📍 {entry.location_label}</Text>
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
          />
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1, padding: 20, gap: 12 },
    back: { paddingVertical: 4 },
    backTxt: { fontSize: 15 },
    title: { fontSize: 28, fontWeight: '700' },
    search: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
    group: { gap: 10, marginBottom: 24 },
    dateHeader: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    card: { borderRadius: 12, padding: 16, gap: 6, borderWidth: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
    cardPrompt: { fontSize: 11, fontStyle: 'italic' },
    cardResponse: { fontSize: 15, lineHeight: 22, fontFamily: 'Georgia', fontStyle: 'italic' },
    cardMeta: { fontSize: 11 },
    empty: { textAlign: 'center', marginTop: 60, fontSize: 15 },
  });
  ```

- [ ] **Step 2: Verify on device**

  Navigate to Entries. Check: off-white background, white cards with shadow, response text in Georgia italic, prompt label in accent colour.

- [ ] **Step 3: Commit**

  ```bash
  git add app/entries.tsx
  git commit -m "feat: apply theme polish to Entries screen"
  ```

---

## Task 8: Entry Detail Screen

**Files:**
- Modify: `app/entry/[id].tsx`

- [ ] **Step 1: Replace `app/entry/[id].tsx`**

  ```typescript
  import { useState, useEffect } from 'react';
  import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
  import { router, useLocalSearchParams } from 'expo-router';
  import { AudioPlayer, createAudioPlayer } from 'expo-audio';
  import { getDb } from '../../src/db/database';
  import { getEntry } from '../../src/db/entries';
  import { getMediaForEntry } from '../../src/db/media';
  import { useTheme } from '../../src/theme/ThemeContext';
  import type { Entry, MediaItem } from '../../src/types';

  function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
      year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  export default function EntryDetailScreen() {
    const { colors, accent } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [entry, setEntry] = useState<Entry | null>(null);
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [player, setPlayer] = useState<AudioPlayer | null>(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
      (async () => {
        const db = await getDb();
        const e = await getEntry(db, Number(id));
        setEntry(e);
        if (e) setMedia(await getMediaForEntry(db, e.id));
      })();
      return () => { player?.remove(); };
    }, [id]);

    const photo = media.find(m => m.type === 'photo');
    const voice = media.find(m => m.type === 'voice');

    async function togglePlayback() {
      if (!voice) return;
      if (playing && player) {
        player.pause();
        setPlaying(false);
      } else if (player) {
        player.play();
        setPlaying(true);
      } else {
        const p = createAudioPlayer({ uri: voice.file_path });
        p.addListener('playbackStatusUpdate', (status: any) => {
          if (status.didJustFinish) setPlaying(false);
        });
        p.play();
        setPlayer(p);
        setPlaying(true);
      }
    }

    if (!entry) return null;

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={[styles.backTxt, { color: colors.textSecondary }]}>← Back</Text>
          </TouchableOpacity>

          <Text style={[styles.dateTime, { color: colors.textMuted }]}>{formatDateTime(entry.created_at)}</Text>
          {entry.location_label && (
            <Text style={[styles.location, { color: colors.textMuted }]}>📍 {entry.location_label}</Text>
          )}

          <Text style={[styles.prompt, { color: colors.textSecondary }]}>{entry.prompt_text}</Text>

          {photo && (
            <Image source={{ uri: photo.file_path }} style={styles.photo} resizeMode="cover" />
          )}

          <Text style={[styles.response, { color: colors.textPrimary }]}>{entry.response_text}</Text>

          {voice && (
            <TouchableOpacity
              style={[styles.voiceBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={togglePlayback}
            >
              <Text style={[styles.voiceTxt, { color: colors.textSecondary }]}>
                {playing ? '⏸ Pause voice memo' : '▶ Play voice memo'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: accent.buttonColor }]}
            onPress={() => router.push(`/share/${entry.id}`)}
          >
            <Text style={styles.shareTxt}>Share this entry</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { padding: 20, gap: 16, paddingBottom: 40 },
    back: { paddingVertical: 4 },
    backTxt: { fontSize: 15 },
    dateTime: { fontSize: 13 },
    location: { fontSize: 13 },
    prompt: { fontSize: 16, fontFamily: 'Georgia', fontStyle: 'italic', lineHeight: 24 },
    photo: { width: '100%', height: 220, borderRadius: 12 },
    response: { fontSize: 18, lineHeight: 30, fontFamily: 'Georgia', fontStyle: 'italic' },
    voiceBtn: { borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
    voiceTxt: { fontSize: 15 },
    shareBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    shareTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  });
  ```

- [ ] **Step 2: Verify on device**

  Open any entry. Check: prompt text in Georgia italic, response text in Georgia italic at 18px, share button uses accent colour, voice button has border style.

- [ ] **Step 3: Commit**

  ```bash
  git add "app/entry/[id].tsx"
  git commit -m "feat: apply theme polish to Entry Detail screen"
  ```

---

## Task 9: Timeline Screen

**Files:**
- Modify: `app/timeline.tsx`

- [ ] **Step 1: Open `app/timeline.tsx` and apply theme**

  Add `useTheme` import and call at the top of the component:
  ```typescript
  import { useTheme } from '../src/theme/ThemeContext';
  // inside component:
  const { colors, accent } = useTheme();
  ```

  Replace every hardcoded colour with theme tokens:

  | Replace | With |
  |---------|------|
  | `backgroundColor: '#fff'` (safe/container) | `colors.bg` |
  | `color: '#888'` (back button) | `colors.textSecondary` |
  | `color: '#1a1a1a'` (month title) | `colors.textPrimary` |
  | `color: '#aaa'` (day-of-week headers) | `colors.textMuted` |
  | `backgroundColor: '#7c6af7'` (dot) | `accent.labelColor` |
  | `backgroundColor: '#1a1a1a'` (selected day) | `accent.buttonColor` |
  | `backgroundColor: '#f8f8f8'` (entry cards) | `colors.surface` |
  | `color: '#333'` / `color: '#1a1a1a'` (card text) | `colors.textPrimary` |
  | `color: '#aaa'` (card meta) | `colors.textMuted` |

  Add `borderWidth: 1, borderColor: colors.cardBorder` to entry card styles alongside existing shadow properties, and change `shadowColor` to `colors.shadowColor`, `shadowOpacity` to `colors.shadowOpacity`.

- [ ] **Step 2: Verify on device**

  Open Timeline. Check: entry dots appear in accent colour, selected day uses accent button colour, cards have consistent styling.

- [ ] **Step 3: Commit**

  ```bash
  git add app/timeline.tsx
  git commit -m "feat: apply theme polish to Timeline screen"
  ```

---

## Task 10: Reflect Screen

**Files:**
- Modify: `app/reflect.tsx`

- [ ] **Step 1: Open `app/reflect.tsx` and apply theme**

  Add `useTheme` import and call at the top of the component:
  ```typescript
  import { useTheme } from '../src/theme/ThemeContext';
  // inside component:
  const { colors, accent } = useTheme();
  ```

  Replace every hardcoded colour:

  | Replace | With |
  |---------|------|
  | `backgroundColor: '#fff'` (safe) | `colors.bg` |
  | `color: '#888'` (back button) | `colors.textSecondary` |
  | `color: '#1a1a1a'` (title) | `colors.textPrimary` |
  | `color: '#aaa'` (section heads) | `colors.textMuted` |
  | `color: '#7c6af7'` (year badge) | `accent.labelColor` |
  | `backgroundColor: '#f8f8f8'` (cards) | `colors.surface` |
  | `color: '#333'` (card response) | `colors.textPrimary` |
  | `color: '#aaa'` (card prompt) | `colors.textSecondary` |
  | `color: '#bbb'` (card date) | `colors.textMuted` |
  | `backgroundColor: '#f4f4f4'` (inactive tab) | `colors.surface` |
  | `color: '#555'` (inactive tab text) | `colors.textSecondary` |
  | `backgroundColor: '#1a1a1a'` (active tab) | `accent.buttonColor` |
  | `color: '#aaa'` (period count) | `colors.textMuted` |

  Add `borderWidth: 1, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity` to card styles.

  Change `cardResponse` font to Georgia italic:
  ```typescript
  cardResponse: { fontSize: 15, lineHeight: 22, fontFamily: 'Georgia', fontStyle: 'italic' },
  ```

- [ ] **Step 2: Verify on device**

  Open Reflect. Check: year badge in accent colour, active tab in accent colour, response previews in Georgia italic.

- [ ] **Step 3: Commit**

  ```bash
  git add app/reflect.tsx
  git commit -m "feat: apply theme polish to Reflect screen"
  ```

---

## Task 11: Share Card Screen

**Files:**
- Modify: `app/share/[id].tsx`

- [ ] **Step 1: Open `app/share/[id].tsx` and apply theme**

  Add `useTheme` import and call at the top of the component:
  ```typescript
  import { useTheme } from '../../src/theme/ThemeContext';
  // inside component:
  const { colors, accent } = useTheme();
  ```

  Replace every hardcoded colour:

  | Replace | With |
  |---------|------|
  | `backgroundColor: '#fff'` (safe) | `colors.bg` |
  | `color: '#aaa'` (close button) | `colors.textMuted` |
  | `color: '#1a1a1a'` (title) | `colors.textPrimary` |
  | `color: '#aaa'` (label) | `colors.textMuted` |
  | `backgroundColor: '#f4f4f4'` (template chips) | `colors.surface` |
  | `backgroundColor: '#1a1a1a'` (active template chip) | `accent.buttonColor` |
  | `color: '#444'` (chip label) | `colors.textSecondary` |
  | `color: '#333'` (toggle labels) | `colors.textPrimary` |
  | `backgroundColor: '#1a1a1a'` (share button) | `accent.buttonColor` |
  | `backgroundColor: '#ccc'` (share button disabled) | `colors.border` |

- [ ] **Step 2: Verify on device**

  Open any entry → Share. Check: active template chip uses accent colour, Share button uses accent colour, screen background is off-white.

- [ ] **Step 3: Commit**

  ```bash
  git add "app/share/[id].tsx"
  git commit -m "feat: apply theme polish to Share Card screen"
  ```

---

## Task 12: Run All Tests

- [ ] **Step 1: Run the full test suite**

  ```bash
  npx jest
  ```
  Expected: all existing tests pass plus the 11 new theme tests (4 tokens + 7 ThemeContext).

- [ ] **Step 2: Full end-to-end device check**

  Open the app in Expo Go and verify:
  1. Home screen loads with off-white background, Feather icons, serif prompt text
  2. Gear icon navigates to Settings
  3. Tapping a colour swatch in Settings immediately changes the accent across the whole app
  4. Dark Mode toggle immediately flips the whole app to dark/light
  5. Killing and reopening the app restores the last saved theme/mode
  6. Respond screen: prompt and text input are Georgia italic, submit button is accent coloured
  7. Entries screen: response previews are Georgia italic, cards have shadow (light) / border (dark)
  8. Entry Detail: prompt and response are Georgia italic, share button is accent coloured
  9. Timeline: entry dots are accent coloured, selected day is accent coloured
  10. Reflect: year badge is accent coloured, active tab is accent coloured
  11. Share Card: active template chip and share button are accent coloured

- [ ] **Step 3: Final commit**

  ```bash
  git add -A
  git commit -m "feat: complete design polish — theme system, serif typography, Feather icons across all screens"
  ```

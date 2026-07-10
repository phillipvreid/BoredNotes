# Share Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the nine passport/photo/signal share cards with one Arcade Sticker "Setup & Punchline" card, and remove all old card code and artifacts cleanly.

**Architecture:** A single `ShareCard` renders a category-hued setup band (prompt or freeform kicker) above a Bricolage-display punchline and a dashed "ticket" footer carrying the BoredNotes hook lockup. All color derives from the active theme + the entry's category via `useTheme()`; there is no style/color picker. Logic (band content, band color, footer meta) lives in pure helpers in `src/share/card-content.ts` so it is unit-tested without a renderer.

**Tech Stack:** Expo / React Native, TypeScript (strict), `@testing-library/react-native`, jest-expo, `react-native-view-shot` (`captureRef`), `expo-sharing`.

## Global Constraints

- Strict TypeScript — no `any`, no non-null assertions on possibly-undefined values. Run `npx tsc --noEmit` clean.
- Yellow / the theme `action` color is reserved — never use it as the card background or setup band.
- No database, migration, or CSV-export changes. The `captureRef` → `Sharing.shareAsync` PNG flow is unchanged.
- Photos are cut from the app — no photo/media loading anywhere on the share screen.
- Card width is 320px.
- Run tests with `npm test -- --runInBand`.
- Copy voice: dry, sarcastic, never rude.
- `getMediaForEntry` (`src/db/media.ts`) is still used by `app/entry/[id].tsx` — do NOT delete `src/db/media.ts`; only remove its use in `app/share/[id].tsx`.
- Pure date helpers use UTC getters (`getUTCMonth`/`getUTCDate`) so tests are timezone-independent.

---

## File Structure

**Create:**
- `src/share/card-content.ts` — pure helpers: `resolveBand`, `resolveBandColor`, `footerMeta`, `BandContent` type.
- `__tests__/share/card-content.test.ts` — unit tests for the helpers (no renderer, no db).
- `__tests__/share/renderer.test.tsx` — render smoke test for `ShareCard` via `ThemeProvider`.

**Modify:**
- `src/theme/copy.ts` — add `FREEFORM_KICKERS` and `SHARE_TAGLINES`.
- `src/share/renderer.tsx` — full rewrite to a single `ShareCard`.
- `app/share/[id].tsx` — remove pickers + photo logic, wire new props.
- `__tests__/theme/copy.test.ts` — add assertions for the new copy arrays (create the file only if it does not exist; otherwise append).

**Delete (source):**
- `src/share/passport-card.tsx`, `src/share/photo-card.tsx`, `src/share/signal-card.tsx`, `src/share/templates.ts`

**Delete (tests):**
- `__tests__/share/passport-card.test.tsx`, `__tests__/share/photo-card.test.tsx`, `__tests__/share/signal-card.test.tsx`, `__tests__/share/templates.test.ts`

---

## Task 1: Add share-card copy

**Files:**
- Modify: `src/theme/copy.ts`
- Test: `__tests__/theme/copy.test.ts` (append, or create if absent)

**Interfaces:**
- Consumes: the existing `pick<T>(arr: readonly T[]): T` helper in `src/theme/copy.ts`.
- Produces: `FREEFORM_KICKERS: readonly string[]`, `SHARE_TAGLINES: readonly string[]`.

- [ ] **Step 1: Write the failing test**

Append to `__tests__/theme/copy.test.ts` (create the file with this content if it does not exist):

```ts
import { FREEFORM_KICKERS, SHARE_TAGLINES } from '../../src/theme/copy';

describe('share-card copy', () => {
  it('FREEFORM_KICKERS is a non-empty list of non-empty strings', () => {
    expect(FREEFORM_KICKERS.length).toBeGreaterThan(0);
    for (const line of FREEFORM_KICKERS) {
      expect(typeof line).toBe('string');
      expect(line.trim().length).toBeGreaterThan(0);
    }
  });

  it('SHARE_TAGLINES is a non-empty list of non-empty strings', () => {
    expect(SHARE_TAGLINES.length).toBeGreaterThan(0);
    for (const line of SHARE_TAGLINES) {
      expect(typeof line).toBe('string');
      expect(line.trim().length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/theme/copy.test.ts`
Expected: FAIL — `FREEFORM_KICKERS`/`SHARE_TAGLINES` are not exported.

- [ ] **Step 3: Add the copy**

Add to `src/theme/copy.ts` (near `SHARE_LINES`):

```ts
// Setup-band labels for freeform (no-prompt) entries on the share card.
export const FREEFORM_KICKERS = [
  'NO ONE ASKED, BUT—',
  'UNPROMPTED THOUGHT',
  'BRAIN DUMP RECEIPT',
  'FILED UNDER: WHATEVER',
] as const;

// Small taglines under the wordmark in the share-card footer.
export const SHARE_TAGLINES = [
  'professionally bored',
  'the anti-scroll journal',
  'bored on purpose',
] as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/theme/copy.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/theme/copy.ts __tests__/theme/copy.test.ts
git commit -m "feat: add freeform kickers + share taglines copy"
```

---

## Task 2: Pure card-content helpers

**Files:**
- Create: `src/share/card-content.ts`
- Test: `__tests__/share/card-content.test.ts`

**Interfaces:**
- Consumes: `PromptCategory` from `src/types.ts`; `CategoryStyle` from `src/theme/tokens.ts`.
- Produces:
  - `interface BandContent { kicker: string; setupLine: string | null }`
  - `resolveBand(entryMode: 'prompted' | 'freeform', category: PromptCategory | null, promptText: string, freeformKicker: string): BandContent`
  - `resolveBandColor(category: PromptCategory | null, categoryStyles: Record<PromptCategory, CategoryStyle>): string`
  - `footerMeta(createdAt: string | null, location: string | null, showDate: boolean, showLocation: boolean): string`

- [ ] **Step 1: Write the failing test**

Create `__tests__/share/card-content.test.ts`:

```ts
import { resolveBand, resolveBandColor, footerMeta } from '../../src/share/card-content';
import type { CategoryStyle } from '../../src/theme/tokens';
import type { PromptCategory } from '../../src/types';

const styles: Record<PromptCategory, CategoryStyle> = {
  observational: { label: 'OBSERVE', kind: 'notice', color: '#06B6C9' },
  reflective: { label: 'REFLECT', kind: 'introspect', color: '#2E5BFF' },
  personal: { label: 'CONFESS', kind: 'off the record', color: '#8B3DF5' },
  creative: { label: 'IMAGINE', kind: 'what if', color: '#6C5CE7' },
  game: { label: 'RANK + DEFEND', kind: 'micro-game', color: '#15A150' },
};

describe('resolveBand', () => {
  it('prompted + category → TODAY\'S PROMPT with the prompt as setup line', () => {
    expect(resolveBand('prompted', 'reflective', 'Why?', 'KICK')).toEqual({
      kicker: "TODAY'S PROMPT",
      setupLine: 'Why?',
    });
  });

  it('prompted + null category → PROMPTED label with the prompt as setup line', () => {
    expect(resolveBand('prompted', null, 'Why?', 'KICK')).toEqual({
      kicker: 'PROMPTED',
      setupLine: 'Why?',
    });
  });

  it('freeform → freeform kicker and no setup line', () => {
    expect(resolveBand('freeform', 'reflective', 'ignored', 'KICK')).toEqual({
      kicker: 'KICK',
      setupLine: null,
    });
  });

  it('freeform + null category → freeform kicker and no setup line', () => {
    expect(resolveBand('freeform', null, '', 'KICK')).toEqual({
      kicker: 'KICK',
      setupLine: null,
    });
  });
});

describe('resolveBandColor', () => {
  it('uses the category hue when present', () => {
    expect(resolveBandColor('personal', styles)).toBe('#8B3DF5');
  });

  it('falls back to the REFLECT hue for null category (white-text-safe in both modes)', () => {
    expect(resolveBandColor(null, styles)).toBe('#2E5BFF');
  });
});

describe('footerMeta', () => {
  it('date only when location hidden', () => {
    expect(footerMeta('2026-07-10T10:00:00.000Z', 'Portland', true, false)).toBe('JUL 10');
  });

  it('date and location joined with a middot', () => {
    expect(footerMeta('2026-07-10T10:00:00.000Z', 'Portland', true, true)).toBe('JUL 10 · Portland');
  });

  it('location only when date hidden', () => {
    expect(footerMeta('2026-07-10T10:00:00.000Z', 'Portland', false, true)).toBe('Portland');
  });

  it('empty string when both hidden', () => {
    expect(footerMeta('2026-07-10T10:00:00.000Z', 'Portland', false, false)).toBe('');
  });

  it('omits date when createdAt is null and location when location is null', () => {
    expect(footerMeta(null, null, true, true)).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/share/card-content.test.ts`
Expected: FAIL — `src/share/card-content.ts` does not exist.

- [ ] **Step 3: Write the helpers**

Create `src/share/card-content.ts`:

```ts
import type { CategoryStyle } from '../theme/tokens';
import type { PromptCategory } from '../types';

export interface BandContent {
  kicker: string;
  setupLine: string | null;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// Prompted entries put the prompt in the band; freeform entries put a playful
// kicker there and drop the setup line (the answer is the whole point).
export function resolveBand(
  entryMode: 'prompted' | 'freeform',
  category: PromptCategory | null,
  promptText: string,
  freeformKicker: string,
): BandContent {
  if (entryMode === 'freeform') {
    return { kicker: freeformKicker, setupLine: null };
  }
  return { kicker: category ? "TODAY'S PROMPT" : 'PROMPTED', setupLine: promptText };
}

// The band always carries white text, so its color must stay dark enough for
// contrast in both light and dark themes. Category hues qualify; null (legacy)
// rows fall back to the REFLECT hue rather than raw ink, which would flip light
// in dark mode and break the white band text.
export function resolveBandColor(
  category: PromptCategory | null,
  categoryStyles: Record<PromptCategory, CategoryStyle>,
): string {
  return categoryStyles[category ?? 'reflective'].color;
}

// Footer meta line: "MMM D", "MMM D · Location", "Location", or "".
export function footerMeta(
  createdAt: string | null,
  location: string | null,
  showDate: boolean,
  showLocation: boolean,
): string {
  const parts: string[] = [];
  if (showDate && createdAt) {
    const d = new Date(createdAt);
    parts.push(`${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`);
  }
  if (showLocation && location) {
    parts.push(location);
  }
  return parts.join(' · ');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/share/card-content.test.ts`
Expected: PASS (all cases)

- [ ] **Step 5: Commit**

```bash
git add src/share/card-content.ts __tests__/share/card-content.test.ts
git commit -m "feat: pure share-card content helpers (band, band color, footer meta)"
```

---

## Task 3: Rewrite renderer.tsx to the single ShareCard

**Files:**
- Modify (full rewrite): `src/share/renderer.tsx`
- Test: `__tests__/share/renderer.test.tsx`

**Interfaces:**
- Consumes: `useTheme()` (`colors`, `categoryStyles`) from `src/theme/ThemeContext`; `pick`, `FREEFORM_KICKERS`, `SHARE_TAGLINES` from `src/theme/copy`; `resolveBand`, `resolveBandColor`, `footerMeta` from `src/share/card-content`; `Mascot` from `src/components/ui/Mascot`; `FONTS` from `src/theme/tokens`; `PromptCategory` from `src/types`.
- Produces:
  - `interface ShareCardProps { promptText: string; responseText: string; createdAt: string | null; location: string | null; showDate: boolean; showLocation: boolean; entryMode: 'prompted' | 'freeform'; category: PromptCategory | null }`
  - `ShareCard` = `React.forwardRef<View, ShareCardProps>` (same ref-forwarding contract `captureRef` relies on).

- [ ] **Step 1: Write the failing test**

Create `__tests__/share/renderer.test.tsx` (mirrors the ThemeProvider+db pattern in `__tests__/components/sticker.test.tsx`):

```tsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { openDatabaseAsync } from 'expo-sqlite';
import { ShareCard } from '../../src/share/renderer';
import { ThemeProvider } from '../../src/theme/ThemeContext';

const base = {
  promptText: 'What did you avoid today?',
  responseText: 'Literally all of it.',
  createdAt: '2026-07-10T10:00:00.000Z',
  location: 'Portland',
  showDate: true,
  showLocation: true,
  entryMode: 'prompted' as const,
  category: 'reflective' as const,
};

describe('ShareCard', () => {
  let db: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
    db.getFirstAsync.mockResolvedValue(null);
  });

  async function renderCard(props: React.ComponentProps<typeof ShareCard>) {
    const result = render(
      <ThemeProvider db={db}>
        <ShareCard {...props} />
      </ThemeProvider>,
    );
    await act(async () => {});
    return result;
  }

  it('renders the prompt and response for a prompted entry', async () => {
    const { getByText } = await renderCard(base);
    expect(getByText('What did you avoid today?')).toBeTruthy();
    expect(getByText('Literally all of it.')).toBeTruthy();
    expect(getByText("TODAY'S PROMPT")).toBeTruthy();
  });

  it('omits the prompt for a freeform entry and still shows the response', async () => {
    const { queryByText, getByText } = await renderCard({
      ...base,
      entryMode: 'freeform',
      promptText: '',
    });
    expect(queryByText('What did you avoid today?')).toBeNull();
    expect(getByText('Literally all of it.')).toBeTruthy();
  });

  it('shows the date-and-location footer meta', async () => {
    const { getByText } = await renderCard(base);
    expect(getByText('JUL 10 · Portland')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/share/renderer.test.tsx`
Expected: FAIL — current `ShareCard` requires `styleId`/`variantId` props and renders the old cards; new assertions (e.g. `TODAY'S PROMPT`) are absent.

- [ ] **Step 3: Rewrite the renderer**

Replace the entire contents of `src/share/renderer.tsx` with:

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/tokens';
import { pick, FREEFORM_KICKERS, SHARE_TAGLINES } from '../theme/copy';
import { Mascot } from '../components/ui/Mascot';
import { resolveBand, resolveBandColor, footerMeta } from './card-content';
import type { PromptCategory } from '../types';

export interface ShareCardProps {
  promptText: string;
  responseText: string;
  createdAt: string | null;
  location: string | null;
  showDate: boolean;
  showLocation: boolean;
  entryMode: 'prompted' | 'freeform';
  category: PromptCategory | null;
}

export const ShareCard = React.forwardRef<View, ShareCardProps>(
  ({ promptText, responseText, createdAt, location, showDate, showLocation, entryMode, category }, ref) => {
    const { colors, categoryStyles } = useTheme();
    // Picked once per mount so the live preview matches the captured PNG.
    const [freeformKicker] = useState(() => pick(FREEFORM_KICKERS));
    const [tagline] = useState(() => pick(SHARE_TAGLINES));

    const band = resolveBand(entryMode, category, promptText, freeformKicker);
    const bandColor = resolveBandColor(category, categoryStyles);
    const meta = footerMeta(createdAt, location, showDate, showLocation);

    return (
      <View
        ref={ref}
        style={[
          styles.card,
          { backgroundColor: colors.bg, borderColor: colors.cardBorder, shadowColor: colors.shadowColor },
        ]}
      >
        <View style={[styles.band, { backgroundColor: bandColor }]}>
          <Text style={styles.kicker}>{band.kicker}</Text>
          {band.setupLine !== null && <Text style={styles.setup}>{band.setupLine}</Text>}
        </View>

        <View style={styles.punchWrap}>
          <Text style={[styles.punch, { color: colors.textPrimary }]}>{responseText}</Text>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.cardBorder }]}>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{meta}</Text>
          <View style={styles.lockup}>
            <Mascot size={30} variant="red" bob={false} />
            <View>
              <Text style={[styles.wordmark, { color: colors.textPrimary }]}>BoredNotes</Text>
              <Text style={[styles.tagline, { color: colors.textMuted }]}>{tagline}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    width: 320,
    borderRadius: 18,
    borderWidth: 3,
    overflow: 'hidden',
    transform: [{ rotate: '-1.4deg' }],
    shadowOffset: { width: 7, height: 7 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  band: { paddingVertical: 14, paddingHorizontal: 18, gap: 4 },
  kicker: {
    fontFamily: FONTS.label,
    fontSize: 9,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
  },
  setup: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 14, lineHeight: 19, color: '#FFFFFF' },
  punchWrap: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  punch: { fontFamily: FONTS.display, fontSize: 22, lineHeight: 26 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 3,
    borderStyle: 'dashed',
  },
  meta: { fontFamily: FONTS.label, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase' },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontFamily: FONTS.display, fontSize: 12 },
  tagline: { fontFamily: FONTS.label, fontSize: 7.5, letterSpacing: 0.5, textTransform: 'uppercase' },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/share/renderer.test.tsx`
Expected: PASS (3 cases)

- [ ] **Step 5: Commit**

```bash
git add src/share/renderer.tsx __tests__/share/renderer.test.tsx
git commit -m "feat: single Setup & Punchline ShareCard renderer"
```

---

## Task 4: Update the share screen

**Files:**
- Modify: `app/share/[id].tsx`

**Interfaces:**
- Consumes: `ShareCard` (new props from Task 3), `getEntry` (already imported).
- Produces: no new exports (screen component).

- [ ] **Step 1: Rewrite the screen**

Replace the entire contents of `app/share/[id].tsx` with (removes photo loading, `styleId`/`variantId` state, the STYLE chip row, and the COLOUR dots row; keeps the date/location toggles and share flow):

```tsx
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { getDb } from '../../src/db/database';
import { getEntry } from '../../src/db/entries';
import { ShareCard } from '../../src/share/renderer';
import { useTheme } from '../../src/theme/ThemeContext';
import { FONTS } from '../../src/theme/tokens';
import { SHARE_LINES, pick } from '../../src/theme/copy';
import { IconSticker } from '../../src/components/ui/IconSticker';
import { Mascot } from '../../src/components/ui/Mascot';
import { SpeechBubble } from '../../src/components/ui/SpeechBubble';
import { ActionButton } from '../../src/components/ui/ActionButton';
import type { Entry } from '../../src/types';

export default function ShareCardScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cardRef = useRef<View>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [showDate, setShowDate] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareLine] = useState(() => pick(SHARE_LINES));

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const e = await getEntry(db, Number(id));
      setEntry(e);
    })();
  }, [id]);

  async function handleShare() {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png' });
    } catch {
      Alert.alert('Could not share', 'Please try again.');
    } finally {
      setSharing(false);
    }
  }

  if (!entry) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.sheet }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <IconSticker glyph="✕" onPress={() => router.back()} />
        </View>

        <View style={styles.mascotRow}>
          <Mascot size={64} />
          <SpeechBubble kicker="SHARE IT, THEN" style={styles.bubble}>{shareLine}</SpeechBubble>
        </View>

        <View style={styles.preview}>
          <ShareCard
            ref={cardRef}
            promptText={entry.prompt_text}
            responseText={entry.response_text}
            createdAt={entry.created_at}
            location={entry.location_label}
            showDate={showDate}
            showLocation={showLocation}
            entryMode={entry.entry_mode}
            category={entry.category}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Show date</Text>
          <Switch value={showDate} onValueChange={setShowDate} trackColor={{ true: colors.action }} />
        </View>
        {entry.location_label && (
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Show location</Text>
            <Switch value={showLocation} onValueChange={setShowLocation} trackColor={{ true: colors.action }} />
          </View>
        )}

        <ActionButton
          label={sharing ? 'PREPARING…' : 'SEND IT'}
          onPress={handleShare}
          disabled={sharing}
          style={styles.shareBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 18, paddingTop: 8, gap: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row' },
  mascotRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 11 },
  bubble: { flex: 1, marginBottom: 10 },
  preview: { alignItems: 'center', paddingVertical: 8 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 15 },
  shareBtn: { justifyContent: 'center', marginTop: 4 },
});
```

- [ ] **Step 2: Typecheck the screen**

Run: `npx tsc --noEmit`
Expected: no errors from `app/share/[id].tsx` (note: `src/share/templates.ts` and the old cards still exist and still typecheck at this point — they are deleted in Task 5).

- [ ] **Step 3: Commit**

```bash
git add app/share/[id].tsx
git commit -m "feat: simplify share screen — one card, no pickers, no photo"
```

---

## Task 5: Remove old card code and artifacts

**Files:**
- Delete: `src/share/passport-card.tsx`, `src/share/photo-card.tsx`, `src/share/signal-card.tsx`, `src/share/templates.ts`
- Delete: `__tests__/share/passport-card.test.tsx`, `__tests__/share/photo-card.test.tsx`, `__tests__/share/signal-card.test.tsx`, `__tests__/share/templates.test.ts`

**Interfaces:**
- Consumes: nothing. This task only removes now-unreferenced files.
- Produces: nothing.

- [ ] **Step 1: Delete the old source and test files**

```bash
git rm src/share/passport-card.tsx src/share/photo-card.tsx src/share/signal-card.tsx src/share/templates.ts
git rm __tests__/share/passport-card.test.tsx __tests__/share/photo-card.test.tsx __tests__/share/signal-card.test.tsx __tests__/share/templates.test.ts
```

- [ ] **Step 2: Verify no dangling references remain**

Run:
```bash
grep -rnE "passport-card|photo-card|signal-card|share/templates|PassportCard|PhotoCard|SignalCard|CARD_STYLES|PassportTokens|PhotoTokens|SignalTokens|DEFAULT_STYLE_ID|DEFAULT_VARIANT_ID|dotGradient" src app __tests__
```
Expected: **no output** (exit status 1). If anything prints, remove that reference before continuing.

- [ ] **Step 3: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: no errors. (Confirms nothing imported the deleted files.)

- [ ] **Step 4: Run the full test suite**

Run: `npm test -- --runInBand`
Expected: PASS — all suites green, and the four deleted card test suites no longer run.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old passport/photo/signal share cards and tests"
```

---

## Self-Review

**Spec coverage:**
- One "Setup & Punchline" card replacing 9 → Task 3. ✓
- Setup band (prompt) / freeform kicker / null-category fallback → Task 2 (`resolveBand`/`resolveBandColor`) + Task 3 render. ✓
- Bricolage punchline, dashed ticket footer, mascot + wordmark + tagline hook → Task 3 styles. ✓
- Automatic color from category hue + active theme, yellow reserved → Task 2 + Task 3 (`colors.bg`/`cardBorder`, band = hue, never `action`). ✓
- Footer meta (date / location combinations) → Task 2 (`footerMeta`) + tests. ✓
- Share screen: remove STYLE/COLOUR pickers + photo logic, keep toggles + capture/share flow → Task 4. ✓
- Copy additions (`FREEFORM_KICKERS`, `SHARE_TAGLINES`) → Task 1. ✓
- Clean removal of passport/photo/signal/templates + their tests, no artifacts → Task 5 (with grep + tsc + full-suite verification). ✓
- No DB/CSV/schema changes; `getMediaForEntry` kept for `app/entry/[id].tsx` → Global Constraints + Task 4 (only removes its use in the share screen). ✓
- Game entries work unchanged (response_text plain-text) → no special handling needed; category hue = RANK+DEFEND green via `categoryStyles.game`. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases" placeholders; every code step shows complete code. ✓

**Type consistency:** `ShareCardProps` (Task 3) matches the props passed in Task 4. `resolveBand`/`resolveBandColor`/`footerMeta` signatures (Task 2) match their calls in Task 3. `FREEFORM_KICKERS`/`SHARE_TAGLINES` (Task 1) consumed in Task 3. `CategoryStyle` shape `{ label, kind, color }` matches `src/theme/tokens.ts`. ✓

**Note on spec refinement:** the spec's "neutral ink band" for null-category rows is implemented as the REFLECT hue (`resolveBandColor(null) → categoryStyles.reflective.color`) to keep the white band text legible in dark mode, where the resolved ink palette value flips to a light color. Documented inline in `card-content.ts`.

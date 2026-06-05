# Share Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4 existing flat share-card templates with 9 purpose-designed cards across 3 style families (Passport, Photo Memory, Signal Fragment) and update the share screen with a 2-level style/colour picker.

**Architecture:** Three new focused card components (`PassportCard`, `PhotoCard`, `SignalCard`) each in their own file, plus a lean `ShareCard` router in `renderer.tsx` that resolves the active style/variant and delegates to the right component. Colour tokens are defined per style family with typed interfaces in `templates.ts`. The share screen (`app/share/[id].tsx`) drops the old horizontal chip row in favour of a style-tabs row + colour-dots row.

**Tech Stack:** React Native, TypeScript, Expo (iOS), @testing-library/react-native ^12, jest-expo

---

## File Structure

**New files:**
- `src/share/passport-card.tsx` — PassportCard component + styles
- `src/share/photo-card.tsx` — PhotoCard component + styles
- `src/share/signal-card.tsx` — SignalCard component + styles
- `__tests__/share/templates.test.ts` — data integrity tests for CARD_STYLES
- `__tests__/share/passport-card.test.tsx` — PassportCard render + conditional tests
- `__tests__/share/photo-card.test.tsx` — PhotoCard render + conditional tests
- `__tests__/share/signal-card.test.tsx` — SignalCard render + conditional tests

**Rewritten files:**
- `src/share/templates.ts` — typed token interfaces + CARD_STYLES data (replaces ShareTemplate[])
- `src/share/renderer.tsx` — ShareCard router only (~40 lines; delegates to card files above)

**Modified files:**
- `app/share/[id].tsx` — state (`styleId` + `variantId`), picker UI (style tabs + colour dots), `ShareCard` props

**Unchanged:**
- Entry/photo loading and `captureRef` share flow in `app/share/[id].tsx`
- All `src/db/` files
- `src/export/` files

---

## Task 1: Rewrite `src/share/templates.ts`

**Files:**
- Rewrite: `src/share/templates.ts`
- Create: `__tests__/share/templates.test.ts`

- [ ] **Step 1.1: Write the failing tests**

```ts
// __tests__/share/templates.test.ts
import { CARD_STYLES, DEFAULT_STYLE_ID, DEFAULT_VARIANT_ID } from '../../src/share/templates';
import type { PassportTokens, PhotoTokens, SignalTokens } from '../../src/share/templates';

describe('CARD_STYLES', () => {
  it('has exactly 3 style families', () => {
    expect(CARD_STYLES).toHaveLength(3);
  });

  it('each style has exactly 3 variants', () => {
    for (const style of CARD_STYLES) {
      expect(style.variants).toHaveLength(3);
    }
  });

  it('default style and variant exist in CARD_STYLES', () => {
    const style = CARD_STYLES.find(s => s.id === DEFAULT_STYLE_ID);
    expect(style).toBeDefined();
    expect(style!.variants.find(v => v.id === DEFAULT_VARIANT_ID)).toBeDefined();
  });

  it('passport variants have all required token keys', () => {
    const passport = CARD_STYLES.find(s => s.id === 'passport')!;
    const required: (keyof PassportTokens)[] = [
      'bg', 'border', 'topbar', 'brand', 'stampDate', 'stampRing', 'stampLabel',
      'divider', 'text', 'meta', 'mrzBg', 'mrzText', 'mrzBorder',
    ];
    for (const v of passport.variants) {
      for (const key of required) {
        expect(v.tokens).toHaveProperty(key);
      }
    }
  });

  it('photo variants have all required token keys', () => {
    const photo = CARD_STYLES.find(s => s.id === 'photo')!;
    const required: (keyof PhotoTokens)[] = ['bg', 'photoPlaceholder', 'text', 'muted'];
    for (const v of photo.variants) {
      for (const key of required) {
        expect(v.tokens).toHaveProperty(key);
      }
    }
  });

  it('signal variants have all required token keys', () => {
    const signal = CARD_STYLES.find(s => s.id === 'signal')!;
    const required: (keyof SignalTokens)[] = [
      'bg', 'border', 'accent', 'quoteColor', 'text', 'divider', 'dateMuted',
    ];
    for (const v of signal.variants) {
      for (const key of required) {
        expect(v.tokens).toHaveProperty(key);
      }
    }
  });

  it('every variant has a dotGradient tuple of two strings', () => {
    for (const style of CARD_STYLES) {
      for (const v of style.variants) {
        expect(v.dotGradient).toHaveLength(2);
        expect(typeof v.dotGradient[0]).toBe('string');
        expect(typeof v.dotGradient[1]).toBe('string');
      }
    }
  });
});
```

- [ ] **Step 1.2: Run tests to confirm they fail**

```
npx jest __tests__/share/templates.test.ts --no-coverage
```
Expected: FAIL — "Cannot find module '../../src/share/templates'" (or TypeScript import errors)

- [ ] **Step 1.3: Rewrite `src/share/templates.ts`**

```ts
// Token interfaces — one per style family for type safety
export interface PassportTokens {
  bg: string; border: string; topbar: string;
  brand: string; stampDate: string; stampRing: string; stampLabel: string;
  divider: string; text: string; meta: string;
  mrzBg: string; mrzText: string; mrzBorder: string;
}
export interface PhotoTokens {
  bg: string; photoPlaceholder: string; text: string; muted: string;
}
export interface SignalTokens {
  bg: string; border: string; accent: string; quoteColor: string;
  text: string; divider: string; dateMuted: string;
}

// Discriminated variant types — TypeScript narrows tokens correctly in renderer
export interface PassportVariant { id: string; label: string; tokens: PassportTokens; dotGradient: [string, string]; }
export interface PhotoVariant    { id: string; label: string; tokens: PhotoTokens;    dotGradient: [string, string]; }
export interface SignalVariant   { id: string; label: string; tokens: SignalTokens;   dotGradient: [string, string]; }

export interface PassportStyle { id: 'passport'; label: string; variants: PassportVariant[]; }
export interface PhotoStyle    { id: 'photo';    label: string; variants: PhotoVariant[];    }
export interface SignalStyle   { id: 'signal';   label: string; variants: SignalVariant[];   }
export type CardStyle = PassportStyle | PhotoStyle | SignalStyle;

export const CARD_STYLES: CardStyle[] = [
  {
    id: 'passport', label: 'Passport',
    variants: [
      {
        id: 'gold', label: 'Gold', dotGradient: ['#c9a96e', '#1b1f2e'],
        tokens: {
          bg: '#1b1f2e', border: '#2a3050', topbar: '#c9a96e',
          brand: '#c9a96e', stampDate: '#c9a96e',
          stampRing: 'rgba(201,169,110,0.3)', stampLabel: 'rgba(201,169,110,0.5)',
          divider: '#252b42', text: '#d8d8e8', meta: '#6070a0',
          mrzBg: '#12151f', mrzText: '#2a3050', mrzBorder: '#1e2238',
        },
      },
      {
        id: 'copper', label: 'Copper', dotGradient: ['#c08040', '#160f08'],
        tokens: {
          bg: '#160f08', border: '#2a1e10', topbar: '#b07030',
          brand: '#c08040', stampDate: '#c08040',
          stampRing: 'rgba(192,128,64,0.3)', stampLabel: 'rgba(192,128,64,0.5)',
          divider: '#221810', text: '#e8ddd0', meta: '#5a4020',
          mrzBg: '#0e0a04', mrzText: '#221810', mrzBorder: '#181008',
        },
      },
      {
        id: 'navy', label: 'Navy', dotGradient: ['#4a80d0', '#080e1c'],
        tokens: {
          bg: '#080e1c', border: '#101a30', topbar: '#2a60c0',
          brand: '#4a80d0', stampDate: '#4a80d0',
          stampRing: 'rgba(74,128,208,0.3)', stampLabel: 'rgba(74,128,208,0.5)',
          divider: '#101828', text: '#d0d8f0', meta: '#2a4070',
          mrzBg: '#040810', mrzText: '#101828', mrzBorder: '#0a1020',
        },
      },
    ],
  },
  {
    id: 'photo', label: 'Photo',
    variants: [
      {
        id: 'warm', label: 'Warm', dotGradient: ['#8a7060', '#f5f0e8'],
        tokens: { bg: '#f5f0e8', photoPlaceholder: '#d9c9b0', text: '#2a2018', muted: '#8a7060' },
      },
      {
        id: 'bw', label: 'B&W', dotGradient: ['#707070', '#f2f2f2'],
        tokens: { bg: '#f2f2f2', photoPlaceholder: '#c0c0c0', text: '#1a1a1a', muted: '#707070' },
      },
      {
        id: 'cool', label: 'Cool', dotGradient: ['#507090', '#eaf4f8'],
        tokens: { bg: '#eaf4f8', photoPlaceholder: '#b0d4e8', text: '#162030', muted: '#507090' },
      },
    ],
  },
  {
    id: 'signal', label: 'Signal',
    variants: [
      {
        id: 'purple', label: 'Purple', dotGradient: ['#7c3aed', '#0d0d0d'],
        tokens: { bg: '#0d0d0d', border: '#1a0a2a', accent: '#7c3aed', quoteColor: '#200840', text: '#e8e8f0', divider: '#1c1c24', dateMuted: '#3a3a4a' },
      },
      {
        id: 'ember', label: 'Ember', dotGradient: ['#d97706', '#0d0d0d'],
        tokens: { bg: '#0d0d0d', border: '#1e1000', accent: '#d97706', quoteColor: '#1e1000', text: '#f0ece4', divider: '#1c1810', dateMuted: '#3a3020' },
      },
      {
        id: 'teal', label: 'Teal', dotGradient: ['#0d9488', '#0d0d0d'],
        tokens: { bg: '#0d0d0d', border: '#001a18', accent: '#0d9488', quoteColor: '#001a18', text: '#e4f0ee', divider: '#101c1a', dateMuted: '#203830' },
      },
    ],
  },
];

export const DEFAULT_STYLE_ID = 'passport';
export const DEFAULT_VARIANT_ID = 'gold';
```

- [ ] **Step 1.4: Run tests**

```
npx jest __tests__/share/templates.test.ts --no-coverage
```
Expected: PASS (7 tests)

- [ ] **Step 1.5: Commit**

```
git add src/share/templates.ts __tests__/share/templates.test.ts
git commit -m "feat: rewrite share templates with typed token interfaces and 9 variants"
```

---

## Task 2: PassportCard component

**Files:**
- Create: `src/share/passport-card.tsx`
- Create: `__tests__/share/passport-card.test.tsx`

- [ ] **Step 2.1: Write the failing tests**

```tsx
// __tests__/share/passport-card.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { PassportCard } from '../../src/share/passport-card';
import { CARD_STYLES } from '../../src/share/templates';
import type { PassportTokens } from '../../src/share/templates';

const tokens = CARD_STYLES.find(s => s.id === 'passport')!.variants[0].tokens as PassportTokens;

const base = {
  tokens,
  promptText: 'What did you notice today?',
  responseText: 'A red door.',
  createdAt: '2026-06-04T10:00:00.000Z',
  location: 'Melbourne, VIC',
  showDate: true,
  showLocation: true,
  entryMode: 'prompted' as const,
};

describe('PassportCard', () => {
  it('renders response text', () => {
    const { getByText } = render(<PassportCard {...base} />);
    expect(getByText('A red door.')).toBeTruthy();
  });

  it('shows prompt meta for prompted entries', () => {
    const { getByText } = render(<PassportCard {...base} />);
    expect(getByText('What did you notice today?')).toBeTruthy();
  });

  it('hides prompt meta for freeform entries', () => {
    const { queryByText } = render(
      <PassportCard {...base} entryMode="freeform" promptText="" />
    );
    expect(queryByText('PROMPT')).toBeNull();
  });

  it('shows location meta when location present and showLocation=true', () => {
    const { getByText } = render(<PassportCard {...base} />);
    expect(getByText('Melbourne, VIC')).toBeTruthy();
  });

  it('hides location meta when showLocation=false', () => {
    const { queryByText } = render(<PassportCard {...base} showLocation={false} />);
    expect(queryByText('Melbourne, VIC')).toBeNull();
  });

  it('hides location meta when location is null', () => {
    const { queryByText } = render(<PassportCard {...base} location={null} />);
    expect(queryByText('LOCATION')).toBeNull();
  });

  it('shows stamp date when showDate=true', () => {
    const { getByText } = render(<PassportCard {...base} />);
    expect(getByText('JUN 4')).toBeTruthy();
  });

  it('hides stamp date when showDate=false', () => {
    const { queryByText } = render(<PassportCard {...base} showDate={false} />);
    expect(queryByText('JUN 4')).toBeNull();
  });
});
```

- [ ] **Step 2.2: Run tests to confirm they fail**

```
npx jest __tests__/share/passport-card.test.tsx --no-coverage
```
Expected: FAIL — "Cannot find module '../../src/share/passport-card'"

- [ ] **Step 2.3: Create `src/share/passport-card.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PassportTokens } from './templates';

export interface PassportCardProps {
  tokens: PassportTokens;
  promptText: string;
  responseText: string;
  createdAt: string | null;
  location: string | null;
  showDate: boolean;
  showLocation: boolean;
  entryMode: 'prompted' | 'freeform';
}

function stampParts(createdAt: string | null, showDate: boolean) {
  if (!showDate || !createdAt) return { monthDay: '---', year: '----' };
  const d = new Date(createdAt);
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return { monthDay: `${month} ${d.getDate()}`, year: String(d.getFullYear()) };
}

function mrzDateStr(createdAt: string | null, showDate: boolean): string {
  if (!showDate || !createdAt) return '<<<<<<<<';
  return createdAt.slice(0, 10).replace(/-/g, '');
}

export const PassportCard = React.forwardRef<View, PassportCardProps>(
  ({ tokens: t, promptText, responseText, createdAt, location, showDate, showLocation, entryMode }, ref) => {
    const stamp = stampParts(createdAt, showDate);
    const showLoc = showLocation && !!location;
    const showPrompt = entryMode === 'prompted' && !!promptText;

    return (
      <View ref={ref} style={[styles.card, { backgroundColor: t.bg, borderColor: t.border }]}>
        <View style={[styles.topbar, { backgroundColor: t.topbar }]} />
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={[styles.brand, { color: t.brand }]}>BOREDNOTES</Text>
            <View style={[styles.stamp, { borderColor: t.stampRing }]}>
              <Text style={[styles.stampSmall, { color: t.stampLabel }]}>entry</Text>
              <Text style={[styles.stampDate, { color: showDate ? t.stampDate : t.stampLabel }]}>
                {stamp.monthDay}
              </Text>
              <Text style={[styles.stampSmall, { color: t.stampLabel }]}>{stamp.year}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: t.divider }]} />
          <Text style={[styles.response, { color: t.text }]}>{responseText}</Text>
          {(showLoc || showPrompt) && (
            <View style={styles.metaRow}>
              {showLoc && (
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: t.meta }]}>LOCATION</Text>
                  <Text style={[styles.metaValue, { color: t.meta }]}>{location}</Text>
                </View>
              )}
              {showPrompt && (
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: t.meta }]}>PROMPT</Text>
                  <Text style={[styles.metaValue, { color: t.meta }]}>{promptText}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View style={[styles.mrz, { backgroundColor: t.mrzBg, borderTopColor: t.mrzBorder }]}>
          <Text style={[styles.mrzText, { color: t.mrzText }]}>
            {'P<BNBOREDNOTES<<<<<<<<<<<<<<<<<<<<<<<<'}
          </Text>
          <Text style={[styles.mrzText, { color: t.mrzText }]}>
            {`${mrzDateStr(createdAt, showDate)}<<<ENTRY<<<<<<<<<<<<<<<<<<<<<<`}
          </Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: { width: 320, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  topbar: { height: 3 },
  inner: { paddingTop: 20, paddingHorizontal: 22, paddingBottom: 16, gap: 11 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontSize: 9, letterSpacing: 2.2 },
  stamp: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', gap: 1,
  },
  stampSmall: { fontSize: 6, letterSpacing: 1.2 },
  stampDate: { fontSize: 8, fontWeight: '700' },
  divider: { height: 1 },
  response: { fontSize: 13.5, fontStyle: 'italic', lineHeight: 22, fontFamily: 'Georgia' },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 7.5, letterSpacing: 1, fontWeight: '700', marginBottom: 1 },
  metaValue: { fontSize: 10 },
  mrz: { paddingVertical: 9, paddingHorizontal: 12, borderTopWidth: 1 },
  mrzText: { fontFamily: 'Courier New', fontSize: 7, letterSpacing: 0.4, lineHeight: 12 },
});
```

- [ ] **Step 2.4: Run tests**

```
npx jest __tests__/share/passport-card.test.tsx --no-coverage
```
Expected: PASS (8 tests)

- [ ] **Step 2.5: Commit**

```
git add src/share/passport-card.tsx __tests__/share/passport-card.test.tsx
git commit -m "feat: add PassportCard with stamp, MRZ, and conditional meta layout"
```

---

## Task 3: PhotoCard component

**Files:**
- Create: `src/share/photo-card.tsx`
- Create: `__tests__/share/photo-card.test.tsx`

- [ ] **Step 3.1: Write the failing tests**

```tsx
// __tests__/share/photo-card.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { PhotoCard } from '../../src/share/photo-card';
import { CARD_STYLES } from '../../src/share/templates';
import type { PhotoTokens } from '../../src/share/templates';

const tokens = CARD_STYLES.find(s => s.id === 'photo')!.variants[0].tokens as PhotoTokens;

const base = {
  tokens,
  promptText: 'What did you notice today?',
  responseText: 'A red door.',
  createdAt: '2026-06-04T10:00:00.000Z',
  location: 'Melbourne, VIC',
  photoUri: null as string | null,
  showDate: true,
  showLocation: true,
  entryMode: 'prompted' as const,
};

describe('PhotoCard', () => {
  it('renders response text', () => {
    const { getByText } = render(<PhotoCard {...base} />);
    expect(getByText('A red door.')).toBeTruthy();
  });

  it('shows prompt for prompted entries', () => {
    const { getByText } = render(<PhotoCard {...base} />);
    expect(getByText('"What did you notice today?"')).toBeTruthy();
  });

  it('hides prompt for freeform entries', () => {
    const { queryByText } = render(
      <PhotoCard {...base} entryMode="freeform" promptText="" />
    );
    expect(queryByText(/"What did you notice today\?"/)).toBeNull();
  });

  it('shows caption with location · date when both enabled', () => {
    const { getByText } = render(<PhotoCard {...base} />);
    expect(getByText('Melbourne, VIC · Jun 4, 2026')).toBeTruthy();
  });

  it('shows date only when showLocation=false', () => {
    const { getByText } = render(<PhotoCard {...base} showLocation={false} />);
    expect(getByText('Jun 4, 2026')).toBeTruthy();
  });

  it('shows location only when showDate=false', () => {
    const { getByText } = render(<PhotoCard {...base} showDate={false} />);
    expect(getByText('Melbourne, VIC')).toBeTruthy();
  });

  it('renders photo Image when photoUri is provided', () => {
    const { getByTestId } = render(<PhotoCard {...base} photoUri="file:///photo.jpg" />);
    expect(getByTestId('photo-image')).toBeTruthy();
  });

  it('renders placeholder View when photoUri is null', () => {
    const { getByTestId } = render(<PhotoCard {...base} photoUri={null} />);
    expect(getByTestId('photo-placeholder')).toBeTruthy();
  });
});
```

- [ ] **Step 3.2: Run tests to confirm they fail**

```
npx jest __tests__/share/photo-card.test.tsx --no-coverage
```
Expected: FAIL — "Cannot find module '../../src/share/photo-card'"

- [ ] **Step 3.3: Create `src/share/photo-card.tsx`**

```tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { PhotoTokens } from './templates';

export interface PhotoCardProps {
  tokens: PhotoTokens;
  promptText: string;
  responseText: string;
  createdAt: string | null;
  location: string | null;
  photoUri: string | null;
  showDate: boolean;
  showLocation: boolean;
  entryMode: 'prompted' | 'freeform';
}

function formatDate(createdAt: string | null): string | null {
  if (!createdAt) return null;
  return new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export const PhotoCard = React.forwardRef<View, PhotoCardProps>(
  ({ tokens: t, promptText, responseText, createdAt, location, photoUri, showDate, showLocation, entryMode }, ref) => {
    const showLoc = showLocation && !!location;
    const dateStr = showDate ? formatDate(createdAt) : null;
    const captionParts = ([showLoc && location, dateStr]).filter(Boolean) as string[];
    const caption = captionParts.join(' · ');
    const showPrompt = entryMode === 'prompted' && !!promptText;

    return (
      <View ref={ref} style={[styles.card, { backgroundColor: t.bg }]}>
        {photoUri ? (
          <Image
            testID="photo-image"
            source={{ uri: photoUri }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View
            testID="photo-placeholder"
            style={[styles.photo, { backgroundColor: t.photoPlaceholder }]}
          />
        )}
        <View style={styles.body}>
          {showPrompt && (
            <Text style={[styles.prompt, { color: t.muted }]}>{`"${promptText}"`}</Text>
          )}
          <Text style={[styles.response, { color: t.text }]}>{responseText}</Text>
        </View>
        <View style={styles.footer}>
          {!!caption && (
            <Text style={[styles.caption, { color: t.muted }]}>{caption}</Text>
          )}
          <Text style={[styles.watermark, { color: t.muted }]}>borednotes</Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: 320, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 10, elevation: 8,
  },
  photo: { width: '100%', height: 150 },
  body: { paddingTop: 14, paddingHorizontal: 18, paddingBottom: 4, gap: 7 },
  prompt: { fontSize: 10.5, fontStyle: 'italic', fontFamily: 'Georgia' },
  response: { fontSize: 13, lineHeight: 21.5, fontFamily: 'Georgia' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14,
  },
  caption: { fontSize: 11.5, fontStyle: 'italic', fontFamily: 'Georgia', flex: 1 },
  watermark: { fontSize: 8, letterSpacing: 1.8 },
});
```

- [ ] **Step 3.4: Run tests**

```
npx jest __tests__/share/photo-card.test.tsx --no-coverage
```
Expected: PASS (8 tests)

- [ ] **Step 3.5: Commit**

```
git add src/share/photo-card.tsx __tests__/share/photo-card.test.tsx
git commit -m "feat: add PhotoCard with polaroid layout and conditional prompt/caption"
```

---

## Task 4: SignalCard component

**Files:**
- Create: `src/share/signal-card.tsx`
- Create: `__tests__/share/signal-card.test.tsx`

- [ ] **Step 4.1: Write the failing tests**

```tsx
// __tests__/share/signal-card.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { SignalCard } from '../../src/share/signal-card';
import { CARD_STYLES } from '../../src/share/templates';
import type { SignalTokens } from '../../src/share/templates';

const tokens = CARD_STYLES.find(s => s.id === 'signal')!.variants[0].tokens as SignalTokens;

const base = {
  tokens,
  responseText: 'A red door.',
  createdAt: '2026-06-04T10:00:00.000Z',
  location: 'Melbourne, VIC',
  showDate: true,
  showLocation: true,
  entryMode: 'prompted' as const,
};

describe('SignalCard', () => {
  it('renders response text', () => {
    const { getByText } = render(<SignalCard {...base} />);
    expect(getByText('A red door.')).toBeTruthy();
  });

  it('shows location line when provided and showLocation=true', () => {
    const { getByText } = render(<SignalCard {...base} />);
    expect(getByText('📍 Melbourne, VIC')).toBeTruthy();
  });

  it('hides location line when showLocation=false', () => {
    const { queryByText } = render(<SignalCard {...base} showLocation={false} />);
    expect(queryByText('📍 Melbourne, VIC')).toBeNull();
  });

  it('hides location line when location is null', () => {
    const { queryByText } = render(<SignalCard {...base} location={null} />);
    expect(queryByText(/📍/)).toBeNull();
  });

  it('shows ISO date in date line when showDate=true', () => {
    const { getByText } = render(<SignalCard {...base} />);
    expect(getByText(/2026-06-04/)).toBeTruthy();
  });

  it('omits ISO date when showDate=false', () => {
    const { queryByText } = render(<SignalCard {...base} showDate={false} />);
    expect(queryByText(/2026-06-04/)).toBeNull();
  });

  it('shows "· prompted" suffix for prompted entries', () => {
    const { getByText } = render(<SignalCard {...base} />);
    expect(getByText(/· prompted/)).toBeTruthy();
  });

  it('shows "· freeform" suffix for freeform entries', () => {
    const { getByText } = render(<SignalCard {...base} entryMode="freeform" />);
    expect(getByText(/· freeform/)).toBeTruthy();
  });
});
```

- [ ] **Step 4.2: Run tests to confirm they fail**

```
npx jest __tests__/share/signal-card.test.tsx --no-coverage
```
Expected: FAIL — "Cannot find module '../../src/share/signal-card'"

- [ ] **Step 4.3: Create `src/share/signal-card.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SignalTokens } from './templates';

export interface SignalCardProps {
  tokens: SignalTokens;
  responseText: string;
  createdAt: string | null;
  location: string | null;
  showDate: boolean;
  showLocation: boolean;
  entryMode: 'prompted' | 'freeform';
}

export const SignalCard = React.forwardRef<View, SignalCardProps>(
  ({ tokens: t, responseText, createdAt, location, showDate, showLocation, entryMode }, ref) => {
    const showLoc = showLocation && !!location;
    const modeLabel = entryMode === 'freeform' ? 'freeform' : 'prompted';
    const isoDate = createdAt ? createdAt.slice(0, 10) : '';
    const dateLine = showDate && isoDate ? `${isoDate} · ${modeLabel}` : `· ${modeLabel}`;

    return (
      <View ref={ref} style={[styles.card, { backgroundColor: t.bg, borderColor: t.border }]}>
        <View style={[styles.accentBar, { backgroundColor: t.accent }]} />
        <View style={styles.inner}>
          <Text style={[styles.quote, { color: t.quoteColor }]}>{'"'}</Text>
          <Text style={[styles.response, { color: t.text }]}>{responseText}</Text>
          <View style={[styles.divider, { backgroundColor: t.divider }]} />
          <View style={styles.footer}>
            <View style={styles.meta}>
              {showLoc && (
                <Text style={[styles.loc, { color: t.accent }]}>{`📍 ${location}`}</Text>
              )}
              <Text style={[styles.dateText, { color: t.dateMuted }]}>{dateLine}</Text>
            </View>
            <Text style={[styles.brand, { color: t.text }]}>borednotes</Text>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: { width: 320, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  accentBar: { height: 3 },
  inner: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 20, gap: 9 },
  quote: { fontSize: 52, lineHeight: 34, fontFamily: 'Georgia' },
  response: { fontSize: 14, lineHeight: 22.7 },
  divider: { height: 1, marginVertical: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { gap: 3, flex: 1 },
  loc: { fontSize: 10, fontFamily: 'Courier New', letterSpacing: 0.4 },
  dateText: { fontSize: 10, fontFamily: 'Courier New', letterSpacing: 0.4 },
  brand: { fontSize: 8.5, letterSpacing: 2, opacity: 0.2 },
});
```

- [ ] **Step 4.4: Run tests**

```
npx jest __tests__/share/signal-card.test.tsx --no-coverage
```
Expected: PASS (8 tests)

- [ ] **Step 4.5: Commit**

```
git add src/share/signal-card.tsx __tests__/share/signal-card.test.tsx
git commit -m "feat: add SignalCard with accent bar, quote, and monospace footer"
```

---

## Task 5: Rewrite `src/share/renderer.tsx`

**Files:**
- Rewrite: `src/share/renderer.tsx`

The router has no logic beyond a dispatch — no new tests needed. Card logic is fully covered in Tasks 2–4.

- [ ] **Step 5.1: Confirm all share tests pass before touching renderer**

```
npx jest __tests__/share/ --no-coverage
```
Expected: All passing (31 tests: 7 + 8 + 8 + 8).

- [ ] **Step 5.2: Rewrite `src/share/renderer.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';
import { CARD_STYLES } from './templates';
import { PassportCard } from './passport-card';
import { PhotoCard } from './photo-card';
import { SignalCard } from './signal-card';

export interface ShareCardProps {
  styleId: string;
  variantId: string;
  promptText: string;
  responseText: string;
  createdAt: string | null;
  location: string | null;
  photoUri: string | null;
  showDate: boolean;
  showLocation: boolean;
  entryMode: 'prompted' | 'freeform';
}

export const ShareCard = React.forwardRef<View, ShareCardProps>(
  ({ styleId, variantId, promptText, responseText, createdAt, location, photoUri, showDate, showLocation, entryMode }, ref) => {
    const style = CARD_STYLES.find(s => s.id === styleId) ?? CARD_STYLES[0];

    if (style.id === 'passport') {
      const variant = style.variants.find(v => v.id === variantId) ?? style.variants[0];
      return (
        <PassportCard
          ref={ref} tokens={variant.tokens}
          promptText={promptText} responseText={responseText}
          createdAt={createdAt} location={location}
          showDate={showDate} showLocation={showLocation}
          entryMode={entryMode}
        />
      );
    }
    if (style.id === 'photo') {
      const variant = style.variants.find(v => v.id === variantId) ?? style.variants[0];
      return (
        <PhotoCard
          ref={ref} tokens={variant.tokens}
          promptText={promptText} responseText={responseText}
          createdAt={createdAt} location={location} photoUri={photoUri}
          showDate={showDate} showLocation={showLocation}
          entryMode={entryMode}
        />
      );
    }
    // signal
    const variant = style.variants.find(v => v.id === variantId) ?? style.variants[0];
    return (
      <SignalCard
        ref={ref} tokens={variant.tokens}
        responseText={responseText} createdAt={createdAt}
        location={location} showDate={showDate}
        showLocation={showLocation} entryMode={entryMode}
      />
    );
  }
);
```

- [ ] **Step 5.3: Run all share tests**

```
npx jest __tests__/share/ --no-coverage
```
Expected: All still passing.

- [ ] **Step 5.4: Commit**

```
git add src/share/renderer.tsx
git commit -m "feat: rewrite ShareCard as style router delegating to card components"
```

---

## Task 6: Update `app/share/[id].tsx`

**Files:**
- Modify: `app/share/[id].tsx`

- [ ] **Step 6.1: Run full test suite to confirm baseline**

```
npx jest --no-coverage
```
Expected: All passing.

- [ ] **Step 6.2: Update imports**

In `app/share/[id].tsx`, replace:

```tsx
import { ShareCard } from '../../src/share/renderer';
import { TEMPLATES, DEFAULT_TEMPLATE_ID } from '../../src/share/templates';
```

With:

```tsx
import { ShareCard } from '../../src/share/renderer';
import { CARD_STYLES, DEFAULT_STYLE_ID, DEFAULT_VARIANT_ID } from '../../src/share/templates';
```

- [ ] **Step 6.3: Replace state declarations**

Remove:
```tsx
const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
```

Add:
```tsx
const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID);
const [variantId, setVariantId] = useState(DEFAULT_VARIANT_ID);
```

- [ ] **Step 6.4: Remove derived variables that are no longer needed**

Delete these lines:
```tsx
const template = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0];
const dateStr = new Date(entry.created_at).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
});
```

Add this derived value (used to drive the colour dots row):
```tsx
const currentStyle = CARD_STYLES.find(s => s.id === styleId) ?? CARD_STYLES[0];
```

Place it just before the `return` statement, after the entry null-check.

- [ ] **Step 6.5: Update the `ShareCard` usage**

Replace:
```tsx
<ShareCard
  ref={cardRef}
  template={template}
  promptText={entry.prompt_text}
  responseText={entry.response_text}
  date={dateStr}
  location={entry.location_label}
  photoUri={photo?.file_path ?? null}
  showDate={showDate}
  showLocation={showLocation}
/>
```

With:
```tsx
<ShareCard
  ref={cardRef}
  styleId={styleId}
  variantId={variantId}
  promptText={entry.prompt_text}
  responseText={entry.response_text}
  createdAt={entry.created_at}
  location={entry.location_label}
  photoUri={photo?.file_path ?? null}
  showDate={showDate}
  showLocation={showLocation}
  entryMode={entry.entry_mode}
/>
```

- [ ] **Step 6.6: Replace the template picker with the 2-level picker**

Delete this block entirely:
```tsx
<Text style={[styles.label, { color: colors.textMuted }]}>Template</Text>
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
  {TEMPLATES.map(t => (
    <TouchableOpacity
      key={t.id}
      style={[styles.templateChip, { backgroundColor: templateId === t.id ? accent.buttonColor : colors.surface }]}
      onPress={() => setTemplateId(t.id)}
    >
      <View style={[styles.templateSwatch, { backgroundColor: t.bg, borderColor: colors.border }]} />
      <Text style={[styles.templateLabel, { color: colors.textSecondary }]}>{t.label}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

Replace with:
```tsx
{/* Style tabs */}
<Text style={[styles.pickerLabel, { color: colors.textMuted }]}>Style</Text>
<View style={styles.tabRow}>
  {CARD_STYLES.map(s => {
    const active = s.id === styleId;
    return (
      <TouchableOpacity
        key={s.id}
        style={[
          styles.tab,
          active && { backgroundColor: accent.buttonColor + '22', borderColor: accent.buttonColor + '66' },
        ]}
        onPress={() => { setStyleId(s.id); setVariantId(s.variants[0].id); }}
      >
        <Text style={[styles.tabLabel, { color: active ? accent.buttonColor : colors.textMuted }]}>
          {s.label}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>

{/* Colour dots */}
<Text style={[styles.pickerLabel, { color: colors.textMuted }]}>Colour</Text>
<View style={styles.dotsRow}>
  {currentStyle.variants.map(v => {
    const active = v.id === variantId;
    return (
      <TouchableOpacity key={v.id} onPress={() => setVariantId(v.id)} style={styles.dotWrap}>
        <View style={[
          styles.dot,
          { backgroundColor: v.dotGradient[0] },
          active && { borderColor: accent.buttonColor, borderWidth: 2.5 },
        ]} />
        <Text style={[styles.dotLabel, { color: active ? accent.buttonColor : colors.textMuted }]}>
          {v.label}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>
```

- [ ] **Step 6.7: Update `StyleSheet.create`**

Remove these keys:
```ts
label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
templateScroll: { flexGrow: 0 },
templateChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginRight: 10 },
templateSwatch: { width: 16, height: 16, borderRadius: 4, borderWidth: 1 },
templateLabel: { fontSize: 13 },
```

Add these keys:
```ts
pickerLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
tabRow: { flexDirection: 'row', gap: 8 },
tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
tabLabel: { fontSize: 13, fontWeight: '500' },
dotsRow: { flexDirection: 'row', gap: 10 },
dotWrap: { alignItems: 'center', gap: 6, flex: 1 },
dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: 'transparent' },
dotLabel: { fontSize: 10 },
```

- [ ] **Step 6.8: Remove unused `ScrollView` import if no longer needed**

Check the imports at the top of `app/share/[id].tsx`. The `ScrollView` wrapping the outer content is still used. Only remove it if the outer `ScrollView` was also removed (it wasn't — the page-level scroll stays).

- [ ] **Step 6.9: Run full test suite**

```
npx jest --no-coverage
```
Expected: All passing.

- [ ] **Step 6.10: Commit**

```
git add app/share/[id].tsx
git commit -m "feat: update share screen with 2-level style/colour picker"
```

---

## Task 7: Final verification

- [ ] **Step 7.1: Run full test suite and confirm count**

```
npx jest --no-coverage
```
Expected: All passing. New count = previous count + 31 (7 templates + 8 passport + 8 photo + 8 signal).

- [ ] **Step 7.2: TypeScript check**

```
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 7.3: Push branch**

```
git push
```

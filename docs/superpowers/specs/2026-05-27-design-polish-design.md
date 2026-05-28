# BoredNotes — Design Polish Spec
**Date:** 2026-05-27
**Status:** Approved

---

## Overview

A visual polish pass across all screens of BoredNotes, plus a new Settings screen. The goals are:

- Elevate the aesthetic to feel **inviting, contemporary, and easygoing**
- Introduce a **theme system** (accent colour + dark mode) that is trivially extensible — adding a new theme is one object added to one array
- Replace emoji navigation icons with **Feather outline icons** (`@expo/vector-icons`) for a more polished, consistent look
- Apply **Georgia serif italic** to all prompt and response text for a literary, journal feel

No screen structure changes. No new navigation patterns. No new dependencies beyond what is already in the project.

---

## Scope

**Approach C:** Visual pass + theming system + icon overhaul.

**In scope:**
- Token system (`src/theme/tokens.ts`)
- ThemeContext + `useTheme` hook (`src/theme/ThemeContext.tsx`)
- Visual updates to all 7 existing screens
- New Settings screen (`app/settings.tsx`)
- Feather icons replacing emoji in Home tiles and the settings button

**Out of scope:**
- Back button / navigation header changes
- Animation or haptics
- Any data model changes

---

## Token System

**File:** `src/theme/tokens.ts`

Defines two palette objects (`light`, `dark`) and an `ACCENTS` array. All values are plain strings — no runtime logic.

### Light / Dark Palettes

| Token | Light | Dark |
|-------|-------|------|
| `bg` | `#fafaf9` | `#141412` |
| `surface` | `#ffffff` | `#1f1f1c` |
| `border` | `#e8e5e0` | `#2e2e2a` |
| `textPrimary` | `#1a1a1a` | `#e8e5e0` |
| `textSecondary` | `#888888` | `#888888` |
| `textMuted` | `#bbbbbb` | `#555555` |
| `shadowColor` | `#000000` | `#000000` |
| `shadowOpacity` | `0.07` | `0` (use border instead in dark) |

### Accent Swatches

The `ACCENTS` array is the single source of truth for all available themes. Adding a new theme = adding one object here.

```ts
export interface AccentSwatch {
  id: string;       // stored in settings DB
  label: string;    // display name in Settings
  labelColor: string;  // used for labels, icons, accent text
  buttonColor: string; // used for filled buttons, active tabs, dots
}

export const ACCENTS: AccentSwatch[] = [
  { id: 'sage',        label: 'Sage',       labelColor: '#6a8f72', buttonColor: '#4a7a54' },
  { id: 'terracotta',  label: 'Terracotta', labelColor: '#b5735a', buttonColor: '#9e5e47' },
  { id: 'indigo',      label: 'Indigo',     labelColor: '#6b6bbd', buttonColor: '#5252a8' },
  { id: 'mono',        label: 'Classic',    labelColor: '#666666', buttonColor: '#1a1a1a' },
];

export const DEFAULT_ACCENT_ID = 'sage';
```

### Typography Rules

Applied globally across all screens (not via context — just a convention):

- **Prompt text** (displayed on Home, Respond, Entry Detail): `fontFamily: 'Georgia'`, `fontStyle: 'italic'`
- **Response text** (Entry Detail, Entries cards, Reflect cards, Respond text input): `fontFamily: 'Georgia'`, `fontStyle: 'italic'`
- All other text: system font (`-apple-system` / default), unchanged

---

## ThemeContext

**File:** `src/theme/ThemeContext.tsx`

A React context that resolves the current palette and accent swatch, and exposes setters that persist to the settings DB.

### Interface

```ts
interface ThemeContextValue {
  colors: typeof lightPalette;  // resolved light or dark tokens
  accent: AccentSwatch;         // resolved swatch object
  isDark: boolean;
  setAccent: (id: string) => void;   // persists to DB, re-renders immediately
  setDarkMode: (on: boolean) => void; // persists to DB, re-renders immediately
}
```

### Behaviour

- On mount: reads `theme_accent` and `theme_dark_mode` keys from the settings DB
- Falls back to `DEFAULT_ACCENT_ID` and system color scheme (`useColorScheme`) if not yet set
- `setAccent` and `setDarkMode` update state synchronously and write to DB asynchronously (fire-and-forget — the visual update does not wait for the DB write)
- `app/_layout.tsx` wraps `<Stack>` in `<ThemeProvider db={db}>` after DB init completes

---

## Screen Changes

All screens call `const { colors, accent } = useTheme()` and replace hardcoded colour values.

**Card elevation rule:** In light mode, cards use `colors.surface` background + a subtle drop shadow (`shadowColor`, `shadowOpacity: 0.07`, `shadowRadius: 4`, `elevation: 2`). In dark mode, shadow opacity is 0 so cards instead use a `1px` border in `colors.border` to remain distinguishable from `colors.bg`.

### Home Dashboard (`app/index.tsx`)

| Element | Before | After |
|---------|--------|-------|
| Background | `#fff` | `colors.bg` |
| App name colour | `#aaa` | `accent.labelColor` |
| App name — add settings button | — | Feather `settings` icon, 20px, `accent.labelColor`, top-right, navigates to `/settings` |
| Prompt card background | `#f8f8f8` | `colors.surface` + shadow |
| Prompt card label ("Today's prompt") | `#aaa` | `accent.labelColor` |
| Prompt text | system font | Georgia italic |
| Tile background | `#f4f4f4` | `colors.surface` + shadow |
| Tile icons | 📅 💭 ✨ emoji | Feather: `calendar`, `file-text`, `sun` — 22px, `colors.textSecondary` |
| Tile label colour | `#555` | `colors.textSecondary` |

### Respond Screen (`app/respond.tsx`)

| Element | Before | After |
|---------|--------|-------|
| Background | `#fff` | `colors.bg` |
| Prompt display text | system font | Georgia italic |
| Text input | system font | Georgia italic |
| Attachment buttons | `#f4f4f4` bg | `colors.surface` + border |
| Submit button | `#1a1a1a` | `accent.buttonColor` |
| Submit disabled | `#ccc` | `colors.border` |

### Entries Screen (`app/entries.tsx`)

| Element | Before | After |
|---------|--------|-------|
| Background | `#fff` | `colors.bg` |
| Search bar | `#f4f4f4` bg | `colors.surface` + border |
| Card background | `#f8f8f8` | `colors.surface` + shadow |
| Card response preview | system font | Georgia italic |
| Date header | `#aaa` | `colors.textMuted` |

### Entry Detail (`app/entry/[id].tsx`)

| Element | Before | After |
|---------|--------|-------|
| Background | `#fff` | `colors.bg` |
| Prompt text | system, `#888`, italic | Georgia italic, `colors.textSecondary` |
| Response text | system, `#1a1a1a` | Georgia italic, `colors.textPrimary` |
| Voice button | `#f4f4f4` bg | `colors.surface` + border |
| Share button | `#1a1a1a` | `accent.buttonColor` |

### Timeline Screen (`app/timeline.tsx`)

| Element | Before | After |
|---------|--------|-------|
| Background | `#fff` | `colors.bg` |
| Day dots (has entries) | `#7c6af7` | `accent.labelColor` |
| Selected day background | `#1a1a1a` | `accent.buttonColor` |
| Entry list cards | `#f8f8f8` | `colors.surface` + shadow |

### Reflect Screen (`app/reflect.tsx`)

| Element | Before | After |
|---------|--------|-------|
| Background | `#fff` | `colors.bg` |
| Year badge | `#7c6af7` | `accent.labelColor` |
| Card background | `#f8f8f8` | `colors.surface` + shadow |
| Card response preview | system font | Georgia italic |
| Active tab | `#1a1a1a` bg | `accent.buttonColor` bg |

### Share Card Screen (`app/share/[id].tsx`)

| Element | Before | After |
|---------|--------|-------|
| Background | `#fff` | `colors.bg` |
| Active template chip | `#1a1a1a` bg | `accent.buttonColor` bg |
| Share button | `#1a1a1a` | `accent.buttonColor` |

---

## New Settings Screen

**File:** `app/settings.tsx`

Accessible via the gear icon on Home (standard push navigation, not a modal).

### Layout

```
← Back    Settings

APPEARANCE
  Theme
  [● Sage] [● Terracotta] [● Indigo] [● Classic]   ← swatches from ACCENTS array

  Dark Mode                              [toggle]

ABOUT
  Version                                     1.0.0
```

### Theme Swatches

- Rendered by mapping over `ACCENTS` — no hardcoded list
- Each swatch: 28px circle, filled with `accent.buttonColor`
- Active swatch: checkmark overlay (Feather `check`, white, 14px)
- Tapping calls `setAccent(id)` — immediate visual update

### Dark Mode Toggle

- React Native `Switch`, value = `isDark`
- `onValueChange` calls `setDarkMode(bool)`
- Immediate visual update across the whole app

### About Section

- Static: app name + version string from `app.json`

---

## File Map (new / changed)

```
src/
└── theme/
    ├── tokens.ts          NEW — palette + ACCENTS array
    └── ThemeContext.tsx   NEW — provider + useTheme hook

app/
├── _layout.tsx            CHANGED — wrap Stack in ThemeProvider
├── index.tsx              CHANGED — useTheme, icons, settings button
├── respond.tsx            CHANGED — useTheme, serif input
├── entries.tsx            CHANGED — useTheme, serif cards
├── reflect.tsx            CHANGED — useTheme, serif cards, accent tabs
├── timeline.tsx           CHANGED — useTheme, accent dots
├── settings.tsx           NEW — theme swatches + dark mode toggle
├── entry/
│   └── [id].tsx           CHANGED — useTheme, serif text
└── share/
    └── [id].tsx           CHANGED — useTheme, accent button
```

---

## Extensibility

To add a new theme in the future: add one `AccentSwatch` object to the `ACCENTS` array in `tokens.ts`. The Settings screen, ThemeContext, and all screens automatically pick it up — no other changes needed.

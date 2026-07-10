# Settings Sprint — Wonky Toggle + Appearance Selector

**Date:** 2026-07-10
**Status:** Approved design

## Overview

Two independent additions to the Settings screen's APPEARANCE section:

1. A **wonky tilt toggle** that flattens the Home/Feed card stacks to straight when off.
2. A **three-way Light / Dark / System appearance selector** that replaces the current binary Dark Mode switch and defaults to following the iOS system appearance.

Both preferences persist in the existing key-value `settings` table and are driven through `ThemeContext`, matching how theme and dark-mode already work. No schema change, no DB migration, no new dependencies.

## A. Wonky tilt toggle

### Behavior
- The app's "wonky" character comes from a handful of intentional tilts. This toggle controls **only the Home and Feed card stacks**.
- The mascot speech bubble (constant −2°) and the Rank & Defend numerals (`OutlinedNumber`) are illustration, not chrome — they keep their tilt regardless of this setting.
- Default: **on** (current behavior). Off = card stacks sit up straight.

### Setting
- Key: `wonky_tilt`. Values: `'true'` / `'false'`. Absent = treated as `true`.

### Context (`ThemeContext`)
- Expose `wonky: boolean` and `setWonky(on: boolean)`.
- Load on mount from `getSetting(db, 'wonky_tilt')` (absent → `true`); persist on change via `setSetting`. Mirrors the existing `theme_dark_mode` handling.

### Gating (call sites)
- `app/index.tsx` (home card stack): `tilt={TILTS[i % TILTS.length]}` → `tilt={wonky ? TILTS[i % TILTS.length] : 0}`.
- `src/boredbefore/FeedTab.tsx` (feed card stack): `tilt={CARD_TILTS[i % CARD_TILTS.length]}` → `tilt={wonky ? CARD_TILTS[i % CARD_TILTS.length] : 0}`.
- `Sticker`, `SpeechBubble`, and `OutlinedNumber` are **not** modified.

### UI
- A `Switch` row under APPEARANCE, styled like the existing Offline/Auto-location rows.
- Label: "Wonky tilt". Subtitle (dry, on-brand): "Let the cards lean. Off = everything sits up straight."
- `value={wonky}`, `onValueChange={setWonky}`, `trackColor={{ true: colors.action }}`.

## B. Light / Dark / System selector

### Behavior
- Replaces the binary Dark Mode switch with a three-segment control: **Light · Dark · System**.
- `system` follows `useColorScheme()` **live** — if the user changes the iOS appearance while the app is open, the UI tracks it.
- Default: **`system`**.

### Setting
- New key: `appearance_mode`. Values: `'light' | 'dark' | 'system'`.
- The legacy `theme_dark_mode` key is no longer written. It is only read once, for migration (below).

### Derivation
- `isDark` is **computed each render**, not stored as state:
  - `system` → `systemScheme === 'dark'` (from `useColorScheme()`)
  - `light` → `false`
  - `dark` → `true`

### Migration
- On mount, resolve the initial mode:
  - If `appearance_mode` is set, use it.
  - Else if legacy `theme_dark_mode` is set: `'true' → 'dark'`, `'false' → 'light'` (preserve the old explicit choice).
  - Else `'system'`.
- No write-back required on migration; the mode is persisted the next time the user picks a segment.

### Context (`ThemeContext`)
- Replace `setDarkMode` with `setAppearance(mode: 'light' | 'dark' | 'system')`.
- Expose `appearanceMode` alongside the existing `isDark` (kept, now derived).
- `setDarkMode` is removed; the only consumer is the Settings screen, which moves to `setAppearance`.

### UI
- Replace the Dark Mode switch row with a labeled row containing a 3-segment sticker control on the right.
- Segments: `Light`, `Dark`, `System`. Active segment tinted `colors.action` with contrasting text; inactive segments use `colors.surface` / `colors.textPrimary`.
- Tapping a segment calls `setAppearance(mode)`.

## Testing

Extract the two pure decisions into `src/theme/appearance.ts` so they are unit-testable without rendering:

- `resolveIsDark(mode: AppearanceMode, systemScheme: 'light' | 'dark' | null): boolean`
- `resolveInitialMode(storedAppearance: string | null, legacyDark: string | null): AppearanceMode`

`__tests__/theme/appearance.test.ts` covers both truth tables:
- `resolveIsDark`: all three modes × system light/dark/null.
- `resolveInitialMode`: appearance set wins; legacy `true`/`false` maps to dark/light; nothing set → system; unknown stored values fall back to system.

The card-tilt gating, the wonky switch, and the segment control are thin wiring, verified on device (CI proves logic, not rendered UI).

## Non-goals / scope

- No schema or migration on the `settings` table (it is already key-value).
- No changes to theme selection, the six themes, or category hues.
- No new dependencies.
- No change to the speech bubble or rank numeral tilts.

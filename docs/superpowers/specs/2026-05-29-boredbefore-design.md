# BoredBefore — Design Spec
**Date:** 2026-05-29
**Status:** Approved
**Version bump:** 1.0.0 → 1.1.0

---

## Overview

BoredBefore is a new unified hub screen that consolidates all entry-browsing into one place — replacing the existing Timeline, Entries, and Reflect screens. It is accessed via a single tile on the Home Dashboard and contains three tabs: Feed, Calendar, and Map.

This release also adds Auto-GPS, an opt-in setting that automatically captures the user's location when they open the Respond screen, making the map progressively more useful over time.

---

## Navigation Changes

### Home Dashboard

The three existing tiles (Timeline, Entries, Reflect) are **removed**. They are replaced by a single full-width **BoredBefore tile** using the existing `styles.tile` card appearance.

| Element | Value |
|---|---|
| Title | "BoredBefore" |
| Subtitle | "look into your bored past" |
| On tap | `router.push('/boredbefore')` |

### Removed screens

The following files are **deleted entirely**:
- `app/timeline.tsx`
- `app/entries.tsx`
- `app/reflect.tsx`

All internal navigation links to these routes are removed.

---

## BoredBefore Screen (`app/boredbefore.tsx`)

A single screen at the `/boredbefore` route. Manages active tab state internally via `useState`. Three content panels render conditionally — no nested routes.

### Tab Bar

A pill-style segmented control rendered below the screen header. Uses `expo-blur` (`BlurView`) as a frosted backdrop. Three tabs: **Feed**, **Calendar**, **Map**.

- Active tab: white pill with subtle drop shadow, `accent.buttonColor` label text
- Inactive tabs: ghost text in `colors.textMuted`
- Selected pill animates between positions using `Animated.spring`
- Tab bar is fixed at the top of the content area, content scrolls below it

### Header

Standard back arrow (←) in `colors.textSecondary` on the top left, navigating back to Home via `router.back()`.

---

## Feed Tab

A reverse-chronological scrollable list of all entries, grouped by date header. Functionally identical to the removed Entries screen.

- Search bar at the top filters by `response_text`, `prompt_text`, and `location_label`
- Tapping an entry navigates to `/entry/[id]`
- Reuses `getAllEntries` and `searchEntries` from `src/db/entries.ts` — no data layer changes

---

## Calendar Tab

A month-grid calendar view. Functionally equivalent to the removed Timeline screen, with the addition of a year-jump control.

### Month grid
- Days with at least one entry show a dot in `accent.buttonColor`
- Swipe left/right to navigate months
- Tapping a day with entries opens an inline list of that day's entries below the grid
- Tapping an entry in the list navigates to `/entry/[id]`
- Reuses `getDatesWithEntries` and `getEntriesForDate` from `src/db/entries.ts`

### Year jump
- The month/year header (e.g. "May 2026") is tappable
- Tapping opens a vertical year scroller inline below the header
- Selecting a year jumps the calendar to January of that year; the user then swipes to the target month
- Years shown: all years that have at least one entry, plus the current year

---

## Map Tab

A full-screen map showing a pin for every entry with location data (`location_lat` and `location_lng` not null).

### Library
- `react-native-maps` (new dependency) — Apple Maps on iOS, no API key required
- `expo-blur` (new dependency) — used for tab bar only, not the map itself

### Pins
- Each pin is a small custom marker rendered in `accent.buttonColor`
- Tapping a pin shows a callout bubble containing:
  - Entry date and location label
  - First ~60 characters of `response_text` in Georgia italic
  - A "Open entry →" affordance
- Tapping the callout navigates to `/entry/[id]`

### Camera behaviour
- **Initial load:** Map centres on the densest geographic cluster of pins. Pins are bucketed into a lat/lng grid (0.5° cells); the cell with the most entries determines the initial `region`. This prevents a super-zoomed-out view when most pins are in one city and a few outliers are elsewhere.
- **Position persistence:** The map's current region is tracked via `onRegionChangeComplete` into a `useRef`. When the user returns to the Map tab (via `useFocusEffect`), the map restores to that saved region rather than recalculating.

### Overlay
- A serif italic label **"places you've been bored"** rendered in `colors.textMuted` overlaid at the top of the map surface (absolute-positioned, not a header bar)

### Empty state
- If no entries have location data, the map is not shown
- A centred message reads: "No places yet. Enable Auto-location in Settings to capture where you write."

---

## Auto-GPS Setting (`app/settings.tsx`)

A new **LOCATION** section is added to the Settings screen, below the existing WRITING section.

| Element | Value |
|---|---|
| Section header | "LOCATION" |
| Row label | "Auto-location" |
| Row subtitle | "Capture your location automatically when writing" |
| Control | `Switch` (same pattern as Dark Mode and Freeform rows) |
| Setting key | `auto_location` |
| Values | `'true'` \| `'false'` (default: absent = `'false'`) |

Reads `auto_location` from DB on mount via `getSetting`. Writes on toggle via `setSetting`. Includes try/catch with state revert on DB failure (same pattern as `handleFreeformToggle`).

---

## Respond Screen Changes (`app/respond.tsx`)

When `auto_location = 'true'`, the Respond screen captures GPS automatically on mount.

### Auto-capture behaviour
- On mount, after loading the prompt and respond mode, reads `auto_location` from DB
- If `'true'`: calls `captureLocation()` automatically (same function as the manual "Add place" button)
- The captured label is populated into `locationLabel` state and coordinates into `locationCoords`
- The location row shows the captured label with an **✕** button alongside it; tapping ✕ clears both `locationLabel` and `locationCoords`, reverting to the "📍 Add place" state for that entry only

### Manual flow (unchanged)
- When `auto_location = 'false'` or absent: the "📍 Add place" button behaviour is unchanged

---

## New Dependencies

| Package | Purpose | Install |
|---|---|---|
| `react-native-maps` | Map view and pin markers | `npx expo install react-native-maps` |
| `expo-blur` | Frosted glass tab bar backdrop | `npx expo install expo-blur` |

`expo-location` is already installed.

---

## Files Changed

| File | Change |
|---|---|
| `app/index.tsx` | Remove 3 tiles; add single BoredBefore tile |
| `app/boredbefore.tsx` | **New** — full BoredBefore screen with tab bar + 3 tab panels |
| `app/timeline.tsx` | **Deleted** |
| `app/entries.tsx` | **Deleted** |
| `app/reflect.tsx` | **Deleted** |
| `app/settings.tsx` | Add LOCATION section with Auto-location toggle |
| `app/respond.tsx` | Read `auto_location`; auto-capture GPS on mount; add ✕ remove button |

No changes to `src/db/` — all required query functions already exist.

---

## Out of Scope (v1.1.0)

- Heatmap overlay on the Map tab (deferred to backlog)
- "On this day" feature (removed; covered by Calendar)
- Mood toggle (deferred separately)
- Custom app icon, weather themes, font packs (backlog)

# PLACE Chip — Manual Location Tagging

**Date:** 2026-07-22
**Status:** Approved design

## Overview

Bring back a manual way to attach a place to an entry from the respond screen,
independent of the `auto_location` Settings toggle. The `◉ PLACE` chip existed
before 2026-07-06 (removed alongside Photo/Camera) and did a single thing: tap
→ GPS capture → reverse-geocoded label filled into the entry. Today, location
only attaches passively — silently, on mount — if `auto_location` is on; if
it's off, or the GPS fix/geocode fails, there's no way to tag a place at all.

This pass restores the manual entry point and extends it: tapping the chip now
opens a small modal sheet offering "use current location" (the old behavior),
a way to save a *new* named place on the spot, or picking from the app's
existing Named Places (`src/db/places.ts`) — sorted nearest-first. Renaming or
deleting saved places stays out of scope; that's already reachable from an
entry's detail screen.

**Explicitly out of scope for this pass:** location-aware AI prompts (e.g.
recognizing "Central Park" as a park and asking something park-specific) and
location-aware mascot copy. Both are real product directions worth designing
later, but they're a different, larger piece of work than a data-tagging UI —
noted here as a follow-on, not designed.

## Chip + existing editable-label row

- `◉ PLACE` chip (inactive style) when no location is attached to the draft.
- Tapping it — in either state — opens `PlacePickerSheet`. This replaces the
  pre-removal behavior of "tap = instant GPS capture"; the tap now always
  opens the sheet, which is itself one tap away from the old behavior via
  "Use current location."
- Once a location is attached — via auto-capture on mount, "Use current
  location," creating a new place, or picking a saved one — the chip flips to
  its active style and shows the name: `◉ CENTRAL PARK`.
- The **existing** editable text row + ✕ clear button (already in
  `app/respond.tsx`, untouched by this feature) still appears below once
  `locationLabel` is non-empty, so a quick rename or clear doesn't require
  reopening the sheet.
- Tapping the chip again while already active reopens the sheet to switch to a
  different saved place or re-capture GPS — it does not clear anything.

## `PlacePickerSheet` component

New component: `src/components/PlacePickerSheet.tsx`, following the same
`Modal` pattern as the existing `PlaceNameSheet`. Self-contained — respond.tsx
renders it with `visible`, `onPick(label: string, lat: number, lng: number)`,
and `onClose`.

**Layout:**
```
┌─────────────────────────────┐
│ [ ◎ Use current location ]  [+] │
│ 📍 Central Park      12 entries │
│ 📍 The Office          4 entries │
│ 📍 Mom's House         2 entries │
└─────────────────────────────┘
```
The header row is a wide "Use current location" button plus a small square
`+` beside it, matching the `IconSticker` square language already used for
back/menu buttons elsewhere in the app.

**On open:**
- Fetch saved places via the existing `getAllPlacesWithCounts()`.
- If `locationCoords` is already set (auto-location ran on mount) it's used
  immediately to sort the list. Otherwise a background GPS fetch kicks off and
  the list re-sorts once it resolves — no blocking spinner; the list renders
  in `getAllPlacesWithCounts()`'s existing most-used order until/unless a fix
  arrives.
- Sorting uses a new `sortPlacesByDistance(places, coords)` helper alongside
  `haversineMeters` in `src/db/places.ts`.
- **Empty state** (no saved places yet): the list area is replaced with a
  short line in the app's voice, e.g. *"Nothing saved yet — hit + to fix
  that."*

**Row behaviors:**
1. **"Use current location"** → same `captureLocation()` (GPS +
   reverse-geocode) as the original chip → `onPick(label, lat, lng)` → sheet
   closes.
2. **"+"** → uses the current GPS fix (the one already fetched for sorting, or
   fetched fresh on-demand if none resolved yet) → opens the *existing*
   `PlaceNameSheet` stacked on top (`placeId` omitted, `entryCount: 0` since
   it's a new place, `coordinate` = the fetched fix) → on save,
   `onPick(newPlace.name, lat, lng)` → both sheets close.
3. **Saved-place row** → `onPick(place.name, place.lat, place.lng)` straight
   from the stored record → sheet closes.

## Data flow / persistence

No new DB writes beyond what `PlaceNameSheet` already performs when creating a
place. `onPick` in `app/respond.tsx` just does what auto-location already
does today: `setLocationLabel(label)` + `setLocationCoords({ lat, lng })`.
`handleSubmit` is unchanged — it already passes `locationCoords` into
`createEntry` and already calls `checkEntryAgainstPlaces(db, { id, lat, lng })`
afterward, which proximity-matches the entry to the right `place_id`. This
works correctly for a place created seconds earlier via "+", since its
`lat`/`lng` match exactly (distance 0, well within `radius_m`).

## Error handling

Matches the codebase's existing quiet-failure convention for location — no
new alert patterns introduced:

- GPS fetch for sorting fails, is denied, or times out → silently fall back to
  most-used order. Sorting is a nicety, not a blocker; no alert.
- "Use current location" fails (denied permission, no fix) → silently no-ops,
  same as today's auto-location-on-mount behavior. The sheet stays open so the
  user can still pick a saved place instead.
- "+" tapped with no coords resolved yet → fetches a fresh fix on-demand
  (same call as "Use current location," minus the reverse-geocode, since
  `PlaceNameSheet` collects the name manually). If that also fails, same
  silent no-op — there's nothing to save without coordinates.

## Testing

- `sortPlacesByDistance(places, coords)` in `src/db/places.ts` is pure and
  unit-tested: coords present (nearest-first), coords `null`/`undefined`
  (stable passthrough of the input order), empty list.
- `PlacePickerSheet`'s open/close, the GPS calls, and the nested
  `PlaceNameSheet` hand-off are thin wiring — verified on device per this
  project's existing convention (CI proves logic, not rendered UI), same as
  `PlaceNameSheet` itself today.

## Non-goals

- No rename/delete surfaced in this sheet — stays reachable only from an
  entry's detail screen, as it is today.
- No map/pin-drop place creation — "+" always uses the current GPS fix,
  consistent with how `PlaceNameSheet` is invoked everywhere else in the app.
- No changes to the `auto_location` toggle or its silent on-mount capture —
  this sheet is purely an additional manual entry point alongside it.
- No change to `offline_mode` gating — location capture (manual or auto) is
  unaffected by offline mode today, and this feature doesn't change that.
- Location-aware AI prompts and location-aware mascot copy — noted above as a
  real follow-on direction, not designed here.

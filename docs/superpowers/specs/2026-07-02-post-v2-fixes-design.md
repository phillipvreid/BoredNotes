# Post-v2.0.0 Fixes & Roadmap — Design Spec
**Date:** 2026-07-02
**Status:** Draft
**Branch context:** `feat/arcade-sticker-v2` (commit c285185)

---

## Overview

Post-v2.0.0 cleanup covering two confirmed bugs, a set of Settings/navigation improvements, and product decisions carried over from `TODO.md`. Work is ordered bugs-first, then remaining items ranked by lift-to-reward. The two bugs are the only fully-specified, ready-to-build items here; later sections capture scope and open decisions so nothing is lost, but each larger feature gets its own spec before implementation.

---

## Bug 1 — Home cards don't refresh after submitting an entry

**Reward:** medium · **Lift:** XS · **Do first.**

### Cause

In `app/index.tsx`, the prompt cards are selected in a mount-only `useEffect` (deps `[]`, lines 34–42). The adjacent `useFocusEffect` (lines 44–56) only refreshes `entryCount`. Returning to Home after submitting therefore shows the same cards — including a prompt that was just used.

### Fix

Fold the card-selection query into the existing `useFocusEffect` so it re-runs on every focus:

- Move the `getEligiblePrompts(db, {})` + `selectHomeCardPrompts(pool, 3)` call inside the focus callback, alongside `countEntries`.
- Keep the `active` guard already present in the focus effect to avoid setting state after unmount.
- Remove the now-redundant mount-only `useEffect`.

No schema change. `getEligiblePrompts` already filters recently-used prompts, so a just-used prompt naturally drops out of the next selection.

### Trade-off (accepted)

Cards reshuffle each time Home regains focus, not only after a submit. This is acceptable and arguably desirable for a "here's a fresh pick" home surface. If reshuffle-on-every-focus proves jarring in device testing, a follow-up can gate reselection on entry-count change.

---

## Bug 2 — Greatest Hits cards show "prompt" instead of the entry's category

**Reward:** medium · **Lift:** medium · **Do second (separate commit — includes a migration).**

### Cause

`src/boredbefore/FeedTab.tsx:97` hardcodes the pill label:

```ts
const pillLabel = rank ? 'RANK + DEFEND' : freeform ? 'BRAIN DUMP' : 'PROMPTED';
```

Prompted entries always read "PROMPTED". Showing the real category (observational / reflective / personal / creative) isn't possible today because **the category is never stored on the entry.** The `entries` table (`src/db/schema.ts`) has `prompt_text` but no `category`; category lives only on the `prompts` table (schema line 36). The write path (`respond.tsx` → `createEntry` in `src/db/entries.ts`) never carries it across.

### Data model change

Add a nullable `category` column to `entries`:

```sql
ALTER TABLE entries ADD COLUMN category TEXT;
```

- Nullable, no default — existing rows keep `NULL`, which the UI treats as "unknown category" and falls back to the current "PROMPTED" pill.
- Applied as a forward migration in `src/db/schema.ts` (follow the existing migration pattern in that file; do not rewrite the base `CREATE TABLE` in a way that breaks installed databases).
- Freeform and game entries may leave `category` `NULL`; their pills are already driven by `entry_mode`/`entry_kind`, not category.

### Write path

- `respond.tsx` already holds `promptCategory` (from route params, defaulting to `'reflective'`). Pass it into `createEntry` when the entry is prompted.
- Extend the `createEntry` input type and `INSERT` in `src/db/entries.ts` to include `category` (nullable).
- Extend the `Entry` interface in `src/types.ts` with `category?: PromptCategory | null`.

### Render

In `FeedTab.tsx`, for prompted entries with a non-null `category`, show the category label and hue from `CATEGORY_STYLES` (as Home already does at `app/index.tsx:91`) instead of the static "PROMPTED" pill. Keep "PROMPTED" as the fallback when `category` is null so legacy entries still render sensibly. Apply the same treatment anywhere the entry-detail screen shows the pill, for consistency.

---

## Files changed (bugs)

| File | Change |
|------|--------|
| `app/index.tsx` | Move card selection into `useFocusEffect`; drop mount-only `useEffect` (Bug 1) |
| `src/db/schema.ts` | Migration: add nullable `category` column to `entries` (Bug 2) |
| `src/db/entries.ts` | `createEntry` input + `INSERT` include `category` (Bug 2) |
| `src/types.ts` | `Entry.category?: PromptCategory \| null` (Bug 2) |
| `app/respond.tsx` | Pass `promptCategory` into `createEntry` on submit (Bug 2) |
| `src/boredbefore/FeedTab.tsx` | Render real category label/hue with "PROMPTED" fallback (Bug 2) |
| entry detail screen | Same pill treatment for consistency (Bug 2) |

---

## Testing

- **Bug 1:** focus effect reselects cards (mock `getEligiblePrompts`/`selectHomeCardPrompts`, simulate refocus, assert new selection query runs); count still refreshes on focus.
- **Bug 2 — db:** migration adds `category` without dropping existing rows; `createEntry` persists `category` for prompted entries and accepts `null` for freeform/game entries; reading back returns the stored category.
- **Bug 2 — FeedTab:** prompted entry with a category renders that category's label; prompted entry with `null` category falls back to "PROMPTED"; freeform and rank pills unchanged.
- Existing CSV export / search tests must still pass with the new column (per `TODO.md` "re-check CSV export and search with `entry_kind`/`game_data`").

---

## Remaining roadmap (ranked by lift-to-reward)

Each item below gets its own spec before build. Ranked highest reward-per-unit-lift first.

| Item | Lift | Reward | Notes |
|------|------|--------|-------|
| Remove "places you've been bored" map message | XS | Low | String removal in `MapTab.tsx`; moot if map is cut |
| Settings: disable-"wonky"-tilt toggle | S | Medium | New setting gating `TILTS` usage app-wide |
| Settings: three-way Light / Dark / System selector | S–M | Medium | Default System, track iOS Appearance API, persist |
| Remove calendar tab → date search/filter on Feed | M | Medium | Delete `CalendarTab.tsx`, add date filter to `FeedTab` |
| Arcade Sticker design spec + plan doc | S–M | Low–Med | Housekeeping; every other feature has one |
| Share screen redesign (Arcade Sticker) | L | High | Pre-Arcade design; will use claude.ai/design |
| Second micro-game | L | Med–High | Reuses `prompts.kind` / `game_config` / `entry_kind` / `game_data` plumbing |
| Extend category hues / IconSticker set | S | Low | Only when new prompt categories are added — deferred |

---

## Open product decisions (block downstream work)

These need a product call, not engineering. Deciding them first avoids wasted work:

- **Map** — keep or cut entirely? If cut, the "remove message" item is moot and `MapTab.tsx` / related boredbefore wiring is deleted.
- **Photo** — does attachment fit the app's local-first, calm-reflection concept, or should it be cut?

---

## User-owned / cannot be automated here

The assistant's session cannot run the iOS native build. These remain the developer's on-device tasks and **gate the PR** for `feat/arcade-sticker-v2` → main:

- Full "Verify on device" pass (Home, Reply text/brain-dump, Reply·Rank, Greatest Hits, Share, Settings; font loading; 4 paper themes in light/dark; Rank & Defend end-to-end; offline mode disables AI).
- Polish checks: SE-class layout cramping, Mascot animation battery/jank, Toast vs. Share-sheet overlap.

---

## Out of scope

- Backfilling `category` onto pre-existing entries — legacy rows keep the "PROMPTED" fallback rather than a guessed category.
- Any backend, analytics, or Expo/RN version upgrade (per project principles).
- Reworking the Rank & Defend game logic — Bug 2 only touches how prompted entries label their category.

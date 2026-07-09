# Greatest Hits — Filter menu

**Date:** 2026-07-09
**Status:** Approved design, ready for implementation plan
**Area:** `src/boredbefore/` (Feed tab)

## Problem

The Greatest Hits Feed tab has a single **Date** button beside the search field. It
opens a month-picker modal and only filters by month. We want a general, extensible
filtering surface that keeps the UI clean as more filter types are added.

## Goal

Replace the **Date** button with a **Filter** button that opens one sheet holding
multiple labeled filter sections. Ship two sections now — **Format** and **When** —
structured so future sections drop in without redesign.

## Non-goals

- No Apply button — filtering is live.
- No filtering on the Map tab (Feed only).
- No handling for legacy prompted-text entries that have no category (the only user
  with existing data is the developer; not worth the complexity).
- No new analytics.

## UX

### Trigger button

- Replaces the current `monthTrigger` in the search row, same slot/size.
- Label: `FILTER`. When any filter is active, the button fills with the theme
  **action** color (`colors.action` / `actionInk`) and shows a count badge, e.g.
  `FILTER · 2`.
- **Badge count** = number of selected Format chips + (1 if a date range is set).
  A date range counts as one, whether one or both bounds are set.

### Filter sheet

Reuses the existing centered modal card (scrim + `Sticker`-style surface). Sections
stack vertically, each with a mono uppercase label, so a new section is just another
labeled block.

**Header row:** title `Narrow it down` + a `Clear all` action. `Clear all` is shown
only when at least one filter is active; it resets Format and the date range.

**Section 1 — FORMAT** (select-all-that-apply chips):
- `Brain Dump`, `Observe`, `Reflect`, `Confess`, `Imagine`, `Rank + Defend`,
  `Love + Hate`.
- Multi-select. A selected chip fills with the action color (matching the existing
  selected-month styling). No chips selected = all formats shown (no-op).
- Chips map 1:1 to the pill shown on each feed card.

**Section 2 — WHEN** (manual date range):
- Layout: `START [ Any ▾ ]  –  [ Any ▾ ]  END`.
- Both boxes **start empty** and read `Any`. Tapping a box opens the native iOS date
  picker; picking a date fills that box and applies immediately.
- Either bound is optional: start-only = "from X onward", end-only = "up to X",
  both = closed range.
- A filled box shows the formatted date (e.g. `Jun 1, 2026`) with an offset shadow;
  empty shows `Any`, muted, no shadow.

### Behavior

- **Live filtering.** Toggling a chip or picking a date updates the list immediately.
- **Combine with AND.** Format, date range, and the existing search box all AND
  together. Search still hits the DB (`searchEntries` / `getAllEntries`); Format and
  date range are applied client-side on the loaded set (same as month filtering is
  today).
- **Reset on focus.** All filter state (formats, range, search) resets when the screen
  regains focus, matching current behavior.

## Format mapping

Each entry maps to exactly one format token, matching its card pill:

| Entry                                   | Token        | Chip label      |
|-----------------------------------------|--------------|-----------------|
| `entry_kind === 'loveHate'`             | `loveHate`   | Love + Hate     |
| `entry_kind === 'rank'`                 | `rank`       | Rank + Defend   |
| `entry_mode === 'freeform'`             | `brainDump`  | Brain Dump      |
| prompted text, `category === 'observational'` | `observe`  | Observe   |
| prompted text, `category === 'reflective'`    | `reflect`  | Reflect   |
| prompted text, `category === 'personal'`      | `confess`  | Confess   |
| prompted text, `category === 'creative'`      | `imagine`  | Imagine   |

Note the derivation order mirrors the card's pill logic in `FeedTab` (game kinds
first, then freeform, then category). The `game` prompt category is not a chip — those
entries are saved as `rank`/`loveHate` kinds and are covered by those chips.

## Architecture

Keep `FeedTab` as the state owner; extract the filter UI and the pure filter logic so
`FeedTab` (already ~400 lines) stays focused and the logic is unit-testable.

- **`src/boredbefore/filterEntries.ts`** — pure helpers:
  - `type FeedFilters = { formats: FormatToken[]; startDate: string | null; endDate: string | null }`
  - `formatOf(entry): FormatToken` — the mapping above.
  - `filterEntries(entries, filters): Entry[]` — applies format + date range.
  - `activeFilterCount(filters): number` — for the badge.
  - Date comparison is on the `YYYY-MM-DD` prefix of `created_at`; `endDate` is
    inclusive (match `created_at.slice(0,10) <= endDate`).
- **`src/boredbefore/FilterSheet.tsx`** — the trigger button + modal sheet. Props:
  current `FeedFilters`, `onChange(next)`, and the available format options. Owns the
  native date-picker presentation internally.
- **`FeedTab.tsx`** — holds `filters` state, renders `<FilterSheet>`, derives
  `visible = filterEntries(entries, filters)`, then groups as today. Drops
  `getMonthsWithEntries`/year-nav/month-grid code and its related state.

`getMonthsWithEntries` in `src/db/entries.ts` becomes unused by the Feed; remove it if
nothing else references it (verify first).

## Dependency

Native date picker: `@react-native-community/datetimepicker` (Expo-supported).

- Install with `npx expo install @react-native-community/datetimepicker`.
- Native module → requires a fresh `npx expo run:ios` build, not just a JS reload.
- Run `npx expo install --check` before the build to catch SDK/peer mismatches.

## Testing

- Unit tests for `filterEntries.ts` (Jest, no native deps):
  - `formatOf` returns the right token for each entry kind/mode/category.
  - `filterEntries` with no filters returns everything.
  - Format filter keeps only matching tokens; multiple selected formats OR within the
    section.
  - Date range: start-only, end-only, both (inclusive bounds), and range +
    format combined (AND).
  - `activeFilterCount` counts formats + one for any range.
- `FilterSheet` rendering / native picker is verified on-device by the developer
  (simulator can drive the date wheel).

## Copy

- Button: `FILTER`, active `FILTER · N`.
- Sheet title: `Narrow it down`.
- Section labels: `FORMAT`, `WHEN`. Field captions: `START`, `END`. Empty value: `Any`.
- `Clear all`.

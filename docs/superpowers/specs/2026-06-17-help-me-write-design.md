# Help Me Write — Design Spec
**Date:** 2026-06-17
**Status:** Approved

---

## Overview

Replaces the global "Freeform mode" Settings toggle with a per-entry choice. Freeform is always the default when opening Respond. A new **"Help me write"** pill inside Respond expands an AI-generated prompt block with four toggleable context chips — **Place, Time, Weather, Memory** — that control what context feeds the AI's prompt generation. Collapsing the pill returns to plain freeform without losing typed text. Home no longer previews or pre-fetches a prompt; it becomes a static entry point.

---

## Data Model

### `settings` table — key changes

| Key | Values | Default | Change |
|-----|--------|---------|--------|
| `respond_mode` | `'prompted'` \| `'freeform'` | — | **Removed.** No longer read or written anywhere. |
| `help_me_write_chips` | JSON of `{ time, place, weather, memory }` booleans | absent → all `true` | **New.** Last-used chip combination, read on first "Help me write" tap per Respond mount, written immediately on every chip toggle. |

No schema/table changes. `entries.entry_mode` keeps its existing `'prompted' | 'freeform'` values — derived per-entry from whether the prompt block was expanded at submit time, same as today.

### `src/prompts/types` (new, or added to `src/types.ts`)

```ts
interface PromptModifiers {
  time: boolean;
  place: boolean;
  weather: boolean;
  memory: boolean;
}
const DEFAULT_MODIFIERS: PromptModifiers = { time: true, place: true, weather: true, memory: true };
```

---

## Home Screen (`app/index.tsx`)

Simplifies to a static tile:

- Drop `getContextualPrompt`/`forceRefreshContextualPrompt` calls, `contextualPromptLoading`, `refreshing`, `respondMode`, and `prompt` state entirely.
- Card always shows label "Today's entry" / body "What's on your mind…" / hint "Tap to write →" — i.e. today's freeform branch becomes the only branch.
- No AI badge, no refresh icon, no loading state.
- `handleCardPress` always does `router.push('/respond')` with no params.

---

## Respond Screen (`app/respond.tsx`)

### State

- Remove `respondMode` state and its `getSetting(db, 'respond_mode')` read.
- Remove the `promptText`/`promptCategory` route params (Home no longer sends them).
- Add `helpMeWriteOpen: boolean` (default `false`).
- Add `modifiers: PromptModifiers` (loaded from `help_me_write_chips` setting on mount, falling back to `DEFAULT_MODIFIERS`).
- Add `prompt: CurrentPrompt | null` and `promptLoading: boolean` for the expanded block.
- Add `offlineMode: boolean` (read from existing `offline_mode` setting on mount) — controls whether the chip row renders at all.

### Layout

- Above the text box: a pill, e.g. "✨ Help me write" (collapsed) — tapping it:
  - Sets `helpMeWriteOpen = true`.
  - Triggers generation (see below) if no prompt is loaded yet for this entry.
- When expanded, the pill area becomes the existing prompt block pattern (prompt text, AI badge when `source === 'ai'`, refresh icon) **plus**, only when `!offlineMode`, a row of four chip toggles: Place, Time, Weather, Memory.
- Tapping the pill again sets `helpMeWriteOpen = false`. The prompt block disappears; typed `response` text is untouched.
- When `offlineMode` is true, the chip row is hidden — only the prompt text + refresh icon show, sourced from the library fallback.

### Behavior

- **First open (per entry):** generate using current `modifiers` (or library fallback if offline).
- **Refresh tap:** regenerate with the same `modifiers`/offline state — mirrors today's `forceRefreshContextualPrompt` call.
- **Chip toggle:** flip that chip in `modifiers`, persist the whole object to `help_me_write_chips` immediately, and regenerate right away (no separate "apply" step).
- **Submit:** `entry_mode` is `'prompted'` if `helpMeWriteOpen` else `'freeform'`; `prompt_text` is the current prompt text if open, else `''` — same shape `createEntry` already expects.

---

## Prompt Generation (`src/prompts/contextual.ts`, `src/prompts/ai.ts`)

### `contextual.ts`

`getContextualPrompt`/`forceRefreshContextualPrompt` gain a `modifiers: PromptModifiers` parameter (no default — Respond is now the only caller and always has a value):

- **Offline branch:** unchanged — defers to `next.ts`'s library functions (`peekNextLibraryPrompt`, `getCurrentPrompt`/`getNextPrompt`), ignoring `modifiers` (chips aren't shown in this state anyway).
- **Online branch:**
  - `recentTopics` is only computed/passed when `modifiers.memory` is true; otherwise pass `[]` (no recent-entry text leaves the device).
  - `gatherContext()` is still called unconditionally (cheap, avoids partial-permission edge cases) but the resulting `PromptContext` is filtered through `modifiers.{time,place,weather}` when building the AI request — see below.

### `ai.ts`

`buildContextLine` becomes modifier-aware: it builds a sentence only from the fragments whose chip is on (weather condition + temp when `weather` is true and data is available; day-of-week + time-of-day when `time` is true; location label when `place` is true and available). If a selected modifier's data isn't available (e.g. location permission denied), that fragment is silently omitted — same graceful-degradation behavior as today. If no modifiers are active (or none have data), the context line is empty and the AI request is just the bare category/depth instruction.

When the context line is non-empty, the instruction sent to the model appends a soft steering line:

> "...don't force every detail into one short question — only use what makes it feel timely or personal."

This replaces any code-level weighting/random-subset logic: variety relies on the model's own judgment plus the existing category/depth rotation in `selectPrompt`, not a new randomization layer.

`recentTopics` continues to be an ordinary input field — the `memory` chip is enforced entirely by the caller passing `[]` when off, so `ai.ts`'s signature doesn't need a dedicated flag.

---

## Settings Screen (`app/settings.tsx`)

- Remove the "Freeform mode" row, its `isFreeform` state, and `handleFreeformToggle` — the whole block tied to `respond_mode`.
- **Offline Mode disclosure copy must be updated.** Today it reads "AI-generated prompts use short snippets from your recent notes for context. Enable offline mode to disable this." — written as if recent-note snippets are always sent whenever AI is used. Once the Memory chip exists, that's no longer true: snippets are only sent when Memory is on. Update the subtitle to something like: "AI-generated prompts can use short snippets from your recent notes when the Memory option is on. Enable offline mode to disable AI prompts entirely." so the disclosure accurately reflects the new opt-in behavior.

---

## Files Changed

| File | Change |
|------|--------|
| `app/index.tsx` | Strip prompt-fetching/loading state; static freeform tile always navigating to `/respond` |
| `app/respond.tsx` | Remove `respond_mode` read and route params; add `helpMeWriteOpen`, `modifiers`, chip row, expand/collapse pill, offline-aware rendering |
| `app/settings.tsx` | Remove "Freeform mode" row/state |
| `src/prompts/contextual.ts` | `getContextualPrompt`/`forceRefreshContextualPrompt` take `modifiers: PromptModifiers`; conditional `recentTopics`; pass modifiers into AI call |
| `src/prompts/ai.ts` | `buildContextLine` filters by modifiers; soft steering instruction appended when context line is non-empty |
| `src/types.ts` (or new `src/prompts/types.ts`) | Add `PromptModifiers` type + `DEFAULT_MODIFIERS` |
| `src/db/settings.ts` | No code change — new `help_me_write_chips` key uses existing generic `getSetting`/`setSetting` |

`src/prompts/next.ts`, `src/context/gather.ts`, `src/context/weather.ts`, schema/migrations, `entries.ts`, entry detail screen, and share rendering are all unaffected.

---

## Testing

- **Existing tests will break, not just need new cases:** `__tests__/prompts/contextual.test.ts` calls `getContextualPrompt`/`forceRefreshContextualPrompt` directly, and `__tests__/prompts/ai.test.ts` exercises `buildContextLine` via `generateAiPrompt` — every existing call site in both files must be updated to pass `modifiers` (typically `DEFAULT_MODIFIERS`) before any new modifier-specific cases are added.
- `ai.ts`: each modifier's effect on the built context line individually and in combination; all-off produces no context line; soft steering line present only when context line is non-empty; `memory` continues to be governed purely by the `recentTopics` argument.
- `contextual.ts`: modifiers correctly gate `recentTopics` computation; offline branch ignores modifiers and still returns a library prompt.
- `app/respond.tsx`: pill expand/collapse preserves typed text; chip toggle persists `help_me_write_chips` and triggers regeneration; offline mode hides chip row; submit produces correct `entry_mode`/`prompt_text` for both expanded and collapsed states.
- `app/index.tsx`: simplified render has no prompt-fetch side effects.
- `app/settings.tsx`: "Freeform mode" row no longer renders.

---

## Out of Scope

- Code-level randomized subset selection of modifiers (rejected in favor of soft model steering).
- Per-entry override of `help_me_write_chips` persistence (it's a single global "last used," not per-category memory).
- Editing the generated prompt's text inline (chips are the only customization surface).
- Any change to `next.ts`'s library rotation/AI-frequency logic, which remains the offline/no-API-key fallback path.

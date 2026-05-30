# Contextual Questions — Design Spec

**Date:** 2026-05-30
**Status:** Approved

---

## Overview

Enrich AI-generated prompts with real-time contextual signals — time of day, day of week, season, location, weather condition, and temperature — so prompts feel tuned to the user's actual moment. Context is gathered on Home screen focus and used to generate a fresh prompt via Claude. The existing prompt pipeline is untouched; the contextual path is purely additive.

---

## Approach

Approach A: context layer wraps the existing pipeline. A new `src/context/` module handles signal gathering. `generateAiPrompt()` gains an optional `context` parameter. The Home screen drives generation on focus with a 1-hour throttle. The existing post-submission `getNextPrompt()` call is unchanged and keeps the DB cache warm as a silent fallback.

---

## Context Signals

Two tiers:

**Light signals** — device-side, always available, no permissions or network needed:
- Time of day: `morning` (6–11), `afternoon` (12–17), `evening` (18–21), `night` (22–5)
- Day of week: full name, e.g. `Thursday`
- Season: derived from month — `spring` (Mar–May), `summer` (Jun–Aug), `autumn` (Sep–Nov), `winter` (Dec–Feb)

**Rich signals** — require location permission and network:
- `locationLabel` — city/region from reverse geocode, e.g. `Edinburgh, Scotland`
- `weatherCondition` — human-readable string mapped from Open-Meteo weathercode, e.g. `rainy`, `sunny`, `overcast`, `snowy`
- `temperatureCelsius` — current temperature as a number; the AI decides how to express it

Rich signals are null when unavailable. The architecture supports future offline light-context library selection — `gatherContext()` always returns light signals regardless of connectivity, so library selection can consume them without changes to this module.

---

## New Module: `src/context/`

### `src/context/types.ts`

```ts
export interface PromptContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  locationLabel: string | null;
  weatherCondition: string | null;
  temperatureCelsius: number | null;
}
```

### `src/context/weather.ts`

Fetches from Open-Meteo (free, no API key required):

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lng}
  &current=temperature_2m,weathercode
```

- 2s timeout via `AbortController`
- Returns `{ condition: string, temperatureCelsius: number } | null`
- Maps WMO weathercodes to a concise condition string (clear, partly cloudy, overcast, foggy, drizzle, rainy, snowy, thunderstorm). Unmapped codes fall back to `null`.
- Never throws — returns `null` on any failure

### `src/context/gather.ts`

`gatherContext(): Promise<PromptContext>`

1. Build light signals from `new Date()`
2. Try `Location.getLastKnownPositionAsync()` for a near-instant OS-cached fix
3. If nothing cached, try `Location.getCurrentPositionAsync()` with `Accuracy.Low` and a 3s timeout
4. If location acquired, fetch weather (parallel — does not block if it fails)
5. Return full `PromptContext`; rich fields are `null` on any failure

Never throws.

---

## Changes to `src/prompts/ai.ts`

`AiPromptInput` gains an optional `context` field:

```ts
export interface AiPromptInput {
  category: PromptCategory;
  depth: 1 | 2 | 3;
  recentTopics: string[];
  context?: PromptContext;
}
```

When `context` is present, a context line is prepended to the Claude prompt:

- Rich context available: `"It's a rainy Thursday evening in Edinburgh, 11°C."`
- Light signals only: `"It's a Thursday evening in autumn."`
- No context (existing post-submission path): no context line — prompt string is identical to today

`category` and `depth` continue to be driven by `selectPrompt()` picking a library prompt, preserving the existing variety management (category cycling, depth balancing). Context enriches the prompt *text*, not the *selection logic*.

No other changes to `ai.ts`. Existing timeout and error handling unchanged.

---

## Home Screen Changes (`app/index.tsx`)

### Throttle

Two new settings keys:
- `contextual_prompt_text` — the last successfully generated contextual prompt text
- `contextual_prompt_generated_at` — ISO timestamp of last successful generation

On focus, the screen reads `contextual_prompt_generated_at`. If less than 1 hour ago, it reads `contextual_prompt_text` from DB and displays it immediately — no fetch. If over 1 hour (or no timestamp), it triggers fresh generation. The timestamp is only written on success, so a failed attempt does not block retrying on the next focus.

### Generation flow

1. Check `offline_mode` setting — if enabled, skip the contextual path entirely; display `getCurrentPrompt()` from DB as today
2. Set `contextualPromptLoading = true`
3. Call `gatherContext()`
4. Call `getRecentEntries()` to get `recentTopics` (same as `next.ts` does today)
5. Call `selectPrompt()` to get `category` and `depth` for variety management
6. Call `generateAiPrompt({ category, depth, recentTopics, context })`
7. On success: write `contextual_prompt_text` and `contextual_prompt_generated_at` to DB; display prompt; set `contextualPromptLoading = false`
8. On any failure (null return or thrown error): silently read `getCurrentPrompt()` from DB; display that; set `contextualPromptLoading = false`

### Loading state

A `contextualPromptLoading` boolean controls the home card render. While true, the card shows a placeholder (subtle shimmer or muted italic `…`). This render branch is self-contained — it is the exact slot the future mascot character will occupy. Swapping in a mascot component requires touching only this branch.

### Navigation to Respond

On card tap, navigate to `/respond` passing the contextual prompt via route params:

```
/respond?promptText=...&promptCategory=...
```

---

## Respond Screen Changes (`app/respond.tsx`)

On mount, check for `promptText` and `promptCategory` route params. If present, use them directly. If absent, fall back to `getCurrentPrompt()` from DB as today.

The prompt is set once on mount and never updated. No risk of the prompt changing after the user starts writing.

`promptCategory` is passed so the entry is saved with correct category metadata, consistent with prompted entries today.

---

## Error Handling

Every layer is independently silent:

| Layer | Failure behaviour |
|---|---|
| `gatherContext()` | Never throws; returns partial context (light signals always populated, rich fields null) |
| `generateAiPrompt()` | Already returns null on timeout, network error, or bad response |
| Home screen generation | Any failure → silent fallback to `getCurrentPrompt()` from DB; loading state clears; user sees a prompt |
| Throttle timestamp | Only written on success — failed attempts do not lock out retrying on next focus |

No error states, toasts, or user-visible indicators. Fully invisible degradation.

---

## Offline Mode Interaction

When `offline_mode` is enabled, the contextual generation path is skipped entirely. The Home screen reads from the existing `current_prompt_text` DB cache as it does today. No new interaction to design.

---

## Settings Keys

| Key | Type | Purpose |
|---|---|---|
| `contextual_prompt_text` | string | Last successfully generated contextual prompt text |
| `contextual_prompt_generated_at` | ISO string | Timestamp of last successful generation; drives 1-hour throttle |

---

## Files Changed

| File | Change |
|---|---|
| `src/context/types.ts` | New — `PromptContext` interface |
| `src/context/weather.ts` | New — Open-Meteo fetch, weathercode mapping |
| `src/context/gather.ts` | New — `gatherContext()` orchestrator |
| `src/prompts/ai.ts` | Add optional `context?: PromptContext` to `AiPromptInput`; inject context line into Claude prompt |
| `app/index.tsx` | Add throttle check, generation flow, loading state, route param on navigate |
| `app/respond.tsx` | Read `promptText` / `promptCategory` from route params; fall back to DB |

**Unchanged:** `src/prompts/next.ts`, `src/prompts/selection.ts`, `next.test.ts`, all existing DB schema.

---

## Testing

| Target | Tests |
|---|---|
| `src/context/weather.ts` | Successful fetch maps weathercodes correctly; timeout returns null; non-200 returns null |
| `src/context/gather.ts` | Light signals correct for a fixed date; rich signals populated when location + weather succeed; null fields when either fails |
| `src/prompts/ai.ts` | Context line included in prompt string when `context` provided; absent when not; existing tests unchanged |
| `app/index.tsx` | Fallback path: when `generateAiPrompt` returns null, cached prompt from DB is displayed |
| `next.test.ts` | Completely untouched |

---

## Out of Scope

- Offline light-context library selection (architecture supports it; library expansion is a separate follow-up)
- Mascot/persistent character (loading slot is reserved; mascot is a separate feature)
- Showing the user any indication of what contextual signals were used
- Per-entry context metadata stored on the entry
- Weather beyond condition + temperature (no UV, wind, humidity, etc.)

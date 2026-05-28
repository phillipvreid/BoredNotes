# Offline-Only Mode — Design Spec

**Date:** 2026-05-28  
**Status:** Approved

---

## Overview

Add a toggle in Settings that disables AI prompt generation entirely. When active, BoredNotes draws prompts exclusively from the built-in curated library (~70 prompts), making no network calls to the Claude API.

---

## Motivation

Some users prefer not to rely on AI or network connectivity for prompt generation. The offline-only mode gives them a predictable, fully local experience without degrading prompt quality — the curated library already covers a wide range of depth and categories.

---

## Data Layer

- **No schema changes.** The existing `settings` table already supports arbitrary key/value pairs via `getSetting` / `setSetting` in `src/db/settings.ts`.
- A new key `offline_mode` is stored with values `'true'` / `'false'`. Default: `'false'` (AI enabled).
- Follows the same pattern as `theme_dark` and `theme_accent`.

---

## Prompt Orchestrator (`src/prompts/next.ts`)

- On prompt generation, read `offline_mode` from settings before the AI branch.
- If `offline_mode` is `'true'`, skip the ~25% AI probability check and call `selection.ts` directly.
- No changes to `src/prompts/ai.ts` — it simply is not called.

---

## Settings Screen (`app/settings.tsx`)

- Add a new toggle row below the dark mode toggle.
- **Label:** "Offline mode"
- **Subtitle:** "Use built-in prompts only, no AI"
- Uses the same Switch component pattern as the dark mode toggle.
- On toggle:
  1. Write new `offline_mode` value to the settings DB.
  2. Call `next.ts` to generate and persist a fresh local prompt as `current_prompt`.
- No indicator shown on the Home screen — the Settings toggle is the sole signal.

---

## Home Screen Behaviour

- The Home screen (`app/index.tsx`) reads `current_prompt` from the settings DB on focus.
- When the user toggles offline mode in Settings and navigates back, the Home screen displays the newly generated local prompt automatically.
- No additional state management or context changes required.

---

## Out of Scope

- No visual indicator on the Home screen for offline mode status.
- No per-session override (the toggle is a persistent preference).
- No changes to the prompt library or selection weighting — the existing algorithm runs as-is, just without the AI branch.

---

## Verification

1. Toggle offline mode on in Settings.
2. Navigate to Home — prompt should have refreshed to a local one (no AI-style phrasing).
3. Kill and relaunch the app — offline mode should still be active, prompt still local.
4. Toggle offline mode off — next prompt generation should resume normal AI-enhanced behaviour (~25% AI prompts).
5. Confirm no network calls are made to the Anthropic API while offline mode is active (check with network inspector or by disabling internet).

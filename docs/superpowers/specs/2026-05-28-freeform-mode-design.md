# Freeform Mode — Design Spec
**Date:** 2026-05-28
**Status:** Approved

---

## Overview

Freeform mode lets users switch the app from prompted journalling (current behaviour) to open, unprompted writing. It is a sticky setting — set once, persists until changed. All attachment tools (photo, camera, voice memo, location) remain available in both modes.

---

## Data Model

### `entries` table — migration

```sql
ALTER TABLE entries ADD COLUMN entry_mode TEXT NOT NULL DEFAULT 'prompted'
```

- Valid values: `'prompted'` | `'freeform'`
- All existing rows receive `'prompted'` automatically via the `DEFAULT`
- Freeform entries store `prompt_text = ''` (the column stays `NOT NULL`)
- Migration runs once on app launch in `database.ts`, immediately after the existing `execAsync(CREATE_TABLES_SQL)` call, using a try/catch (SQLite throws `duplicate column name` if the column already exists, which is silently swallowed):
  ```ts
  try {
    await _db.execAsync(
      `ALTER TABLE entries ADD COLUMN entry_mode TEXT NOT NULL DEFAULT 'prompted'`
    );
  } catch {}
  ```

### `settings` table — new key

| Key | Values | Default |
|-----|--------|---------|
| `respond_mode` | `'prompted'` \| `'freeform'` | `'prompted'` (absent key treated as prompted) |

Read with `getSetting(db, 'respond_mode')`, written with `setSetting`.

### `src/types.ts`

Add `entry_mode: 'prompted' | 'freeform'` to the `Entry` interface.

---

## Settings Screen

A new **"WRITING"** section is added above the existing "ABOUT" section. It contains one row:

- **Label:** "Freeform mode"
- **Subtitle:** "Write without a prompt"
- **Control:** `Switch` (same pattern as the Dark Mode row)

On mount, the screen reads `respond_mode` from the DB (defaults to `'prompted'` if the key is absent). Toggling the switch immediately writes the new value. No context or state lifting required — affected screens re-read from DB on each focus via `useFocusEffect`.

---

## Home Dashboard

The Home screen reads `respond_mode` in its existing `useFocusEffect` call alongside the current prompt.

| Element | Prompted mode | Freeform mode |
|---------|--------------|---------------|
| Card label | "Today's prompt" | "Today's entry" |
| Card body text | Prompt text (Georgia italic) | "What's on your mind…" (muted italic placeholder) |
| Tap hint | "Tap to respond →" | "Tap to write →" |
| Navigation on tap | `/respond` | `/respond` (unchanged) |

Loading state and `ActivityIndicator` behaviour are unaffected.

---

## Respond Screen

The Respond screen reads `respond_mode` on mount.

### Freeform mode (`respond_mode = 'freeform'`)

- Prompt `Text` block at the top is not rendered
- `TextInput` auto-focuses as normal — user lands directly in writing mode
- A faint right-aligned italic label **"writing freely"** is shown just below the input's bottom border, in `colors.textMuted`
- All attachment rows (photo, camera, voice memo, location) are unchanged
- On submit: `createEntry` called with `entry_mode: 'freeform'` and `prompt_text: ''`
- `getNextPrompt` is still called after submit, keeping a fresh prompt queued for if the user switches back

### Prompted mode (`respond_mode = 'prompted'`)

Behaviour is identical to today. No indicator shown.

---

## Entry Detail

`app/entry/[id].tsx` — when `entry.entry_mode === 'freeform'`:

- The prompt `Text` block is not rendered
- Layout: date/location header followed directly by response text
- No label or placeholder substituted — clean content leading

Prompted entries are unchanged.

---

## Share Card

`src/share/renderer.tsx` — the renderer currently renders `"${promptText}"` unconditionally. A non-empty guard (`{promptText && <Text>...}`) causes the prompt line to disappear for freeform entries (where `promptText = ''`) across all four templates. The card layout tightens naturally and response text takes the space. No "freeform" label is added to the card. No change needed in `app/share/[id].tsx`.

---

## Files Changed

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `entry_mode TEXT NOT NULL DEFAULT 'prompted'` to the `entries` CREATE TABLE statement (for fresh installs) |
| `src/db/database.ts` | Add try/catch `ALTER TABLE entries ADD COLUMN entry_mode` after `CREATE_TABLES_SQL` (for existing installs) |
| `src/db/entries.ts` | Add `entry_mode` to `CreateEntryInput`; include in `INSERT` |
| `src/types.ts` | Add `entry_mode: 'prompted' \| 'freeform'` to `Entry` |
| `app/settings.tsx` | Add Writing section with Freeform toggle |
| `app/index.tsx` | Read `respond_mode`; swap card label, body text, tap hint |
| `app/respond.tsx` | Read `respond_mode`; hide prompt; show "writing freely"; pass `entry_mode` to `createEntry` |
| `app/entry/[id].tsx` | Conditionally skip prompt block for freeform entries |
| `src/share/renderer.tsx` | Guard prompt `Text` block — only render when `promptText` is non-empty |

---

## Out of Scope

- Per-entry mode override (mode is sticky only)
- Any indicator of mode on the Home screen beyond card content changes
- Freeform-specific search or filtering in the Entries / Timeline screens

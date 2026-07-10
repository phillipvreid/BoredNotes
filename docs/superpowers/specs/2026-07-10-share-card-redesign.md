# Share Card Redesign — Arcade Sticker ("Setup & Punchline") — Spec

**Date:** 2026-07-10
**Status:** Approved — ready for implementation plan
**Supersedes:** `docs/superpowers/specs/2026-06-04-share-card-redesign.md` (passport/photo/signal cards)

---

## Overview

The share **screen chrome** already uses the Arcade Sticker system (Mascot, SpeechBubble, IconSticker, Chip, ActionButton). The exported **cards** do not — they are the June 2026 passport/photo/signal families: Georgia serif, passport MRZ codes, gold/copper/navy dark palettes, a separate visual language from the rest of the app.

This redesign replaces those nine cards with **one** card design — **"Setup & Punchline"** — built in the Arcade Sticker language. The card's job:

1. Make a **prompt→answer pair** look great — funny combos land like a meme; sincere lines read cleanly.
2. Act as **organic marketing** — every card carries a BoredNotes hook so strangers ask "what app is that?"
3. Stay **fun and silly**, carrying the app's tone and design through.

**Photos are out of scope entirely** — the photo feature has been cut from the app, so there is no photo card and no photo/media loading on the share screen.

No database, CSV, or schema changes. The `captureRef` → `Sharing.shareAsync` PNG flow is unchanged.

---

## The Card — "Setup & Punchline"

One design. Width **320px**, border radius **18px**, ~**-1.4°** tilt. Arcade Sticker surface recipe: **3px ink keyline**, **flat offset shadow** (no blur), cream/theme paper.

### Anatomy (top to bottom)

1. **Setup band** — full-width block in the entry's **category hue**, white text.
   - **Kicker** — Space Mono 700, ~8px, letter-spacing ~1.5px, uppercase, white at ~0.7 opacity.
   - **Setup line** — Georgia italic, ~14px, line-height ~1.35, white.
   - **Prompted entry:** kicker = `TODAY'S PROMPT`; setup line = `entry.prompt_text`.
   - **Freeform entry:** kicker = a randomly-picked `FREEFORM_KICKERS` line (see Copy); setup line is **omitted** (kicker alone fills the band — the answer is the whole point). Band keeps its height via padding so the silhouette stays consistent.

2. **Punchline** — `entry.response_text` in **Bricolage Grotesque 800** display (`FONTS.display`), ink color, ~22px, tight line-height (~1.15). This is the hero. Padding ~18px.

3. **Ticket footer** — separated from the punchline by a **dashed ink divider** (the "torn ticket" line), padding ~12–18px, row, space-between:
   - **Left:** meta in Space Mono, ~8px, muted. `MMM D` date (when `showDate`), and `· LOCATION` appended when `showLocation` and `entry.location_label` is present. If both are hidden, the left slot is empty.
   - **Right:** the **growth hook lockup** — Mascot glyph + `BoredNotes` wordmark (Bricolage, ~12px, ink) + a small rotating tagline beneath (Space Mono, ~7.5px, muted), picked from `SHARE_TAGLINES`.

### Prompted vs. freeform summary

| | Kicker | Setup line | Punchline | Band hue |
|---|---|---|---|---|
| Prompted | `TODAY'S PROMPT` | `prompt_text` | `response_text` | category hue |
| Freeform | random `FREEFORM_KICKERS` | — (omitted) | `response_text` | category hue |

---

## Color & Theming — fully automatic, no picker

The card derives all color from context. There is **no style picker and no color picker** on the share screen.

- **Setup band + hue accents** = `categoryStyles[entry.category].color` from `useTheme()` — OBSERVE / REFLECT / CONFESS / IMAGINE / RANK+DEFEND.
- **Null category** (legacy rows, `entry.category === null`) → neutral **ink**-colored band with kicker `PROMPTED` (prompted) or the freeform kicker (freeform). This mirrors the FeedTab "PROMPTED" fallback.
- **Paper + ink + muted text** = the user's **active concession-stand theme** via `colors` from `useTheme()`, so the card matches whatever theme the app is in (e.g. Grape Soda → grape-tinted paper).
- **Yellow stays reserved** — the action color is never used as the band or card background. (See `borednotes-design-system` memory: reserved-color rule.)

Because color is derived, the card preview updates when the user switches app theme in Settings, but the share screen itself exposes no color controls.

---

## Share Screen (`app/share/[id].tsx`)

### Remove
- The **STYLE** chip row (`CARD_STYLES.map(...)` + `styleId` state).
- The **COLOUR** dots row (`currentStyle.variants.map(...)` + `variantId` state).
- All **photo/media** logic: `getMediaForEntry` import + call, `photo` state, `photoUri` prop.
- Imports of `Chip` if no longer used elsewhere on the screen, and `DEFAULT_STYLE_ID` / `DEFAULT_VARIANT_ID`.

### Keep (unchanged behavior)
- Header row with the `IconSticker` close button.
- Mascot + SpeechBubble intro (`SHARE_LINES` quip).
- The live **card preview** (`ShareCard` via `cardRef`).
- **"Show date"** toggle, and **"Show location"** toggle rendered only when `entry.location_label` is present.
- `SEND IT` `ActionButton` → `captureRef(cardRef, { format: 'png', quality: 1 })` → `Sharing.shareAsync`. Loading label `PREPARING…` unchanged.

### Result
The screen is: close button → mascot quip → card preview → two toggles → `SEND IT`. Simpler than today.

---

## Architecture

### Delete
- `src/share/passport-card.tsx`
- `src/share/photo-card.tsx`
- `src/share/signal-card.tsx`

### `src/share/renderer.tsx` — rewrite to one card
- Single `ShareCard`, keeping the existing `React.forwardRef<View, ShareCardProps>` contract so `captureRef` still works.
- **Props** (revised): `promptText`, `responseText`, `createdAt`, `location`, `showDate`, `showLocation`, `entryMode`, `category` (`PromptCategory | null`). **Removed:** `styleId`, `variantId`, `photoUri`.
- Reads `colors` + `categoryStyles` from `useTheme()` internally (it renders live in the app, not headless), OR receives resolved `bandColor` + `colors` as props — **decide in the plan**; prefer reading `useTheme()` inside for a smaller call site, provided `captureRef` still captures correctly (it captures the mounted view, so context is available).
- Pure helpers extracted for testability (see Testing): band-content selection, footer meta string, kicker/tagline pickers.

### `src/share/templates.ts` — remove or shrink
- The multi-family `CARD_STYLES` / `Passport|Photo|Signal` token interfaces are deleted. If nothing else needs the file, delete it and its imports; otherwise it retains only small shared constants (e.g. card width). **Decide in the plan.**

### `src/theme/copy.ts` — add
- `FREEFORM_KICKERS: string[]` — playful band labels for freeform entries, e.g. `"NO ONE ASKED, BUT—"`, `"UNPROMPTED THOUGHT"`, `"BRAIN DUMP RECEIPT"`, `"FILED UNDER: WHATEVER"`. Voice: dry, sarcastic, never rude (per app principles).
- `SHARE_TAGLINES: string[]` — small footer taglines under the wordmark, e.g. `"professionally bored"`, `"the anti-scroll journal"`, `"bored on purpose"`.
- Both consumed via the existing `pick()` helper, chosen once per screen mount so the preview and the captured PNG match.

---

## Behavior / Edge Cases

| Scenario | Handling |
|---|---|
| Freeform entry (no prompt) | Kicker = random `FREEFORM_KICKERS`; setup line omitted; band still shown in category hue. |
| Null category (legacy row) | Neutral **ink** band; kicker `PROMPTED` (prompted) or freeform kicker (freeform). |
| No location | Location omitted from footer meta; "Show location" toggle hidden from the screen (unchanged). |
| Show date off | Date omitted from footer meta; footer left slot may be empty. |
| Both date + location hidden | Footer left slot renders empty; hook lockup stays right-aligned. |
| Long response text | Card is fixed 320px wide; punchline wraps and the card grows vertically. No truncation. |
| Long prompt text | Setup line wraps within the band; band grows vertically. |
| Game entry (`entry_kind` rank) | `response_text` already holds the plain-text rendering (per design system), so the card works unchanged; category hue = RANK+DEFEND green. |

---

## What Does Not Change

- `captureRef` + `Sharing.shareAsync` share flow and PNG output.
- Entry loading in `app/share/[id].tsx` (minus photo/media).
- "Show date" / "Show location" toggle behavior and conditional rendering.
- Database schema, migrations, CSV export.
- Card width (320px).
- The share screen's Mascot + SpeechBubble intro and `SHARE_LINES` copy.

---

## Testing

Pure functions extracted from the renderer, unit-tested (no DB, no capture):

- **Band content selection** — given `entryMode` + `category`, returns `{ kicker, setupLine | null, bandColor }`. Cases: prompted+category, freeform+category, prompted+null, freeform+null.
- **Footer meta string** — given `createdAt`, `location`, `showDate`, `showLocation`, returns the composed meta (date only / date · location / location only / empty).
- **Picker determinism** — `FREEFORM_KICKERS` / `SHARE_TAGLINES` pick is stable given a fixed seed/index (so preview == captured PNG).

Existing suites (search, CSV, theme) must stay green; `tsc --noEmit` clean.

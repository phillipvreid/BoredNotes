# Share Card Redesign — Spec

**Date:** 2026-06-04  
**Status:** Approved — ready for implementation

---

## Overview

Replace the existing 4 flat share-card templates with 9 purpose-designed cards across 3 style families. The current templates feel generic; the new designs have distinct personalities and a "passport to a memory" coherence. The share screen UI gains a 2-level picker (style tabs → colour dots) replacing the existing horizontal chip row.

No database changes. No CSV export changes. The capture-and-share mechanism is unchanged.

---

## The 9 Templates

**3 style families × 3 colour variants = 9 cards.**

Default selection: **Passport Gold**. All cards: width 320px, border radius 14px.

### Style 1 — Passport Stamp

Serif (Georgia). Structured like a passport page: thin gradient topbar, brand + circular date stamp, italic response body, meta field row, and a machine-readable-zone (MRZ) footer in monospace. Feels official, archival, designed.

**Card structure (top to bottom):**
1. **Topbar** — 3px gradient bar
2. **Inner body** (padding 20/22/16px, column, gap 11px):
   - **Header row**: `BOREDNOTES` brand label (9px, letter-spacing 0.22em, uppercase, sans-serif) left; circular stamp (44px) right. Stamp shows "entry" / "MMM D" / "YYYY".
   - **Divider** — 1px horizontal line
   - **Response** — 13.5px, italic, line-height 1.65
   - **Meta row** — `Location` + `Prompt` fields (each: 7.5px uppercase label + 10px value). Omit `Prompt` field on freeform entries. Omit `Location` field when no location.
3. **MRZ footer** — monospace, 2 lines:
   - Line 1: `P<BNBOREDNOTES<<<<<<<<<<<<<<<<<<<<<<<<`
   - Line 2: `YYYYMMDD<<<ENTRY<<<<<<<<<<<<<<<<<<<<<<` (location is always `<<<` — the MRZ is decorative, not data)

| Variant | bg | Accent gradient | Text | Meta |
|---|---|---|---|---|
| **Gold** | `#1b1f2e` | `#c9a96e` → `#e8c98a` | `#d8d8e8` | `#6070a0` |
| **Copper** | `#160f08` | `#b07030` → `#d89050` | `#e8ddd0` | `#5a4020` |
| **Navy** | `#080e1c` | `#2a60c0` → `#4a88e8` | `#d0d8f0` | `#2a4070` |

Additional tokens per variant (divider / MRZ bg / MRZ text):

- Gold: divider `#252b42` / MRZ bg `#12151f` / MRZ text `#2a3050`
- Copper: divider `#221810` / MRZ bg `#0e0a04` / MRZ text `#221810`
- Navy: divider `#101828` / MRZ bg `#040810` / MRZ text `#101828`

Stamp circle border and stamp label text use the accent colour at `0.3` and `0.5` opacity respectively. Brand label and stamp date use full accent colour.

---

### Style 2 — Photo Memory

Serif (Georgia). Polaroid-style: full-bleed photo area at top, response body below, footer with caption and watermark. Designed for entries with photos — the name makes this clear to the user so they know what to expect if they pick it for a photo-less entry.

**Card structure (top to bottom):**
1. **Photo area** — 150px tall, full card width. If entry has a photo, show it (`resizeMode: cover`). If no photo, show the variant's placeholder gradient (see below) — no text or icon, just the muted background.
2. **Body** (padding 14/18/4px, column, gap 7px):
   - **Prompt** — 10.5px, italic, 0.6 opacity. Omit entirely on freeform entries.
   - **Response** — 13px, line-height 1.65
3. **Footer** (padding 8/18/14px, row, space-between):
   - Left: caption — `Location · Date` (11.5px, italic), date formatted as "MMM D, YYYY" (e.g. "Jun 4, 2026"). If no location: date only. If no date: location only.
   - Right: `borednotes` (8px, letter-spacing 0.18em, uppercase, sans-serif, 0.4 opacity)

| Variant | Card bg | Photo placeholder gradient | Text | Muted |
|---|---|---|---|---|
| **Warm** | `#f5f0e8` | `#d9c9b0` → `#c8b090` | `#2a2018` | `#8a7060` |
| **B&W** | `#f2f2f2` | `#c0c0c0` → `#989898` | `#1a1a1a` | `#707070` |
| **Cool** | `#eaf4f8` | `#b0d4e8` → `#8ab8d4` | `#162030` | `#507090` |

Prompt text, caption, and brand all use the `muted` colour. Card has a drop shadow (`0 4px 20px rgba(0,0,0,0.45)`) — no border. Gradient direction: `135deg`.

---

### Style 3 — Signal Fragment

Sans-serif (system). Minimal dark card: thin accent bar, oversized decorative quote mark, response text, footer with location/date in monospace and brand watermark. Feels modern, extracted, like a transmitted signal.

**Card structure (top to bottom):**
1. **Accent bar** — 3px solid bar (accent colour)
2. **Inner body** (padding 16/20/20px, column, gap 9px):
   - **Decorative quote** — `"` character, 52px Georgia serif, line-height 0.65. Colour: very dark accent (see table).
   - **Response** — 14px, line-height 1.62
   - **Divider** — 1px line
   - **Footer row** (space-between, align centre):
     - Left: `s-meta` column (gap 3px):
       - Location line: `📍 Location` (10px, Courier New, accent colour). Omit when no location.
       - Date line: `YYYY-MM-DD · prompted` or `YYYY-MM-DD · freeform` (10px, Courier New, muted). Always shown.
     - Right: `borednotes` (8.5px, letter-spacing 0.2em, uppercase, 0.2 opacity)

| Variant | bg | Accent | Quote mark | Text | Divider | Date muted |
|---|---|---|---|---|---|---|
| **Purple** | `#0d0d0d` | `#7c3aed` | `#200840` | `#e8e8f0` | `#1c1c24` | `#3a3a4a` |
| **Ember** | `#0d0d0d` | `#d97706` | `#1e1000` | `#f0ece4` | `#1c1810` | `#3a3020` |
| **Teal** | `#0d0d0d` | `#0d9488` | `#001a18` | `#e4f0ee` | `#101c1a` | `#203830` |

Location line uses the accent colour. Date/mode line uses the `date muted` colour. Card border: 1px solid — Purple `#1a0a2a`, Ember `#1e1000`, Teal `#001a18`.

---

## Share Screen UI

Replaces the existing horizontal template-chip scroll with a 2-level picker.

```
[ Share ]                              ✕

  ┌─────────────────────────────────┐
  │  [Passport card preview]        │
  └─────────────────────────────────┘

  STYLE
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Passport │  │  Instant │  │  Signal  │
  └──────────┘  └──────────┘  └──────────┘
  (active tab: accent-tinted bg + accent text + accent border)

  COLOUR
  ●  ●  ●     (28px gradient dots, active = accent ring)
  Gold  Copper  Navy
  (labels update per style)

  ─────────────────────────────────────────
  Show date                          [ ⚙ ]
  ─────────────────────────────────────────
  Show location                      [ ⚙ ]   ← only when entry.location_label != null
  ─────────────────────────────────────────

  [         Share →         ]
```

**Picker behaviour:**
- Switching style tabs resets variant to that style's first variant (index 0).
- Colour dots are gradient swatches: each shows a `135deg` blend of accent → bg colour.
- Dot labels update to match the selected style's variant names: Passport → Gold/Copper/Navy; Instant → Warm/B&W/Cool; Signal → Purple/Ember/Teal.
- Active dot has an accent-coloured border ring.
- Active tab uses accent-tinted background, accent text, accent border — all using `accent.buttonColor` from `useTheme()`, consistent with the rest of the app.
- Card preview updates instantly on any picker or toggle change.

**Toggles:**
- "Show date" and "Show location" — existing `Switch` components, unchanged behaviour.
- "Show location" row is conditionally rendered (only when `entry.location_label` is not null) — unchanged from current.

**Watermark:** `borednotes` is baked into every card design. Not a toggle. Not shown as a UI control.

---

## Architecture

Three files change. Nothing else.

### `src/share/templates.ts` — full rewrite

Replace `ShareTemplate[]` with a `CardStyle[]` structure:

```ts
// Typed token interfaces — one per style family, so the compiler catches typos
export interface PassportTokens { bg: string; border: string; accentStart: string; accentEnd: string; text: string; meta: string; divider: string; mrzBg: string; mrzText: string; }
export interface PhotoTokens { bg: string; photoGradientStart: string; photoGradientEnd: string; text: string; muted: string; }
export interface SignalTokens { bg: string; border: string; accent: string; quoteColor: string; text: string; divider: string; dateMuted: string; }

export interface StyleVariant {
  id: string;
  label: string;
  tokens: PassportTokens | PhotoTokens | SignalTokens;
  // gradient dot colours for the picker [accent, bg]
  dotGradient: [string, string];
}

export interface CardStyle {
  id: 'passport' | 'instant' | 'signal';
  label: string;
  variants: StyleVariant[];
}

export const CARD_STYLES: CardStyle[] = [ /* see above */ ];

export const DEFAULT_STYLE_ID = 'passport';
export const DEFAULT_VARIANT_ID = 'gold';
```

The `tokens` object carries all per-variant colour values needed by that style's renderer component.

### `src/share/renderer.tsx` — full rewrite

Three focused card components plus a router:

- `PassportCard` — renders the passport stamp layout. Props: entry data + passport variant tokens.
- `InstantCard` — renders the instant photo layout. Props: entry data + instant variant tokens + `photoUri`.
- `SignalCard` — renders the signal fragment layout. Props: entry data + signal variant tokens.
- `ShareCard` — top-level router component (same name, same `ref` forwarding contract as today). Receives `styleId + variantId + entry data`; resolves the right tokens and delegates to the right card component.

`ShareCard` replaces the `template` prop with `styleId: string` and `variantId: string`. All entry data props stay unchanged: `ref`, `showDate`, `showLocation`, `promptText`, `responseText`, `date`, `location`, `photoUri`.

### `app/share/[id].tsx` — picker UI update

- Replace `templateId: string` state with `styleId: string` + `variantId: string`.
- Replace `DEFAULT_TEMPLATE_ID` import with `DEFAULT_STYLE_ID` + `DEFAULT_VARIANT_ID`.
- Replace the `TEMPLATES.find(...)` lookup with `CARD_STYLES.find(s => s.id === styleId)?.variants.find(v => v.id === variantId)`.
- Replace the horizontal chip scroll with the 2-level picker: style tabs row + colour dots row + labels row.
- Pass `styleId` and `variantId` to `ShareCard` in place of `template`.
- Switching style tab resets `variantId` to the new style's first variant id.

---

## Behaviour / Edge Cases

| Scenario | Handling |
|---|---|
| Freeform entry (no prompt) | Omit prompt field from all cards. Passport: no "Prompt" meta item. Instant: no `i-prompt` line. Signal: unaffected (no prompt shown anyway). |
| No photo (Photo Memory) | Show 150px placeholder area with variant's muted gradient. No placeholder text. |
| No location | Omit location from Passport meta row; omit location from Instant caption; omit `📍` line from Signal footer. Location toggle hidden from share screen. |
| Long response text | Cards are fixed width (320px). Text wraps naturally. No truncation — the card can grow vertically. |
| Freeform entry mode in Signal date line | Show `· freeform` suffix instead of `· prompted`. Derived from `entry.entry_mode`. |

---

## What Does Not Change

- `captureRef` + `Sharing.shareAsync` share flow
- Entry and photo loading logic in `app/share/[id].tsx`
- "Show date" / "Show location" toggle behaviour and conditional rendering
- Database schema
- CSV export
- Card width (320px)

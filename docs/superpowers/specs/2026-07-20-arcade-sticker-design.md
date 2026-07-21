# Arcade Sticker Design System

**Date:** 2026-07-20 (backfilled — design shipped 2026-07-01, v2 shipped 2026-07-06 via PRs #17–#20)
**Status:** Shipped, on `main`

This doc backfills the one shipped feature without a spec: the app's reskin from
its original look to "Arcade Sticker," plus the v2 pass that added full themes
and the first micro-game. Written after the fact from the current code, not
before it — it documents what shipped, not a proposal.

## Overview

Arcade Sticker is BoredNotes' visual identity: warm paper backgrounds, a single
near-black keyline + flat offset-shadow surface recipe used everywhere, hand-placed
(never random) tilts, and one reserved action color that always means "do the
thing." Source of truth is the claude.ai/design project
`2baf7def-04cb-4fb2-9382-e3cdedb778dd` (`ui-kit/Borednotes Kit.dc.html` →
`ui-kit/MDFrame.dc.html`, tokens in `tokens/*.css`, copy deck in `content.json`);
the RN app is a hand-port of that kit, not a generated one.

## Design tokens (`src/theme/tokens.ts`)

- **Surface recipe:** every card/button/chip is a `Sticker` — a 2.5px keyline
  (`KEYLINE`, 3px `KEYLINE_HEAVY` for the CTA) plus a flat, un-blurred offset
  shadow (3/4/5px for rows/cards/stickers — `SHADOW_SM`/`SHADOW_CARD`/`SHADOW_STICKER`).
  Press state translates the surface `(2, 2)` and halves the shadow offset —
  no opacity or scale change. One recipe, no per-screen variants.
- **Tilts:** `TILTS = [-1.5, 1.2, -1]`, cycled by index, never randomized —
  "wonky, never random" per the source comment. Gated off entirely by the
  `wonky` setting (see [[Settings Sprint]] spec) for the Home/Feed card stacks
  only; the mascot speech bubble and Rank & Defend numerals keep their tilt
  regardless, since they're illustration, not chrome.
- **Typography:** Bricolage Grotesque 800 (`FONTS.display`) for numerals and
  display text, Hanken Grotesk (`FONTS.body*`, four weights) for body/input,
  Space Mono 700 (`FONTS.label`) for labels/chips/badges. Loaded via
  `@expo-google-fonts` in `app/_layout.tsx`.
- **Reserved action color:** `ACTION = '#FFD23E'` (classic theme) is used only
  for the primary CTA (`ActionButton`) and equivalent single-emphasis actions.
  This rule generalizes per theme (see below) — a theme's `action` color always
  carries that theme's `ink` as text/border color on top of it, never anything else.

## Themes (`ThemeDef[]`, added in v2 — 2026-07-05)

The old paper picker (cream/white/mint/bubblegum backgrounds only) became six
full palette themes, named like a concession stand: **Classic, Blue Raspberry,
Sour Apple, Grape Soda, Bubblegum, Cherry Cola**. Each `ThemeDef` carries:

- `ink` (keyline + light-mode text) and `action` (the reserved CTA color, always
  paired with `ink` as its text)
- `paper: { light, dark }` — the background per appearance mode
- `lightText` (secondary/muted/timestamp grays) and a full `dark` set
  (surface/sheet/border/text/secondary) for dark mode
- `cats: CatHues` — the theme's own tint of the 8 category hues

`makePalette(theme, isDark)` derives the full `Palette` (20 semantic keys —
`bg`, `surface`, `border`, `actionInk`, `toastBg`, etc.) from a `ThemeDef` +
appearance flag; components consume `useTheme().colors`, never raw theme fields.

**Category hues stay recognizable across themes:** each of the 8 categories
(reflect/observe/confess/rank/take/nostalgia/gossip/imagine) keeps its hue
*family* in every theme — REFLECT is always some blue, GOSSIP always some red —
only the specific tint shifts per theme. All 8 hues are chosen dark enough to
carry white text. Components read `categoryStyles`/`catHues` from `useTheme()`,
not the static `CATEGORY_STYLES`/`CAT_HUES` exports (which remain as
classic-theme defaults for theme-independent uses).

Setting key: `theme_id`. Legacy `theme_paper` values migrate via
`LEGACY_PAPER_TO_THEME` (cream/white → classic, mint → sour-apple, bubblegum →
bubblegum) so nobody's app changes color on update. Reference doc with hexes +
mock previews: `docs/theme-palettes.html`.

## Voice (`src/theme/copy.ts`)

Deadpan, faintly rude, never evaluative, no emoji — CTA labels ("CLEAR THE
BRAIN TUBES"), mascot quips, save toasts ("SAVED. POINTLESS. PERFECT.") all
draw from small rotating pools rather than one fixed string, so repeat visits
don't feel scripted.

## Component inventory (`src/components/ui/`)

All built on `Sticker` (the one surface primitive):

- `Sticker` — base surface: keyline, offset shadow, press transform, optional
  tilt with `shouldRasterizeIOS` (rotated layers don't anti-alias on iOS, so
  tilted stickers rasterize; untilted ones skip the memory cost).
- `ActionButton` — the reserved-color CTA, `md`/`lg` sizes, optional arrow.
- `Chip`, `IconSticker` (40×40 back-button/menu square), `OutlinedNumber`
  (Rank & Defend's 1/2/3 medals), `Mascot` + `SpeechBubble` (idle
  bob/blink + rotating quip), `Toast` (global save confirmation).

## Micro-game plumbing

Games are generic, not bolted on. `PromptKind`/`EntryKind` = `'text' | 'rank' |
'loveHate'`. A prompt carries `kind` + a JSON `game_config`; a submitted entry
carries `entry_kind` + JSON `game_data`. Every game module exports a
`parse*Config`/`parse*Data` pair plus a `render*ResponseText()` that flattens
the structured data to plain text, which is always what's stored in
`entries.response_text` — this is what keeps search, CSV export, and share
cards game-agnostic; they never need to know a game exists.

Two games ship: **Rank & Defend** (`src/games/rank.ts`, category hue `#15A150`
family, 3 ranked slots + a one-line defense of #1) and **Love it / Hate it**
(`src/games/loveHate.ts`). Adding a third game means: a new `PromptKind` value,
a config/data parser + renderer in `src/games/`, a reply-UI branch in
`app/respond.tsx`, and a hit-card branch in `FeedTab`. The plain-text prompt
flows (`contextual.ts`, `next.ts`, Help Me Write) all filter `onlyKind: 'text'`
so games never leak into prompt selection.

## Help Me Write (chip-driven, `src/prompts/ai.ts`)

Help Me Write prompts have no homescreen category to anchor to, so
`buildTopicInstruction()` builds an instruction from whichever context chips
(place/weather/time/memory) are active, each with its own forceful angle and a
worked example — e.g. the place angle must name the user's actual location
(`ctx.locationLabel`) when known rather than staying abstract. No chips active
falls back to a broad, low-stakes prompt. The Respond screen's pill shows the
active chip name(s), not a homescreen category label. This intentionally
diverged from the original homescreen taxonomy after early on-device testing
showed AI prompts secretly inheriting a hidden category and being mislabeled.

## Non-goals

- Not a generated design-to-code pipeline — the kit is a reference, ported by
  hand into `tokens.ts`/`copy.ts`/`src/components/ui/`.
- No per-screen surface variants — one `Sticker` recipe everywhere is a
  deliberate constraint, not a gap.
- Randomized tilts, animation-driven theme transitions, and a user-facing
  theme editor were all considered and rejected in favor of the fixed
  six-theme set.

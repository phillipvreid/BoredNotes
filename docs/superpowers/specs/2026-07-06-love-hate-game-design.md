# Love it / Hate it — micro-game design

**Date:** 2026-07-06
**Status:** Approved (brainstormed with visual companion; layout locked against mockup v3)

## What it is

A second micro-game alongside Rank It. The game deals a random theme (e.g.
"Fruit"); the user names one thing in that theme they love and one they hate.
Two required text lines, nothing else. No reshuffle — you commit to the theme
you're dealt.

## Decisions made during brainstorming

- **One prompt, random theme** — a single library prompt; the theme is picked
  at random from a built-in list each time the respond screen opens. Not a
  batch of themed prompts, not user-entered themes.
- **Just two fields** — Love it + Hate it. No "defend"/why line.
- **No reshuffle** — fits the app's "no scoring, just commit" attitude.
- **Themes live in `game_config`** (Approach A) — data-driven like Rank's
  `slots`, so adding themes later is a library.json edit that reaches existing
  installs through the normal seed re-sync.
- **No footer quip** on the respond screen for this game (unlike Rank's
  "committed to the bit").

## Data model

No schema changes. The existing `prompts.game_config` and `entries.game_data`
columns carry everything.

**Types** (`src/types.ts`):

- `PromptKind` and `EntryKind` become `'text' | 'rank' | 'loveHate'`.
- New interfaces:

```ts
interface LoveHateGameConfig { themes: string[] }
interface LoveHateGameData  { theme: string; love: string; hate: string }
```

**Prompt library** (`src/prompts/library.json`): one new entry —
`category: "game"`, `depth: 1`, `kind: "loveHate"`, text
"Love it / Hate it. The theme decides, you commit." (this is the default copy;
tweak only if a better line comes up in review), plus a `themes` array of ~25–30 short, punchy themes (Fruit,
Condiments, Weather, Breakfast foods, Small talk topics, Smells, Airport
rituals, …). Seed logic maps `themes` → `game_config` JSON the same way it
maps Rank's `slots`.

**Saved entry:** `entry_kind: 'loveHate'`,
`game_data: {"theme":"Fruit","love":"Grapes","hate":"Pears"}`, and a plain-text
`response_text` (see game module) so downstream features need no game
knowledge.

## Game module — `src/games/loveHate.ts`

Mirrors `src/games/rank.ts`:

- `parseLoveHateConfig(json)` / `parseLoveHateData(json)` — defensive JSON
  parsing; return `null` on anything malformed.
- `DEFAULT_LOVE_HATE_THEMES` — small built-in fallback list so a missing or
  unparseable config never yields a blank game.
- `pickLoveHateTheme(themes)` — uniform random pick; falls back to the default
  list when given an empty/missing array.
- `renderLoveHateResponseText(data)` — plain text stored in `response_text`:

```
Fruit
Love it: Grapes
Hate it: Pears
```

## Respond screen (`app/respond.tsx`)

Follows the `isRank` branching pattern with an `isLoveHate` branch.

- **Theme deal:** parsed from `game_config.themes` and picked once in a
  `useState` initializer — stable for the life of the screen; re-renders and
  keyboard events never reshuffle it. The dealt theme is what gets saved in
  `game_data.theme`.
- **Layout (locked against mockup v3):** production-style game card — the
  LOVE IT / HATE IT chip sits inside the card top-left on the dark scrim,
  the dealt theme headlines the card in display type (no "THE THEME" label),
  the framing line "one you love, one you hate. no takebacks." (default copy)
  sits under it, and the mini yellow mascot peeks over the
  card's bottom-right edge. Below the card: two stacked sticker input rows —
  a LOVE IT tag + input, then a HATE IT tag + input — with sarcastic
  placeholders (e.g. "the one you'd defend in court…" / "the one that should
  apologize…"). No footer quip line. Send button unchanged (yellow stays
  reserved for it).
- **Tag hues:** defaults from the kit's category hues — LOVE IT tag on
  `rank` green (#15A150), HATE IT tag on `gossip` red (#FF4438), as mocked.
  Adjust only if they clash on device; never yellow.
- **Validation:** both lines required (trimmed non-empty) to send; alert copy
  in the app's voice if incomplete.
- **Unsaved-content guard:** back-navigation warning when either line has
  text, same as Rank.
- **On save:** `entry_kind: 'loveHate'`, `game_data` JSON, `response_text`
  from the renderer.

## Display

- **Feed (`src/boredbefore/FeedTab.tsx`):** loveHate entries get their own
  pill — label `LOVE + HATE` (parallel to Rank's `RANK + DEFEND`) on the
  kit's `nostalgia` pink (#F5468C) so it reads distinctly from Rank's green —
  and a compact custom rendering mirroring the Rank treatment — theme as a small bold header, then
  the two answers with their tags.
- **Entry detail (`app/entry/[id].tsx`):** parses `game_data` like Rank —
  theme headline, then the two tagged rows in full sticker styling; falls back
  to plain `response_text` when `game_data` doesn't parse.
- **Search, CSV export, share cards:** no changes — they read
  `response_text`, which the renderer writes as plain text.

## Delivery

No changes to prompt selection. Game prompts are excluded from the main
rotation (`getNextPrompt` filters `onlyKind: 'text'`) and reach the user via
the home screen card stack, which samples the full prompt table with no
repeat-blocking — so the single prompt reappears indefinitely, dealing a fresh
theme each time. Known consequence: the card stack shows at most one `game`
category card per stack, so Love it/Hate it appears ~1 in 4 of game-card
appearances (competing with the 3 Rank prompts). Ship as-is; tune frequency
later only if it feels rare.

## Error handling

- Malformed/missing `game_config` → fallback theme list; game still playable.
- Malformed `game_data` on display → fall back to rendering `response_text`.
- Incomplete submission → in-voice alert, no save.

## Testing

Jest unit tests for `src/games/loveHate.ts`, matching the existing rank test
style:

- Config parsing: valid themes array; malformed JSON; wrong shapes; null.
- Data parsing: valid; missing fields; wrong types; null.
- Theme picking: returns a member of the given list; falls back to defaults
  for empty/missing input.
- Response text rendering: exact expected output for a sample entry.

UI behavior (theme stability, validation, save payload) is verified on the
simulator via `npx expo run:ios` (user-run).

## Out of scope

- Reshuffle button, third "why" field, per-theme prompt entries.
- Any change to prompt selection/delivery weighting.
- Share card or export format changes.

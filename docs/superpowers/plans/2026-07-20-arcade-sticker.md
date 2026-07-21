# Arcade Sticker Rollout — As-Built

> **Backfill note:** this documents already-shipped work (design system landed
> 2026-07-01, v2 landed 2026-07-06). It's an as-built reference, not a plan to
> execute — see `docs/superpowers/specs/2026-07-20-arcade-sticker-design.md`
> for the design spec this implements.

**Goal:** Reskin BoredNotes to the Arcade Sticker design system, then extend it
(v2) with six full color themes and the first micro-game (Rank & Defend).

## PR trail

| PR | Content | Status |
|----|---------|--------|
| (untracked pre-PR commits, 2026-07-01) | Initial Arcade Sticker reskin: tokens, `src/components/ui/`, copy deck, micro-game plumbing scaffolding | merged |
| #19 | v2 design system pass + Rank & Defend game | merged → `main` |
| #17 | Chip-driven Help Me Write + respond screen polish | merged (stacked on #19; needed #20 to actually reach `main`) |
| #18 | Six concession-stand themes | merged (same stacking issue) |
| #20 | Stack catch-up — landed #17/#18's content on `main` after the stacked-PR retarget gap | merged |

All confirmed on `main` at `b7a5a53` as of 2026-07-06, 175 tests passing, `tsc`
clean.

**Lesson from this rollout (recorded so it doesn't repeat):** GitHub only
auto-retargets stacked PRs to `main` when the base branch is deleted on merge;
this repo doesn't auto-delete branches. The base PR (#19) was merged first, so
#17/#18 silently merged into a now-stale feature branch instead of `main`; #20
was needed to catch the content up. Next time a stack is used: merge top-down,
manually retarget each PR to `main` after its base merges, or enable branch
auto-delete first.

## File map

**Tokens / theming**
- `src/theme/tokens.ts` — `ThemeDef`, `THEMES` (6 themes), `CatHues`,
  `makePalette()`, tilt/shadow/keyline constants, font map.
- `src/theme/copy.ts` — voice/microcopy pools.
- `src/theme/ThemeContext.tsx` — loads/persists `theme_id`, exposes
  `colors`/`theme`/`catHues`/`categoryStyles` via `useTheme()`.

**Components**
- `src/components/ui/Sticker.tsx` — base surface primitive.
- `src/components/ui/{ActionButton,Chip,IconSticker,OutlinedNumber,Mascot,SpeechBubble,Toast}.tsx`
  — everything else built on `Sticker`.

**Micro-game plumbing**
- `src/types.ts` — `PromptKind`/`EntryKind` (`'text' | 'rank' | 'loveHate'`),
  `RankGameConfig`/`RankGameData`, `LoveHateGameConfig`/`LoveHateGameData`.
- `src/games/rank.ts`, `src/games/loveHate.ts` — parse/render pairs per game.
- `app/respond.tsx` — reply-UI branch per `kind`.
- `src/boredbefore/FeedTab.tsx` — hit-card branch per `entry_kind`.

**Help Me Write**
- `src/prompts/ai.ts` — `buildTopicInstruction()` (chip-driven instruction
  builder), `buildContextLine()` (time/place/weather sentence assembly).
- `src/prompts/contextual.ts`, `src/prompts/next.ts` — plain-text prompt flows,
  both filter `onlyKind: 'text'` so games don't leak into prompt selection.

**Reference**
- `docs/theme-palettes.html` — hex values + rendered mock previews for all six
  themes.
- claude.ai/design project `2baf7def-04cb-4fb2-9382-e3cdedb778dd` — kit source
  of truth (`ui-kit/Borednotes Kit.dc.html`, `tokens/*.css`, `content.json`).

## Test coverage (already in place)

- `__tests__/games/rank.test.ts`, `__tests__/games/loveHate.test.ts` — parse/
  render round-trips per game.
- `__tests__/prompts/ai.test.ts` — `buildTopicInstruction()` per chip
  combination, `buildContextLine()` per modifier combination.
- `__tests__/theme/ThemeContext.test.tsx` — theme load/migrate/persist.
- Full suite: `npm test -- --runInBand`.

## Downstream work this unlocked

Everything else in `TODO.md`'s "Next feature candidates" and the Settings/Map/
Photo decisions built directly on this plumbing — the generic `kind`/
`game_config`/`entry_kind`/`game_data` split is why Love it / Hate it (PR #23)
was a same-day addition instead of a new subsystem, and the six-theme
`ThemeDef` shape is why the wonky-toggle and Light/Dark/System selector
(PR #25) needed no schema change.

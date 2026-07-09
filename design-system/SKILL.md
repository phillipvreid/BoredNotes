# Borednotes Design System

Use this skill whenever you design or build anything for **Borednotes** — screens,
components, share assets, marketing. It is the "Arcade Sticker" visual language.

## First step, always

Read `readme.md` (overview + the rules), then link `styles.css` in your output. Pull
real copy and seed data from `content.json` instead of inventing it. Reuse the
components in `components/` rather than rebuilding their look; match the foundation
specimens in `guidelines/`.

## The non-negotiables

- **Yellow = the action, and nothing else.** `--bn-action` is only the CTA / send /
  selected-action color. Never a category fill, never decoration.
- **Categories are colored stickers with white text.** One `--bn-cat-*` hue per
  category; white ink on top; the UPPERCASE category name in a Space Mono chip.
- **One surface recipe everywhere:** black keyline (2.5–3px) + flat offset shadow
  (3px rows / 4px cards / 5px stickers, no blur). Interactive press =
  `translate(2px,2px)` + halved shadow. Don't introduce soft/blurred shadows.
- **Wonky is intentional.** Hand-place small tilts (≈ ±1–1.5°); never randomize, and
  provide a way to flatten them for reduced-motion / a11y.
- **Type roles are fixed:** Bricolage Grotesque 800 for display/prompts/numbers,
  Hanken Grotesk for body/input, Space Mono 700 UPPERCASE for wordmark/chips/labels.
- **Voice:** deadpan, faintly rude, affectionate; pressure is theatrical, never a
  score or a fail. No emoji.

## Building screens

**`ui-kit/Borednotes Kit.dc.html` (rendered from `ui-kit/MDFrame.dc.html`) is the
canonical screen construction — match it exactly.** It holds all six screens in light
and dark. Don't re-derive screens from the components and hope they line up; mirror the
frame. Key Home facts people get wrong: the BOREDNOTES badge + menu sit at the top; the
mascot is on the LEFT with the heckle bubble on its right; the yellow **DUMP A THOUGHT**
CTA sits directly under the mascot (NOT at the bottom); the three category cards
(REFLECT / HOT TEA / RANK) stretch to fill; and a dark **YOUR GREATEST HITS · 37
BANGERS** archive bar is pinned at the very bottom. Screen rhythm: warm `--bn-paper`
background, ~18px side padding, top bar, content stack with 11–13px gaps.

The components in `components/` are the reusable pieces for building NEW screens; when
you assemble them, check the result against the kit so it doesn't drift.

## Components (in `components/`)

- **buttons/** `Button` (the sticker CTA / send; `action`/`ghost`/`dark`), `IconButton`
  (back / menu).
- **cards/** `CategoryCard` (Home prompt), `PromptSticker` (Reply headline + peeking
  mascot), `HitCard` (saved answer — text / rank / brain).
- **forms/** `Textarea` (answer input + escalating heckle counter), `RankSlot` (podium
  row, no scoring), `DefendPad` (soft-yellow defend note — uses #FFF6D6, NOT the action
  yellow).
- **feedback/** `Chip` (filter & meta), `Toast` ("filed under nonsense" save confirm),
  `EmptyState` (deadpan mascot), `ShareTile` (the screenshot export card).
- **brand/** `Mascot` (CSS **placeholder** — production needs an illustrated reactive
  character), `Wordmark`, `SpeechBubble`.

Each component has a `.prompt.md` with copy-paste examples and a `.d.ts` for props.

## When you need new copy

`content.json` already holds prompts (by category), rotating CTA labels, mascot quips,
reply microcopy, save-toast lines, share lines, and seed "greatest hits". Match its
register if you must add more: short, dry, a little mean, never mean-spirited.

## Don'ts

- Don't use yellow for anything but the action.
- Don't add gradients, blurred shadows, rounded-corner-plus-left-border cards, or
  emoji.
- Don't ship the CSS mascot as the final character — it's scaffolding.
- Don't randomize tilts or invent new category colors.

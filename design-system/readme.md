# Borednotes Design System — "Arcade Sticker"

The design language for **Borednotes**, a low-stakes boredom-killer app. The whole
system is one idea: **everything is a sticker** — a near-black keyline plus a flat,
un-blurred offset shadow, on warm cream paper. Tapping presses the sticker into its
own shadow. The tone is deadpan and faintly rude; the mascot heckles, but nothing is
ever scored or failed.

## Using it

Link the single entry stylesheet, then use the tokens or mount a component:

```html
<link rel="stylesheet" href="styles.css">
```

`styles.css` pulls in four token files from `tokens/`:

- `fonts.css` — the three webfonts (loaded from Google Fonts; see "Fonts" below)
- `colors.css` — ink, papers, the reserved action yellow, 8 category hues, dark mode
- `typography.css` — the Bricolage / Hanken / Space Mono scales
- `surface.css` — keyline widths, the offset-shadow + press recipe, radii, motion

Every value is a CSS custom property prefixed `--bn-`. Components fall back to literal
hexes when a token is missing, so a single `.jsx` works even without the stylesheet —
but link it so theming and dark mode work.

## The rules that make it Borednotes

1. **Yellow is reserved.** `--bn-action` (#FFD23E) only ever means "do the thing"
   (the CTA, the send button, a selected action). Never a category, never decoration.
2. **Eight category hues, white text.** Each prompt category owns one saturated,
   dark-enough hue (`--bn-cat-*`) and always carries white ink.
3. **One surface recipe.** 2.5–3px black keyline + flat offset shadow (3px rows,
   4px cards, 5px stickers). Press = `translate(2px,2px)` and halve the shadow.
4. **Wonky, never random.** Cards sit at small hand-placed tilts (−1.5°, 1.2°, −1°).
   The mascot bubble's −2° is constant. Offer a toggle to flatten for a11y.
5. **Three fonts, three jobs.** Bricolage 800 = display/numbers, Hanken = body/input,
   Space Mono 700 UPPERCASE = wordmark/chips/labels/counters.
6. **Theatrical pressure, never evaluative.** The mascot mocks affectionately; there
   is no score. No emoji.

## What's in here

- `tokens/` — the four token files (the source of truth).
- `guidelines/` — foundation specimen cards (colors, type, surface, brand, voice).
- `components/` — React components, one folder per group. Each component ships a
  `.jsx` (implementation), `.d.ts` (typed props), and `.prompt.md` (usage), with a
  `*.card.html` demo per group:
  - `buttons/` — Button, IconButton
  - `cards/` — CategoryCard, PromptSticker, HitCard
  - `forms/` — Textarea (+ heckling counter), RankSlot, DefendPad
  - `feedback/` — Chip, Toast, EmptyState, ShareTile
  - `brand/` — Mascot (placeholder), Wordmark, SpeechBubble
- `ui-kit/Borednotes Kit.dc.html` — the **canonical** screen kit: all six screens
  (Home · Reply·Text · Reply·Rank · Greatest Hits · Share · Toast) in light **and**
  dark, rendered from `ui-kit/MDFrame.dc.html` — the exact shipping frame, the same
  one the final review board renders. This is the source of truth for screen-level
  construction; build new screens to match it (CTA placement, the bottom Greatest
  Hits archive bar, mascot-left/bubble-right, etc.).
- `content.json` — all copy + seed data (prompts, quips, microcopy, seed hits).

## Components at a glance

The components are plain React (`export function`) and take their colors from the
`--bn-*` tokens. Mount them however your app loads React. Example:

```jsx
import { Button } from "./components/buttons/Button.jsx";
import { CategoryCard } from "./components/cards/CategoryCard.jsx";

<CategoryCard cat="REFLECT" color="var(--bn-cat-reflect)"
  text="If your boredom had a sound, what is it?" tilt={-1.5} onClick={open} />
<Button size="lg" block arrow>DUMP A THOUGHT</Button>
```

> The demo `*.card.html` files transpile the `.jsx` in-browser via a small loader
> (`components/_loader.js`) purely so the previews are build-free. Your real app
> should import the `.jsx` through its own bundler.

## Fonts

`tokens/fonts.css` loads Bricolage Grotesque, Hanken Grotesk, and Space Mono from the
Google Fonts CSS endpoint. This sandbox can't fetch and bundle the font binaries, so
they are **not** self-hosted here. For a fully offline/owned build, download the
`.woff2` files for those three families and replace the `@import` in `fonts.css` with
local `@font-face` rules — nothing else changes, the family names stay the same.

## Mascot

`components/brand/Mascot.jsx` is a **CSS placeholder** — it reserves space and sets the
personality (bored, bobbing, blinking). Production should swap in an illustrated /
animated character that reacts to what the user is typing.

## Dark mode

Add `class="bn-dark"` to any scope. Category hues, the action yellow, the mascot, the
medals, and the defend pad stay identical (they're already dark enough for white/black
text); only the neutral surfaces, text, borders, and shadows invert.

# Handoff: Borednotes — "Arcade Sticker" (Direction B)

## Overview
Borednotes is a low-stakes boredom-killer app. The user opens it when they have nothing to do, and it gives them something light to react to — a freeform brain dump, a category-tagged prompt, or a playful "rank & defend" micro-game. The personality is the product: a deadpan, faintly rude mascot ("an imaginary audience you're trying to entertain") that asks to be entertained. Engagement comes from **borrowed motivation** — a small objective removes the blank-canvas problem a bored, low-energy user faces.

This handoff covers the full v1 surface for the chosen visual direction (internally **B / "Arcade Sticker"**): the **home screen**, the **reply flow** (three reply modes), the **Greatest Hits** archive, and the **Share** sheet.

> **For developers / Claude Code:** start with `CLAUDE.md` in this folder — it has the recommended stack, data model, persistence schema, and a phased build plan. All copy and seed data is extracted into `content.json` so you don't re-type strings. This README is the source of truth for *look & feel*.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype demonstrating the intended look, motion, and behavior. They are **not production code to copy directly.** The task is to **recreate these designs in the target codebase's environment** (this reads as a phone-native app — React Native, Expo, or a web-to-app wrapper would all preserve the look well, since the prototype is already React-flavored) using that environment's established patterns, navigation, and state libraries. If no codebase exists yet, choose the most appropriate mobile framework and implement there.

The prototype is built as a single "Design Component" (`.dc.html`) plus two runtime helpers:
- `Borednotes B - MAIN DESIGN.dc.html` — the full design + interaction logic.
- `ios-frame.jsx` — the device bezel/status-bar mock (a **prototype-only** scaffold; do not ship it — the real app runs full-screen on a real device).
- `support.js` — the prototype runtime (prototype-only; not for production).

To view it: open `Borednotes B - MAIN DESIGN.dc.html` in a browser.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, motion, and copy are all specified below and should be recreated faithfully. The only deliberately unfinished element is the mascot (see *Assets* / *Mocked vs. real*).

---

## Screens / Views

### 1. Home
**Purpose:** Orient the user in two seconds and get them into a reply with the least possible activation energy. Shows the app's personality (mascot quip), one big freeform escape hatch, and exactly three tappable prompts.

**Layout:** Vertical flex column, full screen. Outer padding `58px 18px 24px` (top padding clears the status bar/notch). Top-to-bottom:
1. **Top bar** (flex row, space-between, `flex-shrink:0`):
   - Wordmark chip — black `#141414` rounded box, white text `BOREDNOTES`, Space Mono 700 / 13px / letter-spacing 2px, padding `6px 10px`, radius 8px.
   - Menu affordance — 40×40 white square, 2.5px `#141414` border, hard shadow `3px 3px 0 #141414`, radius 11px, three 4px black dots. **Decorative only** (no action wired). Intended as the future entry point to Settings.
2. **Mascot + speech bubble** (flex row, align-end, gap 10px, margin-top 14px):
   - Mascot — 96×87 (see *Assets*), `bob` float animation.
   - Speech bubble — white, 2.5px border, shadow `3px 3px 0`, radius 14px, padding `11px 13px`, rotated `-2deg`, `flex:1`. Text = current quip, Bricolage Grotesque 800 / 16px / line-height 1.12.
3. **Freeform CTA** (margin-top 16px, `flex-shrink:0`): yellow `#FFD23E`, 3px border, shadow `4px 4px 0`, radius 16px, padding `15px 18px`, flex row space-between. Left = rotating label (Bricolage 800 / 20px). Right = `→` (Bricolage 800 / 22px). Press state: `transform: translate(2px,2px); box-shadow: 2px 2px 0 #141414`.
4. **Section header** (margin-top 18px): `PICK ONE, GENIUS ↓`, Space Mono 800 / 13px / letter-spacing 0.5px.
5. **Three category cards** (flex column, gap 11px, `flex:1`) — see component below.
6. **"Your Greatest Hits" bar** (margin-top 13px, `flex-shrink:0`): black `#141414`, radius 14px, padding `13px 16px`, flex row space-between. Left = `★ YOUR GREATEST HITS` (Space Mono 800 / 14px, white). Right = `37 BANGERS` (Space Mono 800 / 13px, yellow `#FFD23E`). Tappable; press state `transform: scale(.985)`. **Opens the Greatest Hits archive** (slides up — see §4). The `37` is hardcoded in the prototype; wire to a real count.

**Category card component** (repeated ×3):
- Container: `flex:1`, background = category color, 3px `#141414` border, shadow `4px 4px 0`, radius 16px, padding `13px 15px`, flex column centered, cursor pointer. Rotated per "wonky" setting: `[-1.5, 1.2, -1]deg` for cards 1/2/3 (0 when wonky is off).
- Chip row (flex, gap 7px): category chip — `rgba(0,0,0,.22)` bg, white, Space Mono 700 / 10px / letter-spacing 1px, padding `3px 7px`, radius 6px; plus a muted "kind" label (Space Mono 700 / 10px, `rgba(255,255,255,.6)`).
- Question — white, Bricolage Grotesque 800 / 18px / line-height 1.08, margin-top 7px.
- Press state: `transform: translate(2px,2px); box-shadow: 2px 2px 0 #141414`.

### 2. Reply (slides in from the right over Home)
**Purpose:** Answer the chosen prompt. Same outer padding as Home. Slides in via `transform: translateX(100% → 0)`.

**Shared layout (all modes):**
1. **Top row** (flex, gap 12px): back button — 40×40 white square, 2.5px border, shadow `3px 3px 0`, radius 11px, `←` (Hanken 800 / 19px); plus a mono status label (Space Mono 800 / 13px / letter-spacing 1px).
2. **Prompt sticker** (margin-top 16px, `flex-shrink:0`): background = prompt's category color (brain dump uses blue `#2E5BFF`), 3px border, shadow `5px 5px 0`, radius 20px, padding `18px 18px 20px`, position relative. Inside: category chip (same style as card chip), then question (Bricolage 800 / 23px / line-height 1.06, max-width 250px). A small yellow `#FFD23E` mascot peeks from `bottom:-15px; right:16px` with the `bobR` animation.
3. **Send row** (margin-top 14px, flex, gap 12px): live counter text on the left (Space Mono / 13px, `#9b988c`); send button on the right — yellow, 3px border, shadow `4px 4px 0`, radius 14px, padding `13px 24px`, label (Bricolage 800 / 18px) + `→`. Same press state as the CTA.

**Mode A — Text prompt** (categories REFLECT / HOT TEA / CONFESS / HOT TAKE): single white input card (`flex:1`, 3px border, shadow `4px 4px 0`, radius 16px, padding 15px) containing a full-size `textarea`, font-size 18px / line-height 1.45. Placeholder `type here, genius…`. Auto-focuses on entry.

**Mode B — Brain dump** (the freeform CTA): identical to Mode A but sticker is blue `#2E5BFF`, chip reads `BRAIN DUMP`, status label `POINTLESS, BUT OK`, question copy `Say literally anything. Nobody is reading. Probably.`, placeholder `empty the skull here…`, send button reads `DUMP IT`.

**Mode C — Rank & Defend micro-game** (category RANK + DEFEND): replaces the single textarea with:
- Three numbered slot rows (flex column, gap 9px). Each row: white, 3px border, shadow `3px 3px 0`, radius 14px, padding `9px 12px`, flex row gap 10px. Leading 30×30 medal circle (2.5px border, Bricolage 800 / 15px number) colored gold `#FFD23E` / silver `#E6E6E6` / bronze `#E8B074`. Then a borderless `input` (Hanken 600 / 16px) with a per-prompt placeholder.
- A "defend" pad (`flex:1`, min-height 64px): `#FFF6D6` bg, 3px border, shadow `3px 3px 0`, radius 14px, padding `11px 13px`. Label `DEFEND YOUR #1` (Space Mono 700 / 10px) over a `textarea`, placeholder `no scoring. just commit to the bit.`
- **No scoring, ranking output, or win/lose state exists or should be added** — this is theatrical engagement only.

### 3. Saved toast
Appears on save, bottom-center, for ~1250ms (1300ms after a share-send). Black `#141414`, 3px `#141414` border, radius 16px, padding `13px 20px`, soft drop shadow `6px 6px 0 rgba(0,0,0,.25)`. A 30×28 mini red mascot + a randomized message (Space Mono 800 / 14px, white): `SAVED. POINTLESS. PERFECT.` / `FILED UNDER NONSENSE.` / `ANOTHER BANGER. ALLEGEDLY.` / `NOBODY ASKED. SAVED ANYWAY.` Enters with the `popin` keyframe. (After a share-send it uses share-specific copy — see §5.)

---

### 4. Greatest Hits (slides up from the bottom)
**Purpose:** Browse your saved entries ("bangers"). Reached from the Home archive bar. Slides up via `transform: translateY(100% → 0)`, same `.42s` curve as Reply. Same outer padding as Home (`58px 18px 20px`).

**Layout (top to bottom):**
1. **Back button** — same 40×40 white `←` square as Reply.
2. **Header** (margin-top 14px): title `Your Greatest Hits`, Bricolage 800 / 31px / line-height 0.96 / letter-spacing -0.8px; subtitle `Your finest nonsense. Hold one to inflict it on a friend.`, Hanken 400 / 14px / `#86847d`.
3. **Filter chips** (margin-top 14px, horizontal scroll, gap 8px): pill chips, Space Mono 700 / 11px, padding `7px 12px`, radius 999px, 2.5px `#141414` border. Inactive = white bg / `#141414` text; active = category color bg / white text (BRAIN chip active = yellow bg / `#141414` text). Chips: `ALL`, `REFLECT`, `HOT TEA`, `RANK`, `CONFESS`, `HOT TAKE`, `BRAIN`. The scroller has an **edge fade mask** that updates on scroll (fade only on the side that has more content).
4. **Entry list** (`flex:1`, scrollable, gap 13px). Each entry card: white, 2.5px border, shadow `4px 4px 0`, radius 16px, padding `13px 14px`, slight per-index tilt when `wonky` is on. Header row = category chip (category color bg, white text — BRAIN uses `#141414` text) + relative timestamp (Space Mono 700 / 11px / `#b6b3a6`). Then, by type:
   - **text / brain:** prompt line (Hanken 600 / 13px / `#9b988c`, omitted for brain dumps) then the answer (Hanken 600 / 16px / `#141414`).
   - **rank:** three numbered medal rows (20×20 gold/silver/bronze circles + ranked text) then a `DEFENSE` pad (`#FFF6D6`, 2px border, the defend text).
5. **Empty state** (per filter): `Nothing here. Shocking.` (Bricolage 800 / 19px) + `No bangers in this category yet. Go be interesting.` (Hanken / 14px / `#86847d`).

**Relative timestamps (`fmtWhen`):** within 7 days → `wed · 4:03pm` (lowercase weekday); older → `jun 14 · 8:50am`. Store an absolute ISO timestamp per entry and compute this label at display time.

**Interaction:** **long-press an entry (~480ms)** opens the Share sheet (§5). The press is cancelled if the finger moves >10px so it doesn't fight list scrolling.

### 5. Share sheet (bottom sheet)
**Purpose:** Push a saved entry outward. Opened by long-pressing a Hit. A scrim (`rgba(20,20,20,.45)`, fades in) + a sheet that slides up (`sheetup .34s cubic-bezier(.34,1.4,.5,1)`).

**Sheet:** `#FBFAF3` bg, 3px top border, radius `26px 26px 0 0`, padding `14px 18px 32px`. A grabber bar at top. Then a mascot + speech bubble (`SHARE IT, THEN` label over a randomized line, e.g. `Make it the group chat's problem.` / `Go on. Ruin a friendship.`). Then a row of four share targets, each a white sticker tile (3px border, shadow `3px 3px 0`): a colored initial circle + mono label — `COPY` (yellow), `MESSAGE` (blue), `STORY` (red), `MORE` (black). Tapping any target closes the sheet and fires the saved toast with share-specific copy: `Off it goes. No takebacks.` / `Shared. They didn't ask for this.` / `Sent. Inflicted. Done.` Tapping the scrim dismisses without sharing.

---

## Interactions & Behavior
- **Rotating CTA label** — cycles every 4600ms, **only while on Home**: `DUMP A THOUGHT` → `CLEAR THE BRAIN TUBES` → `UNLOAD THE NOGGIN` → `EMPTY THE SKULL` → `OFFLOAD SOMETHING` → `SPILL IT, FRIEND`.
- **Rotating mascot quip** — cycles every 4600ms (same timer), Home only. Pool includes a deadpan set plus: one line that injects the **live local time** (`It's 2:26pm and you're bored. Predictable.`) and one **weather** line chosen once per session at random from rain/sun/cloud/cold variants.
- **Tap a card** → open Reply for that prompt (text or rank mode by category). **Tap CTA** → open Reply in brain-dump mode.
- **No shuffle.** Three options are intentionally fixed to force a fast decision and avoid a hunting loop. The trio re-rolls only (a) on app open and (b) after a save.
- **Reply slide-in** — `transform` transition `.42s cubic-bezier(.34,1.4,.5,1)`. The transition is disabled on first paint (so the panel starts off-screen without animating in) and re-enabled after mount. A 520ms fallback timer hard-snaps the panel to its resting transform in case the animation timeline stalls (background tab).
- **Live word counter** (text/brain modes) — updates the counter's text node directly (no re-render) on input. Thresholds: 0 → `0 words. bold of you.`; ≥1 → `a start, technically`; ≥16 → `now you're cooking`; ≥41 → `okay, you're writing a memoir`.
- **Save** → show toast, then after 1250ms return Home and load a fresh card trio.
- **Back** → return Home (no save).
- **Press states** — buttons/cards shift `translate(2px,2px)` and shrink their hard shadow (the sticker "press").
- **Idle animations** — mascot `bob`/`bobR` (3s), eye `blink` (4.5–5.5s).
- **"Wonky" setting** — when on (default), cards tilt `[-1.5, 1.2, -1]deg`; off → all 0 (accessibility/preference). The mascot bubble's `-2deg` tilt is constant.

## State Management
Component state in the prototype:
- `screen`: `'home' | 'reply' | 'hits'`
- `cards`: array of 3 prompt objects drawn from a 15-item pool
- `reply`: the currently-open prompt object
- `isBrain`: boolean (brain-dump mode)
- `isRankMode`: boolean (rank micro-game)
- `hitsFilter`: active Greatest Hits category filter (`'ALL'` | category | `'brain'`)
- `share`: the open share-sheet payload (`{line}`) or `null`
- `ctaI`, `quipI`: rotation indices for the CTA label and quip
- `saved`, `savedMsg`: toast visibility + chosen message
- `ready`: gates the slide transition until after first paint

Settings (exposed as props/tweaks): `paper` (enum, default `Cream`), `wonky` (boolean, default `true`).

**Data the real app needs (not in prototype):** a prompt source (the 15-item pool is hardcoded — see below), a **persisted saved-entries store** powering Greatest Hits (the prototype seeds 6 demo entries — see `content.json.seedHits`), a persisted **bored count** (the `37`), and a real weather lookup if that quip is kept.

> All of the below — prompts, CTAs, quips, toast/share copy, seed entries, filter chips, and design tokens — is extracted verbatim into **`content.json`**. Import that rather than copying strings out of this README.

### Prompt pool (hardcoded in prototype — move to a content source)
Each prompt has a category (`reflect | tea | rank | confess | take`) and text; rank prompts also carry three slot placeholders. The full set is in `content.json` (and in `Borednotes B - MAIN DESIGN.dc.html`, `this.POOL`). Categories and colors:
- **REFLECT** (`introspect`) — `#2E5BFF`
- **HOT TEA** (`gossip`) — `#FF4438`
- **RANK + DEFEND** (`micro-game`) — `#15A150`
- **CONFESS** (`off the record`) — `#8B3DF5`
- **HOT TAKE** (`opinion`) — `#FF7A1A`

## Design Tokens
**Colors**
- Ink / outline / text: `#141414`
- Paper (default bg): `#FBFAF3` — alts: Paper White `#FFFFFF`, Mint `#EAF7EE`, Bubblegum `#FCEAF2`
- CTA / accent yellow: `#FFD23E`
- Mascot red: `#FF4438`; mouth highlight `#FF7A6E`
- Category blue `#2E5BFF`, red `#FF4438`, green `#15A150`, purple `#8B3DF5`, orange `#FF7A1A`
- Defend pad: `#FFF6D6`
- Medals: gold `#FFD23E`, silver `#E6E6E6`, bronze `#E8B074`
- Muted text: `#9b988c`
- Chip background: `rgba(0,0,0,.22)`

**Typography**
- Display: **Bricolage Grotesque**, weight 800 (headings, questions, buttons)
- Body: **Hanken Grotesk**, 400–800 (input text)
- Labels: **Space Mono**, 700 (wordmark, category chips, status labels, counters)

**Radii:** chips 6px; medals 50%; buttons/cards 14–16px; prompt sticker 20px; mascot blob `50% 50% 47% 47% / 56% 56% 44% 44%`.

**Borders:** 2.5–3px solid `#141414`.

**Hard offset shadows:** `3px 3px 0 #141414` (small buttons/rows), `4px 4px 0 #141414` (cards/CTA/send), `5px 5px 0 #141414` (prompt sticker). Pressed = shadow halved + `translate(2px,2px)`.

**Motion:** slide `.42s cubic-bezier(.34,1.4,.5,1)`; toast `popin .42s cubic-bezier(.34,1.56,.64,1)`; idle `bob`/`bobR` 3s, `blink` 4.5–5.5s; rotation timer 4600ms.

## Assets
- **Mascot** — a **placeholder** built from CSS (a red blob with eyes/mouth). It is intentionally unfinished; the production app should commission/illustrate a real mascot with multiple expressions (idle, reacting to typing, saved/celebration). Three sizes appear: ~96px (home), ~50px (prompt sticker peek), ~30px (toast).
- **Status bar / device bezel / keyboard** — provided by `ios-frame.jsx`, **prototype chrome only**. Do not ship; the real app uses the OS status bar and keyboard.
- No external image or icon files; all glyphs are Unicode (`→`, `←`, `★`, `↓`) or CSS shapes.

## Mocked vs. real (resolve before/during build)
- **Greatest Hits** — the archive screen is now fully designed (§4) but reads from 6 hardcoded seed entries and the `37` count is hardcoded. Needs a persisted saved-entries store and a real count.
- **Share** — the sheet (§5) is designed; the four targets (COPY/MESSAGE/STORY/MORE) are illustrative. Wire to the platform share sheet / clipboard and decide what "STORY" exports.
- **Prompt pool** — 15 hardcoded prompts. Needs a real content source + a plan for adding/rotating prompts and tagging categories.
- **Weather quip** — randomly faked per session; wire to a real weather API or drop it.
- **Mascot** — placeholder (see *Assets*).
- **Persistence** — nothing is saved between sessions in the prototype.

## Files
- `CLAUDE.md` — build guide for developers/Claude Code (stack, data model, persistence, phased plan). **Start here.**
- `content.json` — all copy, seed data, and design tokens, ready to import.
- `Borednotes B - MAIN DESIGN.dc.html` — full design + logic (open in a browser to view).
- `ios-frame.jsx` — prototype device frame (do not ship).
- `support.js` — prototype runtime (do not ship).

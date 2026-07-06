# CLAUDE.md — Borednotes build guide

> This file is for an AI/dev pair (Claude Code) standing up the **real app** from the design handoff in this folder. Read it first, then `README.md` (full visual spec) and `content.json` (all copy + seed data).

## What you're building

Borednotes is a low-stakes **boredom-killer mobile app**. A bored user opens it and gets something light to react to — a freeform brain dump, a category-tagged prompt, or a playful "rank & defend" micro-game. The personality is the product: a deadpan, faintly rude mascot acting as **an imaginary audience you're trying to entertain**. Engagement comes from *borrowed motivation* — a small objective removes the blank-canvas problem a low-energy user faces.

## Read these in order
1. **CLAUDE.md** (this file) — stack, architecture, data model, build plan.
2. **README.md** — pixel-level spec for every screen, component, and interaction. **This is the source of truth for look & feel.**
3. **content.json** — every prompt, label, quip, toast, share line, seed entry, and design token, already extracted from the prototype. Import this; don't re-type strings.
4. **Borednotes B - MAIN DESIGN.dc.html** — the working prototype. Open it in a browser (it pulls `support.js` + `ios-frame.jsx`, both in this folder) to *see and feel* the real thing: motion, press states, slide transitions, long-press share.

## The files here are a design reference, not production code
The prototype is HTML built in a design tool — a faithful demo of look, motion, and behavior. **Do not port the HTML/CSS/JS verbatim.** Recreate the screens in a proper mobile stack using its native patterns. `support.js` and `ios-frame.jsx` are prototype-only scaffolding (the device bezel + runtime) — **never ship them**; the real app runs full-screen on a real device with the OS status bar and keyboard.

Fidelity is **high**: colors, type, spacing, copy, and motion in README.md/content.json are final and should be matched closely. The only deliberately unfinished element is the mascot (CSS placeholder — see *Open decisions*).

## Recommended stack
The prototype is React-flavored and reads as phone-native (status bar, keyboard, slide/press feel).
- **Expo + React Native + TypeScript** is the path of least resistance and preserves the look. (A web-to-app wrapper or plain RN also fine.)
- **Navigation:** the three secondary screens are *overlays over Home*, not a nav stack — Reply slides in from the right (translateX), Greatest Hits slides up (translateY), Share is a bottom sheet. Use `react-native-reanimated` (or Moti) for these, not a stack navigator pushing routes. Match the easing curves in `content.json.tokens.motion`.
- **State:** local component state + one light store (Zustand/Context) is plenty. No server required for v1.
- **Persistence:** AsyncStorage is enough for v1 (entries list + bored count + settings). Move to SQLite/Expo SQLite only if the Greatest Hits list grows large or you want querying.
- **Fonts:** Bricolage Grotesque (display), Hanken Grotesk (body), Space Mono (labels) — all on Google Fonts; load via `expo-font`/`@expo-google-fonts`.
- **No backend in v1.** The only thing that wants a network call is the optional weather quip.

## Screen / overlay map
| Surface | Trigger | Motion | Spec |
|---|---|---|---|
| **Home** | app open | — | README §1 |
| **Reply** | tap a card (text/rank) or the CTA (brain) | slide in from right | README §2 |
| **Greatest Hits** | tap the bottom archive bar | slide up | README §4 |
| **Share sheet** | long-press a saved hit (~480ms) | bottom sheet up | README §5 |
| **Saved toast** | on save / on share-sent | pop-in, auto-dismiss | README §3 |

Single `screen` value drives Home/Reply/Hits (`'home' | 'reply' | 'hits'`); Share and Toast are independent overlay flags.

## Data model & persistence

```ts
type Category = 'reflect' | 'tea' | 'rank' | 'confess' | 'take';
type EntryType = 'text' | 'rank' | 'brain';

interface Prompt {
  c: Category;
  text: string;
  slots?: [string, string, string]; // rank prompts only — input placeholders
}

interface Entry {                    // a saved "banger"
  id: string;
  type: EntryType;
  c: Category | 'brain';
  createdAt: string;                 // ISO; render relative via fmtWhen (README §4)
  prompt?: string;                   // omitted for brain dumps
  answer?: string;                   // text + brain
  items?: string[];                  // rank: the 3 ranked things
  defense?: string;                  // rank: the "defend #1" text
}

interface Settings {
  paper: 'Cream' | 'Paper White' | 'Mint' | 'Bubblegum'; // default 'Cream'
  wonky: boolean;                                          // card tilt, default true
}
```

**Persisted keys (AsyncStorage):**
- `entries: Entry[]` — newest first. Seed an empty array; the prototype's 6 demo entries are in `content.json.seedHits` for testing only.
- `boredCount: number` — the "37 BANGERS" number. In the prototype it's hardcoded `37`; make it `entries.length` (or a separate lifetime counter if you want it to outrun deletions — decide this).
- `settings: Settings`.

**Prompt source:** `content.json.prompts` (15 prompts). Bundle it for v1; plan a real content pipeline later (see *Open decisions*).

## Core behaviors (don't lose these — they're the product)
- **No shuffle.** Home shows exactly **three** cards, one per category, fixed. The trio re-rolls **only** on app open and after a save — never via a manual reroll button. (Infinite re-roll invites hunting for the "perfect" prompt and kills the spark.) See `pick3` logic in README.
- **Pressure is theatrical, never evaluative.** Rank & Defend has **no scoring, no ranking output, no win/lose**. Saved-toasts and quips mock the user affectionately but nothing is ever judged or failed. Do not add streaks-as-obligation, scores, or "you failed" states.
- **Live word counter** in text/brain modes, voice copy by threshold (`content.json.replyMicrocopy.wordCounter`). Update the text node on input; no need to re-render the whole screen.
- **Rotating CTA label + mascot quip** every 4600ms, **Home only** (pause the timer off Home).
- **Long-press a saved hit → Share sheet.** Cancel the press if the finger moves >10px (so it doesn't fight scrolling).
- **Press states everywhere:** buttons/cards shift `translate(2px,2px)` and halve their hard shadow on press. This "sticker press" is core to the feel.
- **Settings:** `paper` (4 themes) and `wonky` (card tilt) — both live in Settings (the menu-dots affordance on Home is the intended entry point; it's decorative in the prototype).

## Suggested build order
1. **Foundation** — Expo + TS project, fonts loaded, design tokens from `content.json.tokens` as a theme module, the reusable **sticker** primitives (outlined box + hard offset shadow + press state). Get one card looking pixel-right before building screens.
2. **Home** — top bar, mascot + speech bubble, rotating CTA, 3 category cards (`pick3`), archive bar. Wire the 4600ms rotation. Mascot can stay a placeholder.
3. **Reply** — slide-in panel, prompt sticker, the three input modes (text / brain / rank+defend), live counter, send → saved toast → home + fresh trio. Persist the new `Entry`.
4. **Greatest Hits** — slide-up panel, filter chips (horizontal scroll + edge fade), entry cards per `type`, relative timestamps (`fmtWhen`), empty state. Read from persisted `entries`.
5. **Share** — long-press gesture → bottom sheet, mascot line, 4 targets. Wire COPY (clipboard) + native share; STORY/MESSAGE can map to the OS share sheet. Sent → toast.
6. **Settings** — theme + wonky toggle, persisted; wire the menu-dots affordance to open it.
7. **Polish** — match every easing curve, blink/bob idles, toast timing, haptics on press/save (nice-to-have, very on-brand).

**Acceptance for each screen:** put it side-by-side with the prototype (open the `.dc.html`) and match layout, color, type, and motion. README has exact px/hex/weights.

## Open decisions (resolve with the product owner)
- **Mascot** — the prototype mascot is a CSS placeholder (red blob). Highest-value next design step: a real illustrated mascot with expressions that **react to what you type** (idle / reacting / celebration). Don't ship the blob.
- **Bored count semantics** — `entries.length` vs. a lifetime counter that survives deletions.
- **Weather quip** — wire to a real weather API (needs location permission) or drop the line. It's faked per-session in the prototype.
- **Prompt content pipeline** — 15 bundled prompts is a demo. Decide how new prompts get authored, categorized, and rotated (bundled JSON updates vs. remote config/CMS).
- **Share targets** — COPY/MESSAGE/STORY/MORE are illustrative. Map to the platform share sheet and decide what "STORY" means (image export of the entry?).
- **Dark mode** — a dark variant of this direction exists in the design project (`Borednotes B - MAIN DESIGN DARK.dc.html`) if you want it; ask the owner to include it in this folder if dark mode is in scope.

## Files in this folder
- `CLAUDE.md` — this guide.
- `README.md` — full visual + interaction spec (source of truth for look/feel).
- `content.json` — all copy, seed data, and design tokens, ready to import.
- `Borednotes B - MAIN DESIGN.dc.html` — the working prototype (open in a browser to view).
- `support.js`, `ios-frame.jsx` — prototype runtime + device frame. **Prototype-only — do not ship.**

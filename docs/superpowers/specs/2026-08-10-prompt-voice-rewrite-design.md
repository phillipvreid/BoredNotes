# Prompt Voice Rewrite — Design

## Problem

The prompt library is priority #1 for BoredNotes — the app lives or dies on whether prompts pull a user in immediately. Reviewing the current system surfaced the actual gap: the 76 static prompts in `src/prompts/library.json` and the AI-generation instructions in `src/prompts/ai.ts` read as generic, safe, and interchangeable — neutral therapy-app questions rather than the app's own voice.

This is not a "define a new voice" problem. `docs/voice-guide.md` already specifies exactly the target voice — specific, attitude-carrying, willing to ask for something with stakes, willing to surprise — in detail, including a depth-scaling rule, a named pattern ("tag-on jab"), and worked examples per depth tier. It was written 2026-07-06 (PR for chip-driven Help Me Write) and never applied:

- `library.json` still has the "colour" spelling drift the guide names as an anti-pattern to sweep
- `ai.ts`'s `depthLabel` array (`'light and quick'`, `'moderately thoughtful'`, `'deep and personal'`) is exactly the generic, voice-less instruction the guide describes and prescribes a replacement for (lines 33-37 of the guide) — that replacement was never made
- No prompt in the library uses the tag-on-jab pattern

**This project implements `docs/voice-guide.md` against the two places prompts actually get produced.** The guide itself is not being revisited — confirmed with the user that it still reflects the intended voice.

**Future scale note:** the library will grow well past 76 prompts eventually. That doesn't change what this pass does, but it does change what this pass *is* — see "Pattern diversity" under Methodology.

## Scope

### In scope
1. **`src/prompts/library.json`** — rewrite all 76 prompt `text` values in place. Same 76 entries, same `category`/`kind`/`slots`/`themes`, same taxonomy — the category set and the 1/2/3 depth *system* are fixed. A prompt's individual `depth` tag may shift by one tier if the rewrite changes how light or heavy the question feels (see Risks) — that's a per-prompt fit correction, not a structural change.
2. **`src/prompts/ai.ts`** — replace the `depthLabel` array and its use in the generated Haiku instruction with the three per-depth voice instructions already drafted in `voice-guide.md` (the "AI generation" subsection under "Depth scaling"). This affects both call sites that pass `depth` into `generateAiPrompt` (`next.ts`'s category-anchored path and `contextual.ts`'s chip-anchored path) — no changes needed in either caller, since the depth-to-instruction mapping is internal to `ai.ts`.
3. **Spelling sweep** — fix the one "colour" occurrence (and any other British-spelling drift found while rewriting) to American spelling, per the guide's named anti-pattern.
4. **The 4 game prompts** (`kind: rank` ×3, `kind: loveHate` ×1) — light touch only. These already read close to the target voice ("Rank your last 3 snacks. Defend #1."); punch up wording only where it looks flat, not a structural rewrite.

### Out of scope
- Category or depth taxonomy changes (no reviving HOT TAKE/HOT TEA/NOSTALGIA, no merging/splitting categories). If a specific prompt or cluster of prompts turns out to genuinely resist the voice within its current category, that gets flagged as a follow-up decision in the PR description rather than resolved by restructuring here.
- `docs/voice-guide.md`'s rules and voice direction — treated as settled input, not revisited. The one narrow exception: its "reference" section may get 4-6 rewritten prompts appended as calibration examples (see "Pattern diversity" under Methodology) — additive only, no existing guidance in the guide changes.
- Any UI chrome copy (`src/theme/copy.ts`) — already in voice per the guide's own "reference: existing copy that nails it" section; not part of this pass.
- Depth-3 toast/chrome softening logic (`docs/voice-guide.md` "Heavy entries" section) — that's an app-behavior feature (detecting depth-3 entries and swapping toast rotation), separate from prompt text itself. Not part of this content rewrite.

## Methodology

Applied per the guide's existing rules, by depth tier:

- **Depth 1** (33 prompts): full personality — tag-on-jab pattern (a real question, then a short deadpan quip), absurd premises welcome. Reference register: *"Sniff the air. Report your findings. Be brave."*
- **Depth 2** (25 prompts): a real question with one dry quip in the tag that lowers the stakes so the sincere part can still land. Reference register: *"What's something you're pretending is fine? It can hear you."*
- **Depth 3** (18 prompts): the bit mostly drops. The prompt question itself stays close to its current directness — per the guide, depth-3 warmth comes from the surrounding chrome softening (label/placeholder), not from rewriting the question into something else. Still dry, never saccharine.

Anti-patterns to avoid, per the guide: two jokes stacked in one line, judging what the user might write (vs. judging the act of journaling), exclamation-mark enthusiasm, emoji, name-calling past "genius"/"friend."

`ai.ts` change: the three per-depth style lines from the guide get injected into the generation instruction alongside the existing category/topic/context instructions — additive, not a restructuring of `generateAiPrompt`'s existing category-anchored vs. chip-anchored branches.

### Pattern diversity (calibration set for future growth)

Because the library won't stay at 76, this rewrite is also establishing the reference set that future batches — written by hand, or drafted by the now-voiced `ai.ts` and curated by a human — get pattern-matched against. `voice-guide.md`'s own "reference: existing copy that nails it" section is currently thin (5 UI-copy lines, no prompt-specific range).

To avoid the calibration set collapsing into one shape repeated 76 times, deliberately vary *how* the tag-on-jab lands rather than defaulting to a single "question. quip." rhythm every time:
- question, then a separate deadpan quip sentence (the guide's own example: *"Sniff the air. Report your findings. Be brave."*)
- the jab embedded inside the question itself, no separate sentence
- the question posed as its own dry joke, no separate quip needed
- a flat, absurd premise stated before the question does its work

This is a wording/rhythm concern only — it doesn't touch category, depth, or the guide's rules above. If a handful of the rewritten depth-1/depth-2 prompts read as strong, varied reference examples, consider pulling 4-6 of them into `voice-guide.md`'s reference section as part of this same pass, so the guide itself gets a fuller prompt-specific calibration set for whoever writes the next batch.

## Validation

No test in `__tests__/` asserts specific prompt wording — confirmed by reading `seed.test.ts` (checks counts, `category`/`kind` tags, config shapes) and `entries.test.ts` (uses prompt text only as arbitrary fixture data). Rewriting content is safe from a test standpoint.

Post-change checks:
- `npx tsc --noEmit` — schema/type safety net
- `npm test -- --runInBand` — structural regression safety net
- **Tone/quality is a human read, not a test.** The actual acceptance criterion is the user reading the full rewritten `library.json` and the `ai.ts` diff and confirming it lands. No automated check can verify "engaging."

## Risks / open questions

- Depth tagging is already a fuzzy, by-feel judgment (noted in an earlier review of this system) — rewriting text may occasionally make a prompt's assigned depth feel like a better or worse fit than before. Where that happens, the depth tag will be adjusted to match the rewritten prompt rather than forcing the prompt to fit the old tag.
- If a category proves structurally hard to voice (flagged during rewrite, not predicted here), it will be called out explicitly rather than silently worked around.

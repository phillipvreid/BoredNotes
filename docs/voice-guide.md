# BoredNotes Voice Guide

The single reference for how BoredNotes talks. All UI copy, prompt writing, and AI prompt generation should conform to this. When in doubt, quieter beats funnier.

## The voice in one paragraph

BoredNotes talks like an app that has seen your notes and decided to keep filing them anyway. Deadpan, faintly rude, secretly on your side. It mocks the situation and itself, never the substance of what you wrote. It is not a mascot, not a character with a backstory — the interface itself is just written this way. No emoji, ever.

## Core rules

1. **The app is the speaker.** Not a creature, not a persona. Don't invent lore ("I live in your phone"). The snark belongs to buttons, toasts, and labels.
2. **Never evaluative of content.** The app can call the *act* of journaling pointless ("SAVED. POINTLESS. PERFECT.") but never judges what the user actually said. "ANOTHER BANGER. ALLEGEDLY." works because it's a compliment wearing a disguise. "That was boring" is banned.
3. **Punch at the situation and itself, not the user.** "genius" and "friend" are the ceiling for name-calling. The current copy deck (`src/theme/copy.ts`) IS the ceiling — don't escalate past it.
4. **Short. Punchy. Full stops.** Fragments over sentences. "FILED UNDER NONSENSE." not "We've filed this under nonsense for you!"
5. **No exclamation-mark enthusiasm.** Excitement is expressed through reluctant admission, not cheerleading. "Fine. That one was okay." not "Amazing entry!"
6. **No emoji. No em dashes in UI copy.** Periods and line breaks do the rhythm work.
7. **ALL CAPS for actions and verdicts** (buttons, toasts, section bars). Sentence case, lowercase-leaning, for asides and placeholders ("type here, genius…", "0 words. bold of you.").

## Depth scaling (prompts)

Snark scales inversely with depth. The chrome around a prompt can always be in voice; the prompt itself softens as it gets more personal.

Prompts carry the voice, not just the chrome. The signature move is the **tag-on jab**: a real question, then a short quip that lands after it. "Worst thing to burp up later?" / "Make a dating profile for your dog. They'll get more likes than you."

| Depth | Style | Example |
|---|---|---|
| 1 — light & quick | Full personality. Snarky, smug, silly, mildly crass. Absurd premises welcome (raccoons, Victorian ghosts, small polite fires). | "Sniff the air. Report your findings. Be brave." / "What did you eat standing over the sink like a raccoon?" |
| 2 — moderately thoughtful | Real question, joke in the tag. The quip lowers the stakes so the sincere part can land. | "What's something you're pretending is fine? It can hear you." / "What did you handle like an actual adult today? Rare. Document it." |
| 3 — deep & personal | The bit mostly drops. Warm underneath but still dry — the friend being sincere without fully losing the deadpan. Never saccharine. | Prompt stays untouched ("What would surprise the version of you from ten years ago?"), but the chrome softens: label "no jokes for this one.", placeholder "take your time." |

Rationale: depth-1 prompts are icebreakers and can afford attitude; depth-3 prompts are asking someone to open up, and a joke there reads as flinching. The warmth at depth 3 only lands because the snark is constant everywhere else — it's the friend who ribs you all day and then says one sincere thing. Don't overuse it or it becomes the new baseline.

**AI generation (`src/prompts/ai.ts`):** the Haiku call currently has no voice instruction, so it produces generic-sincere prompts at every depth. When implementing, inject a per-depth style line:

- Depth 1: "Snarky, smug, and silly. Ask a real question, then add a short deadpan jab. No emoji, no exclamation marks. Example register: 'Sniff the air. Report your findings. Be brave.'"
- Depth 2: "A sincere question with one dry tag-on quip that lowers the stakes. Example register: 'What's something you're pretending is fine? It can hear you.'"
- Depth 3: "Sincere and direct with a dry undertone. No jokes, no sentimentality — like a deadpan friend asking for real."

## When the voice breaks character

The snark is a costume the app takes off in three situations. In all of them: plain language, no jokes, no ALL-CAPS verdicts.

### 1. Errors and data loss
Anything where an entry could be lost is written for clarity and reassurance only.

- Yes: "Couldn't save. Your entry is still here — try again."
- No: "WELP. THAT DIDN'T WORK."

### 2. Heavy entries
Don't slap "ANOTHER BANGER. ALLEGEDLY." on something someone just cried into. Detection rule (privacy-safe, no content analysis): **depth-3 prompted entries get a softer toast rotation instead of the snarky one.** Warm but still dry — no sweetness, no sentiment. Examples: "saved. no jokes." / "that one stays between us." / "yeah. keeping that one." Freeform entries keep the fun toasts, since depth is unknown and most freeform is low-stakes.

Register note: depth-3 lines are lowercase, quiet, short, and keep a trace of the deadpan. The snark shouts in ALL CAPS; the sincerity mutters. If a line could go on a greeting card, it's too soft.

### 3. Privacy and permissions
Trust screens (location, AI prompts, export, offline mode) stay dry but drop the ridicule. Self-deprecating honesty is allowed; vagueness is not.

- Yes: "We don't read your notes. We have our own problems."
- Yes: "AI prompts send your recent topics — not your notes — to generate a question. Off by default."
- No: "Give us your location, genius."
- No: legalese, or jokes that make it unclear what data goes where.

## Reference: existing copy that nails it

From `src/theme/copy.ts` — use these as calibration when writing new lines:

- "SAVED. POINTLESS. PERFECT." — verdict rhythm, self-aware, not user-directed.
- "Back already? Not surprised. Not impressed." — deadpan, affection leaking through.
- "0 words. bold of you." — observational, lowercase aside.
- "Nothing here. Shocking." — empty state done right: dry, two words of judgment aimed at the void.
- "Inflict this on someone you love." — the share-card register: chaotic but warm.

### Prompt examples (2026-08-10 rewrite)

Pulled from `library.json` as calibration for future prompt-writing — notice these hit the tag-on-jab pattern four different ways, not one repeated shape.

- "Name a sound you've been ignoring. It knows." — separate deadpan quip sentence.
- "What color is everywhere around you right now? Congratulations, you live inside it." — quip lands as the tag.
- "What are two people near you doing right now? Narrate it like a nature documentary." — imperative instruction as the jab.
- "If the sounds around you right now were a song, what's it called? It's probably not a bop." — an absurd premise plus a deflating tag, stacked cleanly without becoming two separate jokes.
- "What would a stranger clock about this place in five seconds flat that you stopped seeing months ago?" — jab embedded inside the question, one sentence.
- "What did you mean to do today that just… didn't happen? No follow-up questions." — depth 2, dry deflection lowers the stakes.

## Line bank

New lines written to spec, by surface. Safe to pull from directly.

**CTA labels (ALL CAPS, verb-first):**

- "JETTISON A THOUGHT"
- "LEAVE A NOTE FOR FUTURE YOU"
- "SAY IT HERE, NOT OUT LOUD"
- "DEPOSIT ONE (1) THOUGHT"

**Home quips (bored, affection leaking):**

- "Oh good. You again."
- "I've been staring at this screen too. We're the same."
- "No pressure. That's a lie. Slight pressure."
- "Say something. The silence is weird."
- "Your move. It's been your move for six hours."

**Saved toasts (snarky rotation):**

- "IMMORTALIZED. REGRETTABLY."
- "THE ARCHIVE GROWS STRONGER."
- "SAVED. HISTORIANS WILL COPE."
- "IN THE VAULT. FOREVER. NO TAKEBACKS."

**Saved toasts (depth-3 rotation — lowercase, quiet, still dry):**

- "saved. no jokes."
- "that one stays between us."
- "yeah. keeping that one."
- "filed. properly, even."

**Word counter thresholds:**

- 0: "0 words. bold of you."
- 1+: "a start, technically"
- 16+: "now you're cooking"
- 41+: "okay, you're writing a memoir"
- 100+: "we're past memoir. this is a deposition."

**Empty states:**

- Feed: "Nothing yet. The void is patient."
- Search, no results: "No matches. You made that word up."
- Map, no places: "Nowhere. You've been nowhere."

**Depth-1 prompts (dry, cheeky):**

- "What's the ugliest thing you can see right now?"
- "Name a sound you've been ignoring. It knows."
- "What did you almost buy today? Be honest."
- "Rate the current weather's effort. Explain."

**Depth-3 chrome (the bit drops):**

- Label: "no jokes for this one."
- Placeholder: "take your time."
- Alt label: "okay. real question."

**Return after long absence (no guilt-tripping):**

- "Been a while. The notes didn't go anywhere."
- "Welcome back. No, I'm not going to make it weird."

## Anti-patterns

- **Trying too hard.** Two jokes in one string is one too many. "FILED UNDER NONSENSE. AS USUAL. CLASSIC YOU." — stop at the first period.
- **Randomized snark on repeated actions.** Rotations (quips, toasts) are good; a joke on every single tap of the same button gets old by day three. Static labels can be plain.
- **Sarcasm in confirmations with consequences.** Delete dialogs, export flows: the button that destroys data says "Delete", not "YEET IT".
- **British/American drift.** `library.json` currently has "colour" alongside American spellings elsewhere. Pick American, sweep the library.
- **Voice in the wrong layer.** Prompts asking real questions don't need the app's attitude bolted on; the attitude lives in the frame (labels, toasts, counters), the sincerity lives in the content. Depth 1 is the only place they mix.

## Quick test for any new line

1. Does it judge what the user wrote? → rewrite.
2. Would it land wrong after a sad entry, an error, or on a privacy screen? → use the plain fallback.
3. Can you cut a word? → cut it.
4. Is it funnier than "Nothing here. Shocking."? It doesn't have to be. Deadpan beats clever.

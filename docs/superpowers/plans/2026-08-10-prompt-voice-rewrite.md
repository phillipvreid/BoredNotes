# Prompt Voice Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `docs/voice-guide.md` (written 2026-07-06, never applied) against the two places prompts actually reach a user — `src/prompts/library.json`'s 76 static prompts and `src/prompts/ai.ts`'s AI-generation instructions — so prompts read as specific, voiced, and stakes-carrying instead of generic and interchangeable.

**Architecture:** No structural changes. `library.json` keeps its exact shape (`text`/`category`/`depth`/`kind`/`slots`/`themes`); only `text` values change, category by category. `ai.ts` swaps its no-op `depthLabel` adjective array for the guide's three per-depth voice-instruction paragraphs, injected into the same Haiku prompt template. A new regression-guard test file catches mechanical anti-pattern violations (British spelling, emoji, exclamation marks) that a human read won't reliably catch across 76+ lines.

**Tech Stack:** TypeScript, Jest (jest-expo preset), static JSON content file.

## Global Constraints

- American spelling throughout (no "colour", "favourite", "organise", "realise", "centre", "theatre")
- No emoji, anywhere, ever (per `docs/voice-guide.md` rule 6)
- No exclamation marks in prompt text (per `docs/voice-guide.md` rule 5, "no exclamation-mark enthusiasm")
- Depth 1: full personality, tag-on-jab pattern (real question + short deadpan quip), absurd premises welcome
- Depth 2: real question + one dry quip in the tag that lowers the stakes
- Depth 3: the bit mostly drops — sincere, dry undertone, never saccharine; prompt question stays close to its current directness
- No two jokes stacked in one line; no name-calling past "genius"/"friend"; the app never judges what a user might write
- Category set (`observational`/`reflective`/`personal`/`creative`/`game`) and the 1/2/3 depth system are fixed — do not add, remove, merge, or rename categories or depth tiers
- Every `npm test -- --runInBand` and `npx tsc --noEmit` run must stay green

---

## File Structure

- **Modify:** `src/prompts/library.json` — all 76 `text` values, one category per task (Tasks 3-7)
- **Modify:** `src/prompts/ai.ts` — replace `depthLabel` with per-depth voice instructions (Task 2)
- **Modify:** `docs/voice-guide.md` — append 6 calibration examples to the existing "Reference" section, additive only (Task 8)
- **Create:** `__tests__/prompts/library-voice.test.ts` — regression guard for spelling/emoji/exclamation anti-patterns (Task 1)
- **Modify:** `__tests__/prompts/ai.test.ts` — add depth-voice-instruction assertions (Task 2)

---

### Task 1: Library content regression-guard tests + spelling sweep

**Files:**
- Create: `__tests__/prompts/library-voice.test.ts`
- Modify: `src/prompts/library.json:3` (the one known "colour" occurrence)

**Interfaces:**
- Consumes: `src/prompts/library.json`'s default export (array of `{ text, category, depth, kind?, slots?, themes? }`)
- Produces: nothing consumed by later tasks — this is a standalone regression guard that stays green through Tasks 3-8

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/prompts/library-voice.test.ts
import library from '../../src/prompts/library.json';

interface LibraryPrompt {
  text: string;
  category: string;
  depth: number;
  kind?: string;
  slots?: string[];
  themes?: string[];
}

const BRITISH_SPELLING_DRIFT = ['colour', 'favourite', 'organise', 'organising', 'realise', 'centre', 'theatre'];
const EMOJI_PATTERN = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function allStrings(prompt: LibraryPrompt): string[] {
  const strings = [prompt.text];
  if (prompt.slots) strings.push(...prompt.slots);
  if (prompt.themes) strings.push(...prompt.themes);
  return strings;
}

describe('library.json voice content', () => {
  const lib = library as LibraryPrompt[];

  it('contains no British-spelling drift', () => {
    const offenders: string[] = [];
    for (const prompt of lib) {
      for (const s of allStrings(prompt)) {
        const lower = s.toLowerCase();
        for (const word of BRITISH_SPELLING_DRIFT) {
          if (lower.includes(word)) offenders.push(s);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('contains no emoji', () => {
    const offenders = lib.flatMap(allStrings).filter(s => EMOJI_PATTERN.test(s));
    expect(offenders).toEqual([]);
  });

  it('contains no exclamation-mark enthusiasm', () => {
    const offenders = lib.flatMap(allStrings).filter(s => s.includes('!'));
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify the spelling one fails**

Run: `npm test -- --runInBand __tests__/prompts/library-voice.test.ts`
Expected: `contains no British-spelling drift` FAILS (the "colour" prompt is in the offenders array); the emoji and exclamation-mark tests PASS (library currently has neither).

- [ ] **Step 3: Fix the one known spelling drift**

In `src/prompts/library.json`, line 3:

```json
{"text": "What colour appears most in your immediate surroundings?", "category": "observational", "depth": 1},
```

becomes:

```json
{"text": "What color appears most in your immediate surroundings?", "category": "observational", "depth": 1},
```

(This entry gets fully rewritten in Task 3 anyway — this step just proves the regression guard works end to end before the bigger content pass.)

- [ ] **Step 4: Run the tests to verify all three pass**

Run: `npm test -- --runInBand __tests__/prompts/library-voice.test.ts`
Expected: all 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add __tests__/prompts/library-voice.test.ts src/prompts/library.json
git commit -m "test: add library content regression guard, fix colour->color drift"
```

---

### Task 2: `ai.ts` — replace generic depth label with the guide's voice instructions

**Files:**
- Modify: `src/prompts/ai.ts:95` (the `depthLabel` line) and `src/prompts/ai.ts:109-116` (the `body` template)
- Test: `__tests__/prompts/ai.test.ts`

**Interfaces:**
- Consumes: nothing new — `generateAiPrompt(input: AiPromptInput, apiKey: string)` keeps its exact existing signature; no caller (`next.ts`, `contextual.ts`) changes
- Produces: same `Promise<string | null>` return type, unchanged

- [ ] **Step 1: Write the failing tests**

Add to `__tests__/prompts/ai.test.ts`, inside the top-level `describe('generateAiPrompt', ...)` block (after the existing tests, before the closing `});` of that describe — do not touch the nested `describe('Help Me Write ...')` block):

```typescript
  it('injects the depth-1 voice instruction (snarky, deadpan jab)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'x' }] }),
    } as any);

    await generateAiPrompt({ category: 'observational', depth: 1, recentTopics: [] }, MOCK_KEY);

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('Snarky, smug, and silly');
    expect(body.messages[0].content).toContain('deadpan jab');
  });

  it('injects the depth-2 voice instruction (sincere question, dry tag-on quip)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'x' }] }),
    } as any);

    await generateAiPrompt({ category: 'reflective', depth: 2, recentTopics: [] }, MOCK_KEY);

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('dry tag-on quip');
  });

  it('injects the depth-3 voice instruction (sincere, no jokes)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'x' }] }),
    } as any);

    await generateAiPrompt({ category: 'personal', depth: 3, recentTopics: [] }, MOCK_KEY);

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('No jokes, no sentimentality');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- --runInBand __tests__/prompts/ai.test.ts`
Expected: the 3 new tests FAIL (current body contains "deep and personal" / "light and quick" / "moderately thoughtful", not the new phrases). All pre-existing tests in this file still PASS.

- [ ] **Step 3: Replace `depthLabel` with per-depth voice instructions**

In `src/prompts/ai.ts`, replace line 95:

```typescript
  const depthLabel = ['light and quick', 'moderately thoughtful', 'deep and personal'][input.depth - 1];
```

with:

```typescript
  const DEPTH_VOICE = [
    'Snarky, smug, and silly. Ask a real question, then add a short deadpan jab. No emoji, no exclamation marks. Example register: "Sniff the air. Report your findings. Be brave."',
    'A sincere question with one dry tag-on quip that lowers the stakes. Example register: "What\'s something you\'re pretending is fine? It can hear you."',
    'Sincere and direct with a dry undertone. No jokes, no sentimentality — like a deadpan friend asking for real.',
  ] as const;
  const voiceInstruction = DEPTH_VOICE[input.depth - 1];
```

Then in the same file, replace the `body` template (currently lines 109-116):

```typescript
  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [{
      role: 'user',
      content: `${contextLine ? contextLine + ' ' : ''}Generate one ${depthLabel} journaling prompt ${topicInstruction}.${steeringLine} ${topicsLine} The prompt should be a single question, under 20 words, written in second person. Return only the prompt text, no quotes, no explanation.`,
    }],
  });
```

with:

```typescript
  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [{
      role: 'user',
      content: `${contextLine ? contextLine + ' ' : ''}Generate one journaling prompt ${topicInstruction}. Voice: ${voiceInstruction}${steeringLine} ${topicsLine} The prompt should be a single question, under 20 words, written in second person. Return only the prompt text, no quotes, no explanation.`,
    }],
  });
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- --runInBand __tests__/prompts/ai.test.ts`
Expected: all tests PASS (new and pre-existing)

- [ ] **Step 5: Run the full suite and type check**

Run: `npx tsc --noEmit && npm test -- --runInBand`
Expected: no type errors, all suites PASS

- [ ] **Step 6: Commit**

```bash
git add src/prompts/ai.ts __tests__/prompts/ai.test.ts
git commit -m "feat: inject voice-guide depth instructions into AI prompt generation"
```

---

### Task 3: Rewrite the OBSERVE category (observational, 20 prompts)

**Files:**
- Modify: `src/prompts/library.json` (lines 2-21, the 20 `"category": "observational"` entries)

**Interfaces:**
- Consumes: nothing
- Produces: nothing consumed by later tasks — content-only change, verified by Task 1's regression tests plus the full suite

- [ ] **Step 1: Replace each of the 20 observational entries' `text` value**

Apply each of these 20 replacements in `src/prompts/library.json` (match the full line including `"category"` and `"depth"` to keep each edit unique):

```
OLD: {"text": "What's one sound you can hear right now that you'd normally tune out?", "category": "observational", "depth": 1},
NEW: {"text": "Name a sound you've been ignoring. It knows.", "category": "observational", "depth": 1},

OLD: {"text": "What colour appears most in your immediate surroundings?", "category": "observational", "depth": 1},
NEW: {"text": "What color is everywhere around you right now? Congratulations, you live inside it.", "category": "observational", "depth": 1},

OLD: {"text": "What's the closest object to your left hand?", "category": "observational", "depth": 1},
NEW: {"text": "What's within reach of your left hand? No cheating — actually look.", "category": "observational", "depth": 1},

OLD: {"text": "What does the light look like where you are right now?", "category": "observational", "depth": 1},
NEW: {"text": "Describe the light where you are right now. Be dramatic about it.", "category": "observational", "depth": 1},

OLD: {"text": "Name three things you can smell, even faintly.", "category": "observational", "depth": 1},
NEW: {"text": "Name three things you can smell right now. One of them might be you.", "category": "observational", "depth": 1},

OLD: {"text": "What's the temperature of the air on your skin?", "category": "observational", "depth": 1},
NEW: {"text": "How does the air feel on your skin? Give it a one-word review.", "category": "observational", "depth": 1},

OLD: {"text": "What are two people near you doing right now?", "category": "observational", "depth": 1},
NEW: {"text": "What are two people near you doing right now? Narrate it like a nature documentary.", "category": "observational", "depth": 1},

OLD: {"text": "What's the first thing your eyes land on when you look up?", "category": "observational", "depth": 1},
NEW: {"text": "What's the ugliest thing you can see right now?", "category": "observational", "depth": 1},

OLD: {"text": "What would a stranger notice about this place that you've stopped noticing?", "category": "observational", "depth": 1},
NEW: {"text": "What would a stranger clock about this place in five seconds flat that you stopped seeing months ago?", "category": "observational", "depth": 1},

OLD: {"text": "What's the weather doing outside right now?", "category": "observational", "depth": 1},
NEW: {"text": "Rate the current weather's effort. Explain.", "category": "observational", "depth": 1},

OLD: {"text": "What's something around you that tells a story about the person who made it?", "category": "observational", "depth": 2},
NEW: {"text": "What's something nearby that tells you about the person who made it? You've probably never wondered.", "category": "observational", "depth": 2},

OLD: {"text": "If you had to describe this moment to someone who's never been here, what would you say?", "category": "observational", "depth": 2},
NEW: {"text": "How would you describe this exact moment to someone who's never set foot here? Try not to lie.", "category": "observational", "depth": 2},

OLD: {"text": "What's the most worn, weathered thing in your current environment?", "category": "observational", "depth": 2},
NEW: {"text": "What's the most worn-out thing in your space right now? It's seen things.", "category": "observational", "depth": 2},

OLD: {"text": "What's something in your field of view that wasn't there a year ago?", "category": "observational", "depth": 2},
NEW: {"text": "What's in view right now that wasn't there a year ago? Small changes count.", "category": "observational", "depth": 2},

OLD: {"text": "If you had to photograph one thing right now to remember this moment, what would it be?", "category": "observational", "depth": 2},
NEW: {"text": "If you could only photograph one thing to remember this exact moment, what gets the shot?", "category": "observational", "depth": 2},

OLD: {"text": "What's the most human-made thing you can see, and who might have made it?", "category": "observational", "depth": 2},
NEW: {"text": "What's the most obviously human-made thing you can see? Guess who made it and why.", "category": "observational", "depth": 2},

OLD: {"text": "What does this place smell like, and what does that remind you of?", "category": "observational", "depth": 2},
NEW: {"text": "What does this place smell like, and what's it dragging up from memory?", "category": "observational", "depth": 2},

OLD: {"text": "What about your current surroundings would surprise the version of you from ten years ago?", "category": "observational", "depth": 3},
NEW: {"text": "What about your surroundings right now would genuinely surprise you from ten years ago?", "category": "observational", "depth": 3},

OLD: {"text": "If this location had a mood, what would it be and why?", "category": "observational", "depth": 3},
NEW: {"text": "If this place had a mood today, what would it be — and why that one?", "category": "observational", "depth": 3},

OLD: {"text": "What's something around you that feels out of place, and what does that say?", "category": "observational", "depth": 3},
NEW: {"text": "What's something here that feels slightly out of place? What does that actually say?", "category": "observational", "depth": 3},
```

(Write the em dash and curly quotes as literal UTF-8 characters in the actual JSON file, matching the existing file's style — the `—` above is just this plan document's way of showing you which character goes where.)

- [ ] **Step 2: Run the regression guard and full suite**

Run: `npx tsc --noEmit && npm test -- --runInBand`
Expected: no type errors, all suites PASS (including `library-voice.test.ts` from Task 1 — confirms no emoji/exclamation/British-spelling crept in)

- [ ] **Step 3: Commit**

```bash
git add src/prompts/library.json
git commit -m "content: rewrite OBSERVE category prompts in voice-guide voice"
```

---

### Task 4: Rewrite the REFLECT category (reflective, 20 prompts)

**Files:**
- Modify: `src/prompts/library.json` (the 20 `"category": "reflective"` entries)

**Interfaces:**
- Consumes: nothing
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Replace each of the 20 reflective entries' `text` value**

```
OLD: {"text": "What's one thing that went well today, however small?", "category": "reflective", "depth": 1},
NEW: {"text": "What's one thing that went right today, even a small dumb one?", "category": "reflective", "depth": 1},

OLD: {"text": "What's the last thing that made you laugh?", "category": "reflective", "depth": 1},
NEW: {"text": "What's the last thing that actually made you laugh? Not smile-laugh. Laugh.", "category": "reflective", "depth": 1},

OLD: {"text": "What's something you're looking forward to in the next 24 hours?", "category": "reflective", "depth": 1},
NEW: {"text": "What's one thing you're mildly looking forward to in the next day? Lower the bar if you need to.", "category": "reflective", "depth": 1},

OLD: {"text": "What's one decision you made today?", "category": "reflective", "depth": 1},
NEW: {"text": "Name one decision you made today. Defend it or don't.", "category": "reflective", "depth": 1},

OLD: {"text": "What's a song stuck in your head right now?", "category": "reflective", "depth": 1},
NEW: {"text": "What song is stuck in your head right now? No judgment. Okay, some judgment.", "category": "reflective", "depth": 1},

OLD: {"text": "What did you eat last, and did you enjoy it?", "category": "reflective", "depth": 1},
NEW: {"text": "What's the last thing you ate, and did it deliver?", "category": "reflective", "depth": 1},

OLD: {"text": "Name one person you thought about today.", "category": "reflective", "depth": 1},
NEW: {"text": "Name one person who crossed your mind today, uninvited or not.", "category": "reflective", "depth": 1},

OLD: {"text": "What time did you wake up, and was that intentional?", "category": "reflective", "depth": 1},
NEW: {"text": "What time did you wake up, and was that a choice or a hostage situation?", "category": "reflective", "depth": 1},

OLD: {"text": "What's something you said today that you're glad you said?", "category": "reflective", "depth": 2},
NEW: {"text": "What's something you said today that you're actually glad you said?", "category": "reflective", "depth": 2},

OLD: {"text": "What's something you meant to do today that didn't happen?", "category": "reflective", "depth": 2},
NEW: {"text": "What did you mean to do today that just… didn't happen? No follow-up questions.", "category": "reflective", "depth": 2},

OLD: {"text": "What's been on your mind most this week?", "category": "reflective", "depth": 2},
NEW: {"text": "What's been sitting in the back of your mind most this week?", "category": "reflective", "depth": 2},

OLD: {"text": "What's a small habit you've been trying to build or break lately?", "category": "reflective", "depth": 2},
NEW: {"text": "What's a small habit you're trying to build or quietly break right now?", "category": "reflective", "depth": 2},

OLD: {"text": "What's something you're putting off, and what would it take to start?", "category": "reflective", "depth": 2},
NEW: {"text": "What's something you keep putting off? At this point it's basically a pet.", "category": "reflective", "depth": 2},

OLD: {"text": "Who did you talk to today, and how did those interactions leave you feeling?", "category": "reflective", "depth": 2},
NEW: {"text": "Who did you talk to today, and how did it leave you feeling afterward?", "category": "reflective", "depth": 2},

OLD: {"text": "What's something you learned or realized in the past few days?", "category": "reflective", "depth": 2},
NEW: {"text": "What's something you learned or finally admitted to yourself this week?", "category": "reflective", "depth": 2},

OLD: {"text": "What's a belief you hold now that you didn't hold five years ago?", "category": "reflective", "depth": 3},
NEW: {"text": "What's something you believe now that you didn't five years ago?", "category": "reflective", "depth": 3},

OLD: {"text": "What's something you've been avoiding thinking about?", "category": "reflective", "depth": 3},
NEW: {"text": "What's something you've been actively avoiding thinking about?", "category": "reflective", "depth": 3},

OLD: {"text": "If this week were a chapter in a book, what would you title it?", "category": "reflective", "depth": 3},
NEW: {"text": "If this week were a chapter title, what would it be?", "category": "reflective", "depth": 3},

OLD: {"text": "What's something you wish you could say to someone, but haven't?", "category": "reflective", "depth": 3},
NEW: {"text": "What's something you wish you could say to someone, but haven't yet?", "category": "reflective", "depth": 3},

OLD: {"text": "What does 'a good day' mean to you right now, and does your life have many of them?", "category": "reflective", "depth": 3},
NEW: {"text": "What does a good day actually look like for you right now? Are you getting many of them?", "category": "reflective", "depth": 3},
```

- [ ] **Step 2: Run the regression guard and full suite**

Run: `npx tsc --noEmit && npm test -- --runInBand`
Expected: no type errors, all suites PASS

- [ ] **Step 3: Commit**

```bash
git add src/prompts/library.json
git commit -m "content: rewrite REFLECT category prompts in voice-guide voice"
```

---

### Task 5: Rewrite the CONFESS category (personal, 18 prompts)

**Files:**
- Modify: `src/prompts/library.json` (the 18 `"category": "personal"` entries)

**Interfaces:**
- Consumes: nothing
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Replace each of the 18 personal entries' `text` value**

```
OLD: {"text": "What's your current comfort food, and when did it become that?", "category": "personal", "depth": 1},
NEW: {"text": "What's your current comfort food, and when did that relationship start?", "category": "personal", "depth": 1},

OLD: {"text": "What's a show, book, or podcast you've been into lately?", "category": "personal", "depth": 1},
NEW: {"text": "What have you been into lately — a show, book, or podcast? No pressure to make it sound smart.", "category": "personal", "depth": 1},

OLD: {"text": "What's something you've bought recently that was worth it?", "category": "personal", "depth": 1},
NEW: {"text": "What did you almost buy today? Be honest.", "category": "personal", "depth": 1},

OLD: {"text": "What's the most-used app on your phone right now, and how do you feel about that?", "category": "personal", "depth": 1},
NEW: {"text": "What's the most-used app on your phone right now? How do you feel about that, really?", "category": "personal", "depth": 1},

OLD: {"text": "What's a skill you're proud of that most people don't know about?", "category": "personal", "depth": 1},
NEW: {"text": "What's a skill you're quietly proud of that nobody asks about?", "category": "personal", "depth": 1},

OLD: {"text": "What's your go-to order at a coffee shop?", "category": "personal", "depth": 1},
NEW: {"text": "What's your go-to coffee order? Judge yourself accordingly.", "category": "personal", "depth": 1},

OLD: {"text": "What's something you do differently from how most people do it?", "category": "personal", "depth": 2},
NEW: {"text": "What's something you do differently from how everyone else seems to do it? Doesn't mean you're right.", "category": "personal", "depth": 2},

OLD: {"text": "What's a goal you had at the start of this year? How's it going?", "category": "personal", "depth": 2},
NEW: {"text": "What was one goal you had at the start of this year? Status update, please.", "category": "personal", "depth": 2},

OLD: {"text": "What's a place you've been that you'd return to immediately if you could?", "category": "personal", "depth": 2},
NEW: {"text": "What's a place you'd go back to immediately, no questions asked?", "category": "personal", "depth": 2},

OLD: {"text": "What's a compliment you've received that stuck with you?", "category": "personal", "depth": 2},
NEW: {"text": "What's a compliment that's stuck with you longer than it probably should have?", "category": "personal", "depth": 2},

OLD: {"text": "What's a quality you admire in others that you wish you had more of?", "category": "personal", "depth": 2},
NEW: {"text": "What's a quality you admire in other people that you wish you had more of? You're allowed to be a little jealous about it.", "category": "personal", "depth": 2},

OLD: {"text": "What does your ideal ordinary Tuesday look like?", "category": "personal", "depth": 3},
NEW: {"text": "What does your ideal, completely ordinary Tuesday actually look like?", "category": "personal", "depth": 3},

OLD: {"text": "What's something you've been carrying that you'd like to put down?", "category": "personal", "depth": 3},
NEW: {"text": "What's something you've been carrying that you'd like to finally put down?", "category": "personal", "depth": 3},

OLD: {"text": "What's a version of yourself that you've outgrown?", "category": "personal", "depth": 3},
NEW: {"text": "What's a version of yourself you've outgrown?", "category": "personal", "depth": 3},

OLD: {"text": "What's something you're genuinely proud of that you don't talk about enough?", "category": "personal", "depth": 3},
NEW: {"text": "What's something you're genuinely proud of that you never bring up?", "category": "personal", "depth": 3},

OLD: {"text": "What would you do differently if no one was watching?", "category": "personal", "depth": 3},
NEW: {"text": "What would you do differently if you knew no one was watching?", "category": "personal", "depth": 3},

OLD: {"text": "What's a fear you've gotten better at living with?", "category": "personal", "depth": 3},
NEW: {"text": "What's a fear you've gotten better at living alongside, even if it never left?", "category": "personal", "depth": 3},
```

OLD: {"text": "What's something you've changed your mind about in the last year?", "category": "personal", "depth": 2},
NEW: {"text": "What's something you've changed your mind about in the last year? You don't have to defend the old opinion.", "category": "personal", "depth": 2},

- [ ] **Step 2: Run the regression guard and full suite**

Run: `npx tsc --noEmit && npm test -- --runInBand`
Expected: no type errors, all suites PASS

- [ ] **Step 3: Commit**

```bash
git add src/prompts/library.json
git commit -m "content: rewrite CONFESS category prompts in voice-guide voice"
```

---

### Task 6: Rewrite the IMAGINE category (creative, 14 prompts)

**Files:**
- Modify: `src/prompts/library.json` (the 14 `"category": "creative"` entries)

**Interfaces:**
- Consumes: nothing
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Replace each of the 14 creative entries' `text` value**

```
OLD: {"text": "If this moment were a movie scene, what genre would it be?", "category": "creative", "depth": 1},
NEW: {"text": "If this exact moment were a movie scene, what genre are we in?", "category": "creative", "depth": 1},

OLD: {"text": "Give the person nearest to you a superhero name based only on what you can observe.", "category": "creative", "depth": 1},
NEW: {"text": "Give the person nearest you a superhero name, based only on what you can currently observe.", "category": "creative", "depth": 1},

OLD: {"text": "If the sounds around you were a song, what would it be called?", "category": "creative", "depth": 1},
NEW: {"text": "If the sounds around you right now were a song, what's it called?", "category": "creative", "depth": 1},

OLD: {"text": "What animal would best describe your energy right now?", "category": "creative", "depth": 1},
NEW: {"text": "What animal matches your current energy? Commit to the answer.", "category": "creative", "depth": 1},

OLD: {"text": "If you had to write one sentence about today for a future historian, what would it say?", "category": "creative", "depth": 1},
NEW: {"text": "Write one sentence about today for a future historian. Make it dramatic.", "category": "creative", "depth": 1},

OLD: {"text": "Describe your current mood as a weather system.", "category": "creative", "depth": 2},
NEW: {"text": "Describe your current mood as a weather system. Include a forecast.", "category": "creative", "depth": 2},

OLD: {"text": "If your life right now were a book, what section of the bookstore would it be in?", "category": "creative", "depth": 2},
NEW: {"text": "If your life right now were a section of a bookstore, which one — and why does that sting a little?", "category": "creative", "depth": 2},

OLD: {"text": "Write a two-sentence story about a stranger you've seen today.", "category": "creative", "depth": 2},
NEW: {"text": "Write a two-sentence story about a stranger you saw today. They'll never know they're famous.", "category": "creative", "depth": 2},

OLD: {"text": "If you could redesign one thing about where you are right now, what would it be?", "category": "creative", "depth": 2},
NEW: {"text": "If you could redesign one thing about where you are right now, what's getting fixed first? Be specific. Be a little unreasonable.", "category": "creative", "depth": 2},

OLD: {"text": "What would a documentary crew find interesting about the last hour of your life?", "category": "creative", "depth": 2},
NEW: {"text": "What would a documentary crew find weirdly interesting about the last hour of your life? They'd probably need a narrator with a very flat voice.", "category": "creative", "depth": 2},

OLD: {"text": "If your past self from five years ago were watching you right now, what would they think?", "category": "creative", "depth": 3},
NEW: {"text": "If your self from five years ago were watching you right now, what would they think?", "category": "creative", "depth": 3},

OLD: {"text": "If you could send a postcard from this exact moment to your future self, what would it say?", "category": "creative", "depth": 3},
NEW: {"text": "If you sent a postcard from this exact moment to your future self, what would it say?", "category": "creative", "depth": 3},
```

Leave these 2 entries exactly as they are — already in voice, no edit needed:
- `"What's a story you keep telling about yourself that might not be true anymore?"`
- `"Describe the version of yourself you're becoming."`

- [ ] **Step 2: Run the regression guard and full suite**

Run: `npx tsc --noEmit && npm test -- --runInBand`
Expected: no type errors, all suites PASS

- [ ] **Step 3: Commit**

```bash
git add src/prompts/library.json
git commit -m "content: rewrite IMAGINE category prompts in voice-guide voice"
```

---

### Task 7: Light-touch pass on the 4 game prompts

**Files:**
- Modify: `src/prompts/library.json` (the 4 `"category": "game"` entries — 3 `kind: "rank"`, 1 `kind: "loveHate"`)

**Interfaces:**
- Consumes: nothing
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Make the one warranted change**

Per the spec, these 4 already read close to the target voice — punch up only where flat. Only one earns a change (adds concrete stakes without stacking a second joke):

```
OLD: {"text": "Rank 3 people you would trust with your phone.", "category": "game", "depth": 1, "kind": "rank", "slots": ["most trusted…", "probably fine…", "risky but ok…"]},
NEW: {"text": "Rank 3 people you'd trust with your unlocked phone for five minutes.", "category": "game", "depth": 1, "kind": "rank", "slots": ["most trusted…", "probably fine…", "risky but ok…"]},
```

Leave these 3 entries exactly as they are — already in voice, no edit needed:
- `"Rank your last 3 snacks. Defend #1."`
- `"Rank 3 ways to waste a perfectly good afternoon."`
- `"Love it / Hate it. The theme decides, you commit."` (and its `themes` array — out of scope per the design spec)

- [ ] **Step 2: Run the regression guard and full suite**

Run: `npx tsc --noEmit && npm test -- --runInBand`
Expected: no type errors, all suites PASS (including `seed.test.ts`'s rank/loveHate structural checks — untouched by this wording change)

- [ ] **Step 3: Commit**

```bash
git add src/prompts/library.json
git commit -m "content: light-touch pass on game prompt wording"
```

---

### Task 8: Append calibration examples to the voice guide + final validation

**Files:**
- Modify: `docs/voice-guide.md` (the "Reference: existing copy that nails it" section, ~line 62-70)

**Interfaces:**
- Consumes: the rewritten prompts from Tasks 3-6
- Produces: nothing — terminal task

- [ ] **Step 1: Append a new subsection after the existing "Reference" list**

In `docs/voice-guide.md`, after the existing bullet list under `## Reference: existing copy that nails it` (the "SAVED. POINTLESS. PERFECT." list) and before `## Line bank`, insert:

```markdown

### Prompt examples (2026-08-10 rewrite)

Pulled from `library.json` as calibration for future prompt-writing — notice these hit the tag-on-jab pattern four different ways, not one repeated shape.

- "Name a sound you've been ignoring. It knows." — separate deadpan quip sentence.
- "What color is everywhere around you right now? Congratulations, you live inside it." — quip lands as the tag.
- "What are two people near you doing right now? Narrate it like a nature documentary." — imperative instruction as the jab.
- "If the sounds around you right now were a song, what's it called?" — the premise itself carries the joke, no separate tag needed.
- "What would a stranger clock about this place in five seconds flat that you stopped seeing months ago?" — jab embedded inside the question, one sentence.
- "What did you mean to do today that just… didn't happen? No follow-up questions." — depth 2, dry deflection lowers the stakes.
```

- [ ] **Step 2: Run the full validation suite**

Run: `npx tsc --noEmit && npm test -- --runInBand`
Expected: no type errors, all suites PASS — this is the final gate before the user does the human tone read the spec calls for

- [ ] **Step 3: Commit**

```bash
git add docs/voice-guide.md
git commit -m "docs: add prompt-specific calibration examples to voice guide"
```

- [ ] **Step 4: Push and verify**

```bash
git push origin main
git log -1 --format='local: %H' && git log -1 --format='remote: %H' origin/main
```

Expected: local and remote HEAD match — confirms the push actually landed (per this repo's git workflow note about silent push failures).

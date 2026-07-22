// Borednotes voice — deadpan, faintly rude, never evaluative. No emoji.
// Copy deck from the design system's content.json.

export const CTA_LABELS = [
  'DUMP A THOUGHT',
  'CLEAR THE BRAIN TUBES',
  'UNLOAD THE NOGGIN',
  'EMPTY THE SKULL',
  'OFFLOAD SOMETHING',
  'SPILL IT, FRIEND',
];

export const QUIPS = [
  'Ugh. FINALLY. Entertain me.',
  'Back already? Not surprised. Not impressed.',
  'Make it good this time. Low bar. Clear it.',
  'I was busy. Doing nothing. You interrupted.',
  "Dazzle me. Or don't. I've stopped hoping.",
];

export const QUIP_ROTATION_MS = 4600;

export const SAVED_TOASTS = [
  'SAVED. POINTLESS. PERFECT.',
  'FILED UNDER NONSENSE.',
  'ANOTHER BANGER. ALLEGEDLY.',
  'NOBODY ASKED. SAVED ANYWAY.',
];

export const SAVED_TOAST_MS = 1250;

export const REPLY_COPY = {
  promptedPlaceholder: 'type here, genius…',
  freeformPlaceholder: 'empty the skull here…',
  freeformQuestion: 'Say literally anything. Nobody is reading. Probably.',
  promptedSend: 'SEND IT',
  freeformSend: 'DUMP IT',
};

// Shown when bailing out of a half-written entry. Warn only past this many
// words, so a stray letter or two doesn't nag.
export const DISCARD_WARN_MIN_WORDS = 8;

export const DISCARD_COPY = {
  title: 'Bailing already?',
  body: 'You actually wrote something. Throw it out?',
  keep: 'Keep going',
  discard: 'Trash it',
};

// Live word-counter heckles, keyed by word-count thresholds (>=), checked highest first.
const WORD_COUNTER: Array<[number, string]> = [
  [41, "okay, you're writing a memoir"],
  [16, "now you're cooking"],
  [1, 'a start, technically'],
  [0, '0 words. bold of you.'],
];

export function wordCounterLine(text: string): string {
  const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
  for (const [threshold, line] of WORD_COUNTER) {
    if (words >= threshold) return line;
  }
  return WORD_COUNTER[WORD_COUNTER.length - 1][1];
}

// Setup-band labels for freeform (no-prompt) entries on the share card.
export const FREEFORM_KICKERS = [
  'NO ONE ASKED, BUT—',
  'UNPROMPTED THOUGHT',
  'BRAIN DUMP RECEIPT',
  'FILED UNDER: WHATEVER',
] as const;

// Small taglines under the wordmark in the share-card footer.
export const SHARE_TAGLINES = [
  'professionally bored',
  'the anti-scroll journal',
  'bored on purpose',
] as const;

export const SHARE_LINES = [
  'Screenshot bait, honestly.',
  'Share it. Start some drama.',
  "Make it the group chat's problem.",
  'Too good to keep. Unfortunately.',
  'Go on. Ruin a friendship.',
  'Let the people riot.',
  'Inflict this on someone you love.',
  'Watch the comments turn feral.',
];

export const HITS_COPY = {
  title: 'Your Greatest Hits',
  subtitle: 'This is your brain on boredom. Hold to inflict on a friend.',
  emptyTitle: 'Nothing here. Shocking.',
  emptySubtitle: 'No bangers in this category yet. Go be interesting.',
  barLabel: 'YOUR GREATEST HITS',
  barCountSuffix: 'BANGERS',
};

export const HOME_PICK_LABEL = 'PICK ONE, GENIUS ↓';

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

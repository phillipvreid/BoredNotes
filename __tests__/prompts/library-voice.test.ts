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

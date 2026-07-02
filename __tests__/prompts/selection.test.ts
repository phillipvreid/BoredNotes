import { selectPrompt, selectHomeCardPrompts } from '../../src/prompts/selection';
import type { Prompt } from '../../src/types';

const makePrompt = (overrides: Partial<Prompt>): Prompt => ({
  id: 1, text: 'Test prompt', category: 'observational', depth: 1,
  source: 'library', last_used_at: null, kind: 'text', game_config: null, ...overrides,
});

describe('selectPrompt', () => {
  it('picks a prompt from the available list', () => {
    const prompts = [makePrompt({ id: 1 }), makePrompt({ id: 2 })];
    const result = selectPrompt(prompts, [], []);
    expect(prompts).toContain(result);
  });

  it('avoids categories used in last 2 entries', () => {
    const obs = makePrompt({ id: 1, category: 'observational' });
    const ref = makePrompt({ id: 2, category: 'reflective' });
    const prompts = [obs, ref];
    const result = selectPrompt(prompts, ['observational', 'observational'], []);
    expect(result.category).toBe('reflective');
  });

  it('avoids depth repeated 3 times in a row', () => {
    const depth1 = makePrompt({ id: 1, depth: 1, category: 'observational' });
    const depth2 = makePrompt({ id: 2, depth: 2, category: 'reflective' });
    const prompts = [depth1, depth2];
    const result = selectPrompt(prompts, [], [1, 1, 1]);
    expect(result.depth).toBe(2);
  });

  it('falls back to full list if no candidates after filtering', () => {
    const obs = makePrompt({ id: 1, category: 'observational' });
    const result = selectPrompt([obs], ['observational', 'observational'], []);
    expect(result).toBe(obs);
  });

  it('throws if available list is empty', () => {
    expect(() => selectPrompt([], [], [])).toThrow('No prompts available');
  });
});

describe('selectHomeCardPrompts', () => {
  it('picks the requested number of prompts from distinct categories', () => {
    const prompts = [
      makePrompt({ id: 1, category: 'observational' }),
      makePrompt({ id: 2, category: 'observational' }),
      makePrompt({ id: 3, category: 'reflective' }),
      makePrompt({ id: 4, category: 'personal' }),
      makePrompt({ id: 5, category: 'creative' }),
    ];
    const result = selectHomeCardPrompts(prompts, 3);
    expect(result).toHaveLength(3);
    const categories = result.map(p => p.category);
    expect(new Set(categories).size).toBe(3);
  });

  it('tops up with duplicate categories when fewer categories than cards', () => {
    const prompts = [
      makePrompt({ id: 1, category: 'observational' }),
      makePrompt({ id: 2, category: 'observational' }),
      makePrompt({ id: 3, category: 'observational' }),
    ];
    const result = selectHomeCardPrompts(prompts, 3);
    expect(result).toHaveLength(3);
    expect(new Set(result.map(p => p.id)).size).toBe(3);
  });

  it('returns everything when fewer prompts than requested', () => {
    const prompts = [makePrompt({ id: 1 })];
    expect(selectHomeCardPrompts(prompts, 3)).toHaveLength(1);
  });

  it('returns empty for empty input', () => {
    expect(selectHomeCardPrompts([], 3)).toEqual([]);
  });
});

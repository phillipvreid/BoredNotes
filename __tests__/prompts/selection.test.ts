import { selectPrompt } from '../../src/prompts/selection';
import type { Prompt } from '../../src/types';

const makePrompt = (overrides: Partial<Prompt>): Prompt => ({
  id: 1, text: 'Test prompt', category: 'observational', depth: 1,
  source: 'library', last_used_at: null, ...overrides,
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

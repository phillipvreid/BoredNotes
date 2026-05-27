import { generateAiPrompt } from '../../src/prompts/ai';

const MOCK_KEY = 'test-key';

describe('generateAiPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a prompt string on success', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'What is the texture of the surface beneath you?' }],
      }),
    } as any);

    const result = await generateAiPrompt(
      { category: 'observational', depth: 1, recentTopics: [] },
      MOCK_KEY
    );
    expect(result).toBe('What is the texture of the surface beneath you?');
  });

  it('returns null on network error', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));
    const result = await generateAiPrompt(
      { category: 'reflective', depth: 2, recentTopics: [] },
      MOCK_KEY
    );
    expect(result).toBeNull();
  });

  it('returns null on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false } as any);
    const result = await generateAiPrompt(
      { category: 'personal', depth: 1, recentTopics: [] },
      MOCK_KEY
    );
    expect(result).toBeNull();
  });
});

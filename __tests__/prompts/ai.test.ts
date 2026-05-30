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

  it('includes rich context line when all rich signals are present', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'What brings you comfort?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'reflective',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'evening',
          dayOfWeek: 'Thursday',
          season: 'autumn',
          locationLabel: 'Edinburgh, Scotland',
          weatherCondition: 'rainy',
          temperatureCelsius: 11,
        },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain("It's a rainy Thursday evening in Edinburgh, Scotland, 11°C.");
  });

  it('includes light context line when rich signals are absent', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'What did you notice today?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'observational',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'morning',
          dayOfWeek: 'Monday',
          season: 'spring',
          locationLabel: null,
          weatherCondition: null,
          temperatureCelsius: null,
        },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain("It's a Monday morning in spring.");
  });

  it('omits context line when no context is provided', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'Some prompt?' }] }),
    } as any);

    await generateAiPrompt({ category: 'reflective', depth: 1, recentTopics: [] }, MOCK_KEY);

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).not.toContain("It's a");
  });
});

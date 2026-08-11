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

  it('includes only the weather fragment when only the weather modifier is on', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'What does the air feel like?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'observational',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'evening', dayOfWeek: 'Thursday', season: 'autumn',
          locationLabel: 'Edinburgh, Scotland', weatherCondition: 'rainy', temperatureCelsius: 11,
        },
        modifiers: { time: false, place: false, weather: true, memory: false },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain("It's rainy, 11°C.");
    expect(body.messages[0].content).not.toContain('Edinburgh');
    expect(body.messages[0].content).not.toContain('Thursday');
  });

  it('includes only the place fragment when only the place modifier is on', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'What do you notice around you?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'observational',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'evening', dayOfWeek: 'Thursday', season: 'autumn',
          locationLabel: 'Edinburgh, Scotland', weatherCondition: 'rainy', temperatureCelsius: 11,
        },
        modifiers: { time: false, place: true, weather: false, memory: false },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('The user is currently in Edinburgh, Scotland.');
    expect(body.messages[0].content).not.toContain('rainy');
  });

  it('falls back to season when time is on but place is off, even if a location is available', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'What season feeling stands out?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'reflective',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'evening', dayOfWeek: 'Thursday', season: 'autumn',
          locationLabel: 'Edinburgh, Scotland', weatherCondition: 'rainy', temperatureCelsius: 11,
        },
        modifiers: { time: true, place: false, weather: false, memory: false },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain("It's a Thursday evening in autumn.");
  });

  it('includes both time and weather fragments when place is off', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'How does the weather match your evening?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'observational',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'evening', dayOfWeek: 'Thursday', season: 'autumn',
          locationLabel: 'Edinburgh, Scotland', weatherCondition: 'rainy', temperatureCelsius: 11,
        },
        modifiers: { time: true, place: false, weather: true, memory: false },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain("It's a rainy Thursday evening in autumn, 11°C.");
    expect(body.messages[0].content).not.toContain('Edinburgh');
  });

  it('omits the context line entirely when all modifiers are off', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'A bare prompt?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'reflective',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'evening', dayOfWeek: 'Thursday', season: 'autumn',
          locationLabel: 'Edinburgh, Scotland', weatherCondition: 'rainy', temperatureCelsius: 11,
        },
        modifiers: { time: false, place: false, weather: false, memory: false },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).not.toContain("It's");
    expect(body.messages[0].content).not.toContain('force every detail');
  });

  it('appends a soft steering line only when a context line is present', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'A steered prompt?' }] }),
    } as any);

    await generateAiPrompt(
      {
        category: 'reflective',
        depth: 1,
        recentTopics: [],
        context: {
          timeOfDay: 'evening', dayOfWeek: 'Thursday', season: 'autumn',
          locationLabel: 'Edinburgh, Scotland', weatherCondition: 'rainy', temperatureCelsius: 11,
        },
        modifiers: { time: true, place: false, weather: false, memory: false },
      },
      MOCK_KEY
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain('only use what makes it feel timely or personal');
  });

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

  describe('Help Me Write (no category — chip-driven)', () => {
    it('never mentions a homescreen category when category is omitted', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: 'What do you notice around you?' }] }),
      } as any);

      await generateAiPrompt(
        { depth: 1, recentTopics: [], modifiers: { time: false, place: true, weather: false, memory: false } },
        MOCK_KEY
      );

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages[0].content).not.toContain('category');
    });

    it('builds a place-forcing instruction when only the place chip is active', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: 'x' }] }),
      } as any);

      await generateAiPrompt(
        { depth: 1, recentTopics: [], modifiers: { time: false, place: true, weather: false, memory: false } },
        MOCK_KEY
      );

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages[0].content).toContain('MUST be about a place');
      expect(body.messages[0].content).not.toContain('weather right now');
      expect(body.messages[0].content).not.toContain('time of day');
    });

    it('names the actual location in the place instruction when context has one', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: 'x' }] }),
      } as any);

      await generateAiPrompt(
        {
          depth: 1,
          recentTopics: [],
          context: {
            timeOfDay: 'evening', dayOfWeek: 'Friday', season: 'summer',
            locationLabel: 'San Francisco', weatherCondition: 'clear', temperatureCelsius: 20,
          },
          modifiers: { time: false, place: true, weather: false, memory: false },
        },
        MOCK_KEY
      );

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages[0].content).toContain('MUST be about a place');
      expect(body.messages[0].content).toContain("favorite bar in San Francisco");
    });

    it('combines multiple active chips into one instruction', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: 'x' }] }),
      } as any);

      await generateAiPrompt(
        { depth: 1, recentTopics: [], modifiers: { time: false, place: true, weather: true, memory: false } },
        MOCK_KEY
      );

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages[0].content).toContain('MUST be about a place');
      expect(body.messages[0].content).toContain('weather right now');
    });

    it('falls back to a broad spark instruction when no chips are active', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: 'x' }] }),
      } as any);

      await generateAiPrompt(
        { depth: 1, recentTopics: [], modifiers: { time: false, place: false, weather: false, memory: false } },
        MOCK_KEY
      );

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages[0].content).toContain('low-stakes writing spark');
    });

    it('uses the homescreen-category instruction when category is provided (unchanged homescreen path)', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: 'x' }] }),
      } as any);

      await generateAiPrompt({ category: 'creative', depth: 1, recentTopics: [] }, MOCK_KEY);

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages[0].content).toContain('in the "creative" category');
    });
  });
});

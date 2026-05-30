jest.mock('../../src/prompts/ai');
jest.mock('../../src/context/gather');

import { getContextualPrompt } from '../../src/prompts/contextual';
import { generateAiPrompt } from '../../src/prompts/ai';
import { gatherContext } from '../../src/context/gather';

const mockGenerateAiPrompt = generateAiPrompt as jest.Mock;
const mockGatherContext = gatherContext as jest.Mock;

const samplePrompt = {
  id: 1, text: 'What made you smile today?', category: 'reflective' as const,
  depth: 1 as const, source: 'library' as const, last_used_at: null,
};

const lightContext = {
  timeOfDay: 'morning' as const, dayOfWeek: 'Monday', season: 'spring' as const,
  locationLabel: null, weatherCondition: null, temperatureCelsius: null,
};

function makeMockDb(settingOverrides: Record<string, string> = {}) {
  const settings: Record<string, string> = {
    offline_mode: 'false',
    contextual_prompt_generated_at: '',
    contextual_prompt_text: '',
    contextual_prompt_category: '',
    recent_categories: '[]',
    recent_depths: '[]',
    current_prompt_text: 'Fallback prompt',
    current_prompt_category: 'reflective',
    ...settingOverrides,
  };
  return {
    getFirstAsync: jest.fn().mockImplementation(async (_sql: string, params: string[]) => {
      const key = params[0];
      return settings[key] !== undefined ? { value: settings[key] } : null;
    }),
    getAllAsync: jest.fn()
      .mockResolvedValueOnce([])             // getRecentEntries
      .mockResolvedValueOnce([samplePrompt]) // getEligiblePrompts (filtered)
      .mockResolvedValueOnce([samplePrompt]),// getEligiblePrompts (fallback)
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    execAsync: jest.fn(),
    withTransactionAsync: jest.fn().mockImplementation(async (fn: () => Promise<void>) => fn()),
  };
}

describe('getContextualPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGatherContext.mockResolvedValue(lightContext);
  });

  it('returns the AI-generated prompt on success', async () => {
    const db = makeMockDb();
    mockGenerateAiPrompt.mockResolvedValue('What small joy surprised you this morning?');

    const result = await getContextualPrompt(db as any);

    expect(result.text).toBe('What small joy surprised you this morning?');
    expect(result.category).toBe('reflective');
  });

  it('falls back to DB prompt when generateAiPrompt returns null', async () => {
    const db = makeMockDb();
    mockGenerateAiPrompt.mockResolvedValue(null);

    const result = await getContextualPrompt(db as any);

    expect(result.text).toBe('Fallback prompt');
    expect(result.category).toBe('reflective');
  });

  it('returns cached contextual prompt when within the 1-hour throttle', async () => {
    const recentTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const db = makeMockDb({
      contextual_prompt_generated_at: recentTimestamp,
      contextual_prompt_text: 'Cached contextual prompt',
      contextual_prompt_category: 'personal',
    });

    const result = await getContextualPrompt(db as any);

    expect(result.text).toBe('Cached contextual prompt');
    expect(result.category).toBe('personal');
    expect(mockGenerateAiPrompt).not.toHaveBeenCalled();
    expect(mockGatherContext).not.toHaveBeenCalled();
  });

  it('skips generation and returns DB prompt when offline mode is enabled', async () => {
    const db = makeMockDb({ offline_mode: 'true' });

    const result = await getContextualPrompt(db as any);

    expect(result.text).toBe('Fallback prompt');
    expect(mockGenerateAiPrompt).not.toHaveBeenCalled();
    expect(mockGatherContext).not.toHaveBeenCalled();
  });
});

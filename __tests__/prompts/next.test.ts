import { getNextPrompt } from '../../src/prompts/next';
import { generateAiPrompt } from '../../src/prompts/ai';

jest.mock('../../src/prompts/ai');

const mockGenerateAiPrompt = generateAiPrompt as jest.Mock;

const samplePrompt = {
  id: 1,
  text: 'What small thing made you smile today?',
  category: 'reflective' as const,
  depth: 1 as const,
  source: 'library' as const,
  last_used_at: null,
};

function makeMockDb() {
  return {
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    execAsync: jest.fn(),
    withTransactionAsync: jest.fn().mockImplementation(async (fn: () => Promise<void>) => fn()),
  };
}

describe('getNextPrompt', () => {
  let db: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    db = makeMockDb();
    // getAllAsync call order inside getNextPrompt:
    // 1. getRecentEntries  2. getEligiblePrompts (filtered)  3. getEligiblePrompts (fallback)
    db.getAllAsync
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([samplePrompt])
      .mockResolvedValueOnce([samplePrompt]);
  });

  it('skips AI when offline_mode is true', async () => {
    // getFirstAsync call order: recent_categories, recent_depths, prompt_call_count, offline_mode
    // prompt_call_count = 3 → 3 % 4 === 3 → useAi = true (would trigger AI without offline flag)
    db.getFirstAsync
      .mockResolvedValueOnce(null)             // recent_categories
      .mockResolvedValueOnce(null)             // recent_depths
      .mockResolvedValueOnce({ value: '3' })   // prompt_call_count
      .mockResolvedValueOnce({ value: 'true' }); // offline_mode

    const result = await getNextPrompt(db as any);

    expect(mockGenerateAiPrompt).not.toHaveBeenCalled();
    expect(result.text).toBe(samplePrompt.text);
    expect(result.category).toBe(samplePrompt.category);
    expect(result.source).toBe('library');           // NEW
  });

  it('calls AI when offline_mode is false and conditions are met', async () => {
    mockGenerateAiPrompt.mockResolvedValueOnce('AI-generated question');
    db.getFirstAsync
      .mockResolvedValueOnce(null)              // recent_categories
      .mockResolvedValueOnce(null)              // recent_depths
      .mockResolvedValueOnce({ value: '3' })    // prompt_call_count
      .mockResolvedValueOnce({ value: 'false' }); // offline_mode

    const result = await getNextPrompt(db as any);

    expect(mockGenerateAiPrompt).toHaveBeenCalledTimes(1);
    expect(result.text).toBe('AI-generated question');
    expect(result.source).toBe('ai');                // NEW
  });
});

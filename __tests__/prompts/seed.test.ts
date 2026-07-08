import { seedLibraryIfNeeded } from '../../src/prompts/seed';
import { openDatabaseAsync } from 'expo-sqlite';
import library from '../../src/prompts/library.json';

describe('seedLibraryIfNeeded', () => {
  let db: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
  });

  it('seeds the whole library into an empty DB, including rank prompts', async () => {
    db.getAllAsync.mockResolvedValueOnce([]);
    await seedLibraryIfNeeded(db);
    expect(db.runAsync).toHaveBeenCalledTimes(library.length);

    const rankCalls = db.runAsync.mock.calls.filter((c: any[]) => c[1][4] === 'rank');
    expect(rankCalls.length).toBeGreaterThanOrEqual(3);
    for (const call of rankCalls) {
      expect(call[1][1]).toBe('game'); // category
      const config = JSON.parse(call[1][5]);
      expect(config.slots).toHaveLength(3);
    }
  });

  it('seeds the loveHate prompt with a themes config', async () => {
    db.getAllAsync.mockResolvedValueOnce([]);
    await seedLibraryIfNeeded(db);

    const lhCalls = db.runAsync.mock.calls.filter((c: any[]) => c[1][4] === 'loveHate');
    expect(lhCalls).toHaveLength(1);
    expect(lhCalls[0][1][1]).toBe('game'); // category
    const config = JSON.parse(lhCalls[0][1][5]);
    expect(config.themes.length).toBeGreaterThanOrEqual(20);
    expect(config.themes.every((t: unknown) => typeof t === 'string')).toBe(true);
  });

  it('tops up only missing prompts on an already-seeded DB', async () => {
    const existing = (library as Array<{ text: string }>).slice(0, library.length - 3);
    db.getAllAsync.mockResolvedValueOnce(existing.map(p => ({ text: p.text })));
    await seedLibraryIfNeeded(db);
    expect(db.runAsync).toHaveBeenCalledTimes(3);
  });

  it('does nothing when every library prompt already exists', async () => {
    db.getAllAsync.mockResolvedValueOnce((library as Array<{ text: string }>).map(p => ({ text: p.text })));
    await seedLibraryIfNeeded(db);
    expect(db.runAsync).not.toHaveBeenCalled();
  });
});

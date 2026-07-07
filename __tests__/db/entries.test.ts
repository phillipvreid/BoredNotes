import { createEntry, getYearsWithEntries, searchEntries } from '../../src/db/entries';
import { openDatabaseAsync } from 'expo-sqlite';

describe('createEntry', () => {
  let db: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
    db.runAsync.mockResolvedValue({ lastInsertRowId: 42, changes: 1 });
  });

  it('inserts a prompted entry with entry_mode = prompted', async () => {
    await createEntry(db, {
      prompt_text: 'What did you notice today?',
      response_text: 'A red door.',
    });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO entries'),
      ['What did you notice today?', 'A red door.', null, null, null, 'prompted', 'text', null, null]
    );
  });

  it('inserts a freeform entry with entry_mode = freeform', async () => {
    await createEntry(db, {
      prompt_text: '',
      response_text: 'Just a quiet morning.',
      entry_mode: 'freeform',
    });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO entries'),
      ['', 'Just a quiet morning.', null, null, null, 'freeform', 'text', null, null]
    );
  });

  it('defaults entry_mode to prompted when omitted', async () => {
    await createEntry(db, {
      prompt_text: 'Test prompt',
      response_text: 'Test response',
    });
    const callArgs = db.runAsync.mock.calls[0][1];
    expect(callArgs[5]).toBe('prompted');
  });

  it('returns the new entry id', async () => {
    const id = await createEntry(db, { prompt_text: 'p', response_text: 'r' });
    expect(id).toBe(42);
  });

  it('inserts a rank entry with entry_kind and game_data', async () => {
    const gameData = JSON.stringify({ items: ['pizza', 'cereal', 'clementine'], defense: 'intimacy' });
    await createEntry(db, {
      prompt_text: 'Rank your last 3 snacks. Defend #1.',
      response_text: '1. pizza',
      entry_kind: 'rank',
      game_data: gameData,
    });
    const callArgs = db.runAsync.mock.calls[0][1];
    expect(callArgs[6]).toBe('rank');
    expect(callArgs[7]).toBe(gameData);
  });

  it('persists the category for a prompted entry', async () => {
    await createEntry(db, {
      prompt_text: 'What did you notice today?',
      response_text: 'A red door.',
      category: 'observational',
    });
    const callArgs = db.runAsync.mock.calls[0][1];
    expect(callArgs[8]).toBe('observational');
  });

  it('defaults category to null when omitted', async () => {
    await createEntry(db, {
      prompt_text: 'Test prompt',
      response_text: 'Test response',
    });
    const callArgs = db.runAsync.mock.calls[0][1];
    expect(callArgs[8]).toBeNull();
  });
});

describe('searchEntries', () => {
  let db: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
  });

  it('matches response_text, prompt_text, and location_label with a wildcarded term', async () => {
    db.getAllAsync.mockResolvedValueOnce([]);
    await searchEntries(db, 'pizza');
    const [sql, params] = db.getAllAsync.mock.calls[0];
    expect(sql).toContain('response_text LIKE ?');
    expect(sql).toContain('prompt_text LIKE ?');
    expect(sql).toContain('location_label LIKE ?');
    expect(params).toEqual(['%pizza%', '%pizza%', '%pizza%']);
  });

  it('finds game entries via their plain-text response_text rendering', async () => {
    // Rank entries store renderRankResponseText() output in response_text,
    // so the ranked items and defense are searchable without touching game_data.
    const rankEntry = {
      id: 7,
      entry_kind: 'rank',
      response_text: '1. pizza\n2. cereal\n3. clementine\n\nDefend #1: it asks nothing of me',
      game_data: '{"items":["pizza","cereal","clementine"],"defense":"it asks nothing of me"}',
    };
    db.getAllAsync.mockResolvedValueOnce([rankEntry]);
    const results = await searchEntries(db, 'clementine');
    expect(results).toEqual([rankEntry]);
  });
});

describe('getYearsWithEntries', () => {
  let db: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
  });

  it('returns distinct years in descending order', async () => {
    db.getAllAsync.mockResolvedValueOnce([
      { y: '2026' }, { y: '2025' }, { y: '2024' },
    ]);
    const result = await getYearsWithEntries(db);
    expect(result).toEqual([2026, 2025, 2024]);
  });

  it('returns empty array when no entries exist', async () => {
    db.getAllAsync.mockResolvedValueOnce([]);
    const result = await getYearsWithEntries(db);
    expect(result).toEqual([]);
  });
});

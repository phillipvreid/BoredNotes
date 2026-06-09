import { openDatabaseAsync } from 'expo-sqlite';

// Each test imports getDb fresh via jest.isolateModules + require to reset the
// module-level _db singleton. The expo-sqlite mock is also re-required inside
// the isolated scope so that openDatabaseAsync returns the same db instance
// that getDb will use.
describe('getDb', () => {
  it('runs the entry_mode migration on init', async () => {
    let getDb: () => Promise<any>;
    let db: any;
    jest.isolateModules(() => {
      const sqlite = require('expo-sqlite');
      // Override the mock so we can capture the db used inside the isolated module
      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
      };
      sqlite.openDatabaseAsync.mockResolvedValue(mockDb);
      db = mockDb;
      ({ getDb } = require('../../src/db/database'));
    });
    await getDb!();
    const calls: string[] = db.execAsync.mock.calls.map((c: any[]) => c[0] as string);
    expect(calls.some((sql: string) => sql.includes('entry_mode'))).toBe(true);
  });

  it('silently ignores duplicate column error from migration', async () => {
    let getDb: () => Promise<any>;
    jest.isolateModules(() => {
      const sqlite = require('expo-sqlite');
      const mockDb = {
        execAsync: jest.fn()
          .mockResolvedValueOnce(undefined)           // CREATE_TABLES_SQL succeeds
          .mockResolvedValueOnce(undefined)           // PRAGMA foreign_keys = ON succeeds
          .mockRejectedValueOnce(new Error('duplicate column name: entry_mode')),
        runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
      };
      sqlite.openDatabaseAsync.mockResolvedValue(mockDb);
      ({ getDb } = require('../../src/db/database'));
    });
    await expect(getDb!()).resolves.not.toThrow();
  });

  it('returns the same db instance on repeated calls', async () => {
    let getDb: () => Promise<any>;
    jest.isolateModules(() => {
      const sqlite = require('expo-sqlite');
      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
      };
      sqlite.openDatabaseAsync.mockResolvedValue(mockDb);
      ({ getDb } = require('../../src/db/database'));
    });
    const first = await getDb!();
    const second = await getDb!();
    expect(first).toBe(second);
  });
});

describe('places migration', () => {
  it('creates the places table on init', async () => {
    let getDb: () => Promise<any>;
    let db: any;
    jest.isolateModules(() => {
      const sqlite = require('expo-sqlite');
      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
      };
      sqlite.openDatabaseAsync.mockResolvedValue(mockDb);
      db = mockDb;
      ({ getDb } = require('../../src/db/database'));
    });
    await getDb!();
    const calls: string[] = db.execAsync.mock.calls.map((c: any[]) => c[0] as string);
    expect(calls.some((sql: string) => sql.includes('CREATE TABLE IF NOT EXISTS places'))).toBe(true);
  });

  it('adds place_id column on init', async () => {
    let getDb: () => Promise<any>;
    let db: any;
    jest.isolateModules(() => {
      const sqlite = require('expo-sqlite');
      const mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
      };
      sqlite.openDatabaseAsync.mockResolvedValue(mockDb);
      db = mockDb;
      ({ getDb } = require('../../src/db/database'));
    });
    await getDb!();
    const calls: string[] = db.execAsync.mock.calls.map((c: any[]) => c[0] as string);
    expect(calls.some((sql: string) => sql.includes('place_id'))).toBe(true);
  });

  it('silently ignores duplicate column error for place_id', async () => {
    let getDb: () => Promise<any>;
    jest.isolateModules(() => {
      const sqlite = require('expo-sqlite');
      const mockDb = {
        execAsync: jest.fn().mockImplementation(async (sql: string) => {
          if (sql.includes('ALTER TABLE') && sql.includes('place_id')) {
            throw new Error('duplicate column name: place_id');
          }
        }),
        runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
      };
      sqlite.openDatabaseAsync.mockResolvedValue(mockDb);
      ({ getDb } = require('../../src/db/database'));
    });
    await expect(getDb!()).resolves.not.toThrow();
  });
});

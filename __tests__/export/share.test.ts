import { exportEntriesToCsv } from '../../src/export/share';
import * as Sharing from 'expo-sharing';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-file-system/next', () => ({
  File: jest.fn().mockImplementation((_dir: unknown, filename: string) => ({
    write: jest.fn(),
    uri: `file:///mock-cache/${filename}`,
  })),
  Paths: { cache: '/mock-cache' },
}));
jest.mock('expo-sharing');

describe('exportEntriesToCsv', () => {
  let db: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
  });

  it('writes a CSV file to cache directory and opens the share sheet', async () => {
    db.getAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        created_at: '2026-01-15T10:30:00.000Z',
        entry_mode: 'prompted',
        prompt_text: 'What did you notice today?',
        response_text: 'A red door.',
        location_label: null,
        location_lat: null,
        location_lng: null,
      },
    ]);

    await exportEntriesToCsv(db);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { File } = require('expo-file-system/next') as { File: jest.Mock };
    const fileInstance = File.mock.results[0].value as { write: jest.Mock; uri: string };
    expect(fileInstance.write).toHaveBeenCalledWith(expect.stringContaining('A red door.'));
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      fileInstance.uri,
      { mimeType: 'text/csv', dialogTitle: 'Export Notes' }
    );
  });

  it('exports an empty CSV (header only) when there are no entries', async () => {
    db.getAllAsync.mockResolvedValueOnce([]);

    await exportEntriesToCsv(db);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { File } = require('expo-file-system/next') as { File: jest.Mock };
    const fileInstance = File.mock.results[0].value as { write: jest.Mock; uri: string };
    expect(fileInstance.write).toHaveBeenCalledWith(
      'id,created_at,entry_mode,prompt_text,response_text,location_label,location_lat,location_lng,category,entry_kind,game_data'
    );
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });
});

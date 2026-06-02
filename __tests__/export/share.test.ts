import { exportEntriesToCsv } from '../../src/export/share';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-file-system');
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

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.stringContaining('borednotes-export-'),
      expect.stringContaining('A red door.'),
      { encoding: 'utf8' }
    );
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      expect.stringContaining('borednotes-export-'),
      { mimeType: 'text/csv', dialogTitle: 'Export Notes' }
    );
  });

  it('exports an empty CSV (header only) when there are no entries', async () => {
    db.getAllAsync.mockResolvedValueOnce([]);

    await exportEntriesToCsv(db);

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.any(String),
      'id,created_at,entry_mode,prompt_text,response_text,location_label,location_lat,location_lng',
      { encoding: 'utf8' }
    );
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });
});

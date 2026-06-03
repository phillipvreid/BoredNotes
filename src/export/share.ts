import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getAllEntries } from '../db/entries';
import { entriesToCsv } from './csv';

export async function exportEntriesToCsv(db: SQLiteDatabase): Promise<void> {
  const entries = await getAllEntries(db);
  const csv = entriesToCsv(entries);
  const filename = `borednotes-export-${Date.now()}.csv`;
  const file = new File(Paths.cache, filename);
  file.write(csv);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export Notes' });
}

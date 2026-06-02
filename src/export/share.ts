import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getAllEntries } from '../db/entries';
import { entriesToCsv } from './csv';

export async function exportEntriesToCsv(db: SQLiteDatabase): Promise<void> {
  const entries = await getAllEntries(db);
  const csv = entriesToCsv(entries);
  const filename = `borednotes-export-${Date.now()}.csv`;
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: 'utf8' });
  await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export Notes' });
}

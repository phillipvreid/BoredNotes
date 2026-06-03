import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getDb } from '../../src/db/database';
import { getEntry } from '../../src/db/entries';
import { getMediaForEntry } from '../../src/db/media';
import { useTheme } from '../../src/theme/ThemeContext';
import type { Entry, MediaItem } from '../../src/types';
import * as Haptics from 'expo-haptics';
import { PlaceNameSheet } from '../../src/components/PlaceNameSheet';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function EntryDetailScreen() {
  const { colors, accent } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetEntryCount, setSheetEntryCount] = useState(0);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const e = await getEntry(db, Number(id));
      setEntry(e);
      if (e) setMedia(await getMediaForEntry(db, e.id));
    })();
  }, [id]);

  const photo = media.find(m => m.type === 'photo');

  if (!entry) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backTxt, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.dateTime, { color: colors.textMuted }]}>{formatDateTime(entry.created_at)}</Text>
        {entry.location_label && (
          <TouchableOpacity
            delayLongPress={400}
            onLongPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              let count = 0;
              if (entry.place_id !== null) {
                const db = await getDb();
                const row = await db.getFirstAsync<{ cnt: number }>(
                  'SELECT COUNT(*) as cnt FROM entries WHERE place_id = ?',
                  [entry.place_id]
                );
                count = row?.cnt ?? 0;
              }
              setSheetEntryCount(count);
              setSheetVisible(true);
            }}
          >
            <Text style={[styles.location, { color: colors.textMuted }]}>📍 {entry.location_label}</Text>
          </TouchableOpacity>
        )}

        {entry.entry_mode !== 'freeform' && (
          <Text style={[styles.prompt, { color: colors.textSecondary }]}>{entry.prompt_text}</Text>
        )}

        {photo && (
          <Image source={{ uri: photo.file_path }} style={styles.photo} resizeMode="cover" />
        )}

        <Text style={[styles.response, { color: colors.textPrimary }]}>{entry.response_text}</Text>

        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: accent.buttonColor }]}
          onPress={() => router.push(`/share/${entry.id}`)}
        >
          <Text style={styles.shareTxt}>Share this entry</Text>
        </TouchableOpacity>
        <PlaceNameSheet
          visible={sheetVisible}
          placeId={entry.place_id ?? undefined}
          coordinate={{ lat: entry.location_lat ?? 0, lng: entry.location_lng ?? 0 }}
          initialName={entry.location_label ?? ''}
          entryCount={sheetEntryCount}
          onSaved={async () => {
            setSheetVisible(false);
            const db = await getDb();
            const updated = await getEntry(db, entry.id);
            if (updated) setEntry(updated);
          }}
          onClose={() => setSheetVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  back: { paddingVertical: 4 },
  backTxt: { fontSize: 15 },
  dateTime: { fontSize: 13 },
  location: { fontSize: 13 },
  prompt: { fontSize: 16, fontFamily: 'Georgia', fontStyle: 'italic', lineHeight: 24 },
  photo: { width: '100%', height: 220, borderRadius: 12 },
  response: { fontSize: 18, lineHeight: 30, fontFamily: 'Georgia', fontStyle: 'italic' },
  shareBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  shareTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

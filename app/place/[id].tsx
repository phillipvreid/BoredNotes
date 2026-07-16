import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getDb } from '../../src/db/database';
import { getPlace } from '../../src/db/places';
import { useTheme } from '../../src/theme/ThemeContext';
import { PlaceFeedList } from '../../src/components/PlaceFeedList';
import { PlaceNameSheet } from '../../src/components/PlaceNameSheet';
import type { Place, PinnedEntry } from '../../src/types';

function isPinned(e: any): e is PinnedEntry {
  return e.location_lat !== null && e.location_lng !== null;
}

export default function PlaceFeedScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [entries, setEntries] = useState<PinnedEntry[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);

  async function load() {
    const db = await getDb();
    const p = await getPlace(db, Number(id));
    setPlace(p);
    if (p) {
      const rows = await db.getAllAsync<any>(
        `SELECT * FROM entries WHERE place_id = ? ORDER BY created_at DESC`,
        [p.id]
      );
      setEntries(rows.filter(isPinned));
    }
  }

  useFocusEffect(useCallback(() => { load(); }, [id]));

  if (!place) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backTxt, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {place.name}
        </Text>
        <TouchableOpacity onPress={() => setSheetVisible(true)} style={styles.editBtn}>
          <Text style={[styles.editTxt, { color: colors.textSecondary }]}>Edit ✎</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.count, { color: colors.textMuted }]}>{entries.length} notes</Text>
      <PlaceFeedList entries={entries} />
      <PlaceNameSheet
        visible={sheetVisible}
        placeId={place.id}
        coordinate={{ lat: place.lat, lng: place.lng }}
        initialName={place.name}
        entryCount={entries.length}
        onSaved={() => load()}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 60 },
  backTxt: { fontSize: 15 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  editBtn: { width: 60, alignItems: 'flex-end' },
  editTxt: { fontSize: 14 },
  count: { fontSize: 12, textAlign: 'center', paddingVertical: 6 },
});

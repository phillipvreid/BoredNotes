import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getDb } from '../../src/db/database';
import { haversineMeters } from '../../src/db/places';
import { useTheme } from '../../src/theme/ThemeContext';
import { PlaceFeedList } from '../../src/components/PlaceFeedList';
import { PlaceNameSheet } from '../../src/components/PlaceNameSheet';
import type { PinnedEntry } from '../../src/types';

function isPinned(e: any): e is PinnedEntry {
  return e.location_lat !== null && e.location_lng !== null;
}

export default function ClusterFeedScreen() {
  const { colors } = useTheme();
  const { lat: latStr, lng: lngStr, radius: radiusStr } = useLocalSearchParams<{
    lat: string; lng: string; radius: string;
  }>();

  const lat    = parseFloat(latStr   ?? '0');
  const lng    = parseFloat(lngStr   ?? '0');
  const radius = parseFloat(radiusStr ?? '111');

  const [entries, setEntries] = useState<PinnedEntry[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const db = await getDb();
        const all = await db.getAllAsync<any>(
          `SELECT e.*, EXISTS(SELECT 1 FROM media m WHERE m.entry_id = e.id AND m.type = 'photo') as has_photo
           FROM entries e WHERE e.location_lat IS NOT NULL AND e.place_id IS NULL ORDER BY e.created_at DESC`,
          []
        );
        setEntries(
          all.filter((e: any) =>
            isPinned(e) && haversineMeters(e.location_lat, e.location_lng, lat, lng) <= radius
          )
        );
      })();
    }, [latStr, lngStr, radiusStr])
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backTxt, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Notes from here</Text>
        <View style={{ width: 60 }} />
      </View>
      <TouchableOpacity
        style={[styles.ctaRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        onPress={() => setSheetVisible(true)}
      >
        <Text style={[styles.ctaTxt, { color: colors.textPrimary }]}>Name this place →</Text>
      </TouchableOpacity>
      <PlaceFeedList entries={entries} />
      <PlaceNameSheet
        visible={sheetVisible}
        coordinate={{ lat, lng }}
        entryCount={entries.length}
        onSaved={() => { setSheetVisible(false); router.back(); }}
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
  ctaRow: {
    margin: 16, marginBottom: 4, borderRadius: 12, borderWidth: 1,
    padding: 14, alignItems: 'center',
  },
  ctaTxt: { fontSize: 15, fontWeight: '600' },
});

import { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { router, useFocusEffect } from 'expo-router';
import { getDb } from '../db/database';
import { getAllEntries } from '../db/entries';
import { useTheme } from '../theme/ThemeContext';
import { findDenseCluster } from './mapUtils';
import type { Entry } from '../types';

interface PinnedEntry extends Entry {
  location_lat: number;
  location_lng: number;
}

function isPinned(e: Entry): e is PinnedEntry {
  return e.location_lat !== null && e.location_lng !== null;
}

export function MapTab() {
  const { colors, accent } = useTheme();
  const mapRef = useRef<MapView>(null);
  const savedRegion = useRef<Region | null>(null);
  const clusterFocused = useRef(false);
  const [pins, setPins] = useState<PinnedEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const db = await getDb();
        const all = await getAllEntries(db);
        setPins(all.filter(isPinned));
        setLoaded(true);
      })();
    }, [])
  );

  useEffect(() => {
    if (loaded && !clusterFocused.current && pins.length > 0 && mapRef.current) {
      const region = findDenseCluster(
        pins.map(p => ({ lat: p.location_lat, lng: p.location_lng }))
      );
      if (region) {
        mapRef.current.animateToRegion(region, 600);
      }
      clusterFocused.current = true;
    }
  }, [pins, loaded]);

  function handleRegionChangeComplete(region: Region) {
    savedRegion.current = region;
  }

  function handleMapReady() {
    if (savedRegion.current && mapRef.current) {
      mapRef.current.animateToRegion(savedRegion.current, 0);
    }
  }

  if (loaded && pins.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No places yet.
        </Text>
        <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
          Enable Auto-location in Settings to capture where you write.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={handleMapReady}
      >
        {pins.map(entry => (
          <Marker
            key={entry.id}
            coordinate={{ latitude: entry.location_lat, longitude: entry.location_lng }}
          >
            <View style={[styles.dot, { backgroundColor: accent.buttonColor }]} />
            <Callout onPress={() => router.push(`/entry/${entry.id}`)}>
              <View style={styles.callout}>
                <Text style={[styles.calloutDate, { color: colors.textMuted }]}>
                  {new Date(entry.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                  {entry.location_label ? `  ·  ${entry.location_label}` : ''}
                </Text>
                <Text style={[styles.calloutSnippet, { color: colors.textPrimary }]} numberOfLines={2}>
                  {entry.response_text}
                </Text>
                <Text style={[styles.calloutCta, { color: accent.buttonColor }]}>Open entry →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <Text style={[styles.mapLabel, { color: colors.textMuted }]}>
        places you've been bored
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  mapLabel: {
    textAlign: 'center',
    fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 13,
    paddingVertical: 8,
  },
  callout: { width: 220, padding: 8, gap: 4 },
  calloutDate: { fontSize: 11 },
  calloutSnippet: { fontSize: 13, fontFamily: 'Georgia', fontStyle: 'italic' },
  calloutCta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  emptyText: { fontSize: 16, fontFamily: 'Georgia', fontStyle: 'italic' },
  emptyHint: { fontSize: 13, textAlign: 'center' },
});

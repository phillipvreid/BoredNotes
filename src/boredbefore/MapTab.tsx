import { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { router, useFocusEffect } from 'expo-router';
import { getDb } from '../db/database';
import { getAllEntries } from '../db/entries';
import { getAllPlaces } from '../db/places';
import { useTheme } from '../theme/ThemeContext';
import { findDenseCluster } from './mapUtils';
import { clusterPins } from './clusterUtils';
import { PlaceNameSheet } from '../components/PlaceNameSheet';
import type { Entry, Place, PinnedEntry } from '../types';
import type { NamedPlaceGroup, UnnamedClusterGroup } from './clusterUtils';

function isPinned(e: Entry): e is PinnedEntry {
  return e.location_lat !== null && e.location_lng !== null;
}

interface SheetState {
  visible: boolean;
  placeId?: number;
  coordinate: { lat: number; lng: number };
  initialName: string;
  entryCount: number;
}

const DEFAULT_SHEET: SheetState = {
  visible: false,
  coordinate: { lat: 0, lng: 0 },
  initialName: '',
  entryCount: 0,
};

export function MapTab() {
  const { colors, accent } = useTheme();
  const mapRef = useRef<MapView>(null);
  const savedRegion = useRef<Region | null>(null);
  const clusterFocused = useRef(false);
  const [pins, setPins] = useState<PinnedEntry[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sheet, setSheet] = useState<SheetState>(DEFAULT_SHEET);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const db = await getDb();
        const [all, allPlaces] = await Promise.all([getAllEntries(db), getAllPlaces(db)]);
        setPins(all.filter(isPinned));
        setPlaces(allPlaces);
        setLoaded(true);
      })();
    }, [])
  );

  useEffect(() => {
    if (loaded && !clusterFocused.current && pins.length > 0 && mapRef.current) {
      const region = findDenseCluster(
        pins.map(p => ({ lat: p.location_lat, lng: p.location_lng }))
      );
      if (region) mapRef.current.animateToRegion(region, 600);
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

  function openSheetForGroup(group: NamedPlaceGroup | UnnamedClusterGroup) {
    if (group.type === 'named') {
      setSheet({
        visible: true,
        placeId: group.placeId,
        coordinate: { lat: group.lat, lng: group.lng },
        initialName: group.placeName,
        entryCount: group.entries.length,
      });
    } else {
      setSheet({
        visible: true,
        placeId: undefined,
        coordinate: { lat: group.lat, lng: group.lng },
        initialName: '',
        entryCount: group.entries.length,
      });
    }
  }

  const clusterResult = clusterPins(pins, places);

  if (loaded && pins.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No places yet.</Text>
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
        {clusterResult.groups.map((group, idx) => (
          <Marker
            key={group.type === 'named'
              ? `named-${(group as NamedPlaceGroup).placeId}`
              : `cluster-${idx}`}
            coordinate={{ latitude: group.lat, longitude: group.lng }}
            tracksViewChanges={false}
          >
            <TouchableOpacity
              onPress={() => {
                if (group.type === 'named') {
                  router.push(`/place/${(group as NamedPlaceGroup).placeId}`);
                } else {
                  router.push(
                    `/place/cluster?lat=${group.lat}&lng=${group.lng}&radius=160`
                  );
                }
              }}
              onLongPress={() => openSheetForGroup(group as NamedPlaceGroup | UnnamedClusterGroup)}
              delayLongPress={400}
            >
              <View style={[
                styles.pill,
                { backgroundColor: group.type === 'named' ? accent.buttonColor : '#888888' },
              ]}>
                <Text style={styles.pillText}>
                  {group.type === 'named'
                    ? `${(group as NamedPlaceGroup).placeName} · ${group.entries.length}`
                    : `${group.entries.length} notes`}
                </Text>
              </View>
            </TouchableOpacity>
          </Marker>
        ))}

        {clusterResult.loneEntries.map(entry => (
          <Marker
            key={entry.id}
            coordinate={{ latitude: entry.location_lat, longitude: entry.location_lng }}
            pinColor={accent.buttonColor}
          >
            <Callout onPress={() => router.push(`/entry/${entry.id}`)}>
              <View style={styles.callout}>
                <Text style={[styles.calloutDate, { color: colors.textMuted }]}>
                  {new Date(entry.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                  {entry.location_label ? `  ·  ${entry.location_label}` : ''}
                </Text>
                <Text
                  style={[styles.calloutSnippet, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  {entry.response_text}
                </Text>
                <Text style={[styles.calloutCta, { color: accent.buttonColor }]}>
                  Open entry →
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <Text style={[styles.mapLabel, { color: colors.textMuted }]}>
        places you've been bored
      </Text>

      <PlaceNameSheet
        visible={sheet.visible}
        placeId={sheet.placeId}
        coordinate={sheet.coordinate}
        initialName={sheet.initialName}
        entryCount={sheet.entryCount}
        onSaved={async () => {
          setSheet(DEFAULT_SHEET);
          const db = await getDb();
          const [all, allPlaces] = await Promise.all([getAllEntries(db), getAllPlaces(db)]);
          setPins(all.filter(isPinned));
          setPlaces(allPlaces);
        }}
        onClose={() => setSheet(DEFAULT_SHEET)}
      />
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
  pill: {
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
  },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  callout: { width: 220, padding: 8, gap: 4 },
  calloutDate: { fontSize: 11 },
  calloutSnippet: { fontSize: 13, fontFamily: 'Georgia', fontStyle: 'italic' },
  calloutCta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  emptyText: { fontSize: 16, fontFamily: 'Georgia', fontStyle: 'italic' },
  emptyHint: { fontSize: 13, textAlign: 'center' },
});

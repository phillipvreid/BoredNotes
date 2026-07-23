import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, FlatList, StyleSheet,
} from 'react-native';
import { getDb } from '../db/database';
import { getAllPlacesWithCounts, sortPlacesByDistance } from '../db/places';
import { captureLocation, getCurrentCoords } from '../location/location';
import { useTheme } from '../theme/ThemeContext';
import { FONTS, KEYLINE_HEAVY, SHADOW_SM } from '../theme/tokens';
import { Sticker } from './ui/Sticker';
import { PlaceNameSheet } from './PlaceNameSheet';
import type { Place } from '../types';

interface Props {
  visible: boolean;
  initialCoords: { lat: number; lng: number } | null;
  onPick: (label: string, lat: number, lng: number) => void;
  onClose: () => void;
}

export function PlacePickerSheet({ visible, initialCoords, onPick, onClose }: Props) {
  const { colors } = useTheme();
  const [places, setPlaces] = useState<(Place & { entry_count: number })[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(initialCoords);
  const [locating, setLocating] = useState(false);
  const [newPlaceCoords, setNewPlaceCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!visible) return;
    setCoords(initialCoords);
    (async () => {
      const db = await getDb();
      setPlaces(await getAllPlacesWithCounts(db));
    })();
    if (!initialCoords) {
      (async () => {
        const fix = await getCurrentCoords();
        if (fix) setCoords(fix);
      })();
    }
  }, [visible, initialCoords]);

  function pickAndClose(label: string, lat: number, lng: number) {
    onPick(label, lat, lng);
    onClose();
  }

  async function handleUseCurrent() {
    setLocating(true);
    try {
      const loc = await captureLocation();
      if (loc) pickAndClose(loc.label ?? '', loc.lat, loc.lng);
    } finally {
      setLocating(false);
    }
  }

  async function handleAddNew() {
    if (coords) {
      setNewPlaceCoords(coords);
      return;
    }
    setLocating(true);
    const fix = await getCurrentCoords();
    setLocating(false);
    if (fix) {
      setCoords(fix);
      setNewPlaceCoords(fix);
    }
  }

  const sortedPlaces = sortPlacesByDistance(places, coords);

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.title, { color: colors.textMuted }]}>Tag a place</Text>

            <View style={styles.gpsRow}>
              <Sticker
                borderWidth={KEYLINE_HEAVY}
                shadow={SHADOW_SM}
                radius={10}
                onPress={handleUseCurrent}
                disabled={locating}
                style={styles.gpsBtn}
              >
                <Text style={[styles.gpsBtnTxt, { color: colors.textPrimary }]}>
                  {locating ? 'LOCATING…' : '◎ Use current location'}
                </Text>
              </Sticker>
              <Sticker
                color={colors.action}
                borderColor={colors.actionInk}
                borderWidth={KEYLINE_HEAVY}
                shadow={SHADOW_SM}
                radius={10}
                onPress={handleAddNew}
                disabled={locating}
                style={styles.addBtn}
              >
                <Text style={[styles.addBtnTxt, { color: colors.actionInk }]}>+</Text>
              </Sticker>
            </View>

            {sortedPlaces.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                Nothing saved yet — hit + to fix that.
              </Text>
            ) : (
              <FlatList
                data={sortedPlaces}
                keyExtractor={item => String(item.id)}
                style={styles.list}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.placeRow, { borderTopColor: colors.border }]}
                    onPress={() => pickAndClose(item.name, item.lat, item.lng)}
                  >
                    <Text
                      style={[styles.placeName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      📍 {item.name}
                    </Text>
                    <Text style={[styles.placeCount, { color: colors.textMuted }]}>
                      {item.entry_count} entr{item.entry_count === 1 ? 'y' : 'ies'}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {newPlaceCoords && (
        <PlaceNameSheet
          visible
          coordinate={newPlaceCoords}
          entryCount={0}
          onSaved={place => {
            setNewPlaceCoords(null);
            pickAndClose(place.name, place.lat, place.lng);
          }}
          onClose={() => setNewPlaceCoords(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingTop: 12, gap: 10,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 2 },
  title: { fontFamily: FONTS.label, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  gpsRow: { flexDirection: 'row', gap: 8 },
  gpsBtn: {
    flex: 1, paddingVertical: 13, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  gpsBtnTxt: { fontFamily: FONTS.bodySemiBold, fontSize: 13 },
  addBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addBtnTxt: { fontFamily: FONTS.display, fontSize: 20 },
  empty: { fontFamily: FONTS.body, fontSize: 13, paddingVertical: 24, textAlign: 'center' },
  list: { maxHeight: 260 },
  placeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1,
  },
  placeName: { fontFamily: FONTS.bodySemiBold, fontSize: 14, flex: 1, marginRight: 8 },
  placeCount: { fontFamily: FONTS.labelRegular, fontSize: 11 },
});

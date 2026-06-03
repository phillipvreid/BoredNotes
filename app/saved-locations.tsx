import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Alert, StyleSheet, SafeAreaView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getDb } from '../src/db/database';
import { getAllPlacesWithCounts, updatePlace, deletePlace, syncPlaceToEntries } from '../src/db/places';
import { useTheme } from '../src/theme/ThemeContext';
import type { Place } from '../src/types';

type PlaceRow = Place & { entry_count: number };

const RADII = [25, 50, 100, 200] as const;

export default function SavedLocationsScreen() {
  const { colors, accent } = useTheme();
  const [places, setPlaces] = useState<PlaceRow[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editRadius, setEditRadius] = useState<number>(100);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const db = await getDb();
        setPlaces(await getAllPlacesWithCounts(db));
      })();
    }, [])
  );

  function openEdit(place: PlaceRow) {
    setExpandedId(place.id);
    setEditName(place.name);
    setEditRadius(place.radius_m);
    setSaveError('');
  }

  function closeEdit() {
    setExpandedId(null);
    setSaveError('');
  }

  async function handleSave(place: PlaceRow) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setSaving(true);
    setSaveError('');
    try {
      const db = await getDb();
      await updatePlace(db, place.id, { name: trimmed, radius_m: editRadius });
      await syncPlaceToEntries(db, { ...place, name: trimmed, radius_m: editRadius });
      setPlaces(await getAllPlacesWithCounts(db));
      closeEdit();
    } catch {
      setSaveError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(placeId: number) {
    Alert.alert(
      'Delete place?',
      'Notes at this location will no longer be grouped.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDb();
              await deletePlace(db, placeId);
              setPlaces(await getAllPlacesWithCounts(db));
              if (expandedId === placeId) closeEdit();
            } catch {}
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backTxt, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Saved Locations</Text>

        {places.length === 0 && (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            No saved locations yet.{'\n'}Long-press a cluster on the map to name it.
          </Text>
        )}

        {places.map(place => (
          <View
            key={place.id}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          >
            {expandedId === place.id ? (
              <View style={styles.editCard}>
                <TextInput
                  style={[styles.editInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                />
                <View style={styles.radiiRow}>
                  {RADII.map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.radiusChip,
                        {
                          borderColor: editRadius === r ? accent.buttonColor : colors.border,
                          backgroundColor: editRadius === r ? accent.buttonColor : 'transparent',
                        },
                      ]}
                      onPress={() => setEditRadius(r)}
                    >
                      <Text style={[
                        styles.radiusTxt,
                        { color: editRadius === r ? '#fff' : colors.textSecondary },
                      ]}>
                        {r} m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.coverCount, { color: colors.textMuted }]}>
                  Currently covers {place.entry_count} notes
                </Text>
                {saveError !== '' && (
                  <Text style={styles.errorTxt}>{saveError}</Text>
                )}
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[styles.deleteBtn, { borderColor: '#f87171' }]}
                    onPress={() => handleDelete(place.id)}
                  >
                    <Text style={styles.deleteTxt}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      { backgroundColor: saving ? colors.border : accent.buttonColor },
                    ]}
                    onPress={() => handleSave(place)}
                    disabled={saving}
                  >
                    <Text style={styles.saveTxt}>{saving ? 'Saving…' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.collapsedRow} onPress={() => openEdit(place)}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.placeName, { color: colors.textPrimary }]}>{place.name}</Text>
                  <Text style={[styles.placeMeta, { color: colors.textMuted }]}>
                    {place.entry_count} notes · {place.radius_m} m radius
                  </Text>
                </View>
                <Text style={[styles.editCta, { color: accent.buttonColor }]}>Edit →</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 8, paddingBottom: 40 },
  back: { paddingVertical: 4, marginBottom: 4 },
  backTxt: { fontSize: 15 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  empty: { fontSize: 14, lineHeight: 22, fontFamily: 'Georgia', fontStyle: 'italic' },
  card: { borderRadius: 12, borderWidth: 1 },
  collapsedRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 12,
  },
  placeName: { fontSize: 15, fontWeight: '600' },
  placeMeta: { fontSize: 12, marginTop: 2 },
  editCta: { fontSize: 14, fontWeight: '600' },
  editCard: { padding: 16, gap: 12 },
  editInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
  radiiRow: { flexDirection: 'row', gap: 8 },
  radiusChip: {
    borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6,
  },
  radiusTxt: { fontSize: 13, fontWeight: '600' },
  coverCount: { fontSize: 12 },
  errorTxt: { fontSize: 13, color: '#f87171' },
  editButtons: { flexDirection: 'row', gap: 10 },
  deleteBtn: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  deleteTxt: { color: '#f87171', fontSize: 14, fontWeight: '600' },
  saveBtn: {
    flex: 1, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  saveTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { Place } from '../types';
import { getDb } from '../db/database';
import { createPlace, updatePlace, syncPlaceToEntries, getPlace } from '../db/places';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  visible: boolean;
  placeId?: number;
  coordinate: { lat: number; lng: number };
  initialName?: string;
  entryCount: number;
  onSaved: (place: Place) => void;
  onClose: () => void;
}

export function PlaceNameSheet({
  visible, placeId, coordinate, initialName = '', entryCount, onSaved, onClose,
}: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const db = await getDb();
      let record;
      if (placeId == null) {
        const newId = await createPlace(db, { name: trimmed, lat: coordinate.lat, lng: coordinate.lng });
        record = await getPlace(db, newId);
      } else {
        await updatePlace(db, placeId, { name: trimmed });
        record = await getPlace(db, placeId);
      }
      if (record) {
        await syncPlaceToEntries(db, record);
        onSaved(record);
      }
      onClose();
    } catch {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {placeId == null ? 'Name this place' : 'Rename place'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Applies to {entryCount} note{entryCount !== 1 ? 's' : ''} at this location
          </Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. My desk, Coffee shop…"
            placeholderTextColor={colors.textMuted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.btnTxt, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn, styles.btnPrimary,
                { backgroundColor: (!name.trim() || saving) ? colors.border : colors.action },
              ]}
              onPress={handleSave}
              disabled={!name.trim() || saving}
            >
              <Text style={[styles.btnTxt, { color: '#141414' }]}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingTop: 12, gap: 12,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: -4 },
  input: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontSize: 16, fontFamily: 'Georgia', fontStyle: 'italic',
  },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    paddingVertical: 12, alignItems: 'center',
  },
  btnPrimary: { borderWidth: 0 },
  btnTxt: { fontSize: 15, fontWeight: '600' },
});

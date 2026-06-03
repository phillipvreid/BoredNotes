import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Image, SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getDb } from '../src/db/database';
import { createEntry } from '../src/db/entries';
import { createMedia } from '../src/db/media';
import { getNextPrompt, getCurrentPrompt } from '../src/prompts/next';
import { forceRefreshContextualPrompt } from '../src/prompts/contextual';
import { getSetting } from '../src/db/settings';
import { captureLocation, queuePendingGeocode } from '../src/location/location';
import { pickPhoto, takePhoto } from '../src/media/capture';
import { useTheme } from '../src/theme/ThemeContext';

export default function RespondScreen() {
  const { colors, accent } = useTheme();
  const [response, setResponse] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prompt, setPrompt] = useState<string>('');
  const [respondMode, setRespondMode] = useState<'prompted' | 'freeform'>('prompted');
  const [refreshingPrompt, setRefreshingPrompt] = useState(false);

  const { promptText, promptCategory } = useLocalSearchParams<{
    promptText?: string;
    promptCategory?: string;
  }>();

  useEffect(() => {
    (async () => {
      const db = await getDb();
      if (promptText && promptCategory) {
        setPrompt(promptText);
      } else {
        const current = await getCurrentPrompt(db);
        setPrompt(current?.text ?? '');
      }
      const mode = await getSetting(db, 'respond_mode');
      setRespondMode((mode as 'prompted' | 'freeform') ?? 'prompted');
      const shouldAutoLocate = (await getSetting(db, 'auto_location')) === 'true';
      if (shouldAutoLocate) {
        try {
          const loc = await captureLocation();
          if (loc) {
            setLocationLabel(loc.label ?? '');
            setLocationCoords({ lat: loc.lat, lng: loc.lng });
          }
        } catch {}
      }
    })();
  }, []);

  async function handleRefreshPrompt() {
    setRefreshingPrompt(true);
    try {
      const db = await getDb();
      const fresh = await forceRefreshContextualPrompt(db);
      setPrompt(fresh.text);
    } catch {
      Alert.alert('Could not refresh prompt', 'Please try again.');
    } finally {
      setRefreshingPrompt(false);
    }
  }

  async function handleAddLocation() {
    const loc = await captureLocation();
    if (loc) {
      setLocationLabel(loc.label ?? '');
      setLocationCoords({ lat: loc.lat, lng: loc.lng });
    }
  }

  async function handlePickPhoto() {
    try {
      const uri = await pickPhoto();
      if (uri) setPhotoUri(uri);
    } catch (e) {
      if (e instanceof Error && e.message === 'permission_denied') {
        Alert.alert('Permission needed', 'Please allow photo library access in Settings to attach photos.');
      } else {
        Alert.alert('Photo error', 'Could not attach the photo. Please try again.');
      }
    }
  }

  async function handleTakePhoto() {
    try {
      const uri = await takePhoto();
      if (uri) setPhotoUri(uri);
    } catch (e) {
      if (e instanceof Error && e.message === 'permission_denied') {
        Alert.alert('Permission needed', 'Please allow camera access in Settings to take photos.');
      } else {
        Alert.alert('Camera error', 'Could not attach the photo. Please try again.');
      }
    }
  }

  async function handleSubmit() {
    if (!response.trim()) {
      Alert.alert('Write something first', 'Your response cannot be empty.');
      return;
    }
    setSubmitting(true);
    try {
      const db = await getDb();
      const entryId = await createEntry(db, {
        prompt_text: respondMode === 'freeform' ? '' : prompt,
        response_text: response.trim(),
        location_label: locationLabel || undefined,
        location_lat: locationCoords?.lat,
        location_lng: locationCoords?.lng,
        entry_mode: respondMode,
      });
      if (locationCoords && !locationLabel) {
        await queuePendingGeocode(db, entryId, locationCoords.lat, locationCoords.lng);
      }
      if (photoUri) await createMedia(db, entryId, 'photo', photoUri);
      await getNextPrompt(db);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save your entry. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={[styles.closeTxt, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>

          {respondMode === 'prompted' && (
            <View style={styles.promptRow}>
              <Text style={[styles.prompt, { color: colors.textPrimary, flex: 1 }]}>{prompt}</Text>
              <TouchableOpacity
                onPress={handleRefreshPrompt}
                disabled={refreshingPrompt}
                hitSlop={8}
                style={styles.refreshBtn}
              >
                <Feather name="refresh-cw" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderBottomColor: colors.border }]}
            placeholder="What's on your mind…"
            placeholderTextColor={colors.textMuted}
            multiline
            autoFocus
            value={response}
            onChangeText={setResponse}
          />

          {respondMode === 'freeform' && (
            <Text style={[styles.freeformHint, { color: colors.textMuted }]}>writing freely</Text>
          )}

          {photoUri && (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photoUri }} style={styles.photoImg} />
              <TouchableOpacity onPress={() => setPhotoUri(null)}>
                <Text style={styles.removeTxt}>Remove photo</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.metaRow}>
            <View style={styles.locationRow}>
              <TouchableOpacity onPress={handleAddLocation}>
                <Text style={[styles.metaBtnTxt, { color: colors.textSecondary }]}>
                  {locationLabel ? `📍 ${locationLabel}` : '📍 Add place'}
                </Text>
              </TouchableOpacity>
              {locationLabel !== '' && (
                <TouchableOpacity onPress={() => { setLocationLabel(''); setLocationCoords(null); }}>
                  <Text style={styles.removeTxt}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {locationLabel !== '' && (
              <TextInput
                style={[styles.locationInput, { color: colors.textPrimary, borderBottomColor: colors.border }]}
                value={locationLabel}
                onChangeText={setLocationLabel}
                placeholder="Edit place name"
                placeholderTextColor={colors.textMuted}
              />
            )}
          </View>

          <View style={styles.attachRow}>
            <TouchableOpacity
              onPress={handlePickPhoto}
              style={[styles.attachBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.attachTxt, { color: colors.textSecondary }]}>🖼 Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleTakePhoto}
              style={[styles.attachBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.attachTxt, { color: colors.textSecondary }]}>📷 Camera</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: (!response.trim() || submitting) ? colors.border : accent.buttonColor }]}
            onPress={handleSubmit}
            disabled={!response.trim() || submitting}
          >
            <Text style={styles.submitTxt}>{submitting ? 'Saving…' : 'Save entry →'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  closeBtn: { alignSelf: 'flex-end', padding: 4 },
  closeTxt: { fontSize: 18 },
  promptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  prompt: { fontSize: 20, lineHeight: 30, fontFamily: 'Georgia', fontStyle: 'italic' },
  refreshBtn: { marginTop: 8 },
  input: { fontSize: 16, lineHeight: 26, minHeight: 160, textAlignVertical: 'top', borderBottomWidth: 1, paddingBottom: 12, fontFamily: 'Georgia', fontStyle: 'italic' },
  photoPreview: { gap: 6 },
  photoImg: { width: '100%', height: 180, borderRadius: 8 },
  removeTxt: { color: '#f87171', fontSize: 13 },
  metaRow: { gap: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaBtnTxt: { fontSize: 14 },
  locationInput: { fontSize: 14, borderBottomWidth: 1, paddingVertical: 4 },
  attachRow: { flexDirection: 'row', gap: 10 },
  attachBtn: { flex: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  attachTxt: { fontSize: 13 },
  submitBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  freeformHint: { fontSize: 12, fontStyle: 'italic', textAlign: 'right', marginTop: -8 },
});

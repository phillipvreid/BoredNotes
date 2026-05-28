import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Image, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { getDb } from '../src/db/database';
import { createEntry } from '../src/db/entries';
import { createMedia } from '../src/db/media';
import { getNextPrompt, getCurrentPrompt } from '../src/prompts/next';
import { getSetting } from '../src/db/settings';
import { captureLocation, queuePendingGeocode } from '../src/location/location';
import { pickPhoto, takePhoto, startVoiceRecording, stopVoiceRecording } from '../src/media/capture';
import { useTheme } from '../src/theme/ThemeContext';

export default function RespondScreen() {
  const { colors, accent } = useTheme();
  const [response, setResponse] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prompt, setPrompt] = useState<string>('');
  const [respondMode, setRespondMode] = useState<'prompted' | 'freeform'>('prompted');

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const current = await getCurrentPrompt(db);
      setPrompt(current?.text ?? '');
      const mode = await getSetting(db, 'respond_mode');
      setRespondMode((mode as 'prompted' | 'freeform') ?? 'prompted');
    })();
  }, []);

  async function handleAddLocation() {
    const loc = await captureLocation();
    if (loc) {
      setLocationLabel(loc.label ?? '');
      setLocationCoords({ lat: loc.lat, lng: loc.lng });
    }
  }

  async function handlePickPhoto() {
    const uri = await pickPhoto();
    if (uri) setPhotoUri(uri);
  }

  async function handleTakePhoto() {
    const uri = await takePhoto();
    if (uri) setPhotoUri(uri);
  }

  async function handleToggleRecording() {
    if (isRecording) {
      const uri = await stopVoiceRecording();
      setIsRecording(false);
      if (uri) setVoiceUri(uri);
    } else {
      try {
        await startVoiceRecording();
        setIsRecording(true);
      } catch {
        Alert.alert('Microphone access needed', 'Please allow microphone access in Settings to record voice memos.');
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
      if (voiceUri) await createMedia(db, entryId, 'voice', voiceUri);
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
            <Text style={[styles.prompt, { color: colors.textPrimary }]}>{prompt}</Text>
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

          {voiceUri && !isRecording && (
            <View style={styles.voiceBadge}>
              <Text style={[styles.voiceTxt, { color: colors.textSecondary }]}>🎙 Voice memo attached</Text>
              <TouchableOpacity onPress={() => setVoiceUri(null)}>
                <Text style={styles.removeTxt}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.metaRow}>
            <TouchableOpacity onPress={handleAddLocation}>
              <Text style={[styles.metaBtnTxt, { color: colors.textSecondary }]}>
                {locationLabel ? `📍 ${locationLabel}` : '📍 Add place'}
              </Text>
            </TouchableOpacity>
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
            <TouchableOpacity
              onPress={handleToggleRecording}
              style={[styles.attachBtn, { backgroundColor: isRecording ? '#fee2e2' : colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.attachTxt, { color: colors.textSecondary }]}>{isRecording ? '⏹ Stop' : '🎙 Record'}</Text>
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
  prompt: { fontSize: 20, lineHeight: 30, fontFamily: 'Georgia', fontStyle: 'italic', marginTop: 8 },
  input: { fontSize: 16, lineHeight: 26, minHeight: 160, textAlignVertical: 'top', borderBottomWidth: 1, paddingBottom: 12, fontFamily: 'Georgia', fontStyle: 'italic' },
  photoPreview: { gap: 6 },
  photoImg: { width: '100%', height: 180, borderRadius: 8 },
  voiceBadge: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voiceTxt: {},
  removeTxt: { color: '#f87171', fontSize: 13 },
  metaRow: { gap: 6 },
  metaBtnTxt: { fontSize: 14 },
  locationInput: { fontSize: 14, borderBottomWidth: 1, paddingVertical: 4 },
  attachRow: { flexDirection: 'row', gap: 10 },
  attachBtn: { flex: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  attachTxt: { fontSize: 13 },
  submitBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  freeformHint: { fontSize: 12, fontStyle: 'italic', textAlign: 'right', marginTop: -8 },
});

import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Image, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { getDb } from '../src/db/database';
import { createEntry } from '../src/db/entries';
import { createMedia } from '../src/db/media';
import { getNextPrompt, getCurrentPrompt } from '../src/prompts/next';
import { captureLocation, queuePendingGeocode } from '../src/location/location';
import { pickPhoto, takePhoto, startVoiceRecording, stopVoiceRecording } from '../src/media/capture';

export default function RespondScreen() {
  const [response, setResponse] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prompt, setPrompt] = useState<string>('');

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const current = await getCurrentPrompt(db);
      setPrompt(current?.text ?? '');
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
    if (isRecording && recording) {
      const uri = await stopVoiceRecording(recording);
      setRecording(null);
      setIsRecording(false);
      if (uri) setVoiceUri(uri);
    } else {
      const rec = await startVoiceRecording();
      setRecording(rec);
      setIsRecording(true);
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
        prompt_text: prompt,
        response_text: response.trim(),
        location_label: locationLabel || undefined,
        location_lat: locationCoords?.lat,
        location_lng: locationCoords?.lng,
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.prompt}>{prompt}</Text>

          <TextInput
            style={styles.input}
            placeholder="What's on your mind…"
            placeholderTextColor="#bbb"
            multiline
            autoFocus
            value={response}
            onChangeText={setResponse}
          />

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
              <Text style={styles.voiceTxt}>🎙 Voice memo attached</Text>
              <TouchableOpacity onPress={() => setVoiceUri(null)}>
                <Text style={styles.removeTxt}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.metaRow}>
            <TouchableOpacity onPress={handleAddLocation}>
              <Text style={styles.metaBtnTxt}>{locationLabel ? `📍 ${locationLabel}` : '📍 Add place'}</Text>
            </TouchableOpacity>
            {locationLabel !== '' && (
              <TextInput
                style={styles.locationInput}
                value={locationLabel}
                onChangeText={setLocationLabel}
                placeholder="Edit place name"
                placeholderTextColor="#bbb"
              />
            )}
          </View>

          <View style={styles.attachRow}>
            <TouchableOpacity onPress={handlePickPhoto} style={styles.attachBtn}>
              <Text style={styles.attachTxt}>🖼 Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTakePhoto} style={styles.attachBtn}>
              <Text style={styles.attachTxt}>📷 Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleRecording} style={[styles.attachBtn, isRecording && styles.recording]}>
              <Text style={styles.attachTxt}>{isRecording ? '⏹ Stop' : '🎙 Record'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!response.trim() || submitting) && styles.submitDisabled]}
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
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  closeBtn: { alignSelf: 'flex-end', padding: 4 },
  closeTxt: { fontSize: 18, color: '#aaa' },
  prompt: { fontSize: 20, color: '#1a1a1a', lineHeight: 28, fontWeight: '400', marginTop: 8 },
  input: { fontSize: 16, color: '#222', lineHeight: 24, minHeight: 160, textAlignVertical: 'top', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 12 },
  photoPreview: { gap: 6 },
  photoImg: { width: '100%', height: 180, borderRadius: 8 },
  voiceBadge: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voiceTxt: { color: '#555' },
  removeTxt: { color: '#f87171', fontSize: 13 },
  metaRow: { gap: 6 },
  metaBtnTxt: { color: '#888', fontSize: 14 },
  locationInput: { fontSize: 14, color: '#333', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 4 },
  attachRow: { flexDirection: 'row', gap: 10 },
  attachBtn: { flex: 1, backgroundColor: '#f4f4f4', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  recording: { backgroundColor: '#fee2e2' },
  attachTxt: { fontSize: 13, color: '#555' },
  submitBtn: { backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitDisabled: { backgroundColor: '#ccc' },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

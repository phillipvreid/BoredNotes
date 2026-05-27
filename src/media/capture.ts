import * as ImagePicker from 'expo-image-picker';
import { AudioRecorder, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system';

const MEDIA_DIR = `${FileSystem.documentDirectory}bn_media/`;

async function ensureMediaDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
}

export async function pickPhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  await ensureMediaDir();
  const src = result.assets[0].uri;
  const dest = `${MEDIA_DIR}photo_${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: src, to: dest });
  return dest;
}

export async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  await ensureMediaDir();
  const src = result.assets[0].uri;
  const dest = `${MEDIA_DIR}photo_${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: src, to: dest });
  return dest;
}

let _recorder: AudioRecorder | null = null;

export async function startVoiceRecording(): Promise<void> {
  const { granted } = await requestRecordingPermissionsAsync();
  if (!granted) throw new Error('Microphone permission denied');

  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

  _recorder = new AudioRecorder({
    isMeteringEnabled: false,
    android: { extension: '.m4a', outputFormat: 'mpeg4', audioEncoder: 'aac', sampleRate: 44100, numberOfChannels: 2, bitRate: 128000 },
    ios: { extension: '.m4a', outputFormat: 'mpeg4', audioQuality: 96, sampleRate: 44100, numberOfChannels: 2, bitRate: 128000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
    web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
  });
  await _recorder.prepareToRecordAsync();
  _recorder.record();
}

export async function stopVoiceRecording(): Promise<string | null> {
  if (!_recorder) return null;

  await _recorder.stop();
  const uri = _recorder.uri;
  _recorder = null;

  if (!uri) return null;

  await setAudioModeAsync({ allowsRecording: false });
  await ensureMediaDir();
  const dest = `${MEDIA_DIR}voice_${Date.now()}.m4a`;
  await FileSystem.moveAsync({ from: uri, to: dest });
  return dest;
}

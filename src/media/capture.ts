import * as ImagePicker from 'expo-image-picker';
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


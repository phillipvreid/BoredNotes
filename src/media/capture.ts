import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system/next';

const mediaDir = new Directory(Paths.document, 'bn_media');

function ensureMediaDir(): void {
  if (!mediaDir.exists) mediaDir.create();
}

export async function pickPhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') throw new Error('permission_denied');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  ensureMediaDir();
  const src = new File(result.assets[0].uri);
  const dest = new File(mediaDir, `photo_${Date.now()}.jpg`);
  src.copy(dest);
  return dest.uri;
}

export async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') throw new Error('permission_denied');

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  ensureMediaDir();
  const src = new File(result.assets[0].uri);
  const dest = new File(mediaDir, `photo_${Date.now()}.jpg`);
  src.copy(dest);
  return dest.uri;
}


import * as Location from 'expo-location';
import type { SQLiteDatabase } from 'expo-sqlite';
import { updateEntryLocation } from '../db/entries';
import { getSetting, setSetting } from '../db/settings';

export interface CapturedLocation {
  lat: number;
  lng: number;
  label: string | null;
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  } catch {
    return null;
  }
}

export async function captureLocation(): Promise<CapturedLocation | null> {
  const coords = await getCurrentCoords();
  if (!coords) return null;
  const label = await reverseGeocode(coords.lat, coords.lng);
  return { lat: coords.lat, lng: coords.lng, label };
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const place = results[0];
    if (!place) return null;
    const parts = [place.name, place.city, place.region].filter(Boolean);
    return parts.slice(0, 2).join(', ') || null;
  } catch {
    return null;
  }
}

export async function queuePendingGeocode(
  db: SQLiteDatabase,
  entryId: number,
  lat: number,
  lng: number
): Promise<void> {
  const existing = JSON.parse((await getSetting(db, 'pending_geocodes')) ?? '[]');
  existing.push({ entryId, lat, lng });
  await setSetting(db, 'pending_geocodes', JSON.stringify(existing));
}

export async function flushPendingGeocodes(db: SQLiteDatabase): Promise<void> {
  const raw = await getSetting(db, 'pending_geocodes');
  if (!raw) return;
  const queue: { entryId: number; lat: number; lng: number }[] = JSON.parse(raw);
  if (queue.length === 0) return;

  const remaining = [];
  for (const item of queue) {
    const label = await reverseGeocode(item.lat, item.lng);
    if (label) {
      await updateEntryLocation(db, item.entryId, label);
    } else {
      remaining.push(item);
    }
  }
  await setSetting(db, 'pending_geocodes', JSON.stringify(remaining));
}

import type { SQLiteDatabase } from 'expo-sqlite';
import type { Place } from '../types';

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortPlacesByDistance<T extends { lat: number; lng: number }>(
  places: T[],
  coords: { lat: number; lng: number } | null
): T[] {
  if (!coords) return places;
  return [...places].sort(
    (a, b) =>
      haversineMeters(coords.lat, coords.lng, a.lat, a.lng) -
      haversineMeters(coords.lat, coords.lng, b.lat, b.lng)
  );
}

export async function getPlace(db: SQLiteDatabase, id: number): Promise<Place | null> {
  return db.getFirstAsync<Place>('SELECT * FROM places WHERE id = ?', [id]);
}

export async function getAllPlaces(db: SQLiteDatabase): Promise<Place[]> {
  return db.getAllAsync<Place>('SELECT * FROM places ORDER BY id', []);
}

export async function createPlace(
  db: SQLiteDatabase,
  input: { name: string; lat: number; lng: number; radius_m?: number }
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO places (name, lat, lng, radius_m) VALUES (?, ?, ?, ?)',
    [input.name, input.lat, input.lng, input.radius_m ?? 100]
  );
  return result.lastInsertRowId;
}

export async function updatePlace(
  db: SQLiteDatabase,
  id: number,
  updates: { name?: string; radius_m?: number }
): Promise<void> {
  if (updates.name === undefined && updates.radius_m === undefined) return;
  if (updates.name !== undefined && updates.radius_m !== undefined) {
    await db.runAsync(
      'UPDATE places SET name = ?, radius_m = ? WHERE id = ?',
      [updates.name, updates.radius_m, id]
    );
  } else if (updates.name !== undefined) {
    await db.runAsync('UPDATE places SET name = ? WHERE id = ?', [updates.name, id]);
  } else if (updates.radius_m !== undefined) {
    await db.runAsync('UPDATE places SET radius_m = ? WHERE id = ?', [updates.radius_m, id]);
  }
}

export async function deletePlace(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM places WHERE id = ?', [id]);
}

export async function getAllPlacesWithCounts(
  db: SQLiteDatabase
): Promise<(Place & { entry_count: number })[]> {
  return db.getAllAsync<Place & { entry_count: number }>(
    `SELECT p.*, COUNT(e.id) as entry_count
     FROM places p
     LEFT JOIN entries e ON e.place_id = p.id
     GROUP BY p.id
     ORDER BY entry_count DESC`,
    []
  );
}

export async function syncPlaceToEntries(db: SQLiteDatabase, place: Place): Promise<void> {
  const rows = await db.getAllAsync<{
    id: number;
    location_lat: number;
    location_lng: number;
    place_id: number | null;
  }>(
    'SELECT id, location_lat, location_lng, place_id FROM entries WHERE location_lat IS NOT NULL',
    []
  );

  for (const row of rows) {
    const dist = haversineMeters(row.location_lat, row.location_lng, place.lat, place.lng);
    const withinRadius = dist <= place.radius_m;
    const isOwnedByThis = row.place_id === place.id;
    const isUnassigned = row.place_id === null;

    if (withinRadius && (isUnassigned || isOwnedByThis)) {
      await db.runAsync(
        'UPDATE entries SET place_id = ?, location_label = ? WHERE id = ?',
        [place.id, place.name, row.id]
      );
    } else if (!withinRadius && isOwnedByThis) {
      await db.runAsync('UPDATE entries SET place_id = NULL WHERE id = ?', [row.id]);
    }
  }
}

export async function checkEntryAgainstPlaces(
  db: SQLiteDatabase,
  entry: { id: number; lat: number; lng: number }
): Promise<void> {
  const places = await getAllPlaces(db);
  let nearest: Place | null = null;
  let nearestDist = Infinity;

  for (const place of places) {
    const dist = haversineMeters(entry.lat, entry.lng, place.lat, place.lng);
    if (dist <= place.radius_m && dist < nearestDist) {
      nearest = place;
      nearestDist = dist;
    }
  }

  if (nearest) {
    await db.runAsync(
      'UPDATE entries SET place_id = ?, location_label = ? WHERE id = ? AND place_id IS NULL',
      [nearest.id, nearest.name, entry.id]
    );
  }
}

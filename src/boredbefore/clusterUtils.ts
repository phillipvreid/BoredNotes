import type { PinnedEntry, Place } from '../types';

export interface NamedPlaceGroup {
  type: 'named';
  placeId: number;
  placeName: string;
  lat: number;
  lng: number;
  entries: PinnedEntry[];
}

export interface UnnamedClusterGroup {
  type: 'unnamed';
  lat: number;
  lng: number;
  entries: PinnedEntry[];
}

export type PlaceGroup = NamedPlaceGroup | UnnamedClusterGroup;

export interface ClusterResult {
  groups: PlaceGroup[];
  loneEntries: PinnedEntry[];
}

const CLUSTER_CELL = 0.001; // ~111m per cell

export function clusterPins(pins: PinnedEntry[], places: Place[]): ClusterResult {
  const placeMap = new Map(places.map(p => [p.id, p]));

  const namedBuckets = new Map<number, PinnedEntry[]>();
  const ungrouped: PinnedEntry[] = [];

  for (const pin of pins) {
    if (pin.place_id !== null && placeMap.has(pin.place_id)) {
      const arr = namedBuckets.get(pin.place_id) ?? [];
      arr.push(pin);
      namedBuckets.set(pin.place_id, arr);
    } else {
      ungrouped.push(pin);
    }
  }

  const namedGroups: NamedPlaceGroup[] = [];
  for (const [placeId, entries] of namedBuckets) {
    const place = placeMap.get(placeId)!;
    namedGroups.push({
      type: 'named',
      placeId,
      placeName: place.name,
      lat: place.lat,
      lng: place.lng,
      entries,
    });
  }

  const cellBuckets = new Map<string, PinnedEntry[]>();
  for (const pin of ungrouped) {
    const key = `${Math.trunc(pin.location_lat / CLUSTER_CELL)},${Math.trunc(pin.location_lng / CLUSTER_CELL)}`;
    const arr = cellBuckets.get(key) ?? [];
    arr.push(pin);
    cellBuckets.set(key, arr);
  }

  const unnamedGroups: UnnamedClusterGroup[] = [];
  const loneEntries: PinnedEntry[] = [];

  for (const [, entries] of cellBuckets) {
    if (entries.length >= 2) {
      const lat = entries.reduce((s, e) => s + e.location_lat, 0) / entries.length;
      const lng = entries.reduce((s, e) => s + e.location_lng, 0) / entries.length;
      unnamedGroups.push({ type: 'unnamed', lat, lng, entries });
    } else {
      loneEntries.push(entries[0]);
    }
  }

  return { groups: [...namedGroups, ...unnamedGroups], loneEntries };
}

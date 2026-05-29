export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const CELL_SIZE = 0.5;

export function findDenseCluster(pins: LatLng[]): MapRegion | null {
  if (pins.length === 0) return null;

  const counts = new Map<string, number>();
  for (const { lat, lng } of pins) {
    const key = `${Math.floor(lat / CELL_SIZE)},${Math.floor(lng / CELL_SIZE)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let bestKey = '';
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) { bestCount = count; bestKey = key; }
  }

  const [rowStr, colStr] = bestKey.split(',');
  const row = parseInt(rowStr, 10);
  const col = parseInt(colStr, 10);

  return {
    latitude: (row + 0.5) * CELL_SIZE,
    longitude: (col + 0.5) * CELL_SIZE,
    latitudeDelta: CELL_SIZE,
    longitudeDelta: CELL_SIZE,
  };
}

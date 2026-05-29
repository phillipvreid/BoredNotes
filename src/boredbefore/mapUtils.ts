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

function roundToNearestCell(value: number, cellSize: number): string {
  return (Math.round(value / cellSize) * cellSize).toString();
}

export function findDenseCluster(pins: LatLng[]): MapRegion | null {
  if (pins.length === 0) return null;

  const counts = new Map<string, number>();
  for (const { lat, lng } of pins) {
    const key = `${roundToNearestCell(lat, CELL_SIZE)},${roundToNearestCell(lng, CELL_SIZE)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let bestKey = '';
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) { bestCount = count; bestKey = key; }
  }

  const [latStr, lngStr] = bestKey.split(',');
  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lngStr);

  return {
    latitude,
    longitude,
    latitudeDelta: CELL_SIZE,
    longitudeDelta: CELL_SIZE,
  };
}

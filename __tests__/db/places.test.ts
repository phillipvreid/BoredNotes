import {
  getPlace,
  getAllPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  getAllPlacesWithCounts,
  syncPlaceToEntries,
  checkEntryAgainstPlaces,
  haversineMeters,
} from '../../src/db/places';
import { openDatabaseAsync } from 'expo-sqlite';
import type { Place } from '../../src/types';

const makePlace = (overrides: Partial<Place> = {}): Place => ({
  id: 1,
  name: 'Home',
  lat: 0,
  lng: 0,
  radius_m: 100,
  created_at: '2026-01-01T00:00:00',
  ...overrides,
});

describe('haversineMeters', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineMeters(0, 0, 0, 0)).toBe(0);
  });

  it('returns ~111m for 0.001 degree latitude difference at equator', () => {
    expect(haversineMeters(0, 0, 0.001, 0)).toBeCloseTo(111, 0);
  });

  it('returns ~111m for 0.001 degree longitude difference at equator', () => {
    expect(haversineMeters(0, 0, 0, 0.001)).toBeCloseTo(111, 0);
  });
});

describe('createPlace', () => {
  let db: any;
  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
    db.runAsync.mockResolvedValue({ lastInsertRowId: 7, changes: 1 });
  });

  it('inserts a place and returns the new id', async () => {
    const id = await createPlace(db, { name: 'Office', lat: 37.77, lng: -122.41 });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO places'),
      ['Office', 37.77, -122.41, 100]
    );
    expect(id).toBe(7);
  });

  it('uses provided radius_m', async () => {
    await createPlace(db, { name: 'Office', lat: 37.77, lng: -122.41, radius_m: 50 });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.any(String),
      ['Office', 37.77, -122.41, 50]
    );
  });
});

describe('getPlace', () => {
  let db: any;
  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
  });

  it('calls SELECT with the given id', async () => {
    db.getFirstAsync.mockResolvedValueOnce(makePlace({ id: 3 }));
    const result = await getPlace(db, 3);
    expect(db.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM places WHERE id = ?'),
      [3]
    );
    expect(result?.id).toBe(3);
  });

  it('returns null when place not found', async () => {
    db.getFirstAsync.mockResolvedValueOnce(null);
    expect(await getPlace(db, 99)).toBeNull();
  });
});

describe('getAllPlaces', () => {
  let db: any;
  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
  });

  it('returns all places ordered by id', async () => {
    const places = [makePlace({ id: 1 }), makePlace({ id: 2, name: 'Work' })];
    db.getAllAsync.mockResolvedValueOnce(places);
    const result = await getAllPlaces(db);
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM places'),
      []
    );
    expect(result).toHaveLength(2);
  });
});

describe('updatePlace', () => {
  let db: any;
  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
    db.runAsync.mockResolvedValue({ lastInsertRowId: 0, changes: 1 });
  });

  it('updates name only when only name provided', async () => {
    await updatePlace(db, 1, { name: 'New Name' });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('SET name = ?'),
      ['New Name', 1]
    );
  });

  it('updates radius only when only radius_m provided', async () => {
    await updatePlace(db, 1, { radius_m: 200 });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('SET radius_m = ?'),
      [200, 1]
    );
  });

  it('updates both when both provided', async () => {
    await updatePlace(db, 1, { name: 'New', radius_m: 50 });
    const call = db.runAsync.mock.calls[0];
    expect(call[0]).toContain('SET name = ?');
    expect(call[0]).toContain('radius_m = ?');
    expect(call[1]).toEqual(['New', 50, 1]);
  });

  it('does nothing when updates object is empty', async () => {
    await updatePlace(db, 1, {});
    expect(db.runAsync).not.toHaveBeenCalled();
  });
});

describe('deletePlace', () => {
  let db: any;
  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
    db.runAsync.mockResolvedValue({ lastInsertRowId: 0, changes: 1 });
  });

  it('calls DELETE for the given id', async () => {
    await deletePlace(db, 5);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM places WHERE id = ?'),
      [5]
    );
  });
});

describe('getAllPlacesWithCounts', () => {
  let db: any;
  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
  });

  it('uses a LEFT JOIN to count entries per place', async () => {
    db.getAllAsync.mockResolvedValueOnce([{ ...makePlace(), entry_count: 3 }]);
    await getAllPlacesWithCounts(db);
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('LEFT JOIN entries'),
      []
    );
  });
});

describe('syncPlaceToEntries', () => {
  let db: any;
  const place = makePlace({ id: 1, name: 'Home', lat: 0, lng: 0, radius_m: 200 });

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
    db.runAsync.mockResolvedValue({ lastInsertRowId: 0, changes: 1 });
  });

  it('assigns entries within radius that are unassigned', async () => {
    // lat=0.001 ≈ 111m from place at (0,0) — within 200m radius
    db.getAllAsync.mockResolvedValueOnce([
      { id: 10, location_lat: 0.001, location_lng: 0, place_id: null },
    ]);
    await syncPlaceToEntries(db, place);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE entries SET place_id = ?'),
      [1, 'Home', 10]
    );
  });

  it('re-assigns entries within radius already owned by this place', async () => {
    db.getAllAsync.mockResolvedValueOnce([
      { id: 11, location_lat: 0.001, location_lng: 0, place_id: 1 },
    ]);
    await syncPlaceToEntries(db, place);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE entries SET place_id = ?'),
      [1, 'Home', 11]
    );
  });

  it('unassigns entries outside radius that were owned by this place', async () => {
    // lat=0.003 ≈ 333m — outside 200m radius
    db.getAllAsync.mockResolvedValueOnce([
      { id: 12, location_lat: 0.003, location_lng: 0, place_id: 1 },
    ]);
    await syncPlaceToEntries(db, place);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE entries SET place_id = NULL'),
      [12]
    );
    // Also verify location_label is cleared
    const callArg = db.runAsync.mock.calls[0][0] as string;
    expect(callArg).toContain('location_label = NULL');
  });

  it('does NOT touch entries owned by a different place', async () => {
    // Within radius but owned by place 2
    db.getAllAsync.mockResolvedValueOnce([
      { id: 13, location_lat: 0.001, location_lng: 0, place_id: 2 },
    ]);
    await syncPlaceToEntries(db, place);
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('does nothing when there are no entries with location', async () => {
    db.getAllAsync.mockResolvedValueOnce([]);
    await syncPlaceToEntries(db, place);
    expect(db.runAsync).not.toHaveBeenCalled();
  });
});

describe('checkEntryAgainstPlaces', () => {
  let db: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
    db.runAsync.mockResolvedValue({ lastInsertRowId: 0, changes: 1 });
  });

  it('assigns the nearest place when entry is within radius', async () => {
    const places = [makePlace({ id: 1, name: 'Home', lat: 0, lng: 0, radius_m: 200 })];
    db.getAllAsync.mockResolvedValueOnce(places);
    await checkEntryAgainstPlaces(db, { id: 99, lat: 0.001, lng: 0 });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE entries SET place_id = ?'),
      [1, 'Home', 99]
    );
  });

  it('does nothing when no places exist', async () => {
    db.getAllAsync.mockResolvedValueOnce([]);
    await checkEntryAgainstPlaces(db, { id: 99, lat: 0.001, lng: 0 });
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('does nothing when entry is outside all place radii', async () => {
    const places = [makePlace({ id: 1, lat: 0, lng: 0, radius_m: 50 })];
    db.getAllAsync.mockResolvedValueOnce(places);
    // 0.001 deg ≈ 111m, outside 50m radius
    await checkEntryAgainstPlaces(db, { id: 99, lat: 0.001, lng: 0 });
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('does not overwrite an entry already assigned to another place', async () => {
    // Note: the guard is in the SQL WHERE clause — we test the SQL shape
    const places = [makePlace({ id: 1, name: 'Home', lat: 0, lng: 0, radius_m: 200 })];
    db.getAllAsync.mockResolvedValueOnce(places);
    await checkEntryAgainstPlaces(db, { id: 99, lat: 0.001, lng: 0 });
    const callArg = db.runAsync.mock.calls[0][0] as string;
    expect(callArg).toContain('AND place_id IS NULL');
  });

  it('assigns the NEAREST place when two overlap', async () => {
    const places = [
      makePlace({ id: 1, name: 'Far',  lat: 0.0008, lng: 0, radius_m: 200 }), // ~89m away
      makePlace({ id: 2, name: 'Near', lat: 0.0002, lng: 0, radius_m: 200 }), // ~22m away
    ];
    db.getAllAsync.mockResolvedValueOnce(places);
    await checkEntryAgainstPlaces(db, { id: 99, lat: 0, lng: 0 });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.any(String),
      [2, 'Near', 99]
    );
  });
});

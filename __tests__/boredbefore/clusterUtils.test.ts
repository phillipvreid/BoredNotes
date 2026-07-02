import { clusterPins } from '../../src/boredbefore/clusterUtils';
import type { PinnedEntry, Place } from '../../src/types';
import type { ClusterResult, NamedPlaceGroup, UnnamedClusterGroup } from '../../src/boredbefore/clusterUtils';

function makePin(id: number, lat: number, lng: number, place_id: number | null = null): PinnedEntry {
  return {
    id,
    prompt_text: 'test',
    response_text: 'test',
    created_at: '2026-01-01T00:00:00',
    location_label: null,
    entry_mode: 'prompted',
    entry_kind: 'text',
    game_data: null,
    place_id,
    location_lat: lat,
    location_lng: lng,
  };
}

const place1: Place = { id: 1, name: 'Home', lat: 37.77, lng: -122.41, radius_m: 100, created_at: '2026-01-01' };

describe('clusterPins', () => {
  it('returns empty result when no pins', () => {
    const result = clusterPins([], []);
    expect(result.groups).toHaveLength(0);
    expect(result.loneEntries).toHaveLength(0);
  });

  it('groups pin with known place_id into a named group', () => {
    const result = clusterPins([makePin(1, 37.77, -122.41, 1)], [place1]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].type).toBe('named');
    expect((result.groups[0] as NamedPlaceGroup).placeId).toBe(1);
    expect((result.groups[0] as NamedPlaceGroup).placeName).toBe('Home');
    expect((result.groups[0] as NamedPlaceGroup).lat).toBe(37.77);
    expect((result.groups[0] as NamedPlaceGroup).lng).toBe(-122.41);
    expect(result.loneEntries).toHaveLength(0);
  });

  it('places the named group centroid at the place coordinates (not entry coordinates)', () => {
    const result = clusterPins([makePin(1, 37.771, -122.411, 1)], [place1]);
    const group = result.groups[0] as NamedPlaceGroup;
    expect(group.lat).toBe(37.77);
    expect(group.lng).toBe(-122.41);
  });

  it('groups two nearby ungrouped pins into an unnamed cluster', () => {
    const pin1 = makePin(1, 40.710000, -74.000000);
    const pin2 = makePin(2, 40.710001, -74.000001);
    const result = clusterPins([pin1, pin2], []);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].type).toBe('unnamed');
    expect(result.loneEntries).toHaveLength(0);
  });

  it('unnamed cluster centroid is the average coordinate of members', () => {
    const pin1 = makePin(1, 40.710000, -74.000000);
    const pin2 = makePin(2, 40.710002, -74.000002);
    const result = clusterPins([pin1, pin2], []);
    const group = result.groups[0] as UnnamedClusterGroup;
    expect(group.lat).toBeCloseTo(40.710001, 5);
    expect(group.lng).toBeCloseTo(-74.000001, 5);
  });

  it('keeps a single ungrouped pin as a lone entry', () => {
    const result = clusterPins([makePin(1, 37.77, -122.41)], []);
    expect(result.groups).toHaveLength(0);
    expect(result.loneEntries).toHaveLength(1);
    expect(result.loneEntries[0].id).toBe(1);
  });

  it('two pins in different 0.001 degree cells become lone entries', () => {
    const pin1 = makePin(1, 37.770, -122.410);
    const pin2 = makePin(2, 37.780, -122.420);
    const result = clusterPins([pin1, pin2], []);
    expect(result.groups).toHaveLength(0);
    expect(result.loneEntries).toHaveLength(2);
  });

  it('pin with place_id that is not in places list falls into ungrouped', () => {
    const result = clusterPins([makePin(1, 37.77, -122.41, 99)], []);
    expect(result.loneEntries).toHaveLength(1);
  });

  it('handles a mix: named group, unnamed cluster, and lone entry', () => {
    const named   = makePin(1, 37.770, -122.410, 1);
    const clust1  = makePin(2, 40.710000, -74.000000);
    const clust2  = makePin(3, 40.710001, -74.000001);
    const lone    = makePin(4, 51.500, -0.100);

    const result = clusterPins([named, clust1, clust2, lone], [place1]);
    expect(result.groups).toHaveLength(2);
    expect(result.groups.some(g => g.type === 'named')).toBe(true);
    expect(result.groups.some(g => g.type === 'unnamed')).toBe(true);
    expect(result.loneEntries).toHaveLength(1);
    expect(result.loneEntries[0].id).toBe(4);
  });

  it('named group entries array contains all member pins', () => {
    const pin1 = makePin(1, 37.770, -122.410, 1);
    const pin2 = makePin(2, 37.771, -122.411, 1);
    const result = clusterPins([pin1, pin2], [place1]);
    expect((result.groups[0] as NamedPlaceGroup).entries).toHaveLength(2);
  });

  it('unnamed cluster entries array contains all member pins', () => {
    const pin1 = makePin(1, 40.710000, -74.000000);
    const pin2 = makePin(2, 40.710001, -74.000001);
    const pin3 = makePin(3, 40.710002, -74.000002);
    const result = clusterPins([pin1, pin2, pin3], []);
    expect((result.groups[0] as UnnamedClusterGroup).entries).toHaveLength(3);
  });
});

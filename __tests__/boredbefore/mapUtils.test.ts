import { findDenseCluster } from '../../src/boredbefore/mapUtils';

describe('findDenseCluster', () => {
  it('returns null when given an empty array', () => {
    expect(findDenseCluster([])).toBeNull();
  });

  it('centres on the single pin when only one exists', () => {
    const result = findDenseCluster([{ lat: 37.7749, lng: -122.4194 }]);
    expect(result).not.toBeNull();
    expect(result!.latitude).toBeCloseTo(37.75, 1);
    expect(result!.longitude).toBeCloseTo(-122.25, 1);
  });

  it('picks the denser cluster when pins span two cities', () => {
    const sf = Array.from({ length: 10 }, (_, i) => ({ lat: 37.77 + i * 0.01, lng: -122.41 }));
    const ny = [{ lat: 40.71, lng: -74.0 }];
    const result = findDenseCluster([...sf, ...ny]);
    expect(result).not.toBeNull();
    expect(result!.latitude).toBeCloseTo(37.75, 0);
  });

  it('returns fixed deltas of 0.5 degrees', () => {
    const result = findDenseCluster([{ lat: 51.5, lng: -0.1 }]);
    expect(result!.latitudeDelta).toBe(0.5);
    expect(result!.longitudeDelta).toBe(0.5);
  });
});

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  Accuracy: { Low: 1 },
}));

jest.mock('../../src/context/weather', () => ({
  fetchWeather: jest.fn(),
}));

import * as Location from 'expo-location';
import { fetchWeather } from '../../src/context/weather';
import { gatherContext } from '../../src/context/gather';

const mockGetPermissions = Location.getForegroundPermissionsAsync as jest.Mock;
const mockGetLastKnown = Location.getLastKnownPositionAsync as jest.Mock;
const mockReverseGeocode = Location.reverseGeocodeAsync as jest.Mock;
const mockFetchWeather = fetchWeather as jest.Mock;

describe('gatherContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns correct light signals for a fixed date (Thursday evening, summer)', async () => {
    jest.setSystemTime(new Date('2026-06-04T19:30:00'));
    mockGetPermissions.mockResolvedValue({ status: 'denied' });

    const result = await gatherContext();

    expect(result.timeOfDay).toBe('evening');
    expect(result.dayOfWeek).toBe('Thursday');
    expect(result.season).toBe('summer');
    expect(result.locationLabel).toBeNull();
    expect(result.weatherCondition).toBeNull();
    expect(result.temperatureCelsius).toBeNull();
  });

  it('populates rich signals when location permission granted and weather succeeds', async () => {
    jest.setSystemTime(new Date('2026-01-15T08:00:00'));
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetLastKnown.mockResolvedValue({ coords: { latitude: 55.95, longitude: -3.19 } });
    mockReverseGeocode.mockResolvedValue([{ city: 'Edinburgh', region: 'Scotland' }]);
    mockFetchWeather.mockResolvedValue({ condition: 'rainy', temperatureCelsius: 8 });

    const result = await gatherContext();

    expect(result.locationLabel).toBe('Edinburgh, Scotland');
    expect(result.weatherCondition).toBe('rainy');
    expect(result.temperatureCelsius).toBe(8);
  });

  it('returns null rich fields when location permission is denied', async () => {
    jest.setSystemTime(new Date('2026-01-15T08:00:00'));
    mockGetPermissions.mockResolvedValue({ status: 'denied' });

    const result = await gatherContext();

    expect(result.locationLabel).toBeNull();
    expect(result.weatherCondition).toBeNull();
    expect(result.temperatureCelsius).toBeNull();
  });

  it('returns null weather fields when weather fetch returns null', async () => {
    jest.setSystemTime(new Date('2026-01-15T08:00:00'));
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetLastKnown.mockResolvedValue({ coords: { latitude: 55.95, longitude: -3.19 } });
    mockReverseGeocode.mockResolvedValue([{ city: 'Edinburgh', region: 'Scotland' }]);
    mockFetchWeather.mockResolvedValue(null);

    const result = await gatherContext();

    expect(result.locationLabel).toBe('Edinburgh, Scotland');
    expect(result.weatherCondition).toBeNull();
    expect(result.temperatureCelsius).toBeNull();
  });
});

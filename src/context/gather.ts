import * as Location from 'expo-location';
import type { PromptContext } from './types';
import { fetchWeather } from './weather';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getTimeOfDay(hour: number): PromptContext['timeOfDay'] {
  if (hour >= 6 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 17) return 'afternoon';
  if (hour >= 18 && hour <= 21) return 'evening';
  return 'night';
}

function getSeason(month: number): PromptContext['season'] {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

async function tryGetCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const cached = await Location.getLastKnownPositionAsync({});
    if (cached) return { lat: cached.coords.latitude, lng: cached.coords.longitude };

    const fresh = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    if (!fresh) return null;
    return { lat: fresh.coords.latitude, lng: fresh.coords.longitude };
  } catch {
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const place = results[0];
    if (!place) return null;
    const parts = [place.city, place.region].filter(Boolean);
    return parts.slice(0, 2).join(', ') || null;
  } catch {
    return null;
  }
}

export async function gatherContext(allowLocation: boolean): Promise<PromptContext> {
  const now = new Date();
  const timeOfDay = getTimeOfDay(now.getHours());
  const dayOfWeek = DAYS[now.getDay()];
  const season = getSeason(now.getMonth() + 1);

  // When auto-location is off, never touch the location or weather APIs —
  // the toggle must gate all location access, not just entry tagging.
  const coords = allowLocation ? await tryGetCoords() : null;

  let locationLabel: string | null = null;
  let weatherCondition: string | null = null;
  let temperatureCelsius: number | null = null;

  if (coords) {
    const [label, weather] = await Promise.all([
      reverseGeocode(coords.lat, coords.lng),
      fetchWeather(coords.lat, coords.lng),
    ]);
    locationLabel = label;
    if (weather) {
      weatherCondition = weather.condition;
      temperatureCelsius = weather.temperatureCelsius;
    }
  }

  return { timeOfDay, dayOfWeek, season, locationLabel, weatherCondition, temperatureCelsius };
}

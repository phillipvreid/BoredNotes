const WEATHERCODE_MAP: Record<number, string> = {
  0: 'clear', 1: 'clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'foggy', 48: 'foggy',
  51: 'drizzle', 53: 'drizzle', 55: 'drizzle', 56: 'drizzle', 57: 'drizzle',
  61: 'rainy', 63: 'rainy', 65: 'rainy', 66: 'rainy', 67: 'rainy',
  71: 'snowy', 73: 'snowy', 75: 'snowy', 77: 'snowy',
  80: 'rainy', 81: 'rainy', 82: 'rainy',
  85: 'snowy', 86: 'snowy',
  95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm',
};

const TIMEOUT_MS = 2000;

export interface WeatherResult {
  condition: string;
  temperatureCelsius: number;
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const data = await response.json();
    const code: number = data.current?.weathercode;
    const temp: number = data.current?.temperature_2m;
    if (code === undefined || temp === undefined) return null;
    const condition = WEATHERCODE_MAP[code] ?? null;
    if (!condition) return null;
    return { condition, temperatureCelsius: temp };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

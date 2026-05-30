import { fetchWeather } from '../../src/context/weather';

describe('fetchWeather', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps a known weathercode to a condition and returns temperature', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current: { weathercode: 61, temperature_2m: 11 } }),
    } as any);

    const result = await fetchWeather(55.9, -3.2);
    expect(result).toEqual({ condition: 'rainy', temperatureCelsius: 11 });
  });

  it('returns null when weathercode is unmapped', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current: { weathercode: 999, temperature_2m: 11 } }),
    } as any);

    const result = await fetchWeather(55.9, -3.2);
    expect(result).toBeNull();
  });

  it('returns null on non-200 response', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false } as any);
    const result = await fetchWeather(55.9, -3.2);
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('network error'));
    const result = await fetchWeather(55.9, -3.2);
    expect(result).toBeNull();
  });
});

import {
  parseLoveHateConfig, parseLoveHateData, pickLoveHateTheme,
  renderLoveHateResponseText, DEFAULT_LOVE_HATE_THEMES, LOVE_HATE_FRAMING,
} from '../../src/games/loveHate';

describe('parseLoveHateConfig', () => {
  it('parses a valid config', () => {
    expect(parseLoveHateConfig('{"themes":["Fruit","Weather"]}')).toEqual({
      themes: ['Fruit', 'Weather'],
    });
  });

  it('returns null for null, invalid JSON, and wrong shapes', () => {
    expect(parseLoveHateConfig(null)).toBeNull();
    expect(parseLoveHateConfig(undefined)).toBeNull();
    expect(parseLoveHateConfig('')).toBeNull();
    expect(parseLoveHateConfig('not json')).toBeNull();
    expect(parseLoveHateConfig('{"themes":"nope"}')).toBeNull();
    expect(parseLoveHateConfig('{"themes":[1,2]}')).toBeNull();
    expect(parseLoveHateConfig('{"slots":["a"]}')).toBeNull();
  });
});

describe('parseLoveHateData', () => {
  it('parses valid data', () => {
    expect(parseLoveHateData('{"theme":"Fruit","love":"Grapes","hate":"Pears"}')).toEqual({
      theme: 'Fruit', love: 'Grapes', hate: 'Pears',
    });
  });

  it('returns null for null, invalid JSON, and wrong shapes', () => {
    expect(parseLoveHateData(null)).toBeNull();
    expect(parseLoveHateData('not json')).toBeNull();
    expect(parseLoveHateData('{"theme":"Fruit","love":"Grapes"}')).toBeNull();
    expect(parseLoveHateData('{"theme":1,"love":"a","hate":"b"}')).toBeNull();
  });
});

describe('pickLoveHateTheme', () => {
  it('returns a member of the given pool', () => {
    const pool = ['Fruit', 'Weather', 'Condiments'];
    for (let i = 0; i < 20; i++) {
      expect(pool).toContain(pickLoveHateTheme(pool));
    }
  });

  it('falls back to the default themes for empty or missing pools', () => {
    expect(DEFAULT_LOVE_HATE_THEMES).toContain(pickLoveHateTheme([]));
    expect(DEFAULT_LOVE_HATE_THEMES).toContain(pickLoveHateTheme(null));
    expect(DEFAULT_LOVE_HATE_THEMES).toContain(pickLoveHateTheme(undefined));
  });
});

describe('renderLoveHateResponseText', () => {
  it('renders theme plus both lines', () => {
    expect(renderLoveHateResponseText({ theme: 'Fruit', love: 'Grapes', hate: 'Pears' })).toBe(
      'Fruit\nLove it: Grapes\nHate it: Pears'
    );
  });

  it('round-trips through parseLoveHateData JSON', () => {
    const data = { theme: 'Weather', love: 'first snow', hate: 'wind for no reason' };
    const parsed = parseLoveHateData(JSON.stringify(data));
    expect(parsed).toEqual(data);
    expect(renderLoveHateResponseText(parsed!)).toContain('Hate it: wind for no reason');
  });
});

describe('constants', () => {
  it('has a non-empty default pool and framing line', () => {
    expect(DEFAULT_LOVE_HATE_THEMES.length).toBeGreaterThanOrEqual(5);
    expect(LOVE_HATE_FRAMING.length).toBeGreaterThan(0);
  });
});

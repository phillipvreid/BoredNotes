import {
  parseRankConfig, parseRankData, renderRankResponseText, DEFAULT_RANK_SLOTS, RANK_SLOT_COUNT,
} from '../../src/games/rank';

describe('parseRankConfig', () => {
  it('parses a valid config', () => {
    expect(parseRankConfig('{"slots":["a","b","c"]}')).toEqual({ slots: ['a', 'b', 'c'] });
  });

  it('returns null for null, invalid JSON, and wrong shapes', () => {
    expect(parseRankConfig(null)).toBeNull();
    expect(parseRankConfig(undefined)).toBeNull();
    expect(parseRankConfig('')).toBeNull();
    expect(parseRankConfig('not json')).toBeNull();
    expect(parseRankConfig('{"slots":"nope"}')).toBeNull();
    expect(parseRankConfig('{"slots":[1,2,3]}')).toBeNull();
  });
});

describe('parseRankData', () => {
  it('parses valid data', () => {
    expect(parseRankData('{"items":["x","y","z"],"defense":"because"}')).toEqual({
      items: ['x', 'y', 'z'], defense: 'because',
    });
  });

  it('returns null for null, invalid JSON, and wrong shapes', () => {
    expect(parseRankData(null)).toBeNull();
    expect(parseRankData('not json')).toBeNull();
    expect(parseRankData('{"items":["x"]}')).toBeNull();
    expect(parseRankData('{"items":"x","defense":"d"}')).toBeNull();
  });
});

describe('renderRankResponseText', () => {
  it('renders numbered items plus the defense', () => {
    const text = renderRankResponseText({
      items: ['cold leftover pizza', 'a fistful of dry cereal', 'one sad clementine'],
      defense: 'Pizza asks nothing of me and gives everything.',
    });
    expect(text).toBe(
      '1. cold leftover pizza\n' +
      '2. a fistful of dry cereal\n' +
      '3. one sad clementine\n\n' +
      'Defend #1: Pizza asks nothing of me and gives everything.'
    );
  });

  it('round-trips through parseRankData JSON', () => {
    const data = { items: ['a', 'b', 'c'], defense: 'd' };
    const parsed = parseRankData(JSON.stringify(data));
    expect(parsed).toEqual(data);
    expect(renderRankResponseText(parsed!)).toContain('Defend #1: d');
  });
});

describe('defaults', () => {
  it('provides one placeholder per slot', () => {
    expect(DEFAULT_RANK_SLOTS).toHaveLength(RANK_SLOT_COUNT);
  });
});

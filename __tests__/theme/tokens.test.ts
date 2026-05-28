import { ACCENTS, DEFAULT_ACCENT_ID, lightPalette, darkPalette } from '../../src/theme/tokens';

describe('tokens', () => {
  it('ACCENTS contains DEFAULT_ACCENT_ID', () => {
    expect(ACCENTS.find(a => a.id === DEFAULT_ACCENT_ID)).toBeDefined();
  });

  it('every accent has all required fields with valid hex colours', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;
    for (const accent of ACCENTS) {
      expect(accent.id).toBeTruthy();
      expect(accent.label).toBeTruthy();
      expect(accent.labelColor).toMatch(hexPattern);
      expect(accent.buttonColor).toMatch(hexPattern);
    }
  });

  it('light palette has no shadow in dark palette', () => {
    expect(lightPalette.shadowOpacity).toBeGreaterThan(0);
    expect(darkPalette.shadowOpacity).toBe(0);
  });

  it('dark palette has visible cardBorder, light palette has transparent cardBorder', () => {
    expect(lightPalette.cardBorder).toBe('transparent');
    expect(darkPalette.cardBorder).not.toBe('transparent');
  });
});

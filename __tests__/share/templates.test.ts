// __tests__/share/templates.test.ts
import { CARD_STYLES, DEFAULT_STYLE_ID, DEFAULT_VARIANT_ID } from '../../src/share/templates';
import type { PassportTokens, PhotoTokens, SignalTokens } from '../../src/share/templates';

describe('CARD_STYLES', () => {
  it('has exactly 3 style families', () => {
    expect(CARD_STYLES).toHaveLength(3);
  });

  it('each style has exactly 3 variants', () => {
    for (const style of CARD_STYLES) {
      expect(style.variants).toHaveLength(3);
    }
  });

  it('default style and variant exist in CARD_STYLES', () => {
    const style = CARD_STYLES.find(s => s.id === DEFAULT_STYLE_ID);
    expect(style).toBeDefined();
    expect(style!.variants.find(v => v.id === DEFAULT_VARIANT_ID)).toBeDefined();
  });

  it('passport variants have all required token keys', () => {
    const passport = CARD_STYLES.find(s => s.id === 'passport')!;
    const required: (keyof PassportTokens)[] = [
      'bg', 'border', 'topbar', 'brand', 'stampDate', 'stampRing', 'stampLabel',
      'divider', 'text', 'meta', 'mrzBg', 'mrzText', 'mrzBorder',
    ];
    for (const v of passport.variants) {
      for (const key of required) {
        expect(v.tokens).toHaveProperty(key);
      }
    }
  });

  it('photo variants have all required token keys', () => {
    const photo = CARD_STYLES.find(s => s.id === 'photo')!;
    const required: (keyof PhotoTokens)[] = ['bg', 'photoPlaceholder', 'text', 'muted'];
    for (const v of photo.variants) {
      for (const key of required) {
        expect(v.tokens).toHaveProperty(key);
      }
    }
  });

  it('signal variants have all required token keys', () => {
    const signal = CARD_STYLES.find(s => s.id === 'signal')!;
    const required: (keyof SignalTokens)[] = [
      'bg', 'border', 'accent', 'quoteColor', 'text', 'divider', 'dateMuted',
    ];
    for (const v of signal.variants) {
      for (const key of required) {
        expect(v.tokens).toHaveProperty(key);
      }
    }
  });

  it('every variant has a dotGradient tuple of two strings', () => {
    for (const style of CARD_STYLES) {
      for (const v of style.variants) {
        expect(v.dotGradient).toHaveLength(2);
        expect(typeof v.dotGradient[0]).toBe('string');
        expect(typeof v.dotGradient[1]).toBe('string');
      }
    }
  });
});

import { resolveBand, resolveBandColor, footerMeta } from '../../src/share/card-content';
import type { CategoryStyle } from '../../src/theme/tokens';
import type { PromptCategory } from '../../src/types';

const styles: Record<PromptCategory, CategoryStyle> = {
  observational: { label: 'OBSERVE', kind: 'notice', color: '#06B6C9' },
  reflective: { label: 'REFLECT', kind: 'introspect', color: '#2E5BFF' },
  personal: { label: 'CONFESS', kind: 'off the record', color: '#8B3DF5' },
  creative: { label: 'IMAGINE', kind: 'what if', color: '#6C5CE7' },
  game: { label: 'RANK + DEFEND', kind: 'micro-game', color: '#15A150' },
};

describe('resolveBand', () => {
  it('prompted + category → TODAY\'S PROMPT with the prompt as setup line', () => {
    expect(resolveBand('prompted', 'reflective', 'Why?', 'KICK')).toEqual({
      kicker: "TODAY'S PROMPT",
      setupLine: 'Why?',
    });
  });

  it('prompted + null category → PROMPTED label with the prompt as setup line', () => {
    expect(resolveBand('prompted', null, 'Why?', 'KICK')).toEqual({
      kicker: 'PROMPTED',
      setupLine: 'Why?',
    });
  });

  it('freeform → freeform kicker and no setup line', () => {
    expect(resolveBand('freeform', 'reflective', 'ignored', 'KICK')).toEqual({
      kicker: 'KICK',
      setupLine: null,
    });
  });

  it('freeform + null category → freeform kicker and no setup line', () => {
    expect(resolveBand('freeform', null, '', 'KICK')).toEqual({
      kicker: 'KICK',
      setupLine: null,
    });
  });
});

describe('resolveBandColor', () => {
  it('uses the category hue when present', () => {
    expect(resolveBandColor('personal', styles)).toBe('#8B3DF5');
  });

  it('falls back to the REFLECT hue for null category (white-text-safe in both modes)', () => {
    expect(resolveBandColor(null, styles)).toBe('#2E5BFF');
  });
});

describe('footerMeta', () => {
  it('date only when location hidden', () => {
    expect(footerMeta('2026-07-10T10:00:00.000Z', 'Portland', true, false)).toBe('JUL 10');
  });

  it('date and location joined with a middot', () => {
    expect(footerMeta('2026-07-10T10:00:00.000Z', 'Portland', true, true)).toBe('JUL 10 · Portland');
  });

  it('location only when date hidden', () => {
    expect(footerMeta('2026-07-10T10:00:00.000Z', 'Portland', false, true)).toBe('Portland');
  });

  it('empty string when both hidden', () => {
    expect(footerMeta('2026-07-10T10:00:00.000Z', 'Portland', false, false)).toBe('');
  });

  it('omits date when createdAt is null and location when location is null', () => {
    expect(footerMeta(null, null, true, true)).toBe('');
  });
});

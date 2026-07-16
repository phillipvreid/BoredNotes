import { FREEFORM_KICKERS, SHARE_TAGLINES } from '../../src/theme/copy';

describe('share-card copy', () => {
  it('FREEFORM_KICKERS is a non-empty list of non-empty strings', () => {
    expect(FREEFORM_KICKERS.length).toBeGreaterThan(0);
    for (const line of FREEFORM_KICKERS) {
      expect(typeof line).toBe('string');
      expect(line.trim().length).toBeGreaterThan(0);
    }
  });

  it('SHARE_TAGLINES is a non-empty list of non-empty strings', () => {
    expect(SHARE_TAGLINES.length).toBeGreaterThan(0);
    for (const line of SHARE_TAGLINES) {
      expect(typeof line).toBe('string');
      expect(line.trim().length).toBeGreaterThan(0);
    }
  });
});

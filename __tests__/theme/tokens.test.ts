import {
  PAPERS, DEFAULT_PAPER_ID, lightPalette, darkPalette, makePalette,
  ACTION, INK, CATEGORY_STYLES, CAT_HUES,
} from '../../src/theme/tokens';

describe('tokens', () => {
  it('PAPERS contains DEFAULT_PAPER_ID', () => {
    expect(PAPERS.find(p => p.id === DEFAULT_PAPER_ID)).toBeDefined();
  });

  it('every paper has valid light and dark hex colours', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;
    for (const paper of PAPERS) {
      expect(paper.id).toBeTruthy();
      expect(paper.label).toBeTruthy();
      expect(paper.light).toMatch(hexPattern);
      expect(paper.dark).toMatch(hexPattern);
    }
  });

  it('offset shadows are opaque in both modes (sticker recipe)', () => {
    expect(lightPalette.shadowOpacity).toBe(1);
    expect(darkPalette.shadowOpacity).toBe(1);
    expect(lightPalette.shadowColor).toBe(INK);
    expect(darkPalette.shadowColor).toBe('#000000');
  });

  it('keylines are always visible: ink in light, light keyline in dark', () => {
    expect(lightPalette.border).toBe(INK);
    expect(darkPalette.border).toBe('#E8E2D2');
  });

  it('the action yellow is identical in both modes and carries near-black ink', () => {
    expect(lightPalette.action).toBe(ACTION);
    expect(darkPalette.action).toBe(ACTION);
    expect(lightPalette.actionInk).toBe(INK);
    expect(darkPalette.actionInk).toBe(INK);
  });

  it('no category hue reuses the reserved action yellow', () => {
    for (const hue of Object.values(CAT_HUES)) {
      expect(hue.toLowerCase()).not.toBe(ACTION.toLowerCase());
    }
  });

  it('every app prompt category maps to a design category', () => {
    for (const cat of ['observational', 'reflective', 'personal', 'creative'] as const) {
      expect(CATEGORY_STYLES[cat].label).toBeTruthy();
      expect(CATEGORY_STYLES[cat].color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('makePalette respects the chosen paper', () => {
    const mint = PAPERS.find(p => p.id === 'mint')!;
    expect(makePalette(mint, false).bg).toBe(mint.light);
    expect(makePalette(mint, true).bg).toBe(mint.dark);
  });
});

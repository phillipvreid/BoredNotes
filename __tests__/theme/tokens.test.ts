import {
  THEMES, DEFAULT_THEME_ID, LEGACY_PAPER_TO_THEME,
  lightPalette, darkPalette, makePalette, makeCategoryStyles,
  ACTION, INK, CATEGORY_STYLES, CAT_HUES,
} from '../../src/theme/tokens';

const HEX = /^#[0-9a-f]{6}$/i;

describe('tokens', () => {
  it('THEMES contains DEFAULT_THEME_ID and unique ids', () => {
    expect(THEMES.find(t => t.id === DEFAULT_THEME_ID)).toBeDefined();
    expect(new Set(THEMES.map(t => t.id)).size).toBe(THEMES.length);
  });

  it('every theme has valid hex colours throughout', () => {
    for (const theme of THEMES) {
      expect(theme.id).toBeTruthy();
      expect(theme.label).toBeTruthy();
      expect(theme.ink).toMatch(HEX);
      expect(theme.action).toMatch(HEX);
      expect(theme.paper.light).toMatch(HEX);
      expect(theme.paper.dark).toMatch(HEX);
      for (const hue of Object.values(theme.cats)) {
        expect(hue).toMatch(HEX);
      }
    }
  });

  it('classic theme preserves the original palette exactly', () => {
    const classic = THEMES.find(t => t.id === 'classic')!;
    expect(classic.ink).toBe(INK);
    expect(classic.action).toBe(ACTION);
    expect(classic.cats).toEqual(CAT_HUES);
    expect(lightPalette.bg).toBe('#FBFAF3');
    expect(lightPalette.border).toBe(INK);
    expect(lightPalette.textSecondary).toBe('#86847d');
    expect(darkPalette.bg).toBe('#1A1813');
    expect(darkPalette.border).toBe('#E8E2D2');
    expect(darkPalette.surface).toBe('#262320');
  });

  it('offset shadows are opaque in both modes for every theme (sticker recipe)', () => {
    for (const theme of THEMES) {
      const light = makePalette(theme, false);
      const dark = makePalette(theme, true);
      expect(light.shadowOpacity).toBe(1);
      expect(light.shadowColor).toBe(theme.ink);
      expect(dark.shadowOpacity).toBe(1);
      expect(dark.shadowColor).toBe('#000000');
    }
  });

  it('keylines are always visible: ink in light, light keyline in dark', () => {
    for (const theme of THEMES) {
      expect(makePalette(theme, false).border).toBe(theme.ink);
      expect(makePalette(theme, true).border).toBe(theme.dark.border);
    }
  });

  it('the action colour is identical in both modes and carries the theme ink', () => {
    for (const theme of THEMES) {
      const light = makePalette(theme, false);
      const dark = makePalette(theme, true);
      expect(light.action).toBe(theme.action);
      expect(dark.action).toBe(theme.action);
      expect(light.actionInk).toBe(theme.ink);
      expect(dark.actionInk).toBe(theme.ink);
    }
  });

  it('no category hue reuses its theme\'s reserved action colour', () => {
    for (const theme of THEMES) {
      for (const hue of Object.values(theme.cats)) {
        expect(hue.toLowerCase()).not.toBe(theme.action.toLowerCase());
      }
    }
  });

  it('every app prompt category maps to a design category in every theme', () => {
    for (const theme of THEMES) {
      const styles = makeCategoryStyles(theme.cats);
      for (const cat of ['observational', 'reflective', 'personal', 'creative', 'game'] as const) {
        expect(styles[cat].label).toBeTruthy();
        expect(styles[cat].color).toMatch(HEX);
      }
    }
  });

  it('CATEGORY_STYLES stays the classic mapping', () => {
    expect(CATEGORY_STYLES.reflective.color).toBe(CAT_HUES.reflect);
    expect(CATEGORY_STYLES.game.color).toBe(CAT_HUES.rank);
  });

  it('makePalette respects the chosen theme paper', () => {
    const grape = THEMES.find(t => t.id === 'grape-soda')!;
    expect(makePalette(grape, false).bg).toBe(grape.paper.light);
    expect(makePalette(grape, true).bg).toBe(grape.paper.dark);
  });

  it('every legacy paper id maps to a real theme', () => {
    for (const themeId of Object.values(LEGACY_PAPER_TO_THEME)) {
      expect(THEMES.find(t => t.id === themeId)).toBeDefined();
    }
  });
});

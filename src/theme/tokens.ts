// Borednotes "Arcade Sticker" design system.
// One idea everywhere: a near-black keyline + flat, un-blurred offset shadow on
// warm paper. Yellow is reserved — it only ever means "do the thing".
// Source of truth: claude.ai/design project → ui-kit/Borednotes Kit.dc.html.

import type { PromptCategory } from '../types';

export const INK = '#141414';
export const ACTION = '#FFD23E';

// Fonts (loaded in app/_layout.tsx via @expo-google-fonts).
// Bricolage 800 = display/numbers · Hanken = body/input · Space Mono 700 = labels/chips.
export const FONTS = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  body: 'HankenGrotesk_500Medium',
  bodyRegular: 'HankenGrotesk_400Regular',
  bodySemiBold: 'HankenGrotesk_600SemiBold',
  bodyBold: 'HankenGrotesk_700Bold',
  bodyExtraBold: 'HankenGrotesk_800ExtraBold',
  label: 'SpaceMono_700Bold',
  labelRegular: 'SpaceMono_400Regular',
} as const;

// Offset-shadow scale: 3px rows, 4px cards, 5px stickers.
// Press = translate(2,2) + halve the offset.
export const SHADOW_SM = 3;
export const SHADOW_CARD = 4;
export const SHADOW_STICKER = 5;

// Keyline widths.
export const KEYLINE = 2.5;
export const KEYLINE_HEAVY = 3;

// Hand-placed tilts — wonky, never random.
export const TILTS = [-1.5, 1.2, -1] as const;

// The eight category hues (all dark enough to carry white text).
// Every theme ships its own tint of this set; each category keeps its hue
// family (REFLECT is always a blue, GOSSIP always a red) so entries stay
// recognizable when the theme changes.
export interface CatHues {
  reflect: string;
  observe: string;
  confess: string;
  rank: string;
  take: string;
  nostalgia: string;
  gossip: string;
  imagine: string;
}

// Classic's hues — kept as a standalone export for theme-independent uses.
export const CAT_HUES: CatHues = {
  reflect: '#2E5BFF',
  observe: '#06B6C9',
  confess: '#8B3DF5',
  rank: '#15A150',
  take: '#FF7A1A',
  nostalgia: '#F5468C',
  gossip: '#FF4438',
  imagine: '#6C5CE7',
};

export interface CategoryStyle { label: string; kind: string; color: string }

// App prompt categories mapped onto the design system's category identities.
export function makeCategoryStyles(cats: CatHues): Record<PromptCategory, CategoryStyle> {
  return {
    observational: { label: 'OBSERVE', kind: 'notice', color: cats.observe },
    reflective: { label: 'REFLECT', kind: 'introspect', color: cats.reflect },
    personal: { label: 'CONFESS', kind: 'off the record', color: cats.confess },
    creative: { label: 'IMAGINE', kind: 'what if', color: cats.imagine },
    game: { label: 'RANK + DEFEND', kind: 'micro-game', color: cats.rank },
  };
}

// Classic's mapping — prefer `categoryStyles` from useTheme() in components.
export const CATEGORY_STYLES = makeCategoryStyles(CAT_HUES);

export const MASCOT = '#FF4438';
export const MASCOT_MOUTH = '#FF7A6E';
export const DEFEND_PAD = '#FFF6D6';
export const CHIP_SCRIM = 'rgba(0,0,0,.22)';
export const MEDALS = ['#EFBF04', '#C4C4C4', '#CE8946'] as const;

// Themes — the user-pickable palette, named like a concession stand menu.
// Each theme swaps paper, ink, action color, and its tint of the category
// hues; the sticker mechanics (keyline + flat offset shadow) never change.
// The reserved-color rule generalizes: a theme's action color only ever
// means "do the thing" and always carries that theme's dark ink.
export interface ThemeDef {
  id: string;
  label: string;
  ink: string;                                   // keyline + light-mode text
  action: string;
  paper: { light: string; dark: string };        // bg per mode
  lightText: { secondary: string; muted: string; when: string };
  dark: { surface: string; sheet: string; border: string; text: string; secondary: string };
  cats: CatHues;
}

export const THEMES: ThemeDef[] = [
  {
    id: 'classic',
    label: 'Classic',
    ink: INK,
    action: ACTION,
    paper: { light: '#FBFAF3', dark: '#1A1813' },
    lightText: { secondary: '#86847d', muted: '#9b988c', when: '#b6b3a6' },
    dark: { surface: '#262320', sheet: '#1F1D18', border: '#E8E2D2', text: '#F4EEDF', secondary: '#9C988A' },
    cats: CAT_HUES,
  },
  {
    id: 'blue-raspberry',
    label: 'Blue Raspberry',
    ink: '#142033',
    action: '#3FB2FF',
    paper: { light: '#EFF3F9', dark: '#0F151E' },
    lightText: { secondary: '#7C8698', muted: '#97A0B0', when: '#AEB6C4' },
    dark: { surface: '#1A2330', sheet: '#141C28', border: '#D7E2F0', text: '#E8EFF9', secondary: '#8A96A8' },
    cats: {
      reflect: '#2B4FD9', observe: '#0891B5', confess: '#7442E0', rank: '#0E8A62',
      take: '#E05A1F', nostalgia: '#D6408F', gossip: '#D93A47', imagine: '#5852D6',
    },
  },
  {
    id: 'sour-apple',
    label: 'Sour Apple',
    ink: '#143020',
    action: '#B5EC3A',
    paper: { light: '#ECF7E0', dark: '#121B10' },
    lightText: { secondary: '#7C9070', muted: '#97AB8B', when: '#AFC2A0' },
    dark: { surface: '#1D2A18', sheet: '#172113', border: '#D8ECC6', text: '#EAF4DE', secondary: '#8FA383' },
    cats: {
      reflect: '#2E6BD6', observe: '#0AA396', confess: '#8A4BD1', rank: '#269136',
      take: '#EE7C0F', nostalgia: '#E8517F', gossip: '#E3472B', imagine: '#6459CF',
    },
  },
  {
    id: 'grape-soda',
    label: 'Grape Soda',
    ink: '#241A38',
    action: '#B983FF',
    paper: { light: '#F3EEFA', dark: '#171224' },
    lightText: { secondary: '#877E97', muted: '#9F97AE', when: '#B8B0C6' },
    dark: { surface: '#241D33', sheet: '#1E182B', border: '#E4DCF2', text: '#EFEAF8', secondary: '#9A92AC' },
    cats: {
      reflect: '#4747EF', observe: '#0D93C4', confess: '#A32BE8', rank: '#10A375',
      take: '#FF5F3D', nostalgia: '#F03CA5', gossip: '#ED3355', imagine: '#7C4BF5',
    },
  },
  {
    id: 'bubblegum',
    label: 'Bubblegum',
    ink: '#33141F',
    action: '#FF8FC7',
    paper: { light: '#FBEAF2', dark: '#1F1119' },
    lightText: { secondary: '#987F8B', muted: '#AE95A2', when: '#C9B2BE' },
    dark: { surface: '#2E1A24', sheet: '#27151E', border: '#F2DCE7', text: '#F8ECF2', secondary: '#A88E9B' },
    cats: {
      reflect: '#3D5BE8', observe: '#0D9EBD', confess: '#A344D6', rank: '#12A96E',
      take: '#F76F28', nostalgia: '#E8348F', gossip: '#E93353', imagine: '#7161E8',
    },
  },
  {
    id: 'cherry-cola',
    label: 'Cherry Cola',
    ink: '#38160E',
    action: '#FF6A52',
    paper: { light: '#FCEBE4', dark: '#1D0F0B' },
    lightText: { secondary: '#9A8078', muted: '#B0958C', when: '#CBAFA6' },
    dark: { surface: '#2C1913', sheet: '#241310', border: '#F0DCD2', text: '#F7ECE4', secondary: '#A78F85' },
    cats: {
      reflect: '#3E51DE', observe: '#0E9FAE', confess: '#9D3BD1', rank: '#379328',
      take: '#F2700F', nostalgia: '#EE3D7F', gossip: '#C42033', imagine: '#7452DB',
    },
  },
];

export const DEFAULT_THEME_ID = 'classic';

// Pre-2.1 the picker stored a paper id under `theme_paper` — map old values
// onto the nearest theme so nobody's app changes color on update.
export const LEGACY_PAPER_TO_THEME: Record<string, string> = {
  cream: 'classic',
  white: 'classic',
  mint: 'sour-apple',
  bubblegum: 'bubblegum',
};

export type Palette = {
  bg: string;
  surface: string;
  sheet: string;
  border: string;          // the keyline color
  cardBorder: string;      // legacy alias for border
  textPrimary: string;     // ink
  textSecondary: string;   // soft ink
  textMuted: string;       // faint ink / placeholder
  when: string;            // timestamps
  shadowColor: string;     // flat offset shadow — always opaque
  shadowOpacity: number;
  action: string;
  actionInk: string;       // ink on the action yellow — always near-black
  badgeBg: string;
  badgeFg: string;
  bubbleBg: string;
  bubbleInk: string;
  archiveBg: string;
  archiveBorder: string;
  archiveShadow: number;
  archiveInk: string;
  starFg: string;
  overlay: string;
  handle: string;
  toastBg: string;
  toastInk: string;
  toastBorder: string;
};

function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function makePalette(theme: ThemeDef, isDark: boolean): Palette {
  if (!isDark) {
    return {
      bg: theme.paper.light,
      surface: '#FFFFFF',
      sheet: theme.paper.light,
      border: theme.ink,
      cardBorder: theme.ink,
      textPrimary: theme.ink,
      textSecondary: theme.lightText.secondary,
      textMuted: theme.lightText.muted,
      when: theme.lightText.when,
      shadowColor: theme.ink,
      shadowOpacity: 1,
      action: theme.action,
      actionInk: theme.ink,
      badgeBg: theme.ink,
      badgeFg: '#FFFFFF',
      bubbleBg: '#FFFFFF',
      bubbleInk: theme.ink,
      archiveBg: theme.ink,
      archiveBorder: 'transparent',
      archiveShadow: 0,
      archiveInk: '#FFFFFF',
      starFg: '#FFFFFF',
      overlay: rgba(theme.ink, 0.45),
      handle: rgba(theme.ink, 0.22),
      toastBg: theme.ink,
      toastInk: '#FFFFFF',
      toastBorder: theme.ink,
    };
  }
  return {
    bg: theme.paper.dark,
    surface: theme.dark.surface,
    sheet: theme.dark.sheet,
    border: theme.dark.border,
    cardBorder: theme.dark.border,
    textPrimary: theme.dark.text,
    textSecondary: theme.dark.secondary,
    textMuted: theme.lightText.muted,
    when: theme.lightText.secondary,
    shadowColor: '#000000',
    shadowOpacity: 1,
    action: theme.action,
    actionInk: theme.ink,
    badgeBg: theme.dark.text,
    badgeFg: theme.ink,
    bubbleBg: theme.dark.surface,
    bubbleInk: theme.dark.text,
    archiveBg: theme.dark.surface,
    archiveBorder: theme.dark.border,
    archiveShadow: SHADOW_CARD,
    archiveInk: theme.dark.text,
    starFg: theme.action,
    overlay: 'rgba(0,0,0,.6)',
    handle: rgba(theme.dark.border, 0.3),
    toastBg: theme.dark.surface,
    toastInk: theme.dark.text,
    toastBorder: theme.dark.border,
  };
}

const classicTheme = THEMES[0];
export const lightPalette = makePalette(classicTheme, false);
export const darkPalette = makePalette(classicTheme, true);

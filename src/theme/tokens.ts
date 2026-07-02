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
export const CAT_HUES = {
  reflect: '#2E5BFF',
  observe: '#06B6C9',
  confess: '#8B3DF5',
  rank: '#15A150',
  take: '#FF7A1A',
  nostalgia: '#F5468C',
  gossip: '#FF4438',
  imagine: '#6C5CE7',
} as const;

// App prompt categories mapped onto the design system's category identities.
export const CATEGORY_STYLES: Record<PromptCategory, { label: string; kind: string; color: string }> = {
  observational: { label: 'OBSERVE', kind: 'notice', color: CAT_HUES.observe },
  reflective: { label: 'REFLECT', kind: 'introspect', color: CAT_HUES.reflect },
  personal: { label: 'CONFESS', kind: 'off the record', color: CAT_HUES.confess },
  creative: { label: 'IMAGINE', kind: 'what if', color: CAT_HUES.imagine },
  game: { label: 'RANK + DEFEND', kind: 'micro-game', color: CAT_HUES.rank },
};

export const MASCOT = '#FF4438';
export const MASCOT_MOUTH = '#FF7A6E';
export const DEFEND_PAD = '#FFF6D6';
export const CHIP_SCRIM = 'rgba(0,0,0,.22)';
export const MEDALS = ['#EFBF04', '#C4C4C4', '#CE8946'] as const;

// Paper themes — the user-pickable surface (Cream is default).
export interface PaperSwatch {
  id: string;
  label: string;
  light: string;
  dark: string;
}

export const PAPERS: PaperSwatch[] = [
  { id: 'cream', label: 'Cream', light: '#FBFAF3', dark: '#1A1813' },
  { id: 'white', label: 'Paper White', light: '#FFFFFF', dark: '#141414' },
  { id: 'mint', label: 'Mint', light: '#EAF7EE', dark: '#10201A' },
  { id: 'bubblegum', label: 'Bubblegum', light: '#FCEAF2', dark: '#221620' },
];

export const DEFAULT_PAPER_ID = 'cream';

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

export function makePalette(paper: PaperSwatch, isDark: boolean): Palette {
  if (!isDark) {
    return {
      bg: paper.light,
      surface: '#FFFFFF',
      sheet: paper.light,
      border: INK,
      cardBorder: INK,
      textPrimary: INK,
      textSecondary: '#86847d',
      textMuted: '#9b988c',
      when: '#b6b3a6',
      shadowColor: INK,
      shadowOpacity: 1,
      action: ACTION,
      actionInk: INK,
      badgeBg: INK,
      badgeFg: '#FFFFFF',
      bubbleBg: '#FFFFFF',
      bubbleInk: INK,
      archiveBg: INK,
      archiveBorder: 'transparent',
      archiveShadow: 0,
      archiveInk: '#FFFFFF',
      starFg: '#FFFFFF',
      overlay: 'rgba(20,20,20,.45)',
      handle: 'rgba(20,20,20,.22)',
      toastBg: INK,
      toastInk: '#FFFFFF',
      toastBorder: INK,
    };
  }
  return {
    bg: paper.dark,
    surface: '#262320',
    sheet: '#1F1D18',
    border: '#E8E2D2',
    cardBorder: '#E8E2D2',
    textPrimary: '#F4EEDF',
    textSecondary: '#9C988A',
    textMuted: '#9b988c',
    when: '#86847d',
    shadowColor: '#000000',
    shadowOpacity: 1,
    action: ACTION,
    actionInk: INK,
    badgeBg: '#F4EEDF',
    badgeFg: INK,
    bubbleBg: '#262320',
    bubbleInk: '#F4EEDF',
    archiveBg: '#262320',
    archiveBorder: '#E8E2D2',
    archiveShadow: SHADOW_CARD,
    archiveInk: '#F4EEDF',
    starFg: ACTION,
    overlay: 'rgba(0,0,0,.6)',
    handle: 'rgba(232,226,210,.3)',
    toastBg: '#262320',
    toastInk: '#F4EEDF',
    toastBorder: '#E8E2D2',
  };
}

const creamPaper = PAPERS[0];
export const lightPalette = makePalette(creamPaper, false);
export const darkPalette = makePalette(creamPaper, true);

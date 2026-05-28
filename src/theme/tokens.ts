export interface AccentSwatch {
  id: string;
  label: string;
  labelColor: string;
  buttonColor: string;
}

export const ACCENTS: AccentSwatch[] = [
  { id: 'sage',       label: 'Sage',       labelColor: '#6a8f72', buttonColor: '#4a7a54' },
  { id: 'terracotta', label: 'Terracotta', labelColor: '#b5735a', buttonColor: '#9e5e47' },
  { id: 'indigo',     label: 'Indigo',     labelColor: '#6b6bbd', buttonColor: '#5252a8' },
  { id: 'mono',       label: 'Classic',    labelColor: '#666666', buttonColor: '#1a1a1a' },
];

export const DEFAULT_ACCENT_ID = 'sage';

export const lightPalette = {
  bg: '#fafaf9',
  surface: '#ffffff',
  border: '#e8e5e0',
  cardBorder: 'transparent' as const,
  textPrimary: '#1a1a1a',
  textSecondary: '#888888',
  textMuted: '#bbbbbb',
  shadowColor: '#000000',
  shadowOpacity: 0.07,
};

export const darkPalette = {
  bg: '#141412',
  surface: '#1f1f1c',
  border: '#2e2e2a',
  cardBorder: '#2e2e2a' as const,
  textPrimary: '#e8e5e0',
  textSecondary: '#888888',
  textMuted: '#555555',
  shadowColor: '#000000',
  shadowOpacity: 0,
};

export type Palette = typeof lightPalette;

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
  bg: '#fafaf9' as const,
  surface: '#ffffff' as const,
  border: '#e8e5e0' as const,
  cardBorder: 'transparent' as const,
  textPrimary: '#1a1a1a' as const,
  textSecondary: '#888888' as const,
  textMuted: '#bbbbbb' as const,
  shadowColor: '#000000' as const,
  shadowOpacity: 0.07,
} as const;

export const darkPalette = {
  bg: '#141412' as const,
  surface: '#1f1f1c' as const,
  border: '#2e2e2a' as const,
  cardBorder: '#2e2e2a' as const,
  textPrimary: '#e8e5e0' as const,
  textSecondary: '#888888' as const,
  textMuted: '#555555' as const,
  shadowColor: '#000000' as const,
  shadowOpacity: 0,
} as const;

export type Palette = {
  bg: string;
  surface: string;
  border: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  shadowColor: string;
  shadowOpacity: number;
};

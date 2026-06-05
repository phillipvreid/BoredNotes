export interface PassportTokens {
  bg: string; border: string; topbar: string;
  brand: string; stampDate: string; stampRing: string; stampLabel: string;
  divider: string; text: string; meta: string;
  mrzBg: string; mrzText: string; mrzBorder: string;
}
export interface PhotoTokens {
  bg: string; photoPlaceholder: string; text: string; muted: string;
}
export interface SignalTokens {
  bg: string; border: string; accent: string; quoteColor: string;
  text: string; divider: string; dateMuted: string;
}

export interface PassportVariant { id: string; label: string; tokens: PassportTokens; dotGradient: [string, string]; }
export interface PhotoVariant    { id: string; label: string; tokens: PhotoTokens;    dotGradient: [string, string]; }
export interface SignalVariant   { id: string; label: string; tokens: SignalTokens;   dotGradient: [string, string]; }

export interface PassportStyle { id: 'passport'; label: string; variants: PassportVariant[]; }
export interface PhotoStyle    { id: 'photo';    label: string; variants: PhotoVariant[];    }
export interface SignalStyle   { id: 'signal';   label: string; variants: SignalVariant[];   }
export type CardStyle = PassportStyle | PhotoStyle | SignalStyle;

export const CARD_STYLES: CardStyle[] = [
  {
    id: 'passport', label: 'Passport',
    variants: [
      {
        id: 'gold', label: 'Gold', dotGradient: ['#c9a96e', '#1b1f2e'],
        tokens: {
          bg: '#1b1f2e', border: '#2a3050', topbar: '#c9a96e',
          brand: '#c9a96e', stampDate: '#c9a96e',
          stampRing: 'rgba(201,169,110,0.3)', stampLabel: 'rgba(201,169,110,0.5)',
          divider: '#252b42', text: '#d8d8e8', meta: '#6070a0',
          mrzBg: '#12151f', mrzText: '#2a3050', mrzBorder: '#1e2238',
        },
      },
      {
        id: 'copper', label: 'Copper', dotGradient: ['#c08040', '#160f08'],
        tokens: {
          bg: '#160f08', border: '#2a1e10', topbar: '#b07030',
          brand: '#c08040', stampDate: '#c08040',
          stampRing: 'rgba(192,128,64,0.3)', stampLabel: 'rgba(192,128,64,0.5)',
          divider: '#221810', text: '#e8ddd0', meta: '#5a4020',
          mrzBg: '#0e0a04', mrzText: '#221810', mrzBorder: '#181008',
        },
      },
      {
        id: 'navy', label: 'Navy', dotGradient: ['#4a80d0', '#080e1c'],
        tokens: {
          bg: '#080e1c', border: '#101a30', topbar: '#2a60c0',
          brand: '#4a80d0', stampDate: '#4a80d0',
          stampRing: 'rgba(74,128,208,0.3)', stampLabel: 'rgba(74,128,208,0.5)',
          divider: '#101828', text: '#d0d8f0', meta: '#2a4070',
          mrzBg: '#040810', mrzText: '#101828', mrzBorder: '#0a1020',
        },
      },
    ],
  },
  {
    id: 'photo', label: 'Photo',
    variants: [
      {
        id: 'warm', label: 'Warm', dotGradient: ['#8a7060', '#f5f0e8'],
        tokens: { bg: '#f5f0e8', photoPlaceholder: '#d9c9b0', text: '#2a2018', muted: '#8a7060' },
      },
      {
        id: 'bw', label: 'B&W', dotGradient: ['#707070', '#f2f2f2'],
        tokens: { bg: '#f2f2f2', photoPlaceholder: '#c0c0c0', text: '#1a1a1a', muted: '#707070' },
      },
      {
        id: 'cool', label: 'Cool', dotGradient: ['#507090', '#eaf4f8'],
        tokens: { bg: '#eaf4f8', photoPlaceholder: '#b0d4e8', text: '#162030', muted: '#507090' },
      },
    ],
  },
  {
    id: 'signal', label: 'Signal',
    variants: [
      {
        id: 'purple', label: 'Purple', dotGradient: ['#7c3aed', '#0d0d0d'],
        tokens: { bg: '#0d0d0d', border: '#1a0a2a', accent: '#7c3aed', quoteColor: '#200840', text: '#e8e8f0', divider: '#1c1c24', dateMuted: '#3a3a4a' },
      },
      {
        id: 'ember', label: 'Ember', dotGradient: ['#d97706', '#0d0d0d'],
        tokens: { bg: '#0d0d0d', border: '#1e1000', accent: '#d97706', quoteColor: '#1e1000', text: '#f0ece4', divider: '#1c1810', dateMuted: '#3a3020' },
      },
      {
        id: 'teal', label: 'Teal', dotGradient: ['#0d9488', '#0d0d0d'],
        tokens: { bg: '#0d0d0d', border: '#001a18', accent: '#0d9488', quoteColor: '#001a18', text: '#e4f0ee', divider: '#101c1a', dateMuted: '#203830' },
      },
    ],
  },
];

export const DEFAULT_STYLE_ID = 'passport';
export const DEFAULT_VARIANT_ID = 'gold';

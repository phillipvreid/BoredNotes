export interface ShareTemplate {
  id: string;
  label: string;
  bg: string;
  textColor: string;
  promptColor: string;
  metaColor: string;
  fontFamily: 'serif' | 'sans-serif';
  accentColor?: string;
  accentStyle?: 'sidebar' | 'topbar' | 'none';
}

export const TEMPLATES: ShareTemplate[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    bg: '#ffffff',
    textColor: '#222222',
    promptColor: '#888888',
    metaColor: '#bbbbbb',
    fontFamily: 'serif',
    accentStyle: 'none',
  },
  {
    id: 'warm',
    label: 'Warm',
    bg: '#f5e6d3',
    textColor: '#4a3728',
    promptColor: '#8a6a50',
    metaColor: '#b8956e',
    fontFamily: 'serif',
    accentColor: '#c9a96e',
    accentStyle: 'sidebar',
  },
  {
    id: 'dark',
    label: 'Dark',
    bg: '#0f0f1a',
    textColor: '#dddddd',
    promptColor: '#6060a0',
    metaColor: '#3a3a6a',
    fontFamily: 'sans-serif',
    accentColor: '#4040a0',
    accentStyle: 'sidebar',
  },
  {
    id: 'bold',
    label: 'Bold',
    bg: '#1a1a1a',
    textColor: '#ffffff',
    promptColor: '#666666',
    metaColor: '#555555',
    fontFamily: 'sans-serif',
    accentStyle: 'topbar',
    accentColor: '#f59e0b',
  },
];

export const DEFAULT_TEMPLATE_ID = 'minimal';

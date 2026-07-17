export type PromptCategory = 'observational' | 'reflective' | 'personal' | 'creative' | 'game';
export type PromptSource = 'library' | 'custom';

// Micro-game plumbing: a prompt's kind selects the reply UI, its game_config
// (JSON) parameterizes it; the entry stores structured game_data (JSON) plus a
// plain-text rendering in response_text so search/export/share keep working.
export type PromptKind = 'text' | 'rank' | 'loveHate';
export type EntryKind = 'text' | 'rank' | 'loveHate';

export interface RankGameConfig {
  slots: string[];   // placeholder text per rank slot, best first
}

export interface RankGameData {
  items: string[];   // what the user ranked, best first
  defense: string;   // the defense of #1
}

export interface LoveHateGameConfig {
  themes: string[];  // theme pool; one is dealt at random when the game opens
}

export interface LoveHateGameData {
  theme: string;     // the dealt theme
  love: string;
  hate: string;
}

export interface Entry {
  id: number;
  prompt_text: string;
  response_text: string;
  entry_kind: EntryKind;
  game_data: string | null;
  created_at: string;
  location_label: string | null;
  location_lat: number | null;
  location_lng: number | null;
  entry_mode: 'prompted' | 'freeform';
  place_id: number | null;
  category: PromptCategory | null;
}

export interface PinnedEntry extends Entry {
  location_lat: number;
  location_lng: number;
}

export interface Place {
  id: number;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  created_at: string;
}

export interface Prompt {
  id: number;
  text: string;
  kind: PromptKind;
  game_config: string | null;
  category: PromptCategory;
  depth: 1 | 2 | 3;
  source: PromptSource;
  last_used_at: string | null;
}

export interface CurrentPrompt {
  text: string;
  category: PromptCategory;
  source: 'ai' | 'library';
  kind?: PromptKind;             // absent = 'text'
  game_config?: string | null;
}

export interface PromptModifiers {
  time: boolean;
  place: boolean;
  weather: boolean;
  memory: boolean;
}

export const DEFAULT_MODIFIERS: PromptModifiers = {
  time: true,
  place: true,
  weather: true,
  memory: true,
};

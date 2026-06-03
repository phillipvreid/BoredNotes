export type PromptCategory = 'observational' | 'reflective' | 'personal' | 'creative';
export type PromptSource = 'library' | 'custom';
export type MediaType = 'photo' | 'voice';

export interface Entry {
  id: number;
  prompt_text: string;
  response_text: string;
  created_at: string;
  location_label: string | null;
  location_lat: number | null;
  location_lng: number | null;
  entry_mode: 'prompted' | 'freeform';
  place_id: number | null;
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

export interface MediaItem {
  id: number;
  entry_id: number;
  type: MediaType;
  file_path: string;
  created_at: string;
}

export interface Prompt {
  id: number;
  text: string;
  category: PromptCategory;
  depth: 1 | 2 | 3;
  source: PromptSource;
  last_used_at: string | null;
}

export interface CurrentPrompt {
  text: string;
  category: PromptCategory;
  source: 'ai' | 'library';
}

export interface EntryWithMedia extends Entry {
  media: MediaItem[];
}

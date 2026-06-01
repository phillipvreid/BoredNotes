export type PromptCategory = 'observational' | 'reflective' | 'personal' | 'creative';
export type PromptSource = 'library' | 'custom';
export type MediaType = 'photo' | 'voice';

export interface Entry {
  id: number;
  prompt_text: string;
  response_text: string;
  created_at: string; // ISO 8601
  location_label: string | null;
  location_lat: number | null;
  location_lng: number | null;
  entry_mode: 'prompted' | 'freeform';
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

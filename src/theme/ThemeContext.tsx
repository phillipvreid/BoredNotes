import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getSetting, setSetting } from '../db/settings';
import {
  THEMES, DEFAULT_THEME_ID, LEGACY_PAPER_TO_THEME, makePalette, makeCategoryStyles,
  type ThemeDef, type Palette, type CatHues, type CategoryStyle,
} from './tokens';
import { resolveIsDark, resolveInitialMode, type AppearanceMode } from './appearance';
import type { PromptCategory } from '../types';

interface ThemeContextValue {
  colors: Palette;
  theme: ThemeDef;
  catHues: CatHues;
  categoryStyles: Record<PromptCategory, CategoryStyle>;
  isDark: boolean;
  appearanceMode: AppearanceMode;
  wonky: boolean;
  setTheme: (id: string) => void;
  setAppearance: (mode: AppearanceMode) => void;
  setWonky: (on: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  db: SQLiteDatabase;
  children: React.ReactNode;
}

export function ThemeProvider({ db, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>('system');
  const [wonky, setWonkyState] = useState(true);

  useEffect(() => {
    (async () => {
      const storedTheme = await getSetting(db, 'theme_id');
      const legacyPaper = storedTheme ? null : await getSetting(db, 'theme_paper');
      const storedAppearance = await getSetting(db, 'appearance_mode');
      const legacyDark = storedAppearance ? null : await getSetting(db, 'theme_dark_mode');
      const storedWonky = await getSetting(db, 'wonky_tilt');
      if (storedTheme) setThemeId(storedTheme);
      else if (legacyPaper && LEGACY_PAPER_TO_THEME[legacyPaper]) {
        setThemeId(LEGACY_PAPER_TO_THEME[legacyPaper]);
      }
      setAppearanceMode(resolveInitialMode(storedAppearance, legacyDark));
      if (storedWonky !== null) setWonkyState(storedWonky === 'true');
    })();
  }, []);

  function setTheme(id: string) {
    setThemeId(id);
    setSetting(db, 'theme_id', id);
  }

  function setAppearance(mode: AppearanceMode) {
    setAppearanceMode(mode);
    setSetting(db, 'appearance_mode', mode);
  }

  function setWonky(on: boolean) {
    setWonkyState(on);
    setSetting(db, 'wonky_tilt', String(on));
  }

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
  const isDark = resolveIsDark(appearanceMode, systemScheme);
  const colors = makePalette(theme, isDark);
  const categoryStyles = makeCategoryStyles(theme.cats);

  return (
    <ThemeContext.Provider value={{ colors, theme, catHues: theme.cats, categoryStyles, isDark, appearanceMode, wonky, setTheme, setAppearance, setWonky }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

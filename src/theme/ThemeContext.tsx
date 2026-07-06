import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getSetting, setSetting } from '../db/settings';
import {
  THEMES, DEFAULT_THEME_ID, LEGACY_PAPER_TO_THEME, makePalette, makeCategoryStyles,
  type ThemeDef, type Palette, type CatHues, type CategoryStyle,
} from './tokens';
import type { PromptCategory } from '../types';

interface ThemeContextValue {
  colors: Palette;
  theme: ThemeDef;
  catHues: CatHues;
  categoryStyles: Record<PromptCategory, CategoryStyle>;
  isDark: boolean;
  setTheme: (id: string) => void;
  setDarkMode: (on: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  db: SQLiteDatabase;
  children: React.ReactNode;
}

export function ThemeProvider({ db, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    (async () => {
      const storedTheme = await getSetting(db, 'theme_id');
      const legacyPaper = storedTheme ? null : await getSetting(db, 'theme_paper');
      const storedDark = await getSetting(db, 'theme_dark_mode');
      if (storedTheme) setThemeId(storedTheme);
      else if (legacyPaper && LEGACY_PAPER_TO_THEME[legacyPaper]) {
        setThemeId(LEGACY_PAPER_TO_THEME[legacyPaper]);
      }
      if (storedDark !== null) setIsDark(storedDark === 'true');
    })();
  }, []);

  function setTheme(id: string) {
    setThemeId(id);
    setSetting(db, 'theme_id', id);
  }

  function setDarkMode(on: boolean) {
    setIsDark(on);
    setSetting(db, 'theme_dark_mode', String(on));
  }

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
  const colors = makePalette(theme, isDark);
  const categoryStyles = makeCategoryStyles(theme.cats);

  return (
    <ThemeContext.Provider value={{ colors, theme, catHues: theme.cats, categoryStyles, isDark, setTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

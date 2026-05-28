import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getSetting, setSetting } from '../db/settings';
import {
  ACCENTS, DEFAULT_ACCENT_ID, lightPalette, darkPalette,
  type AccentSwatch, type Palette,
} from './tokens';

interface ThemeContextValue {
  colors: Palette;
  accent: AccentSwatch;
  isDark: boolean;
  setAccent: (id: string) => void;
  setDarkMode: (on: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  db: SQLiteDatabase;
  children: React.ReactNode;
}

export function ThemeProvider({ db, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [accentId, setAccentId] = useState(DEFAULT_ACCENT_ID);
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    (async () => {
      const storedAccent = await getSetting(db, 'theme_accent');
      const storedDark = await getSetting(db, 'theme_dark_mode');
      if (storedAccent) setAccentId(storedAccent);
      if (storedDark !== null) setIsDark(storedDark === 'true');
    })();
  }, []);

  function setAccent(id: string) {
    setAccentId(id);
    setSetting(db, 'theme_accent', id);
  }

  function setDarkMode(on: boolean) {
    setIsDark(on);
    setSetting(db, 'theme_dark_mode', String(on));
  }

  const accent = ACCENTS.find(a => a.id === accentId) ?? ACCENTS[0];
  const colors = isDark ? darkPalette : lightPalette;

  return (
    <ThemeContext.Provider value={{ colors, accent, isDark, setAccent, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

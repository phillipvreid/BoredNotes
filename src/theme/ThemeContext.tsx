import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getSetting, setSetting } from '../db/settings';
import {
  PAPERS, DEFAULT_PAPER_ID, makePalette,
  type PaperSwatch, type Palette,
} from './tokens';

interface ThemeContextValue {
  colors: Palette;
  paper: PaperSwatch;
  isDark: boolean;
  setPaper: (id: string) => void;
  setDarkMode: (on: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  db: SQLiteDatabase;
  children: React.ReactNode;
}

export function ThemeProvider({ db, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [paperId, setPaperId] = useState(DEFAULT_PAPER_ID);
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    (async () => {
      const storedPaper = await getSetting(db, 'theme_paper');
      const storedDark = await getSetting(db, 'theme_dark_mode');
      if (storedPaper) setPaperId(storedPaper);
      if (storedDark !== null) setIsDark(storedDark === 'true');
    })();
  }, []);

  function setPaper(id: string) {
    setPaperId(id);
    setSetting(db, 'theme_paper', id);
  }

  function setDarkMode(on: boolean) {
    setIsDark(on);
    setSetting(db, 'theme_dark_mode', String(on));
  }

  const paper = PAPERS.find(p => p.id === paperId) ?? PAPERS[0];
  const colors = makePalette(paper, isDark);

  return (
    <ThemeContext.Provider value={{ colors, paper, isDark, setPaper, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

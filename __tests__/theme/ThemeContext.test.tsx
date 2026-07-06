import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../../src/theme/ThemeContext';
import { openDatabaseAsync } from 'expo-sqlite';
import { DEFAULT_THEME_ID, THEMES } from '../../src/theme/tokens';

describe('ThemeContext', () => {
  let db: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
    db.getFirstAsync.mockResolvedValue(null);
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return <ThemeProvider db={db}>{children}</ThemeProvider>;
  }

  it('defaults to classic when no stored value', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe(DEFAULT_THEME_ID);
  });

  it('loads stored theme from DB on mount', async () => {
    db.getFirstAsync
      .mockResolvedValueOnce({ value: 'grape-soda' })  // theme_id
      .mockResolvedValueOnce(null);                    // theme_dark_mode
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe('grape-soda');
  });

  it('migrates a legacy paper setting to its nearest theme', async () => {
    db.getFirstAsync
      .mockResolvedValueOnce(null)                     // theme_id absent
      .mockResolvedValueOnce({ value: 'mint' })        // legacy theme_paper
      .mockResolvedValueOnce(null);                    // theme_dark_mode
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe('sour-apple');
  });

  it('stored theme_id wins over any legacy paper setting', async () => {
    db.getFirstAsync
      .mockResolvedValueOnce({ value: 'cherry-cola' }) // theme_id
      .mockResolvedValueOnce(null);                    // theme_dark_mode
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe('cherry-cola');
    // legacy key never read when theme_id exists: theme_id + dark mode only
    expect(db.getFirstAsync).toHaveBeenCalledTimes(2);
  });

  it('ignores an unknown legacy paper value', async () => {
    db.getFirstAsync
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ value: 'parchment' })
      .mockResolvedValueOnce(null);
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe(DEFAULT_THEME_ID);
  });

  it('setTheme updates theme synchronously', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setTheme('bubblegum'); });
    expect(result.current.theme.id).toBe('bubblegum');
  });

  it('setTheme persists to DB under theme_id', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    await act(async () => { result.current.setTheme('bubblegum'); });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO settings'),
      ['theme_id', 'bubblegum']
    );
  });

  it('categoryStyles and catHues follow the active theme', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    const grape = THEMES.find(t => t.id === 'grape-soda')!;
    act(() => { result.current.setTheme('grape-soda'); });
    expect(result.current.catHues).toEqual(grape.cats);
    expect(result.current.categoryStyles.reflective.color).toBe(grape.cats.reflect);
    expect(result.current.colors.action).toBe(grape.action);
  });

  it('setDarkMode updates isDark synchronously', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setDarkMode(true); });
    expect(result.current.isDark).toBe(true);
  });

  it('setDarkMode persists to DB', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    await act(async () => { result.current.setDarkMode(true); });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO settings'),
      ['theme_dark_mode', 'true']
    );
  });

  it('colors update when dark mode toggles', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    const lightBg = result.current.colors.bg;
    act(() => { result.current.setDarkMode(true); });
    expect(result.current.colors.bg).not.toBe(lightBg);
  });

  it('throws when useTheme is called outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within ThemeProvider'
    );
  });
});

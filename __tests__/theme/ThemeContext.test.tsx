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
  });

  // Keyed mock: getSetting reads `SELECT value ... WHERE key = ?` with [key].
  function mockSettings(store: Record<string, string> = {}) {
    db.getFirstAsync.mockImplementation((_sql: string, params: any[]) => {
      const key = params?.[0];
      return Promise.resolve(key in store ? { value: store[key] } : null);
    });
  }

  function wrapper({ children }: { children: React.ReactNode }) {
    return <ThemeProvider db={db}>{children}</ThemeProvider>;
  }

  it('defaults to classic when no stored value', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe(DEFAULT_THEME_ID);
  });

  it('loads stored theme from DB on mount', async () => {
    mockSettings({ theme_id: 'grape-soda' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe('grape-soda');
  });

  it('migrates a legacy paper setting to its nearest theme', async () => {
    mockSettings({ theme_paper: 'mint' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe('sour-apple');
  });

  it('stored theme_id wins over any legacy paper setting', async () => {
    mockSettings({ theme_id: 'cherry-cola', theme_paper: 'mint' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe('cherry-cola');
  });

  it('ignores an unknown legacy paper value', async () => {
    mockSettings({ theme_paper: 'parchment' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.theme.id).toBe(DEFAULT_THEME_ID);
  });

  it('setTheme updates theme synchronously', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setTheme('bubblegum'); });
    expect(result.current.theme.id).toBe('bubblegum');
  });

  it('setTheme persists to DB under theme_id', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    await act(async () => { result.current.setTheme('bubblegum'); });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO settings'),
      ['theme_id', 'bubblegum']
    );
  });

  it('categoryStyles and catHues follow the active theme', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    const grape = THEMES.find(t => t.id === 'grape-soda')!;
    act(() => { result.current.setTheme('grape-soda'); });
    expect(result.current.catHues).toEqual(grape.cats);
    expect(result.current.categoryStyles.reflective.color).toBe(grape.cats.reflect);
    expect(result.current.colors.action).toBe(grape.action);
  });

  // --- Appearance mode ---

  it('appearanceMode defaults to system when nothing stored', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.appearanceMode).toBe('system');
  });

  it('loads a stored appearance_mode', async () => {
    mockSettings({ appearance_mode: 'dark' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.appearanceMode).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('migrates a legacy dark flag when no appearance_mode is stored', async () => {
    mockSettings({ theme_dark_mode: 'true' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.appearanceMode).toBe('dark');
  });

  it('stored appearance_mode wins over a legacy dark flag', async () => {
    mockSettings({ appearance_mode: 'light', theme_dark_mode: 'true' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.appearanceMode).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('setAppearance updates mode and isDark synchronously', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setAppearance('dark'); });
    expect(result.current.appearanceMode).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('setAppearance persists to DB under appearance_mode', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    await act(async () => { result.current.setAppearance('dark'); });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO settings'),
      ['appearance_mode', 'dark']
    );
  });

  it('colors change when appearance flips to dark', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    const lightBg = result.current.colors.bg;
    act(() => { result.current.setAppearance('dark'); });
    expect(result.current.colors.bg).not.toBe(lightBg);
  });

  // --- Wonky ---

  it('wonky defaults to true when nothing stored', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.wonky).toBe(true);
  });

  it('loads a stored wonky_tilt of false', async () => {
    mockSettings({ wonky_tilt: 'false' });
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.wonky).toBe(false);
  });

  it('setWonky updates synchronously and persists', async () => {
    mockSettings({});
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    await act(async () => { result.current.setWonky(false); });
    expect(result.current.wonky).toBe(false);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO settings'),
      ['wonky_tilt', 'false']
    );
  });

  it('throws when useTheme is called outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within ThemeProvider'
    );
  });
});

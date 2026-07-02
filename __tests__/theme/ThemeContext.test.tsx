import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../../src/theme/ThemeContext';
import { openDatabaseAsync } from 'expo-sqlite';
import { DEFAULT_PAPER_ID } from '../../src/theme/tokens';

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

  it('defaults to cream paper when no stored value', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.paper.id).toBe(DEFAULT_PAPER_ID);
  });

  it('loads stored paper from DB on mount', async () => {
    db.getFirstAsync
      .mockResolvedValueOnce({ value: 'mint' })
      .mockResolvedValueOnce(null);
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.paper.id).toBe('mint');
  });

  it('setPaper updates paper synchronously', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setPaper('bubblegum'); });
    expect(result.current.paper.id).toBe('bubblegum');
  });

  it('setPaper persists to DB', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    await act(async () => { result.current.setPaper('bubblegum'); });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO settings'),
      ['theme_paper', 'bubblegum']
    );
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

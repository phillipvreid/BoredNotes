import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../../src/theme/ThemeContext';
import { openDatabaseAsync } from 'expo-sqlite';
import { DEFAULT_ACCENT_ID } from '../../src/theme/tokens';

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

  it('defaults to sage accent when no stored value', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.accent.id).toBe(DEFAULT_ACCENT_ID);
  });

  it('loads stored accent from DB on mount', async () => {
    db.getFirstAsync
      .mockResolvedValueOnce({ value: 'terracotta' })
      .mockResolvedValueOnce(null);
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    expect(result.current.accent.id).toBe('terracotta');
  });

  it('setAccent updates accent synchronously', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setAccent('indigo'); });
    expect(result.current.accent.id).toBe('indigo');
  });

  it('setAccent persists to DB', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    await act(async () => { result.current.setAccent('indigo'); });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO settings'),
      ['theme_accent', 'indigo']
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

  it('throws when useTheme is called outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within ThemeProvider'
    );
  });
});

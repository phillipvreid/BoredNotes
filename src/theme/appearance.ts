export type AppearanceMode = 'light' | 'dark' | 'system';

// isDark is derived, never stored: system tracks the live OS scheme,
// light/dark are explicit overrides.
export function resolveIsDark(
  mode: AppearanceMode,
  systemScheme: 'light' | 'dark' | null | undefined,
): boolean {
  if (mode === 'system') return systemScheme === 'dark';
  return mode === 'dark';
}

// Picks the mode to start with on mount. A stored appearance_mode wins;
// otherwise a legacy theme_dark_mode boolean is migrated; otherwise system.
export function resolveInitialMode(
  storedAppearance: string | null,
  legacyDark: string | null,
): AppearanceMode {
  if (storedAppearance === 'light' || storedAppearance === 'dark' || storedAppearance === 'system') {
    return storedAppearance;
  }
  if (legacyDark === 'true') return 'dark';
  if (legacyDark === 'false') return 'light';
  return 'system';
}

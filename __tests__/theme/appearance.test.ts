import { resolveIsDark, resolveInitialMode } from '../../src/theme/appearance';

describe('resolveIsDark', () => {
  it('system mode follows a dark system scheme', () => {
    expect(resolveIsDark('system', 'dark')).toBe(true);
  });
  it('system mode follows a light system scheme', () => {
    expect(resolveIsDark('system', 'light')).toBe(false);
  });
  it('system mode treats a null scheme as light', () => {
    expect(resolveIsDark('system', null)).toBe(false);
    expect(resolveIsDark('system', undefined)).toBe(false);
  });
  it('dark mode is always dark regardless of system', () => {
    expect(resolveIsDark('dark', 'light')).toBe(true);
    expect(resolveIsDark('dark', null)).toBe(true);
  });
  it('light mode is always light regardless of system', () => {
    expect(resolveIsDark('light', 'dark')).toBe(false);
    expect(resolveIsDark('light', null)).toBe(false);
  });
});

describe('resolveInitialMode', () => {
  it('uses a stored appearance value when valid', () => {
    expect(resolveInitialMode('dark', null)).toBe('dark');
    expect(resolveInitialMode('light', null)).toBe('light');
    expect(resolveInitialMode('system', null)).toBe('system');
  });
  it('stored appearance wins over a legacy dark flag', () => {
    expect(resolveInitialMode('light', 'true')).toBe('light');
  });
  it('migrates a legacy dark flag when no appearance is stored', () => {
    expect(resolveInitialMode(null, 'true')).toBe('dark');
    expect(resolveInitialMode(null, 'false')).toBe('light');
  });
  it('defaults to system when nothing is stored', () => {
    expect(resolveInitialMode(null, null)).toBe('system');
  });
  it('falls back to system for an unknown stored appearance value', () => {
    expect(resolveInitialMode('parchment', null)).toBe('system');
  });
});

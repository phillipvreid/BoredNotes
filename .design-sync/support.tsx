// design-sync preview support — bundled into the design-system export only,
// never imported by the app. Provides the ThemeProvider wrapper (and a no-op
// SQLite stand-in) so components can render in a browser preview.
export { ThemeProvider } from '../src/theme/ThemeContext';
export { ToastProvider } from '../src/components/ui/Toast';

// Satisfies the two calls ThemeProvider makes (getSetting/setSetting):
// getFirstAsync -> null keeps the default "classic" theme; runAsync is a no-op.
export const fakeDb = {
  getFirstAsync: async () => null,
  runAsync: async () => {},
} as never;

// react-native-web injects <style id="react-native-stylesheet"> into <head>
// with no text content (rules go in via CSSOM insertRule). Tooling that scans
// for render roots by id prefix ("r…") mistakes that empty node for an empty
// mount. Rename it — RNW keeps a direct reference and never re-queries by id.
if (typeof document !== 'undefined') {
  const rename = () => {
    const el = document.getElementById('react-native-stylesheet');
    if (el) el.id = 'native-web-stylesheet';
  };
  rename();
  document.addEventListener('DOMContentLoaded', rename);
}

# design-sync notes — BoredNotes

- This is an Expo React Native APP, not a web package: no dist, `main` is
  `expo-router/entry`. The bundle builds from `.design-sync/entry.tsx`
  (pass `--entry .design-sync/entry.tsx` to every build/driver run).
- `react-native` is aliased to react-native-web via
  `tsconfig.design-sync.json` `paths`. The target must be the FILE
  `node_modules/react-native-web/dist/index.js` — a directory target makes
  esbuild try to read a directory. `react-native-web` + `react-dom` are
  app dependencies installed with `npx expo install` (inert on iOS).
- `ThemeProvider` requires a `db` prop (SQLite). `.design-sync/support.tsx`
  (wired via `extraEntries`) exports it plus a `fakeDb` whose
  `getFirstAsync → null` keeps the default classic theme.
- Components are enumerated in `componentSrcMap` AND re-exported from
  `entry.tsx` — adding a new component means touching BOTH. Toast's exported
  component is `ToastProvider` (there is no `Toast` export).
- Fonts: expo-google-fonts ttfs copied into `.design-sync/fonts/` with
  `fonts.css` `@font-face` rules whose family names equal the expo runtime
  names (`BricolageGrotesque_800ExtraBold` …). If `FONTS` in
  `src/theme/tokens.ts` gains a family, copy its ttf and add a rule.
- Groups come from `.design-sync/docs-stubs/*.md` frontmatter via `docsMap`.
- Preview authoring gotchas:
  - RNW views stretch to full cell width in block containers — wrap preview
    exports in `display:flex` row wrappers so components hug content.
  - ToastProvider preview: the toast's spring entrance races the capture
    screenshot; the preview pins the wrap at opacity 1 via `.toast-host` CSS
    and re-shows the toast every 900ms (< the 1250ms auto-hide).
- Known render warns: none — all 8 components have authored previews.
- Benign console noise on preview pages: RNW "shadow* style props are
  deprecated" (StyleSheet-created shadowOffset can flatten to `0 0 0` —
  the toast card loses its drop shadow, cosmetic only), `useNativeDriver`
  fallback warning, and a `global is not defined` pageerror that doesn't
  affect rendering.

## Re-sync risks

- `fakeDb` in `support.tsx` mirrors the `getSetting`/`setSetting` call
  surface (`getFirstAsync`/`runAsync`) — if `src/db/settings.ts` grows new
  calls used by ThemeProvider, the stub needs them too.
- `entry.tsx` + `componentSrcMap` + `docs-stubs/` are manual enumerations;
  a new component in `src/components/ui/` won't appear until all are updated.
- `fonts.css` family list is hand-maintained against `FONTS` in tokens.ts.
- `conventions.md` names token exports (`FONTS`, `CAT_HUES`, `THEMES`,
  `ACTION`, `SHADOW_*`, `KEYLINE*`, `TILTS`, `MEDALS`, `DEFEND_PAD`,
  `CHIP_SCRIM`) — re-validate against the bundle if tokens.ts is refactored.
- Build assumed node 26 / esbuild staged in `.ds-sync/`; playwright chromium
  cache lives at ~/Library/Caches/ms-playwright (headless shell v1228).

# BoredNotes — Claude Instructions

## Working Style

When asked for a simple list, doc, or quick fix, do exactly that — do NOT auto-invoke the brainstorming skill or generate token-heavy visual mockups unless explicitly requested.

## What this app is

BoredNotes is a private, local-first iOS micro-journaling/reflection app designed as a healthier alternative to passive scrolling.

Users respond to prompts or write freeform notes. Entries can include text, location context, and media. The app is meant to feel fun and punchy, using a dry and sarcastic (but never rude) sense of humor throughout. 

## Product principles

- iOS-first for v1.
- Local-first storage.
- No social feed.
- No followers.
- No analytics for v1.
- Privacy and user trust matter more than growth mechanics.
- Offline mode must disable AI prompt generation and any data transfer.
- Do not send full private notes to AI services unless explicitly requested by the user.
- Personality!

## Tech stack

- Expo / React Native
- TypeScript
- Expo Router
- SQLite via `expo-sqlite`
- Local Xcode builds (`npx expo run:ios`) + EAS Build for distribution
- Jest / jest-expo

## Important directories

- `app/` — Expo Router screens/routes.
- `src/db/` — SQLite schema and data access.
- `src/prompts/` — prompt selection and contextual prompt logic.
- `src/share/` — share card rendering/templates.
- `src/export/` — export helpers.
- `src/boredbefore/` — browsing/reflection features.
- `__tests__/` — Jest tests.
- `docs/superpowers/` — existing specs and implementation plans.

## Common commands

Run tests:

```bash
npm test -- --runInBand
```

Run TypeScript check:

```bash
npx tsc --noEmit
```

Validate Expo config:

```bash
npx expo config --type introspect
```

Start Expo:

```bash
npm run start
```

## Environment: Expo / React Native (iOS)

- This is an Expo React Native project; native modules (react-native-maps, expo-location, expo-sqlite, media pickers) do NOT work in Expo Go, so they must be tested in a real native build.
- Primary dev machine is a MacBook Air with Xcode installed, and the developer has a paid Apple Developer account. Local native builds are the default testing path.
- Local build/run loop (run in a separate terminal, NOT in-session — long-running):
  - Simulator: `npx expo run:ios` (no signing needed; use for most UI/logic checks). Covers maps, SQLite, location tagging, share cards, export.
  - Physical device / debugging: open `ios/BoredNotes.xcworkspace` in Xcode, or `npx expo run:ios --device`.
- Simulator limitations that require a physical device: real camera capture, haptics, true GPS movement. The simulator can simulate a static location and use the photo library.
- EAS Build (`eas build --profile development --platform ios`) is still available for clean/distribution builds and TestFlight; no longer the only option for seeing the app run. Run any EAS or `eas device:create` commands in a separate terminal, not in-session.
- Run `npx expo install --check` before any local or cloud build to catch peer-dep/SDK mismatches early.
- The assistant's own session runs in a Linux sandbox without Xcode, so it cannot build or run the iOS app; it writes/edits code and runs Jest, and the developer runs the native build on the Mac.

## Git Workflow

- After committing, always verify the push actually succeeded — commits have silently failed to push before (e.g. compare local HEAD to `@{u}`).
- Direct pushes from the session generally work; if one is blocked by the auto-mode classifier, surface the git commands for the user to run manually rather than retrying.

## Dependencies

- Before building, check for peer-dependency / SDK version mismatches (reanimated, react-native versions) proactively, since these have caused repeated fix-restart cycles.
- Use `npx expo install` (not `npm install`) for adding packages.
- Run `npx expo install --check` before builds to catch mismatches early.

## Development rules

- Keep changes small and focused.
- Prefer tests for behavior changes.
- Do not introduce analytics unless explicitly requested.
- Do not perform major Expo/React Native upgrades inside unrelated feature branches.
- Keep implementation and tests consistent when Expo APIs change.
- Preserve strict TypeScript.

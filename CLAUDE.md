# BoredNotes — Claude Instructions

## Working Style

When asked for a simple list, doc, or quick fix, do exactly that — do NOT auto-invoke the brainstorming skill or generate token-heavy visual mockups unless explicitly requested.

## What this app is

BoredNotes is a private, local-first iOS journaling/reflection app designed as a healthier alternative to passive scrolling.

Users respond to prompts or write freeform notes. Entries can include text, location context, and media. The app is meant to feel personal and calm, not social or gamified.

## Product principles

- iOS-first for v1.
- Local-first storage.
- No social feed.
- No followers.
- No algorithmic engagement loop.
- No backend for v1.
- No analytics for v1.
- Privacy and user trust matter more than growth mechanics.
- Offline mode must disable AI prompt generation.
- Do not send full private notes to AI services unless explicitly requested by the user.

## Tech stack

- Expo / React Native
- TypeScript
- Expo Router
- SQLite via `expo-sqlite`
- EAS Build
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

- This is an Expo React Native project; on-device testing requires an EAS dev build, NOT Expo Go (react-native-maps and other native modules don't work in Expo Go).
- On-device builds require a paid Apple Developer account.
- Run interactive commands (e.g. `eas device:create`) in a separate terminal, not in-session.
- Whenever a build is needed (e.g. after native config or dependency changes), open a new terminal window and run `eas build --profile development --platform ios` there — don't run it in-session, it's long-running and interactive.

## Git Workflow

- After committing, always verify the push actually succeeded — commits have silently failed to push before.
- Direct pushes may be blocked by the auto-mode classifier; surface git commands for the user to run manually rather than retrying.

## Dependencies

- Before building, check for peer-dependency / SDK version mismatches (reanimated, react-native versions) proactively, since these have caused repeated fix-restart cycles.
- Use `npx expo install` (not `npm install`) for adding packages.
- Run `npx expo install --check` before builds to catch mismatches early.

## Development rules

- Keep changes small and focused.
- Prefer tests for behavior changes.
- Do not introduce a backend unless explicitly requested.
- Do not introduce analytics unless explicitly requested.
- Do not perform major Expo/React Native upgrades inside unrelated feature branches.
- Keep implementation and tests consistent when Expo APIs change.
- Preserve strict TypeScript.

# BoredNotes

BoredNotes is a private, local-first iOS micro-journaling and prompt/response app designed to create a fun and engaging way to kill time without scrolling social media. Users respond to prompts or write freeform notes. Entries can include text, location context, and media. No social feed, no followers.

## Principles

- Local-first
- Private by default
- No social feed
- No followers
- No analytics for v1

## Tech Stack

- Expo / React Native
- TypeScript
- Expo Router
- SQLite via expo-sqlite
- EAS Build

## Setup

```bash
npm install
```

## Development

```bash
npm run ios
npm run start
```

## Quality Checks

```bash
npm test -- --runInBand
npx tsc --noEmit
npx expo config --type introspect
```

## Privacy

Entries are stored locally on device. AI prompt generation avoids sending full note contents and can be disabled with offline mode.

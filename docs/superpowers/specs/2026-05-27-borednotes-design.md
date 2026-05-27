# BoredNotes — Design Spec
**Date:** 2026-05-27
**Status:** Approved

---

## Overview

BoredNotes (BN) is a personal iOS app designed to give people a healthy, mindful alternative to social media when they have a few idle minutes. The app presents prompts — ranging from light observational questions to deeper personal reflections — and lets users respond with text, photos, and voice memos. Responses accumulate into a private, chronological scrapbook of thoughts that can be browsed and reflected on over time.

BN has no social feed, no followers, no algorithmic engagement loop. It is "personal media" — owned entirely by the user, stored on their device.

**Goal:** Help people break passive scrolling habits by providing something more intentional to reach for when bored.

---

## Platform & Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React Native + Expo (managed workflow) | Native iOS feel, handles build pipeline, camera/mic/iCloud hooks built-in |
| Local storage | `expo-sqlite` (SQLite) | Structured, queryable, handles years of entries efficiently |
| Backup | iCloud (automatic via iOS Documents directory) | Zero server cost, Apple handles encryption, seamless for iPhone users |
| AI prompts | Anthropic Claude API | Excels at thoughtful, personal prompt generation |
| Media storage | Local filesystem (app Documents dir) | Referenced by path in SQLite; backed up by iCloud alongside the database |
| Backend | None | No accounts, no server, no analytics — nothing phones home except Claude API |

The app is local-first. All features work fully offline. Internet is only needed for AI-enhanced prompt generation, which degrades silently to the curated library when unavailable.

---

## Data Model

### `entries`
One row per submitted response.

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | |
| `prompt_text` | TEXT | Stored directly (self-contained, survives library updates) |
| `response_text` | TEXT | User's written response |
| `created_at` | DATETIME | Submission timestamp |
| `location_label` | TEXT nullable | User-edited place name (e.g. "the 38 bus") |
| `location_lat` | REAL nullable | Raw GPS latitude |
| `location_lng` | REAL nullable | Raw GPS longitude |

### `media`
Photos and voice memos attached to entries.

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | |
| `entry_id` | INTEGER FK → entries | |
| `type` | TEXT | `'photo'` or `'voice'` |
| `file_path` | TEXT | Relative path inside app Documents folder |
| `created_at` | DATETIME | |

### `prompts`
The curated offline prompt library plus any user-added custom prompts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | |
| `text` | TEXT | The prompt itself |
| `category` | TEXT | `observational`, `reflective`, `personal`, `creative` |
| `depth` | INTEGER | 1 = light, 2 = medium, 3 = deep |
| `source` | TEXT | `'library'` or `'custom'` — enables user-added prompts in future |
| `last_used_at` | DATETIME nullable | Prevents recent repeats |

### `settings`
Key/value store for user preferences.

| Column | Type | Notes |
|--------|------|-------|
| `key` | TEXT PK | |
| `value` | TEXT | Serialized as needed |

All entry writes are SQLite transactions — partial saves cannot occur.

---

## Screen Structure

Seven screens, one root:

```
Home Dashboard (root)
├── → Respond Screen          [tap prompt card]
│     └── → Home             [after submit, new prompt loaded]
├── → Timeline Screen         [tile]
│     └── → Entry Detail
├── → Entries Screen          [tile]
│     └── → Entry Detail
│           └── → Share Card Screen
└── → Reflect Screen          [tile]
      └── → Entry Detail
            └── → Share Card Screen
```

### Home Dashboard
The first screen on every app open. Contains:
- **Prompt card** (primary, top of screen) — displays the current prompt with a "Tap to respond" affordance
- **Three tiles** below the prompt card:
  - 📅 Timeline — calendar dot view
  - 💭 Entries — full list
  - ✨ Reflect — "On this day" + period browser

### Respond Screen
Triggered by tapping the prompt card. Contains:
- Full prompt text (read-only)
- Text input (primary, auto-focused)
- 📍 Add/edit location (GPS auto-suggests, user can override with any text)
- 📷 Attach photo (camera or library)
- 🎙 Attach voice memo (in-app recorder)
- Submit button

On submit: entry is saved, app returns to Home with a fresh prompt already loaded.

### Timeline Screen
Month-grid calendar view. Days with at least one entry show a dot. User taps a day to see a list of that day's entries. Swipe left/right to navigate months.

### Entries Screen
Reverse-chronological list of all entries, grouped by date header. Includes a search bar. Tapping an entry opens Entry Detail.

### Reflect Screen
Two sections:
1. **"On this day"** — surfaces entries from the same calendar date in prior months/years. Shows how many years back it reaches.
2. **Period browser** — tabs for Week / Month / Year. Shows entry count for the period and lets the user scroll through entries within it.

### Entry Detail
Full view of a single past entry:
- Prompt text
- Response text
- Date, time, location label
- Attached photo (if any) — full-width
- Voice memo player (if any)
- Share button (opens Share Card Screen)

### Share Card Screen
- Horizontal scrollable template picker (4 templates)
- Toggle: show/hide date
- Toggle: show/hide location
- Live card preview
- Export button → iOS native share sheet (saves as image or shares directly)

**Templates (default: Minimal):**
- A — Minimal / Editorial (white, serif, sparse)
- B — Warm / Scrapbook (tan gradient, journal feel)
- C — Dark / Moody (deep navy, accent sidebar)
- D — Bold / Quote Card (dark, colour-bar accent, response text prominent)

---

## Prompt System

### Curated Library
~200 prompts bundled as a JSON file at build time, seeded into the `prompts` table on first launch. Organized across four categories and three depth levels.

**Selection algorithm:**
1. Exclude any prompt used in the last 30 entries
2. Avoid the same category as the previous 2 prompts
3. Vary depth — avoid 3 consecutive prompts at the same depth level
4. Pick randomly from the remaining eligible set

### AI-Enhanced Mode
Approximately 1 in 4 prompts is generated by Claude rather than drawn from the library. The API call sends:
- Target category and depth
- Topics of the 3 most recent entries (not full text — summarized to protect privacy in transit)
- Time of day and day of week

**Timeout:** 2 seconds. On any failure (timeout, network error, API error), the app falls back to the curated library silently. The user never sees a loading state or error for prompt generation.

**API key:** Embedded in the app at build time. Acceptable for personal-use distribution.

### Prompt Persistence
The current prompt is stored as a key in the `settings` table (`current_prompt_text` and `current_prompt_category`). This means closing and reopening the app always shows the same prompt the user was about to answer — it never resets to a new one mid-session. A new prompt is only generated after the user submits a response.

### Custom Prompts (future)
The `source` column in the `prompts` table distinguishes `'library'` from `'custom'`. A future "Add your own prompt" screen in Settings can insert rows with `source = 'custom'`. The selection algorithm treats them identically.

---

## Location Handling

- GPS coordinates captured at entry submission time (requires one-time location permission)
- Reverse geocoding (coordinates → human-readable label) attempted immediately if online
- If offline at submission: coordinates stored raw, geocoding attempted next time app opens with connectivity
- User can always edit or replace the auto-suggested label with any free-text string (e.g., "the 38 bus", "Mom's kitchen")

---

## Offline Behavior

| Scenario | Behavior |
|----------|----------|
| No internet | Falls back to curated prompt library; all other features unaffected |
| AI prompt call fails/times out | Silent fallback to library; no error shown |
| Location offline | Coordinates stored, label resolved on next connected launch |
| Media save fails | Entry saved without attachment; brief inline message shown |
| Device storage full | Clear message shown; draft held in memory so text is not lost |

---

## Error Handling

- **SQLite writes** are transactional — no partial/corrupt entries possible
- **App updates** preserve the Documents directory — database and media files survive updates
- **Media permissions revoked** — gracefully disabled with a prompt to re-enable in Settings if user tries to attach
- **No crash-reporting or analytics** — by design. BN collects nothing.

---

## Out of Scope (v1)

The following are explicitly excluded from v1 to keep scope focused:

- Android support (architecture supports it; add later by introducing a backend sync layer)
- Cloud backup beyond iCloud (no custom backend in v1)
- Social features of any kind
- Push notifications or engagement nudges
- Streak tracking or gamification
- In-app analytics or usage stats shown to user
- Custom prompt management UI (architecture supports it; add in a future Settings screen)

---

## Future Extension Points

The architecture is designed so these can be added without restructuring:

- **Analytics:** Add a package (e.g. PostHog) and emit events — no schema changes needed
- **Cloud sync:** Add Supabase as a sync layer on top of existing local SQLite
- **Android:** Expo codebase already cross-platform; add backend sync when expanding
- **Custom prompts UI:** `source` column already in schema; just need the Settings screen
- **AI personalization depth:** Send more entry history to Claude as the feature matures

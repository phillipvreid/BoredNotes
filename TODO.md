# BoredNotes — Post-v2.0.0 To-Do (Arcade Pop UI)

Status as of 2026-07-06: everything merged to `main` (b7a5a53) via PRs #19 (v2 + Rank & Defend), #17 (Help Me Write), #18 (six themes), #20 (stack catch-up) — 21 suites / 175 tests passing, tsc clean. Feature branches retired.

## Verify on device
- [x] Run `npx expo run:ios` and click through Home, Reply (text + brain dump), Reply·Rank, Greatest Hits, Share sheet, Settings on a real simulator/device — CI only proves logic, not the rendered UI.
- [x] Check custom fonts (Bricolage Grotesque / Hanken Grotesk / Space Mono) actually load via `expo-font` and don't flash unstyled text.
- [x] Confirm all 4 paper themes render correctly in both light and dark mode from Settings. (Superseded: papers replaced by the six full themes below.)
- [x] Confirm the six concession-stand themes (Classic, Blue Raspberry, Sour Apple, Grape Soda, Bubblegum, Cherry Cola) render correctly in both light and dark mode from Settings — implemented and unit-tested, never yet seen on device. Check the ActionButton re-tints on theme change and Grape Soda's purple action.
- [x] Test Rank & Defend end-to-end: create a rank entry, confirm medal rendering shows correctly in Greatest Hits and entry detail.
- [x] Spot-check offline mode still disables AI prompt generation under the new UI.

## Polish / known gaps
- [ ] Review flat offset shadows and ink keylines on smaller iPhone screens (SE-class) for cramping/overlap.
- [ ] Confirm Mascot bob/blink animation doesn't drain battery or jank on older devices.
- [ ] Sanity-check the global Toast doesn't stack or overlap with the Share sheet.
- [x] Re-check CSV export and search still work with `entry_kind`/`game_data` for game entries (response_text plain-text fallback). Verified: search already matched game entries because rank entries store `renderRankResponseText()` output in `response_text` (locked in with searchEntries tests). CSV now also exports `category`/`entry_kind`/`game_data` columns and rebuilds response_text from `game_data` if it's ever empty.

## Housekeeping
- [x] Write/save a design spec + plan doc for the Arcade Sticker rollout under `docs/superpowers/specs` and `docs/superpowers/plans` (all other features have one; this one doesn't yet). Done: `docs/superpowers/specs/2026-07-20-arcade-sticker-design.md` + `docs/superpowers/plans/2026-07-20-arcade-sticker.md`, backfilled from current code (tokens, six themes, micro-game plumbing, Help Me Write chips) plus the PR trail and stacked-PR lesson.
- [x] Delete the stray untracked `Agent` file showing in `git status`.
- [x] Push branch and confirm it actually landed on remote (per project workflow note — pushes have silently failed before). Confirmed on GitHub: main has c285185.
- [x] Open PR for `feat/arcade-sticker-v2` → main once device testing above is done. Done: PRs #19/#17/#18 merged (plus #20 to land the stacked content that missed main); all confirmed on `main` at b7a5a53.

## Next feature candidates
- [x] Second micro-game beyond Rank & Defend, reusing the generic game plumbing (`prompts.kind` / `game_config` / `entry_kind` / `game_data`). Done: Love it / Hate it (`kind: loveHate`) shipped via PR #23 (merged 2026-07-08).
- [ ] Extend category hues / IconSticker set if new prompt categories are added.
- [ ] Bring back a streamlined PLACE (manual location tagging) on the respond screen — the chip was removed 2026-07-06 with Photo/Camera; auto-location still works via Settings.
- [ ] App icon: design in the claude.ai/design Arcade Sticker project, then wire `assets/icon.png` + `app.json` `icon` field.

## Bugs
- [x] Greatest Hits cards show "prompt" instead of the entry's actual category. Fixed: added nullable `entries.category` column + migration, threaded through createEntry/respond, FeedTab renders real category hue with "PROMPTED" fallback for legacy rows. (Needs on-device visual check.)
- [x] Home page cards don't refresh after submitting an entry. Fixed: card selection moved into the focus effect in `app/index.tsx`, then gated reselection on `entryCount` actually changing via a ref (opening/closing a prompt without submitting no longer reshuffles the deck; count still refreshes every focus). Confirmed on device.
- [x] Rank+Defend, the 1 2 and 3 are appearing incorrectly on the respond page. Fixed: `OutlinedNumber`'s outer box had no explicit height, so it collapsed to 0 in Yoga layout and the number spilled below the pill. Added `height: size * 1.1` to the box and bumped the rank-slot instance to `size={52}` to fill the pill. Confirmed on device.
- [x] Respond screen's freeform text box has no max height — typing a lot of text keeps growing the box and pushes the Send button off-screen instead of scrolling internally. Fixed: added `maxHeight: 260` to `styles.input` in `app/respond.tsx`; multiline `TextInput` scrolls its own content once it hits the cap (RN's default scrollEnabled behavior). (Needs on-device visual check.)

## Screens needing rework
- [x] Share screen still uses the old (pre-Arcade Sticker) design — bring it in line with the current sticker/pop design. Done: rebuilt as a single Arcade Sticker "Setup & Punchline" card (no pickers, no photo); pure content helpers (band/band-color/footer meta) + freeform kickers/taglines copy; old passport/photo/signal cards removed. Spec + plan in `docs/superpowers/{specs,plans}/2026-07-10-share-card-redesign.md`.
- [x] Respond screen of "dump a thought": the "help me write" feature needs to be adjusted. Fixed: prompts no longer draw from the homescreen category taxonomy (were secretly generated "in the observational/reflective/personal/creative category" and pill-labeled accordingly). `src/prompts/ai.ts` now builds a chip-driven instruction (place/time/weather/memory, each with its own angle + example) when no category is given; `contextual.ts` stops passing a homescreen category into generation; the Respond pill shows the active chip name(s) instead of the homescreen label. Confirmed on device — actual prompt wording/quality is still being tuned by the user, tracked separately.
## Map
- [x] Remove "places you've been bored" message from the map.
- [x] Decide whether the map feature is worth keeping at all. Decision: **cut the Map tab, keep location.** The map dragged in `react-native-maps` (the most build-fragile native dep) for a browse surface whose narrative wasn't landing, while location itself powers weather + PLACE prompts, share-card footers, CSV, and feed labels. Removed `MapTab`/`mapUtils`/`clusterUtils`/`place/cluster` + `react-native-maps`; `boredbefore.tsx` now renders Feed directly (no one-tab tab bar). Kept `place/[id]`, `PlaceNameSheet`, saved-locations, and the `places` system (place naming still reachable from a note's detail screen). Also closed a privacy gap: `gatherContext` now respects the `auto_location` toggle, so turning auto-location off suppresses all location/weather capture (previously it fired regardless).

## Photo
- [x] Decide whether photo attachment makes sense for the app's concept, or should be cut. Decision: **cut fully — commit to text-first.** Photo capture is already dead code: `src/media/capture.ts` is imported nowhere and is the only user of `expo-image-picker` + `expo-media-library` (both effectively unused), so no new photo rows can be created. Remaining media read paths (`getMediaForEntry`, `has_photo`) are vestigial — only meaningful for legacy rows created before the 2026-07-06 capture removal.
- [x] **Photo removal follow-up.** Done: deleted `src/media/capture.ts` + `src/db/media.ts`, dropped `expo-image-picker` + `expo-media-library` deps and the NSCamera/NSPhotoLibrary usage strings, removed `getMediaForEntry`/`has_photo` read paths (`entry/[id]`, `place/[id]`, `entries.ts`, `FeedTab`, `PlaceFeedList`) and the entry-detail photo `<Image>`, deleted `MediaItem`/`MediaType`/`EntryWithMedia`/`has_photo` from types, and removed the `media` table from schema with a `DROP TABLE IF EXISTS media` migration to clean older installs. Stacked on the map-cut branch (`feat/cut-photo` → `feat/cut-map-keep-location`) since both drop things from the same files; retarget to `main` after the map PR merges. Legacy photo rows (if any existed pre-2026-07-06) are dropped with the table — acceptable per the cut-fully decision.

## Settings
- [x] Add a toggle to disable the "wonky" (tilted box) effect. Shipped via PR #25 (merged 2026-07-10) — `wonky` flag in ThemeContext gates the Home/Feed card stacks only. Confirmed on device.
- [x] Replace the dark mode toggle with a three-way Light / Dark / System selector, defaulting to System, tracking the iOS appearance setting. Shipped via PR #25 (merged 2026-07-10) — `appearanceMode` + `resolveIsDark`, System tracks live OS scheme; legacy `theme_dark_mode` migrated read-only. Confirmed on device.

## Boredbefore / Feed
- [x] Remove the calendar tab entirely; replace with a date search/filter on the Feed page. Done: calendar tab removed (only Feed + Map remain in `app/boredbefore.tsx`) and the Feed Filter menu with format chips + date range shipped via PR #24 (merged 2026-07-09).

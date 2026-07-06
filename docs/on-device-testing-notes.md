# On-Device Testing Notes & Fixes

Pulled from `TODO.md` as of 2026-07-06. Run via `npx expo run:ios` on simulator/device.

## To verify on device

- [x] Six concession-stand themes (Classic, Blue Raspberry, Sour Apple, Grape Soda, Bubblegum, Cherry Cola) — check light/dark rendering from Settings, ActionButton re-tint on theme change, Grape Soda's purple action. Implemented + unit-tested, never seen on device.
- [x] Greatest Hits category pill fix — confirm real category hue renders correctly, "PROMPTED" fallback still shows for legacy/null-category entries.
- [x] Freeform text box `maxHeight: 260` cap on `app/respond.tsx` — confirm it scrolls internally instead of pushing the Send button off-screen.

## New from this test pass (2026-07-06)

- [ ] Respond screen: Send button hidden below keyboard — FIXED IN CODE (keyboard-aware padding collapse + smaller input min-heights, plus the attach row removal freeing space). Verify on device: freeform, freeform + Help Me Write open, and prompt-card entry, keyboard up — Send visible without scrolling in all three. Rank & Defend may still scroll (by design).
- [ ] Photo/Camera/Place chips removed from respond screen — DONE. Verify: auto-location (Settings toggle) still tags entries, and the editable place line with its ✕ appears when it does. PLACE returns later with a more streamlined approach (see TODO).
- [ ] Home screen jagged sticker keylines — FIXED IN CODE (tilted stickers now rasterize on iOS). Verify on the purple IMAGINE/CONFESS and blue REFLECT cards.
- [ ] Blue Raspberry ActionButton orange → now `#3FB2FF` blue. Verify on device; tune the hex in `src/theme/tokens.ts` if it reads wrong next to REFLECT blue.
- [ ] App icon — parked: design it in the claude.ai/design Arcade Sticker project first, then wire `assets/icon.png` + the `icon` field in `app.json` and re-run prebuild.

## Polish / known gaps

- [ ] Flat offset shadows + ink keylines on SE-class (small) screens — check for cramping/overlap.
- [ ] Mascot bob/blink animation — check battery drain / jank on older devices.
- [ ] Global Toast — confirm it doesn't stack or overlap the Share sheet.
- [ ] CSV export + search with `entry_kind`/`game_data` for game entries (response_text plain-text fallback).

## Fixed, confirmed on device

- [x] Home cards not refreshing after submitting an entry.
- [x] Rank & Defend number badges (1/2/3) rendering incorrectly on respond page.
- [x] Help Me Write chip-driven prompts (wording/quality still being tuned separately).
- [x] "Places you've been bored" map message removed.

## Notes

- Log new bugs/observations here as you test, then fold confirmed fixes back into `TODO.md`.

# On-Device Test Pass Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the four code-level findings from the 2026-07-06 on-device test pass: Blue Raspberry's orange ActionButton, jagged keylines on tilted Home cards, the attach-row removal (Photo/Camera/Place chips), and the Send button hiding below the keyboard on the respond screen.

**Architecture:** All fixes are small, isolated edits: one theme-token constant change, one prop addition to the shared `Sticker` component, and two edits to the respond screen (removing the attachment UI, then tightening the layout so everything fits above the keyboard). No schema, navigation, or dependency changes.

**Tech Stack:** Expo SDK 54 / React Native 0.81, TypeScript (strict), Jest via jest-expo + @testing-library/react-native.

## Global Constraints

- Strict TypeScript must stay clean: `npx tsc --noEmit` exits 0.
- Full test suite must pass: `npm test -- --runInBand` (21 suites / 175 tests before this plan; count grows as tasks add tests).
- No new dependencies. No analytics.
- The sticker surface recipe (ink keyline + flat offset shadow) and the reserved-action-color rule must not change — only Blue Raspberry's action *value* changes.
- Keep `src/media/capture.ts` and the media DB plumbing intact — photo attachment may return later as a micro-game; this plan removes only the respond-screen UI.
- The app icon is deliberately **out of scope** — it will be designed in the claude.ai/design project (`2baf7def-04cb-4fb2-9382-e3cdedb778dd`) first.
- Layout/rendering fixes (Tasks 2–4) can only be *fully* verified on device by the developer via `npx expo run:ios` (run outside this session); each task still gets the strongest automated check available.
- Commit after every task. Do not push without verifying the push succeeded.

---

### Task 1: Blue Raspberry action color — orange → blue

The theme's `action` token is `#FF8A3D` (orange) in `src/theme/tokens.ts`. The user wants a blue action to match the theme. New value: `#3FB2FF` — a bright blue-raspberry candy blue, clearly distinct from the theme's REFLECT hue (`#2B4FD9`, darker royal) and OBSERVE hue (`#0891B5`, teal), and light enough to carry the theme ink `#142033` (the existing suite already asserts `actionInk` mechanics for every theme).

**Files:**
- Modify: `src/theme/tokens.ts:118` (the `blue-raspberry` entry's `action` field)
- Test: `__tests__/theme/tokens.test.ts`

**Interfaces:**
- Consumes: `THEMES` array from `src/theme/tokens.ts`.
- Produces: `THEMES.find(t => t.id === 'blue-raspberry').action === '#3FB2FF'`. No signature changes.

- [ ] **Step 1: Write the failing test**

Add to the `describe('tokens', ...)` block in `__tests__/theme/tokens.test.ts`:

```ts
  it('blue raspberry action is a blue, matching its theme', () => {
    const br = THEMES.find(t => t.id === 'blue-raspberry')!;
    expect(br.action).toBe('#3FB2FF');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/theme/tokens.test.ts`
Expected: FAIL — received `"#FF8A3D"`, expected `"#3FB2FF"`.

- [ ] **Step 3: Change the token**

In `src/theme/tokens.ts`, in the `blue-raspberry` theme entry, change:

```ts
    action: '#FF8A3D',
```

to:

```ts
    action: '#3FB2FF',
```

- [ ] **Step 4: Run the theme suite to verify it passes**

Run: `npm test -- --runInBand __tests__/theme/tokens.test.ts`
Expected: PASS — including the pre-existing guards (`action identical in both modes`, `no category hue reuses its theme's reserved action colour`).

- [ ] **Step 5: Commit**

```bash
git add src/theme/tokens.ts __tests__/theme/tokens.test.ts
git commit -m "fix: Blue Raspberry action color is blue, not orange"
```

---

### Task 2: Anti-alias tilted stickers (jagged Home-card keylines)

Rotated views on iOS don't anti-alias their layer edges by default, which is why the tilted Home cards (the only tilted stickers — `app/index.tsx` passes `tilt={TILTS[i % TILTS.length]}`) show jagged keylines. Fix: set `shouldRasterizeIOS` on the `Sticker` root whenever it is tilted. React Native pairs this with the screen's `rasterizationScale`, so the layer is composited once with smooth edges. Untilted stickers keep the default (rasterization has a memory cost; don't apply it blanket-wide).

**Files:**
- Modify: `src/components/ui/Sticker.tsx`
- Test: Create `__tests__/components/sticker.test.tsx`

**Interfaces:**
- Consumes: `Sticker` props (`tilt`, `onPress`) from `src/components/ui/Sticker.tsx`; `ThemeProvider` from `src/theme/ThemeContext.tsx` (needs a `db` — use the mocked `openDatabaseAsync` from `expo-sqlite` exactly as `__tests__/theme/ThemeContext.test.tsx` does).
- Produces: `Sticker` renders its root `View`/`Pressable` with `shouldRasterizeIOS={true}` iff `tilt !== 0`. No prop-type changes.

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/sticker.test.tsx`:

```tsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { openDatabaseAsync } from 'expo-sqlite';
import { Sticker } from '../../src/components/ui/Sticker';
import { ThemeProvider } from '../../src/theme/ThemeContext';

describe('Sticker', () => {
  let db: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
    db.getFirstAsync.mockResolvedValue(null);
  });

  async function renderSticker(props: React.ComponentProps<typeof Sticker>) {
    const result = render(
      <ThemeProvider db={db}>
        <Sticker {...props} />
      </ThemeProvider>,
    );
    await act(async () => {});
    return result.toJSON() as any;
  }

  it('rasterizes on iOS when tilted, so rotated keylines stay crisp', async () => {
    const tilted = await renderSticker({ tilt: -1.5 });
    expect(tilted.props.shouldRasterizeIOS).toBe(true);
  });

  it('does not rasterize untilted stickers', async () => {
    const flat = await renderSticker({});
    expect(flat.props.shouldRasterizeIOS).toBeFalsy();
  });

  it('rasterizes pressable tilted stickers too', async () => {
    const pressable = await renderSticker({ tilt: 1.2, onPress: () => {} });
    expect(pressable.props.shouldRasterizeIOS).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/components/sticker.test.tsx`
Expected: FAIL — `shouldRasterizeIOS` is `undefined` on the tilted renders.

- [ ] **Step 3: Add the prop in Sticker**

In `src/components/ui/Sticker.tsx`, replace the two return statements:

```tsx
  if (!onPress && !onLongPress) {
    return <View style={surface}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={surface}
    >
      {children}
    </Pressable>
  );
```

with:

```tsx
  // Rotated layers don't edge-anti-alias on iOS; rasterizing the tilted
  // sticker keeps its keyline crisp. Untilted stickers skip the memory cost.
  const rasterize = tilt !== 0;

  if (!onPress && !onLongPress) {
    return <View style={surface} shouldRasterizeIOS={rasterize}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={surface}
      shouldRasterizeIOS={rasterize}
    >
      {children}
    </Pressable>
  );
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/components/sticker.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Sticker.tsx __tests__/components/sticker.test.tsx
git commit -m "fix: rasterize tilted stickers so keylines render crisp on iOS"
```

Note for the device pass: if edges are still jagged on the purple IMAGINE/CONFESS and blue REFLECT cards, the fallback is wrapping tilted stickers in a padded parent view — flag it rather than improvising.

---

### Task 3: Remove Photo / Camera / Place chips from the respond screen

Product call from the test pass: the attach row is not part of the core text loop. Remove all three chips and the photo-attachment UI from `app/respond.tsx`. Keep: auto-location capture (the `auto_location` setting still tags entries silently), the editable location line when auto-location fills it (now with its own clear-✕, since the old ✕ lived in the attach row), the media DB layer, and `src/media/capture.ts` (dead for now, intentionally — photos may return as a micro-game).

**Files:**
- Modify: `app/respond.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `app/respond.tsx` no longer imports `createMedia`, `pickPhoto`, `takePhoto`, or RN's `Image`. Entry saving (`createEntry`), auto-location, and geocode queueing are unchanged. No other file imports change.

- [ ] **Step 1: Remove the photo/attach imports**

In `app/respond.tsx`, change the react-native import:

```ts
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Keyboard, LayoutAnimation, Platform, Image, SafeAreaView,
} from 'react-native';
```

to:

```ts
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Keyboard, LayoutAnimation, Platform, SafeAreaView,
} from 'react-native';
```

Delete these two import lines entirely:

```ts
import { createMedia } from '../src/db/media';
```

```ts
import { pickPhoto, takePhoto } from '../src/media/capture';
```

- [ ] **Step 2: Remove photo state and the three handlers**

Delete the state line:

```ts
  const [photoUri, setPhotoUri] = useState<string | null>(null);
```

Delete the three functions `handleAddLocation`, `handlePickPhoto`, and `handleTakePhoto` (the block from `async function handleAddLocation() {` through the closing brace of `handleTakePhoto`).

- [ ] **Step 3: Remove the media write in handleSubmit**

Delete this line from `handleSubmit`:

```ts
      if (photoUri) await createMedia(db, entryId, 'photo', photoUri);
```

- [ ] **Step 4: Replace the photo preview + attach row JSX with a location row**

Delete this whole block (photo preview, attach row, and the old location input):

```tsx
          {photoUri && (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photoUri }} style={[styles.photoImg, { borderColor: colors.border }]} />
              <TouchableOpacity onPress={() => setPhotoUri(null)}>
                <Text style={styles.removeTxt}>REMOVE PHOTO ✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.attachRow}>
            <Chip label="+ PHOTO" onPress={handlePickPhoto} />
            <Chip label="+ CAMERA" onPress={handleTakePhoto} />
            <Chip
              label={locationLabel ? `◉ ${locationLabel.toUpperCase()}` : '◉ PLACE'}
              active={locationLabel !== ''}
              onPress={handleAddLocation}
            />
            {locationLabel !== '' && (
              <TouchableOpacity onPress={() => { setLocationLabel(''); setLocationCoords(null); }} hitSlop={8}>
                <Text style={[styles.removeTxt, { alignSelf: 'center' }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {locationLabel !== '' && (
            <TextInput
              style={[styles.locationInput, { color: colors.textPrimary, borderBottomColor: colors.border }]}
              value={locationLabel}
              onChangeText={setLocationLabel}
              placeholder="Edit place name"
              placeholderTextColor={colors.when}
            />
          )}
```

and replace it with (auto-location's tag stays visible, editable, and clearable):

```tsx
          {locationLabel !== '' && (
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.locationInput, { color: colors.textPrimary, borderBottomColor: colors.border }]}
                value={locationLabel}
                onChangeText={setLocationLabel}
                placeholder="Edit place name"
                placeholderTextColor={colors.when}
              />
              <TouchableOpacity onPress={() => { setLocationLabel(''); setLocationCoords(null); }} hitSlop={8}>
                <Text style={styles.removeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
```

- [ ] **Step 5: Update styles**

In the `StyleSheet.create` block, delete these entries:

```ts
  photoPreview: { gap: 6 },
  photoImg: { width: '100%', height: 180, borderRadius: 12, borderWidth: KEYLINE_HEAVY },
  attachRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
```

Change the `locationInput` entry and add `locationRow` beside it:

```ts
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationInput: { flex: 1, fontFamily: FONTS.body, fontSize: 14, borderBottomWidth: 1, paddingVertical: 4 },
```

Keep `removeTxt` — the location clear-✕ still uses it.

- [ ] **Step 6: Verify nothing dangles**

Run: `npx tsc --noEmit`
Expected: exit 0. (This catches any now-unused import — note `KEYLINE_HEAVY` is still used by the prompt card and rank slots, so it stays.)

Run: `grep -n "photoUri\|pickPhoto\|takePhoto\|createMedia\|attachRow\|PHOTO\|CAMERA" app/respond.tsx`
Expected: no matches.

- [ ] **Step 7: Run the full suite**

Run: `npm test -- --runInBand`
Expected: all suites PASS (no test renders the respond screen; this confirms no collateral damage).

- [ ] **Step 8: Commit**

```bash
git add app/respond.tsx
git commit -m "feat: remove photo/camera/place chips from respond screen"
```

---

### Task 4: Respond screen — everything fits above the keyboard, no scrolling

The screen already tracks `keyboardHeight` and pads the scroll region, but the content stack (input-card min-heights + 40px bottom padding, previously plus the attach row) is taller than the shrunken viewport, so the footer with the Send button lands below the fold. Task 3 already reclaimed the attach row's height; this task shrinks the compressible parts so header + input card + footer fit above the keyboard on device-class screens: drop the container's bottom padding while the keyboard is up, and lower the input card's min-heights so `flex: 1` can actually compress it.

**Files:**
- Modify: `app/respond.tsx` (depends on Task 3 being done — line positions shift)

**Interfaces:**
- Consumes: the `keyboardHeight` state already in `app/respond.tsx`.
- Produces: layout-only style changes; no exported API.

- [ ] **Step 1: Make the container's bottom padding collapse when the keyboard is up**

Change the ScrollView opening tag:

```tsx
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
```

to:

```tsx
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.container, keyboardHeight > 0 && styles.containerKeyboard]}
          keyboardShouldPersistTaps="handled"
        >
```

- [ ] **Step 2: Shrink the compressible min-heights**

In the styles block, change:

```ts
  container: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40, gap: 16 },
```

to:

```ts
  container: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40, gap: 16 },
  containerKeyboard: { paddingBottom: 12 },
```

Change:

```ts
  inputCard: { flex: 1, minHeight: 180, padding: 16 },
```

to:

```ts
  inputCard: { flex: 1, minHeight: 120, padding: 16 },
```

Change (inside the `input` entry):

```ts
  input: {
    flex: 1, fontFamily: FONTS.body, fontSize: 18, lineHeight: 26, minHeight: 150,
    textAlignVertical: 'top',
  },
```

to:

```ts
  input: {
    flex: 1, fontFamily: FONTS.body, fontSize: 18, lineHeight: 26, minHeight: 90,
    textAlignVertical: 'top',
  },
```

- [ ] **Step 3: Verify types and suite**

Run: `npx tsc --noEmit` — expected exit 0.
Run: `npm test -- --runInBand` — expected all PASS.

- [ ] **Step 4: Commit**

```bash
git add app/respond.tsx
git commit -m "fix: respond screen fits above the keyboard without scrolling"
```

Device pass must check all three respond variants with the keyboard up: freeform, freeform + Help Me Write open (prompt card + chip row is the tallest stack), and a prompt-card entry. Rank & Defend is allowed to scroll (five stacked inputs can't fit above a keyboard); the requirement applies to the text flows.

---

### Task 5: Fold status back into the docs

**Files:**
- Modify: `docs/on-device-testing-notes.md`
- Modify: `TODO.md`

**Interfaces:** none — documentation only.

- [ ] **Step 1: Update the testing notes**

In `docs/on-device-testing-notes.md`, under "New from this test pass (2026-07-06)", replace the five open items with:

```markdown
- [ ] Respond screen: Send button hidden below keyboard — FIXED IN CODE (keyboard-aware padding collapse + smaller input min-heights, plus the attach row removal freeing space). Verify on device: freeform, freeform + Help Me Write open, and prompt-card entry, keyboard up — Send visible without scrolling in all three. Rank & Defend may still scroll (by design).
- [ ] Photo/Camera/Place chips removed from respond screen — DONE. Verify: auto-location (Settings toggle) still tags entries, and the editable place line with its ✕ appears when it does. PLACE returns later with a more streamlined approach (see TODO).
- [ ] Home screen jagged sticker keylines — FIXED IN CODE (tilted stickers now rasterize on iOS). Verify on the purple IMAGINE/CONFESS and blue REFLECT cards.
- [ ] Blue Raspberry ActionButton orange → now `#3FB2FF` blue. Verify on device; tune the hex in `src/theme/tokens.ts` if it reads wrong next to REFLECT blue.
- [ ] App icon — parked: design it in the claude.ai/design Arcade Sticker project first, then wire `assets/icon.png` + the `icon` field in `app.json` and re-run prebuild.
```

- [ ] **Step 2: Update TODO.md**

In `TODO.md`, under "Next feature candidates", add:

```markdown
- [ ] Bring back a streamlined PLACE (manual location tagging) on the respond screen — the chip was removed 2026-07-06 with Photo/Camera; auto-location still works via Settings.
- [ ] App icon: design in the claude.ai/design Arcade Sticker project, then wire `assets/icon.png` + `app.json` `icon` field.
```

- [ ] **Step 3: Commit**

```bash
git add docs/on-device-testing-notes.md TODO.md
git commit -m "docs: record on-device fix pass status and parked items"
```

---

## Out of scope (unchanged from the notes)

- App icon (design-first in claude.ai/design, per the user).
- "Polish / known gaps" items (SE-class cramping, Mascot battery, Toast/Share overlap, CSV export with game entries) — these are device-observation checks, not code changes yet.
- Help Me Write prompt wording tuning (tracked separately).

## Final verification (after all tasks)

1. `npx tsc --noEmit` — exit 0.
2. `npm test -- --runInBand` — all suites pass (expect 22 suites: +1 for the new sticker test).
3. Developer runs `npx expo run:ios` outside the session and walks the device-check items written into `docs/on-device-testing-notes.md` in Task 5.

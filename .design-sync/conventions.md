# BoredNotes components — how to build with them

These are the app's real React Native components, compiled for the browser via
react-native-web. Everything is on `window.BoredNotes`.

## Setup — always wrap in the providers

Components read the theme from context and throw without it. `fakeDb` is
exported for exactly this:

```jsx
const { ThemeProvider, ToastProvider, fakeDb } = window.BoredNotes;

<ThemeProvider db={fakeDb}>
  <ToastProvider>
    {/* your screens */}
  </ToastProvider>
</ThemeProvider>
```

## Styling idiom — props and JS tokens, no CSS classes

There is no utility-class vocabulary and no `var(--*)` tokens. Style your own
layout glue with inline styles / RN-style objects, and take every color, font,
and size from the exported tokens:

- `FONTS.display` = "BricolageGrotesque_800ExtraBold" (headlines, prompts,
  button labels, numbers) · `FONTS.body` / `bodySemiBold` / `bodyExtraBold` =
  Hanken Grotesk (answers, input, supporting copy) · `FONTS.label` =
  "SpaceMono_700Bold" (UPPERCASE chips, counters, timestamps). The `@font-face`
  rules ship in `styles.css`; use these family names verbatim.
- `CAT_HUES` — the 8 category hues (`reflect`, `observe`, `confess`, `rank`,
  `take`, `nostalgia`, `gossip`, `imagine`); every category fill carries WHITE
  text. `CATEGORY_STYLES` adds each category's UPPERCASE label + kind.
- `ACTION` (#FFD23E) is **reserved**: only CTAs/send/selected-action ever get
  it — never category fills, never decoration. `INK` (#141414) is the single
  keyline/text near-black.
- Surface recipe: don't hand-build cards — compose `Sticker` (keyline + flat
  offset shadow + press behavior built in). Scale: `SHADOW_SM`=3 rows,
  `SHADOW_CARD`=4 cards, `SHADOW_STICKER`=5 prompts; keylines `KEYLINE`=2.5 /
  `KEYLINE_HEAVY`=3. Tilts are hand-placed from `TILTS` (−1.5/1.2/−1), never
  random.
- Inside a component tree, `useTheme()` returns the live palette
  (`colors.surface`, `colors.textPrimary`, `colors.action`, `categoryStyles`,
  `isDark`, `setTheme`) — the 6 concession-stand themes live in `THEMES`.
- Supporting values: `MASCOT`, `DEFEND_PAD` (#FFF6D6 — the rank defend pad,
  NOT the action yellow), `CHIP_SCRIM`, `MEDALS`.

## Where the truth lives

Read `styles.css` (fonts) and each component's `.d.ts` + `.prompt.md` under
`components/<group>/<Name>/` before styling. Tokens are JS exports on
`window.BoredNotes`, not CSS custom properties.

## Idiomatic example

```jsx
const { ThemeProvider, ToastProvider, fakeDb, Sticker, ActionButton,
        Chip, FONTS, CAT_HUES } = window.BoredNotes;

<ThemeProvider db={fakeDb}><ToastProvider>
  <div style={{ maxWidth: 380, padding: 18, display: 'flex',
                flexDirection: 'column', gap: 12, background: '#FBFAF3' }}>
    <Sticker color={CAT_HUES.reflect} tilt={-1.5} onPress={() => {}}>
      <div style={{ padding: '13px 15px' }}>
        <Chip label="REFLECT" active activeColor="rgba(0,0,0,.22)" />
        <p style={{ fontFamily: FONTS.display, fontSize: 18, color: '#fff',
                    margin: '7px 0 0' }}>
          If your boredom had a sound, what is it?
        </p>
      </div>
    </Sticker>
    <ActionButton label="DUMP A THOUGHT" size="lg" block onPress={() => {}} />
  </div>
</ToastProvider></ThemeProvider>
```

Voice, if you write copy: deadpan, faintly rude, affectionate. UPPERCASE mono
for system shouts, sentence case for display lines. No emoji.

A tappable prompt card for the Home feed. The card IS the category color, with white text throughout.

```jsx
<CategoryCard
  cat="REFLECT" kind="introspect"
  color="var(--bn-cat-reflect)"
  text="If your boredom had a sound, what is it?"
  tilt={-1.5}
  onClick={openPrompt}
/>
```

Always pair `cat`/`color` from the same category (REFLECT→`--bn-cat-reflect`, etc.). Give stacked cards small alternating `tilt` values (−1.5, 1.2, −1) — never random.

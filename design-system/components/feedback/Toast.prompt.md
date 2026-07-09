The save confirmation that pops after you file an answer — a dark ink pill with the mini mascot and an UPPERCASE deadpan label.

```jsx
const [saved, setSaved] = React.useState(false);
// ...on save: setSaved(true)
{saved && <Toast show={saved} duration={1800} onDone={() => setSaved(false)} />}
```

Default label is "FILED UNDER NONSENSE." — vary it ("NOTED, REGRETTABLY.", "ANOTHER ONE.") but keep it short and mono.

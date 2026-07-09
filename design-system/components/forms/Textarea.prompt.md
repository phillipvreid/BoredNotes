The answer input. A paper card with the keyline + offset shadow, and a counter line underneath that escalates its heckle as the word count climbs ("now you're cooking." → "you're writing a memoir." → "respectfully, wrap it up.").

```jsx
const [v, setV] = React.useState("");
<Textarea value={v} onChange={setV} placeholder="type here, genius…" />
```

Controlled — own the string in the host. Set `showCounter={false}` for plain inputs.

The Borednotes heckler, built in CSS so you can drop it anywhere. **It is a placeholder** — production should swap in an illustrated character that reacts to what the user types. Bobs and blinks on idle.

```jsx
<Mascot size={96} />                {/* home */}
<Mascot size={50} mood="peek" color="var(--bn-action)" />  {/* sticker corner */}
<Mascot mood="flat" animate={false} /> {/* empty state */}
```

Keep it expressive but deadpan — the mascot mocks, it never cheers.

The primary sticker action button — yellow keyline box with a flat offset shadow that presses into itself. Yellow always means "the action"; never use it for non-actions.

```jsx
<Button size="lg" block arrow onClick={openBrain}>DUMP A THOUGHT</Button>
<Button arrow onClick={save}>SEND IT</Button>
<Button variant="ghost">CANCEL</Button>
<Button disabled arrow>SEND IT</Button>
```

Variants: `action` (default yellow), `ghost` (white), `dark` (ink). Sizes: `md` (send), `lg` (home CTA — pair with `block`). Set `arrow` for the trailing →. Press state (translate + halved shadow) is built in.

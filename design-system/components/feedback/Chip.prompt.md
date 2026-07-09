Small UPPERCASE Space Mono pill. Two roles: a selectable **filter** (rounded pill, ink fill when selected) and a static **meta** tag (squared, sits on a colored card).

```jsx
{/* filter row */}
<Chip role="filter" selected onClick={all}>ALL</Chip>
<Chip role="filter" onClick={confess}>CONFESS</Chip>

{/* meta tag on a card */}
<Chip role="meta" color="rgba(0,0,0,.22)">REFLECT</Chip>
```

A saved answer ("banger") in the Greatest Hits grid. White sticker, slight tilt, three content shapes.

```jsx
{/* text answer */}
<HitCard cat="CONFESS" color="var(--bn-cat-confess)" when="wed · 4:03pm"
  prompt="A thing you pretend to like:" answer="Hiking. It's just walking, upset." tilt={-1} />

{/* rank result with defense */}
<HitCard type="rank" cat="RANK" color="var(--bn-cat-rank)" when="mon"
  prompt="Rank: best cereal mascots"
  items={["Toucan Sam", "Tony", "Count Chocula"]}
  defense="Sam navigates by SMELL. Respect." tilt={1.2} />

{/* brain dump */}
<HitCard type="brain" cat="BRAIN DUMP" color="var(--bn-action)" chipFg="#141414"
  when="now" answer="Reorganized my camera roll by vibe. Looks identical." />
```

import React from 'react';
import { Mascot } from 'borednotes';

const row: React.CSSProperties = { display: 'flex', gap: 32, alignItems: 'flex-end', padding: 10 };

// The bored heckler at home size (96) — red, browed, tongue out.
export const Home = () => (
  <div style={row}>
    <Mascot bob={false} />
  </div>
);

// Yellow "peek" variant (sticker corners) and a small size.
export const Variants = () => (
  <div style={row}>
    <Mascot size={96} bob={false} />
    <Mascot size={50} variant="yellow" bob={false} />
    <Mascot size={32} bob={false} />
  </div>
);

// Idle bob enabled — how it ships on the home screen.
export const Bobbing = () => (
  <div style={{ ...row, paddingTop: 20 }}>
    <Mascot size={72} />
  </div>
);

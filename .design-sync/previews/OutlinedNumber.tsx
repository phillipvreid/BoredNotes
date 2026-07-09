import React from 'react';
import { OutlinedNumber } from 'borednotes';

// The rank-podium numerals — hollow ink-stroked digits at hand-placed tilts
// (the kit's -6 / 5 / -4).
export const Podium = () => (
  <div style={{ display: 'flex', gap: 26, alignItems: 'center', padding: '16px 10px' }}>
    <OutlinedNumber value="1" size={74} tilt={-6} />
    <OutlinedNumber value="2" size={74} tilt={5} />
    <OutlinedNumber value="3" size={74} tilt={-4} />
  </div>
);

// Default 40px size, untitled — inline counter use.
export const Small = () => (
  <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 10 }}>
    <OutlinedNumber value="37" />
    <OutlinedNumber value="8" tilt={3} />
  </div>
);

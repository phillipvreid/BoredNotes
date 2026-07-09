import React from 'react';
import { ActionButton } from 'borednotes';

// Inline row wrapper so md buttons hug their content (RNW views stretch otherwise).
const hug: React.CSSProperties = { display: 'flex', justifyContent: 'flex-start' };

// The home CTA — reserved yellow, full width, lg.
export const HomeCta = () => (
  <div style={{ width: 340, display: 'flex', flexDirection: 'column' }}>
    <ActionButton label="DUMP A THOUGHT" size="lg" block onPress={() => {}} />
  </div>
);

// The reply-screen send button (md, inline).
export const Send = () => (
  <div style={hug}><ActionButton label="SEND IT" onPress={() => {}} /></div>
);

// No trailing arrow.
export const NoArrow = () => (
  <div style={hug}><ActionButton label="FINE, SAVE IT" arrow={false} onPress={() => {}} /></div>
);

// Disabled state (45% opacity).
export const Disabled = () => (
  <div style={hug}><ActionButton label="SEND IT" disabled onPress={() => {}} /></div>
);

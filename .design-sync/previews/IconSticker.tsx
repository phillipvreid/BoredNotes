import React from 'react';
import { IconSticker } from 'borednotes';

const row: React.CSSProperties = { display: 'flex', gap: 12, padding: 6 };

// Back button and the home menu dots — the two canonical uses.
export const BackAndMenu = () => (
  <div style={row}>
    <IconSticker glyph="←" onPress={() => {}} />
    <IconSticker menu onPress={() => {}} />
  </div>
);

// Any single glyph works — close, share, settings.
export const OtherGlyphs = () => (
  <div style={row}>
    <IconSticker glyph="✕" onPress={() => {}} />
    <IconSticker glyph="↑" onPress={() => {}} />
    <IconSticker glyph="★" onPress={() => {}} />
  </div>
);

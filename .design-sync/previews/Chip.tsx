import React from 'react';
import { Chip } from 'borednotes';

const row: React.CSSProperties = { display: 'flex', gap: 9, flexWrap: 'wrap', padding: 6 };

// The Greatest Hits filter row — inverted-ink active chip + quiet inactive ones.
export const FilterRow = () => (
  <div style={row}>
    <Chip label="ALL" active onPress={() => {}} />
    <Chip label="REFLECT" onPress={() => {}} />
    <Chip label="HOT TEA" onPress={() => {}} />
    <Chip label="RANK" onPress={() => {}} />
    <Chip label="CONFESS" onPress={() => {}} />
  </div>
);

// Active with a category hue instead of inverted ink.
export const CategoryActive = () => (
  <div style={row}>
    <Chip label="REFLECT" active activeColor="#2E5BFF" onPress={() => {}} />
    <Chip label="HOT TEA" active activeColor="#FF4438" onPress={() => {}} />
    <Chip label="RANK" active activeColor="#15A150" onPress={() => {}} />
  </div>
);

// With the sticker shadow — share-target treatment.
export const WithShadow = () => (
  <div style={row}>
    <Chip label="COPY LINK" active shadow={3} onPress={() => {}} />
    <Chip label="SEND AS TEXT" shadow={3} onPress={() => {}} />
    <Chip label="MORE…" shadow={3} onPress={() => {}} />
  </div>
);

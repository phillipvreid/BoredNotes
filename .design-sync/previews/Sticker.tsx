import React from 'react';
import { Sticker } from 'borednotes';

const pad: React.CSSProperties = { padding: '13px 15px' };
const q: React.CSSProperties = {
  fontFamily: 'BricolageGrotesque_800ExtraBold',
  fontSize: 18, lineHeight: '19.5px', color: '#fff', letterSpacing: -0.2, margin: 0,
};
const chip: React.CSSProperties = {
  display: 'inline-block', background: 'rgba(0,0,0,.22)', color: '#fff',
  fontFamily: 'SpaceMono_700Bold', fontSize: 10, letterSpacing: 1,
  padding: '3px 7px', borderRadius: 6, marginBottom: 7,
};

// A category prompt card: the sticker IS the category color, white ink on top.
export const CategoryCard = () => (
  <div style={{ width: 300 }}>
    <Sticker color="#2E5BFF" tilt={-1.5} onPress={() => {}}>
      <div style={pad}>
        <span style={chip}>REFLECT</span>
        <p style={q}>If your boredom had a sound, what is it?</p>
      </div>
    </Sticker>
  </div>
);

// The default paper surface — theme surface color, ink keyline, 4px shadow.
export const PaperCard = () => (
  <div style={{ width: 300 }}>
    <Sticker>
      <div style={pad}>
        <p style={{ fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16, lineHeight: '23px', color: '#141414', margin: 0 }}>
          Reorganized my camera roll by vibe. Took two hours. Looks identical.
        </p>
      </div>
    </Sticker>
  </div>
);

// Hand-placed tilts — the "wonky" stack (−1.5 / 1.2 / −1, never random).
export const WonkyStack = () => (
  <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 12, padding: 6 }}>
    {[
      { tilt: -1.5, color: '#8B3DF5', cat: 'CONFESS', text: 'The most pointless thing you did today?' },
      { tilt: 1.2, color: '#FF7A1A', cat: 'HOT TAKE', text: 'A food everyone loves that is actually mid.' },
      { tilt: -1, color: '#15A150', cat: 'RANK', text: 'Rank your last 3 snacks. Defend #1.' },
    ].map((c) => (
      <Sticker key={c.cat} color={c.color} tilt={c.tilt}>
        <div style={pad}>
          <span style={chip}>{c.cat}</span>
          <p style={q}>{c.text}</p>
        </div>
      </Sticker>
    ))}
  </div>
);

// Heavier sticker shadow (5px) + bigger radius — the prompt-sticker recipe.
export const PromptWeight = () => (
  <div style={{ width: 300 }}>
    <Sticker color="#FF4438" shadow={5} radius={20}>
      <div style={{ padding: '18px 18px 20px' }}>
        <span style={chip}>HOT TEA</span>
        <p style={{ ...q, fontSize: 23, lineHeight: '24.4px' }}>What's a lie you tell every single week?</p>
      </div>
    </Sticker>
  </div>
);

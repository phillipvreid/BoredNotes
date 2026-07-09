import React from 'react';
import { SpeechBubble, Mascot } from 'borednotes';

// The mascot's heckle — constant −2° tilt, display type. Row wrapper so the
// bubble hugs its text instead of stretching across the card.
export const Heckle = () => (
  <div style={{ padding: 8, display: 'flex', justifyContent: 'flex-start' }}>
    <SpeechBubble>Ugh. FINALLY. Entertain me.</SpeechBubble>
  </div>
);

// With the Space Mono kicker line above the heckle.
export const WithKicker = () => (
  <div style={{ padding: 8, display: 'flex', justifyContent: 'flex-start' }}>
    <SpeechBubble kicker="SHARE IT, THEN">Make it the group chat's problem.</SpeechBubble>
  </div>
);

// As used on Home: bubble beside the mascot.
export const WithMascot = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: 8, width: 320 }}>
    <Mascot size={72} bob={false} />
    <div style={{ marginBottom: 10, flex: 1 }}>
      <SpeechBubble>Back already? Not surprised.</SpeechBubble>
    </div>
  </div>
);

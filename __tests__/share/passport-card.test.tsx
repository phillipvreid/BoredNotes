// __tests__/share/passport-card.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { PassportCard } from '../../src/share/passport-card';
import { CARD_STYLES } from '../../src/share/templates';
import type { PassportTokens } from '../../src/share/templates';

const tokens = CARD_STYLES.find(s => s.id === 'passport')!.variants[0].tokens as PassportTokens;

const base = {
  tokens,
  promptText: 'What did you notice today?',
  responseText: 'A red door.',
  createdAt: '2026-06-04T10:00:00.000Z',
  location: 'Melbourne, VIC',
  showDate: true,
  showLocation: true,
  entryMode: 'prompted' as const,
};

describe('PassportCard', () => {
  it('renders response text', () => {
    const { getByText } = render(<PassportCard {...base} />);
    expect(getByText('A red door.')).toBeTruthy();
  });

  it('shows prompt meta for prompted entries', () => {
    const { getByText } = render(<PassportCard {...base} />);
    expect(getByText('What did you notice today?')).toBeTruthy();
  });

  it('hides prompt meta for freeform entries', () => {
    const { queryByText } = render(
      <PassportCard {...base} entryMode="freeform" promptText="" />
    );
    expect(queryByText('PROMPT')).toBeNull();
  });

  it('shows location meta when location present and showLocation=true', () => {
    const { getByText } = render(<PassportCard {...base} />);
    expect(getByText('Melbourne, VIC')).toBeTruthy();
  });

  it('hides location meta when showLocation=false', () => {
    const { queryByText } = render(<PassportCard {...base} showLocation={false} />);
    expect(queryByText('Melbourne, VIC')).toBeNull();
  });

  it('hides location meta when location is null', () => {
    const { queryByText } = render(<PassportCard {...base} location={null} />);
    expect(queryByText('LOCATION')).toBeNull();
  });

  it('shows stamp date when showDate=true', () => {
    const { getByText } = render(<PassportCard {...base} />);
    expect(getByText('JUN 4')).toBeTruthy();
  });

  it('hides stamp date when showDate=false', () => {
    const { queryByText } = render(<PassportCard {...base} showDate={false} />);
    expect(queryByText('JUN 4')).toBeNull();
  });
});

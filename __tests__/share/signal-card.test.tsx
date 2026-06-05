// __tests__/share/signal-card.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { SignalCard } from '../../src/share/signal-card';
import { CARD_STYLES } from '../../src/share/templates';
import type { SignalTokens } from '../../src/share/templates';

const tokens = CARD_STYLES.find(s => s.id === 'signal')!.variants[0].tokens as SignalTokens;

const base = {
  tokens,
  responseText: 'A red door.',
  createdAt: '2026-06-04T10:00:00.000Z',
  location: 'Melbourne, VIC',
  showDate: true,
  showLocation: true,
  entryMode: 'prompted' as const,
};

describe('SignalCard', () => {
  it('renders response text', () => {
    const { getByText } = render(<SignalCard {...base} />);
    expect(getByText('A red door.')).toBeTruthy();
  });

  it('shows location line when provided and showLocation=true', () => {
    const { getByText } = render(<SignalCard {...base} />);
    expect(getByText('📍 Melbourne, VIC')).toBeTruthy();
  });

  it('hides location line when showLocation=false', () => {
    const { queryByText } = render(<SignalCard {...base} showLocation={false} />);
    expect(queryByText('📍 Melbourne, VIC')).toBeNull();
  });

  it('hides location line when location is null', () => {
    const { queryByText } = render(<SignalCard {...base} location={null} />);
    expect(queryByText(/📍/)).toBeNull();
  });

  it('shows ISO date in date line when showDate=true', () => {
    const { getByText } = render(<SignalCard {...base} />);
    expect(getByText(/2026-06-04/)).toBeTruthy();
  });

  it('omits ISO date when showDate=false', () => {
    const { queryByText } = render(<SignalCard {...base} showDate={false} />);
    expect(queryByText(/2026-06-04/)).toBeNull();
  });

  it('shows "· prompted" suffix for prompted entries', () => {
    const { getByText } = render(<SignalCard {...base} />);
    expect(getByText(/· prompted/)).toBeTruthy();
  });

  it('shows "· freeform" suffix for freeform entries', () => {
    const { getByText } = render(<SignalCard {...base} entryMode="freeform" />);
    expect(getByText(/· freeform/)).toBeTruthy();
  });
});

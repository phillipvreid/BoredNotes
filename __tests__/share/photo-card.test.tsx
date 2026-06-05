// __tests__/share/photo-card.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { PhotoCard } from '../../src/share/photo-card';
import { CARD_STYLES } from '../../src/share/templates';
import type { PhotoTokens } from '../../src/share/templates';

const tokens = CARD_STYLES.find(s => s.id === 'photo')!.variants[0].tokens as PhotoTokens;

const base = {
  tokens,
  promptText: 'What did you notice today?',
  responseText: 'A red door.',
  createdAt: '2026-06-04T10:00:00.000Z',
  location: 'Melbourne, VIC',
  photoUri: null as string | null,
  showDate: true,
  showLocation: true,
  entryMode: 'prompted' as const,
};

describe('PhotoCard', () => {
  it('renders response text', () => {
    const { getByText } = render(<PhotoCard {...base} />);
    expect(getByText('A red door.')).toBeTruthy();
  });

  it('shows prompt for prompted entries', () => {
    const { getByText } = render(<PhotoCard {...base} />);
    expect(getByText('"What did you notice today?"')).toBeTruthy();
  });

  it('hides prompt for freeform entries', () => {
    const { queryByText } = render(
      <PhotoCard {...base} entryMode="freeform" promptText="" />
    );
    expect(queryByText(/"What did you notice today\?"/)).toBeNull();
  });

  it('shows caption with location · date when both enabled', () => {
    const { getByText } = render(<PhotoCard {...base} />);
    expect(getByText('Melbourne, VIC · Jun 4, 2026')).toBeTruthy();
  });

  it('shows date only when showLocation=false', () => {
    const { getByText } = render(<PhotoCard {...base} showLocation={false} />);
    expect(getByText('Jun 4, 2026')).toBeTruthy();
  });

  it('shows location only when showDate=false', () => {
    const { getByText } = render(<PhotoCard {...base} showDate={false} />);
    expect(getByText('Melbourne, VIC')).toBeTruthy();
  });

  it('renders photo Image when photoUri is provided', () => {
    const { getByTestId } = render(<PhotoCard {...base} photoUri="file:///photo.jpg" />);
    expect(getByTestId('photo-image')).toBeTruthy();
  });

  it('renders placeholder View when photoUri is null', () => {
    const { getByTestId } = render(<PhotoCard {...base} photoUri={null} />);
    expect(getByTestId('photo-placeholder')).toBeTruthy();
  });
});

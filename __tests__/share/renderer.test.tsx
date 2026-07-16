import React from 'react';
import { render, act } from '@testing-library/react-native';
import { openDatabaseAsync } from 'expo-sqlite';
import { ShareCard } from '../../src/share/renderer';
import { ThemeProvider } from '../../src/theme/ThemeContext';

const base = {
  promptText: 'What did you avoid today?',
  responseText: 'Literally all of it.',
  createdAt: '2026-07-10T10:00:00.000Z',
  location: 'Portland',
  showDate: true,
  showLocation: true,
  entryMode: 'prompted' as const,
  category: 'reflective' as const,
};

describe('ShareCard', () => {
  let db: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
    db.getFirstAsync.mockResolvedValue(null);
  });

  async function renderCard(props: React.ComponentProps<typeof ShareCard>) {
    const result = render(
      <ThemeProvider db={db}>
        <ShareCard {...props} />
      </ThemeProvider>,
    );
    await act(async () => {});
    return result;
  }

  it('renders the prompt and response for a prompted entry', async () => {
    const { getByText } = await renderCard(base);
    expect(getByText('What did you avoid today?')).toBeTruthy();
    expect(getByText('Literally all of it.')).toBeTruthy();
    expect(getByText("TODAY'S PROMPT")).toBeTruthy();
  });

  it('omits the prompt for a freeform entry and still shows the response', async () => {
    const { queryByText, getByText } = await renderCard({
      ...base,
      entryMode: 'freeform',
      promptText: '',
    });
    expect(queryByText('What did you avoid today?')).toBeNull();
    expect(getByText('Literally all of it.')).toBeTruthy();
  });

  it('shows the date-and-location footer meta', async () => {
    const { getByText } = await renderCard(base);
    expect(getByText('JUL 10 · Portland')).toBeTruthy();
  });
});

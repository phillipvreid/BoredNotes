import React from 'react';
import { render, act } from '@testing-library/react-native';
import { openDatabaseAsync } from 'expo-sqlite';
import { Sticker } from '../../src/components/ui/Sticker';
import { ThemeProvider } from '../../src/theme/ThemeContext';

describe('Sticker', () => {
  let db: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    db = await openDatabaseAsync('test.db');
    db.getFirstAsync.mockResolvedValue(null);
  });

  async function renderSticker(props: React.ComponentProps<typeof Sticker>) {
    const result = render(
      <ThemeProvider db={db}>
        <Sticker {...props} />
      </ThemeProvider>,
    );
    await act(async () => {});
    return result.toJSON() as any;
  }

  it('rasterizes on iOS when tilted, so rotated keylines stay crisp', async () => {
    const tilted = await renderSticker({ tilt: -1.5 });
    expect(tilted.props.shouldRasterizeIOS).toBe(true);
  });

  it('does not rasterize untilted stickers', async () => {
    const flat = await renderSticker({});
    expect(flat.props.shouldRasterizeIOS).toBeFalsy();
  });

  it('rasterizes pressable tilted stickers too', async () => {
    const pressable = await renderSticker({ tilt: 1.2, onPress: () => {} });
    expect(pressable.props.shouldRasterizeIOS).toBe(true);
  });
});

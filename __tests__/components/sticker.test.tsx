import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
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

  // Fabric's LayoutAnimation Transform::Interpolate walks both the old and new
  // transform op lists with a shared index; if press changes the list's length
  // or op order mid-animation, the app aborts (SIGABRT in Transform::Interpolate).
  // The transform must keep an identical op sequence in every press state.
  it('keeps the same transform op sequence pressed and unpressed', async () => {
    const opKeys = (json: any) =>
      (StyleSheet.flatten(json.props.style).transform ?? []).map(
        (op: object) => Object.keys(op)[0],
      );

    for (const tilt of [0, 1.2]) {
      const result = render(
        <ThemeProvider db={db}>
          <Sticker tilt={tilt} onPress={() => {}} />
        </ThemeProvider>,
      );
      await act(async () => {});
      const before = opKeys(result.toJSON());

      fireEvent(result.root, 'pressIn');
      await act(async () => {});
      const during = opKeys(result.toJSON());

      expect(during).toEqual(before);
    }
  });
});

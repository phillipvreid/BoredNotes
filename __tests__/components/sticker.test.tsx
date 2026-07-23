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

  // iOS renders a bordered, unclipped view as separate fill/border/shadow
  // layers, and the full-bounds fill layer leaks a hairline of its color past
  // the inset border — a white sliver between keyline and shadow. The fix
  // draws the keyline as a padded SOLID frame (no RN border) around an inner
  // fill, keeping everything on the single-layer path. Guard that structure so
  // nobody reintroduces a native border.
  it('draws the keyline as a padded solid frame, not a native border', async () => {
    const json = await renderSticker({ borderWidth: 3, radius: 16 });
    const frame = StyleSheet.flatten(json.props.style) as any;

    expect(frame.borderWidth).toBeUndefined();
    expect(frame.borderColor).toBeUndefined();
    expect(frame.padding).toBe(3); // keyline thickness = borderWidth
    expect(frame.borderRadius).toBe(16);
    expect(frame.backgroundColor).toBeTruthy(); // solid keyline color casts the shadow

    // Inner fill is inset by the keyline and carries its own (smaller) radius.
    const fill = StyleSheet.flatten(json.children[0].props.style) as any;
    expect(fill.borderRadius).toBe(13); // radius - borderWidth
    expect(fill.backgroundColor).toBeTruthy();
    expect(fill.backgroundColor).not.toBe(frame.backgroundColor); // fill ≠ keyline
  });

  it('routes layout props to the outer frame and padding to the inner fill', async () => {
    const json = await renderSticker({
      style: { alignSelf: 'flex-start', height: 52, paddingHorizontal: 13 },
    });
    const frame = StyleSheet.flatten(json.props.style) as any;
    const fill = StyleSheet.flatten(json.children[0].props.style) as any;

    expect(frame.alignSelf).toBe('flex-start');
    expect(frame.height).toBe(52);
    expect(frame.paddingHorizontal).toBeUndefined();

    expect(fill.paddingHorizontal).toBe(13);
    expect(fill.alignSelf).not.toBe('flex-start'); // stays stretched to fill the frame
  });

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

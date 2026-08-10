import React, { useState } from 'react';
import { Pressable, View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { KEYLINE, SHADOW_CARD } from '../../theme/tokens';

interface StickerProps {
  children?: React.ReactNode;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  shadow?: number;
  radius?: number;
  tilt?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Style keys that describe the sticker's OUTER box — where it sits and how big
// it is in its parent. These ride on the outer (shadow-casting) layer. Anything
// not listed here is treated as INNER content styling (padding, flexDirection,
// alignItems, gap, overflow, …) and rides on the fill layer that holds children.
const OUTER_KEYS = new Set<string>([
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'marginHorizontal', 'marginVertical', 'marginStart', 'marginEnd',
  'position', 'top', 'right', 'bottom', 'left', 'start', 'end',
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'flex', 'flexGrow', 'flexShrink', 'flexBasis',
  'alignSelf', 'zIndex', 'aspectRatio',
]);

function partitionStyle(style: StyleProp<ViewStyle>): { outer: ViewStyle; inner: ViewStyle } {
  const flat = StyleSheet.flatten(style) ?? {};
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const key of Object.keys(flat)) {
    (OUTER_KEYS.has(key) ? outer : inner)[key] = (flat as Record<string, unknown>)[key];
  }
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}

// The one surface recipe: keyline + flat offset shadow.
// Press = translate(2,2) and halve the shadow.
//
// Rendered as two nested SOLID layers (no RN border anywhere):
//   - outer = the keyline color, padded by borderWidth so the ring of color IS
//     the keyline; this layer casts the offset shadow.
//   - inner = the fill color, inset by that padding, holding the children.
// iOS renders a bordered, unclipped view as three separate layers (fill / border
// / shadow); the full-bounds fill layer then leaks a hairline of its color past
// the inset border layer, showing as a white sliver between keyline and shadow.
// Using solid backgrounds with borderWidth:0 keeps everything on the Core
// Animation single-layer path, so nothing can bleed.
export function Sticker({
  children, color, borderColor, borderWidth = KEYLINE, shadow = SHADOW_CARD,
  radius = 16, tilt = 0, onPress, onLongPress, disabled, style,
}: StickerProps) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);

  const offset = pressed ? Math.round(shadow / 2) : shadow;
  // Fabric's LayoutAnimation interpolates transforms op-by-op and aborts if the
  // op list changes length or order mid-animation (e.g. pressing a sticker while
  // the respond screen's keyboard LayoutAnimation runs). Keep the op sequence
  // fixed and vary only the values.
  const transform: ViewStyle['transform'] = [
    { translateX: pressed ? 2 : 0 },
    { translateY: pressed ? 2 : 0 },
    { rotate: `${tilt}deg` },
  ];

  const { outer, inner } = partitionStyle(style);

  const frame: StyleProp<ViewStyle> = [
    styles.base,
    {
      backgroundColor: borderColor ?? colors.border,
      borderRadius: radius,
      padding: borderWidth,
      shadowColor: colors.shadowColor,
      shadowOpacity: shadow > 0 ? colors.shadowOpacity : 0,
      shadowOffset: { width: offset, height: offset },
      elevation: shadow > 0 ? offset : 0,
      transform,
    },
    outer,
  ];

  const fill: StyleProp<ViewStyle> = [
    styles.fill,
    {
      backgroundColor: color ?? colors.surface,
      borderRadius: Math.max(0, radius - borderWidth),
    },
    inner,
  ];

  // Rotated layers don't edge-anti-alias on iOS; rasterizing the tilted
  // sticker keeps its keyline crisp. Untilted stickers skip the memory cost.
  const rasterize = tilt !== 0;

  const body = <View style={fill}>{children}</View>;

  if (!onPress && !onLongPress) {
    return <View style={frame} shouldRasterizeIOS={rasterize}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={frame}
      shouldRasterizeIOS={rasterize}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { shadowRadius: 0 },
  // Fill the frame's content box so fixed-height / flex callers keep their
  // geometry, while wrap-content callers still size to their children
  // (flexBasis:auto keeps the base size content-driven, not zero).
  fill: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', alignSelf: 'stretch' },
});

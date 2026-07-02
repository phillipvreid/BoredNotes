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

// The one surface recipe: keyline + flat offset shadow.
// Press = translate(2,2) and halve the shadow.
export function Sticker({
  children, color, borderColor, borderWidth = KEYLINE, shadow = SHADOW_CARD,
  radius = 16, tilt = 0, onPress, onLongPress, disabled, style,
}: StickerProps) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);

  const offset = pressed ? Math.round(shadow / 2) : shadow;
  const transform: ViewStyle['transform'] = [
    ...(pressed ? [{ translateX: 2 }, { translateY: 2 }] as const : []),
    ...(tilt !== 0 ? [{ rotate: `${tilt}deg` }] as const : []),
  ];

  const surface: StyleProp<ViewStyle> = [
    styles.base,
    {
      backgroundColor: color ?? colors.surface,
      borderColor: borderColor ?? colors.border,
      borderWidth,
      borderRadius: radius,
      shadowColor: colors.shadowColor,
      shadowOpacity: shadow > 0 ? colors.shadowOpacity : 0,
      shadowOffset: { width: offset, height: offset },
      elevation: shadow > 0 ? offset : 0,
      transform,
    },
    style,
  ];

  if (!onPress && !onLongPress) {
    return <View style={surface}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={surface}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { shadowRadius: 0 },
});

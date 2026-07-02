import React from 'react';
import { Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Sticker } from './Sticker';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../theme/tokens';

interface ChipProps {
  label: string;
  active?: boolean;
  activeColor?: string;   // category hue when active; defaults to inverted ink
  activeInk?: string;
  onPress?: () => void;
  shadow?: number;
  style?: StyleProp<ViewStyle>;
}

// Space Mono pill — filters, share targets, small selectable labels.
export function Chip({ label, active, activeColor, activeInk = '#fff', onPress, shadow = 0, style }: ChipProps) {
  const { colors, isDark } = useTheme();
  const invertedBg = isDark ? '#F4EEDF' : '#141414';
  const invertedFg = isDark ? '#141414' : '#fff';
  const bg = active ? (activeColor ?? invertedBg) : colors.surface;
  const fg = active ? (activeColor ? activeInk : invertedFg) : colors.textPrimary;

  return (
    <Sticker color={bg} shadow={shadow} radius={999} onPress={onPress} style={[styles.chip, style]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Sticker>
  );
}

const styles = StyleSheet.create({
  chip: { paddingVertical: 7, paddingHorizontal: 12, alignSelf: 'flex-start' },
  label: { fontFamily: FONTS.label, fontSize: 11, letterSpacing: 0.5 },
});

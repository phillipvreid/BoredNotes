import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../theme/tokens';

interface OutlinedNumberProps {
  value: string;
  size?: number;
  tilt?: number;
}

// The kit's rank-slot numeral: transparent fill with an ink stroke. React Native
// has no text-stroke, so stack offset ink copies under a surface-colored fill.
const STROKE_OFFSETS: Array<[number, number]> = [
  [-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5],
  [-1, -1], [1, -1], [-1, 1], [1, 1],
];

export function OutlinedNumber({ value, size = 40, tilt = 0 }: OutlinedNumberProps) {
  const { colors } = useTheme();
  const textStyle = { fontFamily: FONTS.display, fontSize: size, lineHeight: size * 1.1 };

  return (
    <View style={[styles.box, { width: size + 6, height: size * 1.1, transform: [{ rotate: `${tilt}deg` }] }]}>
      {STROKE_OFFSETS.map(([x, y], i) => (
        <Text
          key={i}
          style={[styles.copy, textStyle, { color: colors.textPrimary, left: x + 3, top: y }]}
        >
          {value}
        </Text>
      ))}
      <Text style={[styles.copy, textStyle, { color: colors.surface, left: 3, top: 0 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  copy: { position: 'absolute', textAlign: 'center', width: '100%' },
});

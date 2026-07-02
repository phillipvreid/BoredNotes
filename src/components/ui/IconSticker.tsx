import React from 'react';
import { Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Sticker } from './Sticker';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS, SHADOW_SM } from '../../theme/tokens';

interface IconStickerProps {
  glyph?: string;          // e.g. '←' — omit for the three-dot menu
  menu?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

// The 40×40 square sticker used for back buttons and the home menu.
export function IconSticker({ glyph, menu, onPress, style }: IconStickerProps) {
  const { colors } = useTheme();
  return (
    <Sticker shadow={SHADOW_SM} radius={11} onPress={onPress} style={[styles.box, style]}>
      {menu ? (
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: colors.textPrimary }]} />
          <View style={[styles.dot, { backgroundColor: colors.textPrimary }]} />
          <View style={[styles.dot, { backgroundColor: colors.textPrimary }]} />
        </View>
      ) : (
        <Text style={[styles.glyph, { color: colors.textPrimary }]}>{glyph}</Text>
      )}
    </Sticker>
  );
}

const styles = StyleSheet.create({
  box: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontFamily: FONTS.bodyExtraBold, fontSize: 19, lineHeight: 22 },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});

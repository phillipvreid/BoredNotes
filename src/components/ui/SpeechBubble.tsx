import React from 'react';
import { Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Sticker } from './Sticker';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS, SHADOW_SM } from '../../theme/tokens';

interface SpeechBubbleProps {
  children: string;
  kicker?: string;
  style?: StyleProp<ViewStyle>;
}

// The mascot's heckle. Its −2° tilt is constant — never randomize it.
export function SpeechBubble({ children, kicker, style }: SpeechBubbleProps) {
  const { colors } = useTheme();
  return (
    <Sticker color={colors.bubbleBg} shadow={SHADOW_SM} radius={14} tilt={-2} style={[styles.bubble, style]}>
      {kicker != null && (
        <Text style={[styles.kicker, { color: colors.textMuted }]}>{kicker}</Text>
      )}
      <Text style={[styles.text, { color: colors.bubbleInk }]}>{children}</Text>
    </Sticker>
  );
}

const styles = StyleSheet.create({
  bubble: { paddingVertical: 11, paddingHorizontal: 13 },
  kicker: { fontFamily: FONTS.label, fontSize: 9, letterSpacing: 1, marginBottom: 3 },
  text: { fontFamily: FONTS.display, fontSize: 16, lineHeight: 18 },
});

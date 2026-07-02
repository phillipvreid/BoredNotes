import React from 'react';
import { Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Sticker } from './Sticker';
import { ACTION, INK, FONTS, KEYLINE_HEAVY, SHADOW_CARD } from '../../theme/tokens';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  arrow?: boolean;
  size?: 'md' | 'lg';
  disabled?: boolean;
  block?: boolean;
  style?: StyleProp<ViewStyle>;
}

// The CTA. Yellow is reserved: this is the only thing that gets to be yellow.
export function ActionButton({ label, onPress, arrow = true, size = 'md', disabled, block, style }: ActionButtonProps) {
  const lg = size === 'lg';
  return (
    <Sticker
      color={ACTION}
      borderColor={INK}
      borderWidth={KEYLINE_HEAVY}
      shadow={SHADOW_CARD}
      radius={lg ? 16 : 14}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        lg ? styles.lg : styles.md,
        block && styles.block,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, { fontSize: lg ? 20 : 18 }]}>{label}</Text>
      {arrow && <Text style={[styles.label, { fontSize: lg ? 22 : 18 }]}>→</Text>}
    </Sticker>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  md: { paddingVertical: 13, paddingHorizontal: 24 },
  lg: { paddingVertical: 15, paddingHorizontal: 18 },
  block: { alignSelf: 'stretch' },
  disabled: { opacity: 0.45 },
  label: { fontFamily: FONTS.display, color: INK, letterSpacing: -0.3 },
});

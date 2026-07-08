import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import { ACTION, INK, MASCOT, MASCOT_MOUTH } from '../../theme/tokens';

interface MascotProps {
  size?: number;          // width; height is derived (per the kit's 96×87 ratio)
  variant?: 'red' | 'yellow';
  bob?: boolean;
  bobDirection?: 'left' | 'right';
}

// Placeholder mascot from the kit: a bored, bobbing, blinking blob.
// Production swaps in an illustrated character; this reserves the space and the attitude.
export function Mascot({ size = 96, variant = 'red', bob = true, bobDirection = 'left' }: MascotProps) {
  const bobAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!bob) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(5000),
        Animated.timing(blinkAnim, { toValue: 0.1, duration: 90, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 90, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const h = size * (87 / 96);
  const s = size / 96; // scale factor against the kit's reference blob
  const dir = bobDirection === 'left' ? 1 : -1;
  const translateY = bobAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -7 * s] });
  const rotate = bobAnim.interpolate({ inputRange: [0, 1], outputRange: [`${-3 * dir}deg`, `${3 * dir}deg`] });

  const body = variant === 'red' ? MASCOT : ACTION;
  const kl = Math.max(1.5, 3 * s);

  return (
    // A transform whose op list changes shape crashes Fabric's LayoutAnimation
    // interpolator, so keep both ops present and neutralize them when not bobbing.
    <Animated.View style={{ width: size, height: h, transform: [{ translateY: bob ? translateY : 0 }, { rotate: bob ? rotate : '0deg' }] }}>
      <View style={[styles.body, {
        backgroundColor: body, borderWidth: kl,
        borderTopLeftRadius: size * 0.5, borderTopRightRadius: size * 0.5,
        borderBottomLeftRadius: size * 0.44, borderBottomRightRadius: size * 0.44,
      }]} />
      {variant === 'red' && (
        <>
          <View style={[styles.brow, { top: 15 * s, left: 22 * s, width: 8 * s, height: Math.max(2, 3 * s), transform: [{ rotate: '-22deg' }] }]} />
          <View style={[styles.brow, { top: 15 * s, left: 61 * s, width: 8 * s, height: Math.max(2, 3 * s), transform: [{ rotate: '22deg' }] }]} />
        </>
      )}
      <Animated.View style={[styles.eye, { top: 24 * s, left: 22 * s, width: 17 * s, height: 17 * s, borderRadius: 9 * s, borderWidth: Math.max(1.5, 2 * s), transform: [{ scaleY: blinkAnim }] }]}>
        <View style={[styles.pupil, { top: 4 * s, left: 5 * s, width: 8 * s, height: 8 * s, borderRadius: 4 * s }]} />
      </Animated.View>
      <Animated.View style={[styles.eye, { top: 24 * s, left: 54 * s, width: 17 * s, height: 17 * s, borderRadius: 9 * s, borderWidth: Math.max(1.5, 2 * s), transform: [{ scaleY: blinkAnim }] }]}>
        <View style={[styles.pupil, { top: 4 * s, left: 5 * s, width: 8 * s, height: 8 * s, borderRadius: 4 * s }]} />
      </Animated.View>
      <View style={[styles.mouth, { top: 50 * s, left: 35 * s, width: 24 * s, height: 18 * s, borderBottomLeftRadius: 12 * s, borderBottomRightRadius: 12 * s }]} />
      {variant === 'red' && (
        <View style={[styles.tongue, { top: 59 * s, left: 41 * s, width: 12 * s, height: 8 * s, borderBottomLeftRadius: 8 * s, borderBottomRightRadius: 8 * s }]} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderColor: INK },
  brow: { position: 'absolute', backgroundColor: INK, borderRadius: 3 },
  eye: { position: 'absolute', backgroundColor: '#fff', borderColor: INK, overflow: 'hidden' },
  pupil: { position: 'absolute', backgroundColor: INK },
  mouth: { position: 'absolute', backgroundColor: INK },
  tongue: { position: 'absolute', backgroundColor: MASCOT_MOUTH },
});

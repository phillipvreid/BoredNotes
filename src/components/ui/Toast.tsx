import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS, KEYLINE_HEAVY, MASCOT } from '../../theme/tokens';
import { SAVED_TOASTS, SAVED_TOAST_MS, pick } from '../../theme/copy';

interface ToastContextValue {
  showToast: (message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// Hosts the "SAVED. POINTLESS. PERFECT." sticker over whatever screen is up.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg?: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setMessage(msg ?? pick(SAVED_TOASTS));
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setMessage(null));
    }, SAVED_TOAST_MS);
  }, [anim]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message !== null && <ToastCard message={message} anim={anim} />}
    </ToastContext.Provider>
  );
}

function ToastCard({ message, anim }: { message: string; anim: Animated.Value }) {
  const { colors } = useTheme();
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity: anim, transform: [{ translateY }] }]}
    >
      <View style={[styles.card, {
        backgroundColor: colors.toastBg,
        borderColor: colors.toastBorder,
        shadowColor: colors.shadowColor,
      }]}
      >
        <View style={styles.blob}>
          <View style={styles.blobBody} />
          <View style={[styles.blobEye, { left: 7 }]} />
          <View style={[styles.blobEye, { left: 17 }]} />
          <View style={styles.blobMouth} />
        </View>
        <Text style={[styles.label, { color: colors.toastInk }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 64, alignItems: 'center', zIndex: 30 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    borderWidth: KEYLINE_HEAVY, borderRadius: 16,
    paddingVertical: 13, paddingHorizontal: 20,
    shadowOpacity: 0.22, shadowRadius: 0, shadowOffset: { width: 6, height: 6 }, elevation: 6,
  },
  blob: { width: 30, height: 28 },
  blobBody: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: MASCOT, borderWidth: 2, borderColor: '#fff',
    borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomLeftRadius: 13, borderBottomRightRadius: 13,
  },
  blobEye: { position: 'absolute', top: 10, width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },
  blobMouth: { position: 'absolute', top: 17, left: 10, width: 9, height: 4, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, backgroundColor: '#fff' },
  label: { fontFamily: FONTS.label, fontSize: 14, letterSpacing: 0.5 },
});

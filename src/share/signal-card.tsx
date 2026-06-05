import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SignalTokens } from './templates';

export interface SignalCardProps {
  tokens: SignalTokens;
  responseText: string;
  createdAt: string | null;
  location: string | null;
  showDate: boolean;
  showLocation: boolean;
  entryMode: 'prompted' | 'freeform';
}

export const SignalCard = React.forwardRef<View, SignalCardProps>(
  ({ tokens: t, responseText, createdAt, location, showDate, showLocation, entryMode }, ref) => {
    const showLoc = showLocation && !!location;
    const modeLabel = entryMode === 'freeform' ? 'freeform' : 'prompted';
    const isoDate = createdAt ? createdAt.slice(0, 10) : '';
    const dateLine = showDate && isoDate ? `${isoDate} · ${modeLabel}` : `· ${modeLabel}`;

    return (
      <View ref={ref} style={[styles.card, { backgroundColor: t.bg, borderColor: t.border }]}>
        <View style={[styles.accentBar, { backgroundColor: t.accent }]} />
        <View style={styles.inner}>
          <Text style={[styles.quote, { color: t.quoteColor }]}>{'"'}</Text>
          <Text style={[styles.response, { color: t.text }]}>{responseText}</Text>
          <View style={[styles.divider, { backgroundColor: t.divider }]} />
          <View style={styles.footer}>
            <View style={styles.meta}>
              {showLoc && (
                <Text style={[styles.loc, { color: t.accent }]}>{`📍 ${location}`}</Text>
              )}
              <Text style={[styles.dateText, { color: t.dateMuted }]}>{dateLine}</Text>
            </View>
            <Text style={[styles.brand, { color: t.text }]}>borednotes</Text>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: { width: 320, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  accentBar: { height: 3 },
  inner: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 20, gap: 9 },
  quote: { fontSize: 52, lineHeight: 34, fontFamily: 'Georgia' },
  response: { fontSize: 14, lineHeight: 22.7 },
  divider: { height: 1, marginVertical: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { gap: 3, flex: 1 },
  loc: { fontSize: 10, fontFamily: 'Courier New', letterSpacing: 0.4 },
  dateText: { fontSize: 10, fontFamily: 'Courier New', letterSpacing: 0.4 },
  brand: { fontSize: 8.5, letterSpacing: 2, opacity: 0.2 },
});

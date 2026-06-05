import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PassportTokens } from './templates';

export interface PassportCardProps {
  tokens: PassportTokens;
  promptText: string;
  responseText: string;
  createdAt: string | null;
  location: string | null;
  showDate: boolean;
  showLocation: boolean;
  entryMode: 'prompted' | 'freeform';
}

function stampParts(createdAt: string | null, showDate: boolean) {
  if (!showDate || !createdAt) return { monthDay: '---', year: '----' };
  const d = new Date(createdAt);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return { monthDay: `${months[d.getUTCMonth()]} ${d.getUTCDate()}`, year: String(d.getUTCFullYear()) };
}

function mrzDateStr(createdAt: string | null, showDate: boolean): string {
  if (!showDate || !createdAt) return '<<<<<<<<';
  return createdAt.slice(0, 10).replace(/-/g, '');
}

export const PassportCard = React.forwardRef<View, PassportCardProps>(
  ({ tokens: t, promptText, responseText, createdAt, location, showDate, showLocation, entryMode }, ref) => {
    const stamp = stampParts(createdAt, showDate);
    const showLoc = showLocation && !!location;
    const showPrompt = entryMode === 'prompted' && !!promptText;

    return (
      <View ref={ref} style={[styles.card, { backgroundColor: t.bg, borderColor: t.border }]}>
        <View style={[styles.topbar, { backgroundColor: t.topbar }]} />
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={[styles.brand, { color: t.brand }]}>BOREDNOTES</Text>
            <View style={[styles.stamp, { borderColor: t.stampRing }]}>
              <Text style={[styles.stampSmall, { color: t.stampLabel }]}>entry</Text>
              <Text style={[styles.stampDate, { color: showDate ? t.stampDate : t.stampLabel }]}>
                {stamp.monthDay}
              </Text>
              <Text style={[styles.stampSmall, { color: t.stampLabel }]}>{stamp.year}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: t.divider }]} />
          <Text style={[styles.response, { color: t.text }]}>{responseText}</Text>
          {(showLoc || showPrompt) && (
            <View style={styles.metaRow}>
              {showLoc && (
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: t.meta }]}>LOCATION</Text>
                  <Text style={[styles.metaValue, { color: t.meta }]}>{location}</Text>
                </View>
              )}
              {showPrompt && (
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: t.meta }]}>PROMPT</Text>
                  <Text style={[styles.metaValue, { color: t.meta }]}>{promptText}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View style={[styles.mrz, { backgroundColor: t.mrzBg, borderTopColor: t.mrzBorder }]}>
          <Text style={[styles.mrzText, { color: t.mrzText }]}>
            {'P<BNBOREDNOTES<<<<<<<<<<<<<<<<<<<<<<<<'}
          </Text>
          <Text style={[styles.mrzText, { color: t.mrzText }]}>
            {`${mrzDateStr(createdAt, showDate)}<<<ENTRY<<<<<<<<<<<<<<<<<<<<<<`}
          </Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: { width: 320, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  topbar: { height: 3 },
  inner: { paddingTop: 20, paddingHorizontal: 22, paddingBottom: 16, gap: 11 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontSize: 9, letterSpacing: 2.2 },
  stamp: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', gap: 1,
  },
  stampSmall: { fontSize: 6, letterSpacing: 1.2 },
  stampDate: { fontSize: 8, fontWeight: '700' },
  divider: { height: 1 },
  response: { fontSize: 13.5, fontStyle: 'italic', lineHeight: 22, fontFamily: 'Georgia' },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 7.5, letterSpacing: 1, fontWeight: '700', marginBottom: 1 },
  metaValue: { fontSize: 10 },
  mrz: { paddingVertical: 9, paddingHorizontal: 12, borderTopWidth: 1 },
  mrzText: { fontFamily: 'Courier New', fontSize: 7, letterSpacing: 0.4, lineHeight: 12 },
});

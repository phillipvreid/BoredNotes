import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { getDb } from '../src/db/database';
import { getEntriesForMonthDay, getEntriesInRange } from '../src/db/entries';
import { useTheme } from '../src/theme/ThemeContext';
import type { Entry } from '../src/types';

type Period = 'week' | 'month' | 'year';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function periodRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const to = isoDate(now);
  if (period === 'week') {
    const from = new Date(now); from.setDate(now.getDate() - 7);
    return { from: isoDate(from), to };
  }
  if (period === 'month') {
    const from = new Date(now); from.setMonth(now.getMonth() - 1);
    return { from: isoDate(from), to };
  }
  const from = new Date(now); from.setFullYear(now.getFullYear() - 1);
  return { from: isoDate(from), to };
}

export default function ReflectScreen() {
  const { colors, accent } = useTheme();
  const [onThisDay, setOnThisDay] = useState<Entry[]>([]);
  const [period, setPeriod] = useState<Period>('week');
  const [periodEntries, setPeriodEntries] = useState<Entry[]>([]);
  const now = new Date();

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const otd = await getEntriesForMonthDay(db, now.getMonth() + 1, now.getDate());
      const today = isoDate(now);
      setOnThisDay(otd.filter(e => e.created_at.slice(0, 10) !== today));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const { from, to } = periodRange(period);
      setPeriodEntries(await getEntriesInRange(db, from, to));
    })();
  }, [period]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backTxt, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Reflect</Text>

        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>On this day</Text>
        {onThisDay.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>No entries from this date in past years yet.</Text>
        ) : (
          onThisDay.map(entry => (
            <TouchableOpacity
              key={entry.id}
              style={[styles.card, {
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                shadowColor: colors.shadowColor,
                shadowOpacity: colors.shadowOpacity,
              }]}
              onPress={() => router.push(`/entry/${entry.id}`)}
            >
              <Text style={[styles.yearBadge, { color: accent.labelColor }]}>{entry.created_at.slice(0, 4)}</Text>
              <Text style={[styles.cardPrompt, { color: colors.textSecondary }]} numberOfLines={1}>{entry.prompt_text}</Text>
              <Text style={[styles.cardResponse, { color: colors.textPrimary }]} numberOfLines={3}>{entry.response_text}</Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>Browse</Text>
        <View style={styles.tabs}>
          {(['week','month','year'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.tab, { backgroundColor: period === p ? accent.buttonColor : colors.surface }]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.tabTxt, { color: period === p ? '#fff' : colors.textSecondary }]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.periodCount, { color: colors.textMuted }]}>{periodEntries.length} {periodEntries.length === 1 ? 'entry' : 'entries'} this {period}</Text>
        {periodEntries.map(entry => (
          <TouchableOpacity
            key={entry.id}
            style={[styles.card, {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
              shadowOpacity: colors.shadowOpacity,
            }]}
            onPress={() => router.push(`/entry/${entry.id}`)}
          >
            <Text style={[styles.cardDate, { color: colors.textMuted }]}>{entry.created_at.slice(0, 10)}</Text>
            <Text style={[styles.cardPrompt, { color: colors.textSecondary }]} numberOfLines={1}>{entry.prompt_text}</Text>
            <Text style={[styles.cardResponse, { color: colors.textPrimary }]} numberOfLines={3}>{entry.response_text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  back: { paddingVertical: 4 },
  backTxt: { fontSize: 15 },
  title: { fontSize: 28, fontWeight: '700' },
  sectionHead: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  card: { borderRadius: 12, padding: 16, gap: 6, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  yearBadge: { fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 11 },
  cardPrompt: { fontSize: 11, fontStyle: 'italic' },
  cardResponse: { fontSize: 15, lineHeight: 22, fontFamily: 'Georgia', fontStyle: 'italic' },
  empty: { fontSize: 14 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabTxt: { fontSize: 13, fontWeight: '500' },
  periodCount: { fontSize: 13 },
});

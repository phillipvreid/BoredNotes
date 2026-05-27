import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { getDb } from '../src/db/database';
import { getEntriesForMonthDay, getEntriesInRange } from '../src/db/entries';
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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reflect</Text>

        <Text style={styles.sectionHead}>On this day</Text>
        {onThisDay.length === 0 ? (
          <Text style={styles.empty}>No entries from this date in past years yet.</Text>
        ) : (
          onThisDay.map(entry => (
            <TouchableOpacity
              key={entry.id}
              style={styles.card}
              onPress={() => router.push(`/entry/${entry.id}`)}
            >
              <Text style={styles.yearBadge}>{entry.created_at.slice(0, 4)}</Text>
              <Text style={styles.cardPrompt} numberOfLines={1}>{entry.prompt_text}</Text>
              <Text style={styles.cardResponse} numberOfLines={3}>{entry.response_text}</Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.sectionHead}>Browse</Text>
        <View style={styles.tabs}>
          {(['week','month','year'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.tab, period === p && styles.activeTab]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.tabTxt, period === p && styles.activeTabTxt]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.periodCount}>{periodEntries.length} {periodEntries.length === 1 ? 'entry' : 'entries'} this {period}</Text>
        {periodEntries.map(entry => (
          <TouchableOpacity
            key={entry.id}
            style={styles.card}
            onPress={() => router.push(`/entry/${entry.id}`)}
          >
            <Text style={styles.cardDate}>{entry.created_at.slice(0, 10)}</Text>
            <Text style={styles.cardPrompt} numberOfLines={1}>{entry.prompt_text}</Text>
            <Text style={styles.cardResponse} numberOfLines={3}>{entry.response_text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  back: { paddingVertical: 4 },
  backTxt: { color: '#888', fontSize: 15 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  sectionHead: { fontSize: 13, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  card: { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16, gap: 6 },
  yearBadge: { fontSize: 11, fontWeight: '700', color: '#7c6af7' },
  cardDate: { fontSize: 11, color: '#bbb' },
  cardPrompt: { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
  cardResponse: { fontSize: 15, color: '#333', lineHeight: 22 },
  empty: { color: '#bbb', fontSize: 14 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f4f4f4', alignItems: 'center' },
  activeTab: { backgroundColor: '#1a1a1a' },
  tabTxt: { fontSize: 13, color: '#555', fontWeight: '500' },
  activeTabTxt: { color: '#fff' },
  periodCount: { fontSize: 13, color: '#aaa' },
});

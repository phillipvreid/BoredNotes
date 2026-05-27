import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { getDb } from '../src/db/database';
import { getDatesWithEntries, getEntriesForDate } from '../src/db/entries';
import type { Entry } from '../src/types';

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function TimelineScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [datesWithEntries, setDatesWithEntries] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayEntries, setDayEntries] = useState<Entry[]>([]);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const ym = `${year}-${String(month + 1).padStart(2, '0')}`;
      const dates = await getDatesWithEntries(db, ym);
      setDatesWithEntries(new Set(dates));
      setSelectedDate(null);
      setDayEntries([]);
    })();
  }, [year, month]);

  async function handleDayPress(dateStr: string) {
    setSelectedDate(dateStr);
    const db = await getDb();
    const entries = await getEntriesForDate(db, dateStr);
    setDayEntries(entries);
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const days = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  const cells = Array.from({ length: startDay + days }, (_, i) =>
    i < startDay ? null : i - startDay + 1
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Timeline</Text>

        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth}><Text style={styles.navArrow}>‹</Text></TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth}><Text style={styles.navArrow}>›</Text></TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <Text key={d} style={styles.dayHeader}>{d}</Text>
          ))}
          {cells.map((day, i) => {
            if (!day) return <View key={`e${i}`} style={styles.cell} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEntry = datesWithEntries.has(dateStr);
            const isSelected = selectedDate === dateStr;
            return (
              <TouchableOpacity
                key={dateStr}
                style={[styles.cell, isSelected && styles.selectedCell]}
                onPress={() => hasEntry && handleDayPress(dateStr)}
                disabled={!hasEntry}
              >
                <Text style={[styles.dayNum, !hasEntry && styles.emptyDay, isSelected && styles.selectedDayNum]}>
                  {day}
                </Text>
                {hasEntry && <View style={[styles.dot, isSelected && styles.selectedDot]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDate && dayEntries.map(entry => (
          <TouchableOpacity
            key={entry.id}
            style={styles.entryCard}
            onPress={() => router.push(`/entry/${entry.id}`)}
          >
            <Text style={styles.entryPrompt}>{entry.prompt_text}</Text>
            <Text style={styles.entryResponse} numberOfLines={3}>{entry.response_text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  back: { paddingVertical: 4 },
  backTxt: { color: '#888', fontSize: 15 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navArrow: { fontSize: 28, color: '#555', paddingHorizontal: 12 },
  monthLabel: { fontSize: 17, fontWeight: '600', color: '#222' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  selectedCell: { backgroundColor: '#1a1a1a', borderRadius: 8 },
  dayHeader: { width: '14.28%', textAlign: 'center', fontSize: 11, color: '#aaa', paddingVertical: 6 },
  dayNum: { fontSize: 14, color: '#333' },
  emptyDay: { color: '#ccc' },
  selectedDayNum: { color: '#fff' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#555' },
  selectedDot: { backgroundColor: '#fff' },
  entryCard: { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16, gap: 6 },
  entryPrompt: { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
  entryResponse: { fontSize: 15, color: '#333', lineHeight: 22 },
});

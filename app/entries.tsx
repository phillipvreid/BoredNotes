import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getDb } from '../src/db/database';
import { getAllEntries, searchEntries } from '../src/db/entries';
import { useTheme } from '../src/theme/ThemeContext';
import type { Entry } from '../src/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(entries: Entry[]): { date: string; items: Entry[] }[] {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const d = e.created_at.slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(e);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export default function EntriesScreen() {
  const { colors, accent } = useTheme();
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);

  useFocusEffect(
    useCallback(() => { loadEntries(''); }, [])
  );

  async function loadEntries(q: string) {
    const db = await getDb();
    const results = q.trim() ? await searchEntries(db, q) : await getAllEntries(db);
    setEntries(results);
  }

  function handleSearch(q: string) {
    setQuery(q);
    loadEntries(q);
  }

  const grouped = groupByDate(entries);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backTxt, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Entries</Text>

        <TextInput
          style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Search…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />

        <FlatList
          data={grouped}
          keyExtractor={g => g.date}
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <Text style={[styles.dateHeader, { color: colors.textMuted }]}>{formatDate(group.date)}</Text>
              {group.items.map(entry => (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.card, {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    shadowColor: colors.shadowColor,
                    shadowOpacity: colors.shadowOpacity,
                  }]}
                  onPress={() => router.push(`/entry/${entry.id}`)}
                >
                  <Text style={[styles.cardPrompt, { color: accent.labelColor }]} numberOfLines={1}>{entry.prompt_text}</Text>
                  <Text style={[styles.cardResponse, { color: colors.textPrimary }]} numberOfLines={3}>{entry.response_text}</Text>
                  {entry.location_label && (
                    <Text style={[styles.cardMeta, { color: colors.textMuted }]}>📍 {entry.location_label}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {query ? 'No entries match your search.' : 'No entries yet. Respond to a prompt!'}
            </Text>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 20, gap: 12 },
  back: { paddingVertical: 4 },
  backTxt: { fontSize: 15 },
  title: { fontSize: 28, fontWeight: '700' },
  search: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  group: { gap: 10, marginBottom: 24 },
  dateHeader: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { borderRadius: 12, padding: 16, gap: 6, borderWidth: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  cardPrompt: { fontSize: 11, fontStyle: 'italic' },
  cardResponse: { fontSize: 15, lineHeight: 22, fontFamily: 'Georgia', fontStyle: 'italic' },
  cardMeta: { fontSize: 11 },
  empty: { textAlign: 'center', marginTop: 60, fontSize: 15 },
});

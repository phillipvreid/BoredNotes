import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getDb } from '../src/db/database';
import { getAllEntries, searchEntries } from '../src/db/entries';
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
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadEntries('');
    }, [])
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Entries</Text>

        <TextInput
          style={styles.search}
          placeholder="Search…"
          placeholderTextColor="#bbb"
          value={query}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />

        <FlatList
          data={grouped}
          keyExtractor={g => g.date}
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <Text style={styles.dateHeader}>{formatDate(group.date)}</Text>
              {group.items.map(entry => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.card}
                  onPress={() => router.push(`/entry/${entry.id}`)}
                >
                  <Text style={styles.cardPrompt} numberOfLines={1}>{entry.prompt_text}</Text>
                  <Text style={styles.cardResponse} numberOfLines={3}>{entry.response_text}</Text>
                  {entry.location_label && (
                    <Text style={styles.cardMeta}>📍 {entry.location_label}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>{query ? 'No entries match your search.' : 'No entries yet. Respond to a prompt!'}</Text>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20, gap: 12 },
  back: { paddingVertical: 4 },
  backTxt: { color: '#888', fontSize: 15 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  search: { backgroundColor: '#f4f4f4', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#222' },
  group: { gap: 10, marginBottom: 24 },
  dateHeader: { fontSize: 13, fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16, gap: 6 },
  cardPrompt: { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
  cardResponse: { fontSize: 15, color: '#333', lineHeight: 22 },
  cardMeta: { fontSize: 11, color: '#bbb' },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 60, fontSize: 15 },
});

import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getDb } from '../db/database';
import { getAllEntries, searchEntries } from '../db/entries';
import { useTheme } from '../theme/ThemeContext';
import type { Entry } from '../types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
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

export function FeedTab() {
  const { colors, accent } = useTheme();
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);

  useFocusEffect(
    useCallback(() => {
      setQuery('');
      loadEntries('');
    }, [])
  );

  async function loadEntries(q: string) {
    const db = await getDb();
    const results = q.trim()
      ? await searchEntries(db, q)
      : await getAllEntries(db);
    setEntries(results);
  }

  function handleSearch(q: string) {
    setQuery(q);
    loadEntries(q);
  }

  const grouped = groupByDate(entries);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.search, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.textPrimary,
        }]}
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
            <Text style={[styles.dateHeader, { color: colors.textMuted }]}>
              {formatDate(group.date)}
            </Text>
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
                {entry.entry_mode !== 'freeform' && (
                  <Text
                    style={[styles.cardPrompt, { color: accent.labelColor }]}
                    numberOfLines={1}
                  >
                    {entry.prompt_text}
                  </Text>
                )}
                <Text
                  style={[styles.cardResponse, { color: colors.textPrimary }]}
                  numberOfLines={3}
                >
                  {entry.response_text}
                </Text>
                {(entry.location_label || !!entry.has_photo) && (
                  <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                    {[entry.location_label ? `📍 ${entry.location_label}` : null, entry.has_photo ? '🖼' : null].filter(Boolean).join('  ·  ')}
                  </Text>
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
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  search: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, marginBottom: 12,
  },
  listContent: { paddingBottom: 32 },
  group: { gap: 10, marginBottom: 24 },
  dateHeader: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    borderRadius: 12, padding: 16, gap: 6, borderWidth: 1,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  cardPrompt: { fontSize: 11, fontStyle: 'italic' },
  cardResponse: { fontSize: 15, lineHeight: 22, fontFamily: 'Georgia', fontStyle: 'italic' },
  cardMeta: { fontSize: 11 },
  empty: { textAlign: 'center', marginTop: 60, fontSize: 15 },
});

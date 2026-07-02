import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import type { PinnedEntry } from '../types';

interface Props {
  entries: PinnedEntry[];
}

export function PlaceFeedList({ entries }: Props) {
  const { colors } = useTheme();

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No entries here yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.list}>
      {entries.map(entry => (
        <TouchableOpacity
          key={entry.id}
          style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          onPress={() => router.push(`/entry/${entry.id}`)}
        >
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {[
              new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              entry.entry_mode === 'freeform' ? 'freeform' : null,
              entry.has_photo ? '🖼' : null,
            ].filter(Boolean).join('  ·  ')}
          </Text>
          <Text style={[styles.snippet, { color: colors.textPrimary }]} numberOfLines={2}>
            {entry.response_text}
          </Text>
          <Text style={[styles.cta, { color: colors.textPrimary }]}>Open →</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  row: {
    borderRadius: 12, borderWidth: 1, padding: 14, gap: 6,
  },
  date: { fontSize: 11 },
  snippet: { fontSize: 15, fontFamily: 'Georgia', fontStyle: 'italic', lineHeight: 22 },
  cta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 15, fontFamily: 'Georgia', fontStyle: 'italic' },
});

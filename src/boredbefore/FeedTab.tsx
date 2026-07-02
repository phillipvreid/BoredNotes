import { useState, useCallback } from 'react';
import {
  View, Text, FlatList,
  StyleSheet, TextInput,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getDb } from '../db/database';
import { getAllEntries, searchEntries } from '../db/entries';
import { useTheme } from '../theme/ThemeContext';
import { ACTION, CAT_HUES, CATEGORY_STYLES, DEFEND_PAD, FONTS, INK, MEDALS, SHADOW_CARD } from '../theme/tokens';
import { HITS_COPY } from '../theme/copy';
import { Sticker } from '../components/ui/Sticker';
import { parseRankData } from '../games/rank';
import type { Entry } from '../types';

const CARD_TILTS = [-1, 0.9, -0.7];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .toLowerCase().replace(/\s/g, '');
  return `${weekday} · ${time}`;
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
  const { colors } = useTheme();
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
        placeholder="search the nonsense…"
        placeholderTextColor={colors.when}
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
            {group.items.map((entry, i) => {
              const freeform = entry.entry_mode === 'freeform';
              const rank = entry.entry_kind === 'rank' ? parseRankData(entry.game_data) : null;
              const catStyle = !freeform && !rank && entry.category ? CATEGORY_STYLES[entry.category] : null;
              const pillBg = rank ? CAT_HUES.rank : freeform ? ACTION : catStyle ? catStyle.color : colors.badgeBg;
              const pillFg = rank ? '#fff' : freeform ? INK : catStyle ? '#fff' : colors.badgeFg;
              const pillLabel = rank ? 'RANK + DEFEND' : freeform ? 'BRAIN DUMP' : catStyle ? catStyle.label : 'PROMPTED';
              return (
                <Sticker
                  key={entry.id}
                  shadow={SHADOW_CARD}
                  radius={16}
                  tilt={CARD_TILTS[i % CARD_TILTS.length]}
                  onPress={() => router.push(`/entry/${entry.id}`)}
                  onLongPress={() => router.push(`/share/${entry.id}`)}
                  style={styles.card}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.pill, { backgroundColor: pillBg }]}>
                      <Text style={[styles.pillTxt, { color: pillFg }]}>{pillLabel}</Text>
                    </View>
                    <Text style={[styles.when, { color: colors.when }]}>{formatWhen(entry.created_at)}</Text>
                  </View>
                  {!freeform && entry.prompt_text !== '' && (
                    <Text style={[styles.cardPrompt, { color: colors.textMuted }]} numberOfLines={1}>
                      {entry.prompt_text}
                    </Text>
                  )}
                  {rank ? (
                    <>
                      <View style={styles.rankList}>
                        {rank.items.map((item, j) => (
                          <View key={j} style={styles.rankRow}>
                            <View style={[styles.medal, { backgroundColor: MEDALS[j] ?? MEDALS[2] }]}>
                              <Text style={styles.medalTxt}>{j + 1}</Text>
                            </View>
                            <Text style={[styles.rankItem, { color: colors.textPrimary }]} numberOfLines={1}>
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.defenseBox}>
                        <Text style={styles.defenseLabel}>DEFENSE</Text>
                        <Text style={styles.defenseTxt} numberOfLines={3}>{rank.defense}</Text>
                      </View>
                    </>
                  ) : (
                  <Text style={[styles.cardResponse, { color: colors.textPrimary }]} numberOfLines={3}>
                    {entry.response_text}
                  </Text>
                  )}
                  {(entry.location_label || !!entry.has_photo) && (
                    <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                      {[entry.location_label ? `◉ ${entry.location_label}` : null, entry.has_photo ? '▣ photo' : null].filter(Boolean).join('  ·  ')}
                    </Text>
                  )}
                </Sticker>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {HITS_COPY.emptyTitle}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {query ? 'Nothing matches. Your archive is unbothered.' : HITS_COPY.emptySubtitle}
          </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18 },
  search: {
    borderRadius: 12, borderWidth: 2.5,
    paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: FONTS.body, fontSize: 15, marginBottom: 13,
  },
  listContent: { paddingBottom: 32, paddingHorizontal: 6, paddingTop: 4 },
  group: { gap: 13, marginBottom: 24 },
  dateHeader: { fontFamily: FONTS.label, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  card: { padding: 14, gap: 7 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pill: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  pillTxt: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 1 },
  when: { fontFamily: FONTS.label, fontSize: 11 },
  cardPrompt: { fontFamily: FONTS.bodySemiBold, fontSize: 13, lineHeight: 17, marginTop: 2 },
  cardResponse: { fontFamily: FONTS.bodySemiBold, fontSize: 16, lineHeight: 23 },
  rankList: { gap: 6, marginTop: 3 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  medal: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  medalTxt: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 1, color: '#fff' },
  rankItem: { fontFamily: FONTS.bodySemiBold, fontSize: 15, flex: 1 },
  defenseBox: {
    backgroundColor: DEFEND_PAD, borderWidth: 2, borderColor: INK,
    borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11, marginTop: 3,
  },
  defenseLabel: { fontFamily: FONTS.label, fontSize: 9, letterSpacing: 1, color: INK },
  defenseTxt: { fontFamily: FONTS.bodySemiBold, fontSize: 14, lineHeight: 19, color: INK, marginTop: 3 },
  cardMeta: { fontFamily: FONTS.labelRegular, fontSize: 11 },
  empty: { alignItems: 'center', marginTop: 60, gap: 6, paddingHorizontal: 20 },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 22, letterSpacing: -0.4 },
  emptySubtitle: { fontFamily: FONTS.body, fontSize: 14, textAlign: 'center' },
});

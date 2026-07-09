import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal,
  StyleSheet, TextInput,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getDb } from '../db/database';
import { getAllEntries, getMonthsWithEntries, searchEntries } from '../db/entries';
import { useTheme } from '../theme/ThemeContext';
import { DEFEND_PAD, FONTS, INK, MEDALS, SHADOW_CARD } from '../theme/tokens';
import { HITS_COPY } from '../theme/copy';
import { Sticker } from '../components/ui/Sticker';
import { parseRankData } from '../games/rank';
import { parseLoveHateData } from '../games/loveHate';
import type { Entry } from '../types';

const CARD_TILTS = [-1, 0.9, -0.7];
const MONTHS_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
  const { colors, catHues, categoryStyles } = useTheme();
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  useFocusEffect(
    useCallback(() => {
      setQuery('');
      setSelectedMonth(null);
      setPickerOpen(false);
      loadEntries('');
      loadMonths();
    }, [])
  );

  async function loadEntries(q: string) {
    const db = await getDb();
    const results = q.trim()
      ? await searchEntries(db, q)
      : await getAllEntries(db);
    setEntries(results);
  }

  async function loadMonths() {
    const db = await getDb();
    setMonths(await getMonthsWithEntries(db));
  }

  function handleSearch(q: string) {
    setQuery(q);
    loadEntries(q);
  }

  const availableYears = Array.from(new Set(months.map(m => Number(m.slice(0, 4)))))
    .sort((a, b) => b - a);

  function openPicker() {
    // Land on the selected month's year, else the most recent year with entries.
    const initial = selectedMonth
      ? Number(selectedMonth.slice(0, 4))
      : availableYears[0] ?? new Date().getFullYear();
    setPickerYear(initial);
    setPickerOpen(true);
  }

  function pickMonth(month: string | null) {
    setSelectedMonth(month);
    setPickerOpen(false);
  }

  const visible = selectedMonth
    ? entries.filter(e => e.created_at.slice(0, 7) === selectedMonth)
    : entries;
  const grouped = groupByDate(visible);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TouchableOpacity
          style={[
            styles.monthTrigger,
            { backgroundColor: selectedMonth ? colors.action : colors.surface, borderColor: colors.border },
          ]}
          onPress={openPicker}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.monthTriggerTxt,
            { color: selectedMonth ? colors.actionInk : colors.textSecondary },
          ]}>
            {selectedMonth ? formatMonthLabel(selectedMonth) : 'Date'}
          </Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.search, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textPrimary,
          }]}
          placeholder="It's down there somewhere…"
          placeholderTextColor={colors.when}
          value={query}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setPickerOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.sheetHead}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Jump to a month</Text>
              <TouchableOpacity onPress={() => pickMonth(null)} activeOpacity={0.7}>
                <Text style={[
                  styles.allTimeBtn,
                  { color: selectedMonth ? colors.textSecondary : colors.textPrimary },
                ]}>
                  All time
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.yearNav}>
              <TouchableOpacity
                onPress={() => setPickerYear(y => y - 1)}
                disabled={pickerYear <= (availableYears[availableYears.length - 1] ?? pickerYear)}
                activeOpacity={0.7}
              >
                <Text style={[styles.yearArrow, {
                  color: pickerYear <= (availableYears[availableYears.length - 1] ?? pickerYear)
                    ? colors.textMuted : colors.textPrimary,
                }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[styles.yearLabel, { color: colors.textPrimary }]}>{pickerYear}</Text>
              <TouchableOpacity
                onPress={() => setPickerYear(y => y + 1)}
                disabled={pickerYear >= (availableYears[0] ?? pickerYear)}
                activeOpacity={0.7}
              >
                <Text style={[styles.yearArrow, {
                  color: pickerYear >= (availableYears[0] ?? pickerYear)
                    ? colors.textMuted : colors.textPrimary,
                }]}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.monthGrid}>
              {MONTHS_ABBR.map((label, i) => {
                const ym = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                const enabled = months.includes(ym);
                const isSelected = selectedMonth === ym;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[
                      styles.monthCell,
                      { borderColor: colors.border },
                      isSelected && { backgroundColor: colors.action, borderColor: colors.action },
                    ]}
                    onPress={() => pickMonth(ym)}
                    disabled={!enabled}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.monthCellTxt,
                      { color: colors.textPrimary },
                      !enabled && { color: colors.textMuted },
                      isSelected && { color: colors.actionInk },
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
              const loveHate = entry.entry_kind === 'loveHate' ? parseLoveHateData(entry.game_data) : null;
              const catStyle = !freeform && !rank && !loveHate && entry.category ? categoryStyles[entry.category] : null;
              const pillBg = loveHate ? catHues.nostalgia : rank ? catHues.rank : freeform ? colors.action : catStyle ? catStyle.color : colors.badgeBg;
              const pillFg = loveHate || rank ? '#fff' : freeform ? colors.actionInk : catStyle ? '#fff' : colors.badgeFg;
              const pillLabel = loveHate ? 'LOVE + HATE' : rank ? 'RANK + DEFEND' : freeform ? 'BRAIN DUMP' : catStyle ? catStyle.label : 'PROMPTED';
              const promptLine = entry.prompt_text.replace(/\s*The theme decides, you commit\.?/i, '').trim();
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
                  {!freeform && promptLine !== '' && (
                    <Text style={[styles.cardPrompt, { color: colors.textMuted }]} numberOfLines={1}>
                      {promptLine}
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
                  ) : loveHate ? (
                    <View style={styles.lhList}>
                      <Text style={[styles.lhTheme, { color: colors.textPrimary }]}>{loveHate.theme}</Text>
                      <View style={styles.lhRow}>
                        <View style={[styles.lhTag, { backgroundColor: catHues.rank }]}>
                          <Text style={styles.lhTagTxt}>LOVE IT</Text>
                        </View>
                        <Text style={[styles.lhItem, { color: colors.textPrimary }]} numberOfLines={1}>
                          {loveHate.love}
                        </Text>
                      </View>
                      <View style={styles.lhRow}>
                        <View style={[styles.lhTag, { backgroundColor: catHues.gossip }]}>
                          <Text style={styles.lhTagTxt}>HATE IT</Text>
                        </View>
                        <Text style={[styles.lhItem, { color: colors.textPrimary }]} numberOfLines={1}>
                          {loveHate.hate}
                        </Text>
                      </View>
                    </View>
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
  searchRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8, marginBottom: 13 },
  monthTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, borderWidth: 2.5,
    paddingHorizontal: 12, justifyContent: 'center',
  },
  monthTriggerTxt: { fontFamily: FONTS.label, fontSize: 12, letterSpacing: 0.5 },
  search: {
    flex: 1,
    borderRadius: 12, borderWidth: 2.5,
    paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: FONTS.body, fontSize: 15,
  },
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', paddingHorizontal: 28,
  },
  sheet: { borderRadius: 18, borderWidth: 2.5, padding: 20, gap: 18 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: FONTS.display, fontSize: 20, letterSpacing: -0.4 },
  allTimeBtn: { fontFamily: FONTS.label, fontSize: 12, letterSpacing: 0.5 },
  yearNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  yearArrow: { fontSize: 30, paddingHorizontal: 8 },
  yearLabel: { fontFamily: FONTS.bodyExtraBold, fontSize: 20, minWidth: 64, textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  monthCell: {
    width: '31%', paddingVertical: 12, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  monthCellTxt: { fontFamily: FONTS.bodySemiBold, fontSize: 15 },
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
  lhList: { gap: 6, marginTop: 3 },
  lhTheme: { fontFamily: FONTS.bodyExtraBold, fontSize: 15 },
  lhRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  lhTag: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  lhTagTxt: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 1, color: '#fff' },
  lhItem: { fontFamily: FONTS.bodySemiBold, fontSize: 15, flex: 1 },
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

import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/tokens';
import { FeedFilters, FORMAT_OPTIONS, FormatToken, activeFilterCount } from './filterEntries';

interface FilterSheetProps {
  filters: FeedFilters;
  onChange: (next: FeedFilters) => void;
}

type EditingField = 'start' | 'end' | null;

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatYMD(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function FilterSheet({ filters, onChange }: FilterSheetProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditingField>(null);

  const count = activeFilterCount(filters);
  const active = count > 0;

  function toggleFormat(token: FormatToken) {
    const has = filters.formats.includes(token);
    onChange({
      ...filters,
      formats: has ? filters.formats.filter(t => t !== token) : [...filters.formats, token],
    });
  }

  function clearAll() {
    onChange({ formats: [], startDate: null, endDate: null });
  }

  function onPickDate(field: 'start' | 'end', event: { type: string }, date?: Date) {
    // On Android the picker fires a dismiss event; close it and honor 'set' only.
    setEditing(null);
    if (event.type !== 'set' || !date) return;
    const ymd = toYMD(date);
    onChange(field === 'start' ? { ...filters, startDate: ymd } : { ...filters, endDate: ymd });
  }

  const editingValue = editing === 'end'
    ? (filters.endDate ? new Date(filters.endDate) : new Date())
    : (filters.startDate ? new Date(filters.startDate) : new Date());

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          { backgroundColor: active ? colors.action : colors.surface, borderColor: colors.border },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerTxt, { color: active ? colors.actionInk : colors.textSecondary }]}>
          {active ? `FILTER · ${count}` : 'FILTER'}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.head}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Narrow it down</Text>
              {active && (
                <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
                  <Text style={[styles.clearAll, { color: colors.textSecondary }]}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLbl, { color: colors.textMuted }]}>FORMAT</Text>
              <View style={styles.chips}>
                {FORMAT_OPTIONS.map(opt => {
                  const on = filters.formats.includes(opt.token);
                  return (
                    <TouchableOpacity
                      key={opt.token}
                      onPress={() => toggleFormat(opt.token)}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        { borderColor: colors.border },
                        on && { backgroundColor: colors.action, borderColor: colors.action },
                      ]}
                    >
                      <Text style={[
                        styles.chipTxt,
                        { color: colors.textPrimary },
                        on && { color: colors.actionInk },
                      ]}>
                        {on ? `✓ ${opt.label}` : opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLbl, { color: colors.textMuted }]}>WHEN</Text>
              <View style={styles.rangeRow}>
                <View style={styles.field}>
                  <Text style={[styles.cap, { color: colors.textMuted }]}>START</Text>
                  <TouchableOpacity
                    style={[styles.dateBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setEditing('start')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dateTxt, { color: filters.startDate ? colors.textPrimary : colors.textMuted }]}>
                      {filters.startDate ? formatYMD(filters.startDate) : 'Any'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.dash, { color: colors.textMuted }]}>–</Text>
                <View style={styles.field}>
                  <Text style={[styles.cap, { color: colors.textMuted }]}>END</Text>
                  <TouchableOpacity
                    style={[styles.dateBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setEditing('end')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dateTxt, { color: filters.endDate ? colors.textPrimary : colors.textMuted }]}>
                      {filters.endDate ? formatYMD(filters.endDate) : 'Any'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {editing && (
              <DateTimePicker
                value={editingValue}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(e, date) => onPickDate(editing, e as { type: string }, date)}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderRadius: 12, borderWidth: 2.5, paddingHorizontal: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  triggerTxt: { fontFamily: FONTS.label, fontSize: 12, letterSpacing: 0.5 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 28 },
  sheet: { borderRadius: 18, borderWidth: 2.5, padding: 20, gap: 18 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: FONTS.display, fontSize: 20, letterSpacing: -0.4 },
  clearAll: { fontFamily: FONTS.label, fontSize: 11, letterSpacing: 0.5, textDecorationLine: 'underline' },
  section: { gap: 10 },
  sectionLbl: { fontFamily: FONTS.label, fontSize: 10.5, letterSpacing: 1.4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 2.5, paddingHorizontal: 12, paddingVertical: 8 },
  chipTxt: { fontFamily: FONTS.label, fontSize: 11.5 },
  rangeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  field: { flex: 1, gap: 6 },
  cap: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 1 },
  dateBox: { borderRadius: 12, borderWidth: 2.5, paddingHorizontal: 12, paddingVertical: 11 },
  dateTxt: { fontFamily: FONTS.bodySemiBold, fontSize: 14.5 },
  dash: { fontFamily: FONTS.bodyBold, fontSize: 16, paddingBottom: 12 },
});

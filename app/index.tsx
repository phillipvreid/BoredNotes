import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getDb } from '../src/db/database';
import { getCurrentPrompt, getNextPrompt } from '../src/prompts/next';
import { getSetting } from '../src/db/settings';
import { useTheme } from '../src/theme/ThemeContext';
import type { CurrentPrompt } from '../src/types';

export default function HomeScreen() {
  const { colors, accent } = useTheme();
  const [prompt, setPrompt] = useState<CurrentPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondMode, setRespondMode] = useState<'prompted' | 'freeform'>('prompted');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        const db = await getDb();
        let current = await getCurrentPrompt(db);
        if (!current) current = await getNextPrompt(db);
        setPrompt(current);
        const mode = await getSetting(db, 'respond_mode');
        setRespondMode((mode as 'prompted' | 'freeform') ?? 'prompted');
        setLoading(false);
      })();
    }, [])
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={[styles.appName, { color: accent.labelColor }]}>BoredNotes</Text>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={[styles.settingsBtn, { backgroundColor: colors.surface, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
          >
            <Feather name="settings" size={18} color={accent.labelColor} />
          </TouchableOpacity>
        </View>

        {/* Prompt card */}
        <TouchableOpacity
          style={[styles.promptCard, {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.shadowOpacity,
          }]}
          onPress={() => router.push('/respond')}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={accent.labelColor} />
          ) : (
            <>
              <Text style={[styles.promptLabel, { color: accent.labelColor }]}>
                {respondMode === 'freeform' ? "Today's entry" : "Today's prompt"}
              </Text>
              {respondMode === 'freeform' ? (
                <Text style={[styles.promptText, { color: colors.textMuted }]}>
                  {"What's on your mind…"}
                </Text>
              ) : (
                <Text style={[styles.promptText, { color: colors.textPrimary }]}>
                  {prompt?.text}
                </Text>
              )}
              <Text style={[styles.tapHint, { color: colors.textMuted }]}>
                {respondMode === 'freeform' ? 'Tap to write →' : 'Tap to respond →'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Tile row */}
        <View style={styles.tileRow}>
          <TouchableOpacity
            style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
            onPress={() => router.push('/timeline')}
          >
            <Feather name="calendar" size={22} color={colors.textSecondary} />
            <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>Timeline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
            onPress={() => router.push('/entries')}
          >
            <Feather name="file-text" size={22} color={colors.textSecondary} />
            <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>Entries</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
            onPress={() => router.push('/reflect')}
          >
            <Feather name="sun" size={22} color={colors.textSecondary} />
            <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>Reflect</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 20, gap: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  appName: { fontSize: 13, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  settingsBtn: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  promptCard: {
    flex: 1, borderRadius: 16, padding: 24,
    justifyContent: 'center', gap: 12,
    borderWidth: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  promptLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  promptText: { fontSize: 20, lineHeight: 30, fontFamily: 'Georgia', fontStyle: 'italic' },
  tapHint: { fontSize: 13, marginTop: 8 },
  tileRow: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
  tile: {
    flex: 1, borderRadius: 12, paddingVertical: 18,
    alignItems: 'center', gap: 8, borderWidth: 1,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  tileLabel: { fontSize: 12, fontWeight: '500' },
});

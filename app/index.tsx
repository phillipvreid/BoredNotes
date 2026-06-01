import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getDb } from '../src/db/database';
import { getSetting } from '../src/db/settings';
import { getContextualPrompt, forceRefreshContextualPrompt } from '../src/prompts/contextual';
import { useTheme } from '../src/theme/ThemeContext';
import type { CurrentPrompt } from '../src/types';

export default function HomeScreen() {
  const { colors, accent } = useTheme();
  const [prompt, setPrompt] = useState<CurrentPrompt | null>(null);
  const [contextualPromptLoading, setContextualPromptLoading] = useState(true);
  const [respondMode, setRespondMode] = useState<'prompted' | 'freeform'>('prompted');
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    setContextualPromptLoading(true);
    const db = await getDb();
    const fresh = await forceRefreshContextualPrompt(db);
    setPrompt(fresh);
    setContextualPromptLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setContextualPromptLoading(true);
        const db = await getDb();
        const current = await getContextualPrompt(db);
        setPrompt(current);
        const mode = await getSetting(db, 'respond_mode');
        setRespondMode((mode as 'prompted' | 'freeform') ?? 'prompted');
        setContextualPromptLoading(false);
      })();
    }, [])
  );

  function handleCardPress() {
    if (respondMode === 'freeform') {
      router.push('/respond');
    } else {
      router.push({
        pathname: '/respond',
        params: {
          promptText: prompt?.text ?? '',
          promptCategory: prompt?.category ?? '',
        },
      });
    }
  }

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

        {/* Prompt card — contextualPromptLoading branch is the future mascot slot */}
        <TouchableOpacity
          style={[styles.promptCard, {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.shadowOpacity,
          }]}
          onPress={handleCardPress}
          activeOpacity={0.85}
          disabled={contextualPromptLoading}
        >
          {contextualPromptLoading ? (
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>…</Text>
          ) : (
            <>
              <View style={styles.promptHeader}>
                <Text style={[styles.promptLabel, { color: accent.labelColor }]}>
                  {respondMode === 'freeform' ? "Today's entry" : "Today's prompt"}
                </Text>
                {respondMode !== 'freeform' && prompt?.source === 'ai' && (
                  <View style={[styles.aiBadge, { backgroundColor: accent.buttonColor + '20' }]}>
                    <Text style={[styles.aiBadgeText, { color: accent.buttonColor }]}>AI</Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                {respondMode !== 'freeform' && (
                  <TouchableOpacity onPress={handleRefresh} disabled={refreshing} hitSlop={8}>
                    <Feather name="refresh-cw" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
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

        <TouchableOpacity
          style={[styles.boredBeforeTile, {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.shadowOpacity,
          }]}
          onPress={() => router.push('/boredbefore')}
        >
          <Feather name="clock" size={22} color={colors.textSecondary} />
          <View>
            <Text style={[styles.boredBeforeTitle, { color: colors.textPrimary }]}>BoredBefore</Text>
            <Text style={[styles.boredBeforeSubtitle, { color: colors.textMuted }]}>look into your bored past</Text>
          </View>
        </TouchableOpacity>
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
  loadingText: { fontSize: 28, textAlign: 'center', fontFamily: 'Georgia', fontStyle: 'italic' },
  promptLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  promptText: { fontSize: 20, lineHeight: 30, fontFamily: 'Georgia', fontStyle: 'italic' },
  tapHint: { fontSize: 13, marginTop: 8 },
  boredBeforeTile: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 12, padding: 18, borderWidth: 1,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  boredBeforeTitle: { fontSize: 15, fontWeight: '600' },
  boredBeforeSubtitle: { fontSize: 12, marginTop: 2 },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  aiBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});

import { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../src/theme/ThemeContext';
import { ACCENTS } from '../src/theme/tokens';
import { getDb } from '../src/db/database';
import { getSetting, setSetting } from '../src/db/settings';
import { getNextPrompt } from '../src/prompts/next';

const version = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const { colors, accent, isDark, setAccent, setDarkMode } = useTheme();
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const db = await getDb();
      const val = await getSetting(db, 'offline_mode');
      if (active) setOfflineMode(val === 'true');
    })();
    return () => { active = false; };
  }, []);

  async function handleOfflineToggle(value: boolean) {
    try {
      const db = await getDb();
      await setSetting(db, 'offline_mode', String(value));
      await getNextPrompt(db);
      setOfflineMode(value);
    } catch {
      setOfflineMode(prev => prev);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backTxt, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>

        {/* Appearance section */}
        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>APPEARANCE</Text>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Theme</Text>
          <View style={styles.swatches}>
            {ACCENTS.map(swatch => (
              <TouchableOpacity
                key={swatch.id}
                style={[styles.swatch, { backgroundColor: swatch.buttonColor }]}
                onPress={() => setAccent(swatch.id)}
              >
                {accent.id === swatch.id && (
                  <Feather name="check" size={14} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={setDarkMode}
            trackColor={{ true: accent.buttonColor }}
          />
        </View>

        {/* Prompts section */}
        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>PROMPTS</Text>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Offline Mode</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>Use built-in prompts only, no AI</Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={handleOfflineToggle}
            trackColor={{ true: accent.buttonColor }}
          />
        </View>

        {/* About section */}
        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>ABOUT</Text>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Version</Text>
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{version}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 8, paddingBottom: 40 },
  back: { paddingVertical: 4, marginBottom: 4 },
  backTxt: { fontSize: 15 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  sectionHead: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 16, marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 12, borderWidth: 1,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  rowLabel: { fontSize: 15 },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  rowValue: { fontSize: 15 },
  swatches: { flexDirection: 'row', gap: 10 },
  swatch: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
});

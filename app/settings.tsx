import { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../src/theme/ThemeContext';
import { THEMES, FONTS } from '../src/theme/tokens';
import { IconSticker } from '../src/components/ui/IconSticker';
import { getDb } from '../src/db/database';
import { getSetting, setSetting } from '../src/db/settings';
import { getNextPrompt } from '../src/prompts/next';
import { exportEntriesToCsv } from '../src/export/share';

const version = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const { colors, theme, isDark, setTheme, setDarkMode } = useTheme();
  const [offlineMode, setOfflineMode] = useState(false);
  const [toggling, setToggling] = useState(false);

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
    setToggling(true);
    try {
      const db = await getDb();
      await setSetting(db, 'offline_mode', String(value));
      await getNextPrompt(db);
      setOfflineMode(value);
    } catch {
      setOfflineMode(prev => prev);
    } finally {
      setToggling(false);
    }
  }

  const [autoLocation, setAutoLocation] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        const val = await getSetting(db, 'auto_location');
        setAutoLocation(val === 'true');
      } catch {}
    })();
  }, []);

  async function handleAutoLocationToggle(value: boolean) {
    setAutoLocation(value);
    try {
      const db = await getDb();
      await setSetting(db, 'auto_location', String(value));
    } catch {
      setAutoLocation(!value);
    }
  }

  async function handleExport() {
    try {
      const db = await getDb();
      await exportEntriesToCsv(db);
    } catch {
      Alert.alert('Export failed', 'Could not export your notes. Please try again.');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <IconSticker glyph="←" onPress={() => router.back()} style={styles.back} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Appearance section */}
        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>APPEARANCE</Text>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Theme</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{theme.label}</Text>
          </View>
          <View style={styles.swatches}>
            {THEMES.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.swatch, {
                  backgroundColor: isDark ? t.paper.dark : t.paper.light,
                  borderColor: colors.border,
                  borderWidth: theme.id === t.id ? 2.5 : 1,
                }]}
                onPress={() => setTheme(t.id)}
              >
                {theme.id === t.id ? (
                  <Feather name="check" size={14} color={colors.textPrimary} />
                ) : (
                  <View style={[styles.swatchDot, { backgroundColor: t.action }]} />
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
            trackColor={{ true: colors.action }}
          />
        </View>

        {/* Notes section */}
        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>NOTES</Text>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Offline Mode</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>AI-generated prompts can use short snippets from your recent notes when the Memory option is on. Enable offline mode to disable AI prompts entirely.</Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={handleOfflineToggle}
            trackColor={{ true: colors.action }}
            disabled={toggling}
          />
        </View>

        {/* Location section */}
        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>LOCATION</Text>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <View style={styles.rowTextBlock}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Auto-location</Text>
            <Text style={[styles.rowSubLabel, { color: colors.textMuted }]}>Capture your location automatically when writing</Text>
          </View>
          <Switch
            value={autoLocation}
            onValueChange={handleAutoLocationToggle}
            trackColor={{ true: colors.action }}
          />
        </View>

        <TouchableOpacity
          style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
          onPress={() => router.push('/saved-locations')}
        >
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Saved locations</Text>
          <Text style={[styles.rowValue, { color: colors.textPrimary }]}>→</Text>
        </TouchableOpacity>

        {/* Data section */}
        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>DATA</Text>

        <TouchableOpacity
          style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
          onPress={handleExport}
        >
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Export notes</Text>
          <Text style={[styles.rowValue, { color: colors.textPrimary }]}>CSV →</Text>
        </TouchableOpacity>

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
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  container: { padding: 20, gap: 8, paddingBottom: 40 },
  back: { marginBottom: 12 },
  backTxt: { fontSize: 15 },
  title: { fontFamily: FONTS.display, fontSize: 31, letterSpacing: -0.8, marginBottom: 8 },
  sectionHead: { fontFamily: FONTS.label, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 16, marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 14, borderWidth: 2.5,
    shadowRadius: 0, shadowOffset: { width: 3, height: 3 }, elevation: 3,
  },
  rowLabel: { fontSize: 15 },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  rowValue: { fontSize: 15 },
  rowTextBlock: { flex: 1 },
  rowSubLabel: { fontSize: 12, marginTop: 2 },
  swatches: { flexDirection: 'row', gap: 8 },
  swatch: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  swatchDot: { width: 10, height: 10, borderRadius: 5 },
});

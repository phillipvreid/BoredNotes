import { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../src/theme/ThemeContext';
import { ACCENTS } from '../src/theme/tokens';
import { getDb } from '../src/db/database';
import { getSetting, setSetting } from '../src/db/settings';
import { getNextPrompt } from '../src/prompts/next';
import { exportEntriesToCsv } from '../src/export/share';

const version = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const { colors, accent, isDark, setAccent, setDarkMode } = useTheme();
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

  const [isFreeform, setIsFreeform] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        const mode = await getSetting(db, 'respond_mode');
        setIsFreeform(mode === 'freeform');
      } catch {}
    })();
  }, []);

  async function handleFreeformToggle(value: boolean) {
    setIsFreeform(value);
    try {
      const db = await getDb();
      await setSetting(db, 'respond_mode', value ? 'freeform' : 'prompted');
    } catch {
      setIsFreeform(!value);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backTxt, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
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

        {/* Notes section */}
        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>NOTES</Text>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Offline Mode</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>Use built-in prompts only, no AI</Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={handleOfflineToggle}
            trackColor={{ true: accent.buttonColor }}
            disabled={toggling}
          />
        </View>

        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}>
          <View style={styles.rowTextBlock}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Freeform mode</Text>
            <Text style={[styles.rowSubLabel, { color: colors.textMuted }]}>Write without a prompt</Text>
          </View>
          <Switch
            value={isFreeform}
            onValueChange={handleFreeformToggle}
            trackColor={{ true: accent.buttonColor }}
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
            trackColor={{ true: accent.buttonColor }}
          />
        </View>

        <TouchableOpacity
          style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
          onPress={() => router.push('/saved-locations')}
        >
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Saved locations</Text>
          <Text style={[styles.rowValue, { color: accent.buttonColor }]}>→</Text>
        </TouchableOpacity>

        {/* Data section */}
        <Text style={[styles.sectionHead, { color: colors.textMuted }]}>DATA</Text>

        <TouchableOpacity
          style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]}
          onPress={handleExport}
        >
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Export notes</Text>
          <Text style={[styles.rowValue, { color: accent.buttonColor }]}>CSV →</Text>
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
  back: { paddingVertical: 4, marginBottom: 4 },
  backTxt: { fontSize: 15 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  sectionHead: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 16, marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 12, borderWidth: 1,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  rowLabel: { fontSize: 15 },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  rowValue: { fontSize: 15 },
  rowTextBlock: { flex: 1 },
  rowSubLabel: { fontSize: 12, marginTop: 2 },
  swatches: { flexDirection: 'row', gap: 10 },
  swatch: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
});

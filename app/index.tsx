import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getDb } from '../src/db/database';
import { getCurrentPrompt, getNextPrompt } from '../src/prompts/next';
import type { CurrentPrompt } from '../src/types';

export default function HomeScreen() {
  const [prompt, setPrompt] = useState<CurrentPrompt | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        const db = await getDb();
        let current = await getCurrentPrompt(db);
        if (!current) current = await getNextPrompt(db);
        setPrompt(current);
        setLoading(false);
      })();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.appName}>BoredNotes</Text>

        <TouchableOpacity
          style={styles.promptCard}
          onPress={() => router.push('/respond')}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#888" />
          ) : (
            <>
              <Text style={styles.promptLabel}>Today's prompt</Text>
              <Text style={styles.promptText}>{prompt?.text}</Text>
              <Text style={styles.tapHint}>Tap to respond →</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.tileRow}>
          <TouchableOpacity style={styles.tile} onPress={() => router.push('/timeline')}>
            <Text style={styles.tileIcon}>📅</Text>
            <Text style={styles.tileLabel}>Timeline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tile} onPress={() => router.push('/entries')}>
            <Text style={styles.tileIcon}>💭</Text>
            <Text style={styles.tileLabel}>Entries</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tile} onPress={() => router.push('/reflect')}>
            <Text style={styles.tileIcon}>✨</Text>
            <Text style={styles.tileLabel}>Reflect</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20, gap: 20 },
  appName: { fontSize: 13, fontWeight: '600', color: '#aaa', letterSpacing: 2, textTransform: 'uppercase', marginTop: 8 },
  promptCard: {
    flex: 1, backgroundColor: '#f8f8f8', borderRadius: 16, padding: 24,
    justifyContent: 'center', gap: 12,
  },
  promptLabel: { fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 },
  promptText: { fontSize: 20, color: '#1a1a1a', lineHeight: 28, fontWeight: '400' },
  tapHint: { fontSize: 13, color: '#bbb', marginTop: 8 },
  tileRow: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
  tile: {
    flex: 1, backgroundColor: '#f4f4f4', borderRadius: 12,
    paddingVertical: 18, alignItems: 'center', gap: 6,
  },
  tileIcon: { fontSize: 24 },
  tileLabel: { fontSize: 12, color: '#555', fontWeight: '500' },
});

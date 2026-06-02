import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../src/db/database';
import { seedLibraryIfNeeded } from '../src/prompts/seed';
import { flushPendingGeocodes } from '../src/location/location';
import { ThemeProvider } from '../src/theme/ThemeContext';

export default function RootLayout() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const database = await getDb();
        await seedLibraryIfNeeded(database);
        flushPendingGeocodes(database).catch(() => {});
        setDb(database);
      } catch (e: any) {
        setInitError(String(e?.message ?? e));
      }
    })();
  }, []);

  if (initError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafaf9', padding: 24 }}>
        <Text style={{ color: '#cc0000', fontWeight: '600', marginBottom: 8 }}>Startup error</Text>
        <Text style={{ color: '#333', fontSize: 13 }}>{initError}</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafaf9' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ThemeProvider db={db}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="respond" options={{ presentation: 'modal' }} />
        <Stack.Screen name="boredbefore" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="entry/[id]" />
        <Stack.Screen name="share/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

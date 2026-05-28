import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../src/db/database';
import { seedLibraryIfNeeded } from '../src/prompts/seed';
import { flushPendingGeocodes } from '../src/location/location';
import { ThemeProvider } from '../src/theme/ThemeContext';

export default function RootLayout() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  useEffect(() => {
    (async () => {
      const database = await getDb();
      await seedLibraryIfNeeded(database);
      flushPendingGeocodes(database).catch(() => {});
      setDb(database);
    })();
  }, []);

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
        <Stack.Screen name="timeline" />
        <Stack.Screen name="entries" />
        <Stack.Screen name="reflect" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="entry/[id]" />
        <Stack.Screen name="share/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { getDb } from '../src/db/database';
import { seedLibraryIfNeeded } from '../src/prompts/seed';
import { flushPendingGeocodes } from '../src/location/location';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      await seedLibraryIfNeeded(db);
      flushPendingGeocodes(db).catch(() => {});
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="respond" options={{ presentation: 'modal' }} />
      <Stack.Screen name="timeline" />
      <Stack.Screen name="entries" />
      <Stack.Screen name="reflect" />
      <Stack.Screen name="entry/[id]" />
      <Stack.Screen name="share/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

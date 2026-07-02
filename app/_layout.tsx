import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { getDb } from '../src/db/database';
import { seedLibraryIfNeeded } from '../src/prompts/seed';
import { flushPendingGeocodes } from '../src/location/location';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { ToastProvider } from '../src/components/ui/Toast';

export default function RootLayout() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

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

  if (!db || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBFAF3' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ThemeProvider db={db}>
      <ToastProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="respond" options={{ presentation: 'modal' }} />
        <Stack.Screen name="boredbefore" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="entry/[id]" />
        <Stack.Screen name="share/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="place/[id]" />
        <Stack.Screen name="place/cluster" />
        <Stack.Screen name="saved-locations" />
      </Stack>
      </ToastProvider>
    </ThemeProvider>
  );
}

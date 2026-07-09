import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../src/theme/ThemeContext';
import { FONTS } from '../src/theme/tokens';
import { HITS_COPY } from '../src/theme/copy';
import { IconSticker } from '../src/components/ui/IconSticker';
import { Chip } from '../src/components/ui/Chip';
import { FeedTab } from '../src/boredbefore/FeedTab';
import { MapTab } from '../src/boredbefore/MapTab';

type Tab = 'Feed' | 'Map';
const TABS: Tab[] = ['Feed', 'Map'];

export default function BoredBeforeScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('Feed');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <IconSticker glyph="←" onPress={() => router.back()} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>{HITS_COPY.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{HITS_COPY.subtitle}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map(tab => (
          <Chip
            key={tab}
            label={tab.toUpperCase()}
            active={activeTab === tab}
            onPress={() => setActiveTab(tab)}
          />
        ))}
      </ScrollView>

      <View style={styles.content}>
        {activeTab === 'Feed' && <FeedTab />}
        {activeTab === 'Map' && <MapTab />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: 8 },
  title: {
    fontFamily: FONTS.display, fontSize: 31, lineHeight: 32, letterSpacing: -0.8, marginTop: 14,
  },
  subtitle: { fontFamily: FONTS.body, fontSize: 14, marginTop: 5 },
  tabBar: { flexGrow: 0, marginTop: 10 },
  tabBarContent: { paddingHorizontal: 18, paddingVertical: 6, gap: 8 },
  content: { flex: 1, marginTop: 7 },
});

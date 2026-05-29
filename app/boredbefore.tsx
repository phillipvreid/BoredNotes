import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useTheme } from '../src/theme/ThemeContext';
import { FeedTab } from '../src/boredbefore/FeedTab';
import { CalendarTab } from '../src/boredbefore/CalendarTab';
import { MapTab } from '../src/boredbefore/MapTab';

type Tab = 'Feed' | 'Calendar' | 'Map';
const TABS: Tab[] = ['Feed', 'Calendar', 'Map'];

export default function BoredBeforeScreen() {
  const { colors, accent, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('Feed');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
      </View>

      <BlurView
        intensity={50}
        tint={isDark ? 'dark' : 'light'}
        style={styles.tabBarBlur}
      >
        <View style={styles.tabBarInner}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabLabel,
                { color: activeTab === tab ? accent.buttonColor : colors.textMuted },
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BlurView>

      <View style={styles.content}>
        {activeTab === 'Feed' && <FeedTab />}
        {activeTab === 'Calendar' && <CalendarTab />}
        {activeTab === 'Map' && <MapTab />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  back: { fontSize: 15 },
  tabBarBlur: { marginHorizontal: 16, marginBottom: 8, borderRadius: 20, overflow: 'hidden' },
  tabBarInner: { flexDirection: 'row', padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  tabLabel: { fontSize: 14, fontWeight: '500' },
  content: { flex: 1 },
});

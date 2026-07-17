import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../src/theme/ThemeContext';
import { FONTS } from '../src/theme/tokens';
import { HITS_COPY } from '../src/theme/copy';
import { IconSticker } from '../src/components/ui/IconSticker';
import { FeedTab } from '../src/boredbefore/FeedTab';

export default function BoredBeforeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <IconSticker glyph="←" onPress={() => router.back()} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>{HITS_COPY.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{HITS_COPY.subtitle}</Text>
      </View>

      <View style={styles.content}>
        <FeedTab />
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
  content: { flex: 1, marginTop: 14 },
});

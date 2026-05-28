import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Switch, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { getDb } from '../../src/db/database';
import { getEntry } from '../../src/db/entries';
import { getMediaForEntry } from '../../src/db/media';
import { ShareCard } from '../../src/share/renderer';
import { TEMPLATES, DEFAULT_TEMPLATE_ID } from '../../src/share/templates';
import { useTheme } from '../../src/theme/ThemeContext';
import type { Entry, MediaItem } from '../../src/types';

export default function ShareCardScreen() {
  const { colors, accent } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cardRef = useRef<View>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [photo, setPhoto] = useState<MediaItem | null>(null);
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [showDate, setShowDate] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const e = await getEntry(db, Number(id));
      setEntry(e);
      if (e) {
        const media = await getMediaForEntry(db, e.id);
        setPhoto(media.find(m => m.type === 'photo') ?? null);
      }
    })();
  }, [id]);

  async function handleShare() {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png' });
    } catch {
      Alert.alert('Could not share', 'Please try again.');
    } finally {
      setSharing(false);
    }
  }

  const template = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0];

  if (!entry) return null;

  const dateStr = new Date(entry.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.close}>
          <Text style={[styles.closeTxt, { color: colors.textMuted }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Share</Text>

        <View style={styles.preview}>
          <ShareCard
            ref={cardRef}
            template={template}
            promptText={entry.prompt_text}
            responseText={entry.response_text}
            date={dateStr}
            location={entry.location_label}
            photoUri={photo?.file_path ?? null}
            showDate={showDate}
            showLocation={showLocation}
          />
        </View>

        <Text style={[styles.label, { color: colors.textMuted }]}>Template</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
          {TEMPLATES.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.templateChip, { backgroundColor: templateId === t.id ? accent.buttonColor : colors.surface }]}
              onPress={() => setTemplateId(t.id)}
            >
              <View style={[styles.templateSwatch, { backgroundColor: t.bg, borderColor: colors.border }]} />
              <Text style={[styles.templateLabel, { color: colors.textSecondary }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Show date</Text>
          <Switch value={showDate} onValueChange={setShowDate} />
        </View>
        {entry.location_label && (
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Show location</Text>
            <Switch value={showLocation} onValueChange={setShowLocation} />
          </View>
        )}

        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: sharing ? colors.border : accent.buttonColor }]}
          onPress={handleShare}
          disabled={sharing}
        >
          <Text style={styles.shareTxt}>{sharing ? 'Preparing…' : 'Share →'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  close: { alignSelf: 'flex-end' },
  closeTxt: { fontSize: 18 },
  title: { fontSize: 24, fontWeight: '700' },
  preview: { alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  templateScroll: { flexGrow: 0 },
  templateChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginRight: 10 },
  templateSwatch: { width: 16, height: 16, borderRadius: 4, borderWidth: 1 },
  templateLabel: { fontSize: 13 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 15 },
  shareBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  shareTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

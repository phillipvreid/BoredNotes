import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Switch, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { getDb } from '../../src/db/database';
import { getEntry } from '../../src/db/entries';
import { getMediaForEntry } from '../../src/db/media';
import { ShareCard } from '../../src/share/renderer';
import { CARD_STYLES, DEFAULT_STYLE_ID, DEFAULT_VARIANT_ID } from '../../src/share/templates';
import { useTheme } from '../../src/theme/ThemeContext';
import type { Entry, MediaItem } from '../../src/types';

export default function ShareCardScreen() {
  const { colors, accent } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cardRef = useRef<View>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [photo, setPhoto] = useState<MediaItem | null>(null);
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID);
  const [variantId, setVariantId] = useState(DEFAULT_VARIANT_ID);
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

  if (!entry) return null;

  const currentStyle = CARD_STYLES.find(s => s.id === styleId) ?? CARD_STYLES[0];

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
            styleId={styleId}
            variantId={variantId}
            promptText={entry.prompt_text}
            responseText={entry.response_text}
            createdAt={entry.created_at}
            location={entry.location_label}
            photoUri={photo?.file_path ?? null}
            showDate={showDate}
            showLocation={showLocation}
            entryMode={entry.entry_mode}
          />
        </View>

        {/* Style tabs */}
        <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>Style</Text>
        <View style={styles.tabRow}>
          {CARD_STYLES.map(s => {
            const active = s.id === styleId;
            return (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.tab,
                  active && { backgroundColor: accent.buttonColor + '22', borderColor: accent.buttonColor + '66' },
                ]}
                onPress={() => { setStyleId(s.id); setVariantId(s.variants[0].id); }}
              >
                <Text style={[styles.tabLabel, { color: active ? accent.buttonColor : colors.textMuted }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Colour dots */}
        <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>Colour</Text>
        <View style={styles.dotsRow}>
          {currentStyle.variants.map(v => {
            const active = v.id === variantId;
            return (
              <TouchableOpacity key={v.id} onPress={() => setVariantId(v.id)} style={styles.dotWrap}>
                <View style={[
                  styles.dot,
                  { backgroundColor: v.dotGradient[0] },
                  active && { borderColor: accent.buttonColor, borderWidth: 2.5 },
                ]} />
                <Text style={[styles.dotLabel, { color: active ? accent.buttonColor : colors.textMuted }]}>
                  {v.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
  pickerLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  tabLabel: { fontSize: 13, fontWeight: '500' },
  dotsRow: { flexDirection: 'row', gap: 10 },
  dotWrap: { alignItems: 'center', gap: 6, flex: 1 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: 'transparent' },
  dotLabel: { fontSize: 10 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 15 },
  shareBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  shareTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

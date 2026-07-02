import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, Alert, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { getDb } from '../../src/db/database';
import { getEntry } from '../../src/db/entries';
import { getMediaForEntry } from '../../src/db/media';
import { ShareCard } from '../../src/share/renderer';
import { CARD_STYLES, DEFAULT_STYLE_ID, DEFAULT_VARIANT_ID } from '../../src/share/templates';
import { useTheme } from '../../src/theme/ThemeContext';
import { FONTS } from '../../src/theme/tokens';
import { SHARE_LINES, pick } from '../../src/theme/copy';
import { IconSticker } from '../../src/components/ui/IconSticker';
import { Mascot } from '../../src/components/ui/Mascot';
import { SpeechBubble } from '../../src/components/ui/SpeechBubble';
import { Chip } from '../../src/components/ui/Chip';
import { ActionButton } from '../../src/components/ui/ActionButton';
import type { Entry, MediaItem } from '../../src/types';

export default function ShareCardScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cardRef = useRef<View>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [photo, setPhoto] = useState<MediaItem | null>(null);
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID);
  const [variantId, setVariantId] = useState(DEFAULT_VARIANT_ID);
  const [showDate, setShowDate] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareLine] = useState(() => pick(SHARE_LINES));

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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.sheet }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <IconSticker glyph="✕" onPress={() => router.back()} />
        </View>

        <View style={styles.mascotRow}>
          <Mascot size={64} />
          <SpeechBubble kicker="SHARE IT, THEN" style={styles.bubble}>{shareLine}</SpeechBubble>
        </View>

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

        <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>STYLE</Text>
        <View style={styles.chipRow}>
          {CARD_STYLES.map(s => (
            <Chip
              key={s.id}
              label={s.label.toUpperCase()}
              active={s.id === styleId}
              onPress={() => { setStyleId(s.id); setVariantId(s.variants[0].id); }}
            />
          ))}
        </View>

        <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>COLOUR</Text>
        <View style={styles.dotsRow}>
          {currentStyle.variants.map(v => {
            const active = v.id === variantId;
            return (
              <TouchableOpacity key={v.id} onPress={() => setVariantId(v.id)} style={styles.dotWrap}>
                <View style={[
                  styles.dot,
                  { backgroundColor: v.dotGradient[0], borderColor: active ? colors.border : 'transparent' },
                ]} />
                <Text style={[styles.dotLabel, { color: active ? colors.textPrimary : colors.textMuted }]}>
                  {v.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Show date</Text>
          <Switch value={showDate} onValueChange={setShowDate} trackColor={{ true: colors.action }} />
        </View>
        {entry.location_label && (
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Show location</Text>
            <Switch value={showLocation} onValueChange={setShowLocation} trackColor={{ true: colors.action }} />
          </View>
        )}

        <ActionButton
          label={sharing ? 'PREPARING…' : 'SEND IT'}
          onPress={handleShare}
          disabled={sharing}
          style={styles.shareBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 18, paddingTop: 8, gap: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row' },
  mascotRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 11 },
  bubble: { flex: 1, marginBottom: 10 },
  preview: { alignItems: 'center', paddingVertical: 8 },
  pickerLabel: { fontFamily: FONTS.label, fontSize: 11, letterSpacing: 1 },
  chipRow: { flexDirection: 'row', gap: 9, flexWrap: 'wrap' },
  dotsRow: { flexDirection: 'row', gap: 10 },
  dotWrap: { alignItems: 'center', gap: 6, flex: 1 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2.5 },
  dotLabel: { fontFamily: FONTS.labelRegular, fontSize: 10 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 15 },
  shareBtn: { justifyContent: 'center', marginTop: 4 },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getDb } from '../src/db/database';
import { countEntries } from '../src/db/entries';
import { getEligiblePrompts } from '../src/db/prompts';
import { selectHomeCardPrompts } from '../src/prompts/selection';
import { useTheme } from '../src/theme/ThemeContext';
import {
  FONTS, INK, KEYLINE_HEAVY, SHADOW_CARD, TILTS, CHIP_SCRIM,
} from '../src/theme/tokens';
import { QUIPS, QUIP_ROTATION_MS, CTA_LABELS, HOME_PICK_LABEL, HITS_COPY, pick } from '../src/theme/copy';
import { Sticker } from '../src/components/ui/Sticker';
import { ActionButton } from '../src/components/ui/ActionButton';
import { IconSticker } from '../src/components/ui/IconSticker';
import { Mascot } from '../src/components/ui/Mascot';
import { SpeechBubble } from '../src/components/ui/SpeechBubble';
import type { Prompt } from '../src/types';

export default function HomeScreen() {
  const { colors, categoryStyles } = useTheme();
  const [quipIndex, setQuipIndex] = useState(0);
  const [ctaLabel] = useState(() => pick(CTA_LABELS));
  const [cards, setCards] = useState<Prompt[]>([]);
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const lastEntryCountRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuipIndex(i => (i + 1) % QUIPS.length);
    }, QUIP_ROTATION_MS);
    return () => clearInterval(timer);
  }, []);

  // Re-run on every focus so the count stays fresh, but only reselect the
  // card stack when entryCount has actually changed (i.e. a submit happened)
  // — merely opening and closing a prompt shouldn't reshuffle the deck.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const db = await getDb();
          const n = await countEntries(db);
          if (!active) return;
          setEntryCount(n);
          if (lastEntryCountRef.current === null || n !== lastEntryCountRef.current) {
            const pool = await getEligiblePrompts(db, {});
            if (active) setCards(selectHomeCardPrompts(pool, 3));
          }
          lastEntryCountRef.current = n;
        } catch {}
      })();
      return () => { active = false; };
    }, [])
  );

  function openPrompt(prompt: Prompt) {
    router.push({
      pathname: '/respond',
      params: {
        promptText: prompt.text,
        promptCategory: prompt.category,
        promptKind: prompt.kind,
        gameConfig: prompt.game_config ?? '',
      },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: colors.badgeBg }]}>
            <Text style={[styles.badgeTxt, { color: colors.badgeFg }]}>BOREDNOTES</Text>
          </View>
          <IconSticker menu onPress={() => router.push('/settings')} />
        </View>

        <View style={styles.mascotRow}>
          <Mascot size={96} />
          <SpeechBubble style={styles.bubble}>{QUIPS[quipIndex]}</SpeechBubble>
        </View>

        <ActionButton size="lg" label={ctaLabel} onPress={() => router.push('/respond')} style={styles.cta} />

        <Text style={[styles.pickLabel, { color: colors.textPrimary }]}>{HOME_PICK_LABEL}</Text>

        <View style={styles.cardStack}>
          {cards.map((prompt, i) => {
            const cat = categoryStyles[prompt.category];
            const pillLabel = prompt.kind === 'loveHate' ? 'LOVE IT / HATE IT' : cat.label;
            return (
              <Sticker
                key={prompt.id}
                color={cat.color}
                borderColor={INK}
                borderWidth={KEYLINE_HEAVY}
                shadow={SHADOW_CARD}
                radius={16}
                tilt={TILTS[i % TILTS.length]}
                onPress={() => openPrompt(prompt)}
                style={styles.card}
              >
                <View style={styles.cardMeta}>
                  <View style={styles.catPill}>
                    <Text style={styles.catPillTxt}>{pillLabel}</Text>
                  </View>
                  <Text style={styles.catKind}>{cat.kind}</Text>
                </View>
                <Text style={styles.cardTxt}>{prompt.text}</Text>
              </Sticker>
            );
          })}
        </View>

        <Sticker
          color={colors.archiveBg}
          borderColor={colors.archiveBorder}
          shadow={colors.archiveShadow}
          radius={14}
          onPress={() => router.push('/boredbefore')}
          style={styles.archiveBar}
        >
          <View style={styles.archiveLeft}>
            <Text style={[styles.star, { color: colors.starFg }]}>★</Text>
            <Text style={[styles.archiveLabel, { color: colors.archiveInk }]}>{HITS_COPY.barLabel}</Text>
          </View>
          <Text style={[styles.archiveCount, { color: colors.action }]}>
            {entryCount === null ? '' : `${entryCount} ${HITS_COPY.barCountSuffix}`}
          </Text>
        </Sticker>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  badgeTxt: { fontFamily: FONTS.label, fontSize: 13, letterSpacing: 2 },
  mascotRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 14 },
  bubble: { flex: 1, marginBottom: 14 },
  cta: { marginTop: 16 },
  pickLabel: { fontFamily: FONTS.label, fontSize: 13, letterSpacing: 0.5, marginTop: 18 },
  cardStack: { flex: 1, marginTop: 11, gap: 11 },
  card: { flex: 1, paddingVertical: 13, paddingHorizontal: 15, justifyContent: 'center' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  catPill: { backgroundColor: CHIP_SCRIM, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 },
  catPillTxt: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 1, color: '#fff' },
  catKind: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 0.5, color: 'rgba(255,255,255,.6)' },
  cardTxt: { fontFamily: FONTS.display, fontSize: 18, lineHeight: 20, letterSpacing: -0.2, color: '#fff', marginTop: 7 },
  archiveBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 13, paddingVertical: 13, paddingHorizontal: 16,
  },
  archiveLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  star: { fontFamily: FONTS.display, fontSize: 15 },
  archiveLabel: { fontFamily: FONTS.label, fontSize: 14, letterSpacing: 0.5 },
  archiveCount: { fontFamily: FONTS.label, fontSize: 13 },
});

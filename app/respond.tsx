import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Keyboard, LayoutAnimation, Platform, SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { getDb } from '../src/db/database';
import { createEntry } from '../src/db/entries';
import { getNextPrompt } from '../src/prompts/next';
import { getContextualPrompt, forceRefreshContextualPrompt } from '../src/prompts/contextual';
import { getSetting, setSetting } from '../src/db/settings';
import { captureLocation, queuePendingGeocode } from '../src/location/location';
import { useTheme } from '../src/theme/ThemeContext';
import { checkEntryAgainstPlaces } from '../src/db/places';
import { DEFAULT_MODIFIERS } from '../src/types';
import type { CurrentPrompt, PromptCategory, PromptKind, PromptModifiers } from '../src/types';
import {
  DEFAULT_RANK_SLOTS, RANK_SLOT_COUNT, parseRankConfig, renderRankResponseText,
} from '../src/games/rank';
import {
  FONTS, INK, DEFEND_PAD, KEYLINE_HEAVY, SHADOW_STICKER, SHADOW_SM, CHIP_SCRIM,
} from '../src/theme/tokens';
import { REPLY_COPY, wordCounterLine, DISCARD_COPY, DISCARD_WARN_MIN_WORDS } from '../src/theme/copy';
import { Sticker } from '../src/components/ui/Sticker';
import { ActionButton } from '../src/components/ui/ActionButton';
import { IconSticker } from '../src/components/ui/IconSticker';
import { Mascot } from '../src/components/ui/Mascot';
import { Chip } from '../src/components/ui/Chip';
import { OutlinedNumber } from '../src/components/ui/OutlinedNumber';
import { useToast } from '../src/components/ui/Toast';

const CHIP_LABELS: Record<keyof PromptModifiers, string> = {
  place: 'PLACE',
  time: 'TIME',
  weather: 'WEATHER',
  memory: 'MEMORY',
};
const CHIP_KEYS: (keyof PromptModifiers)[] = ['place', 'time', 'weather', 'memory'];

// Hand-placed numeral tilts from the kit's rank slots.
const RANK_TILTS = [-6, 5, -4];

export default function RespondScreen() {
  const { colors, categoryStyles } = useTheme();
  const { showToast } = useToast();
  const navigation = useNavigation();
  // Set right before a successful save navigates away, so the unsaved-content
  // guard below doesn't fire on the way out.
  const savedRef = useRef(false);
  const params = useLocalSearchParams<{
    promptText?: string; promptCategory?: string; promptKind?: string; gameConfig?: string;
  }>();
  const cardPrompt: CurrentPrompt | null = params.promptText
    ? {
        text: params.promptText,
        category: (params.promptCategory as PromptCategory) ?? 'reflective',
        source: 'library',
        kind: (params.promptKind as PromptKind) ?? 'text',
        game_config: params.gameConfig || null,
      }
    : null;
  const isRank = cardPrompt?.kind === 'rank';
  const rankSlots = isRank
    ? (parseRankConfig(cardPrompt?.game_config)?.slots ?? DEFAULT_RANK_SLOTS)
    : DEFAULT_RANK_SLOTS;

  const [response, setResponse] = useState('');
  const [rankItems, setRankItems] = useState<string[]>(Array(RANK_SLOT_COUNT).fill(''));
  const [defense, setDefense] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [helpMeWriteOpen, setHelpMeWriteOpen] = useState(false);
  const [prompt, setPrompt] = useState<CurrentPrompt | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [modifiers, setModifiers] = useState<PromptModifiers>(DEFAULT_MODIFIERS);
  const [offlineMode, setOfflineMode] = useState(false);
  // This screen is a modal (see app/_layout.tsx), where KeyboardAvoidingView's
  // screen-coordinate frame math is unreliable and leaves the send button under
  // the keyboard. Track the keyboard height directly and lift the footer by it.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Which prompt (if any) drives this entry: a card tapped on Home wins,
  // otherwise the optional help-me-write contextual prompt.
  const activePrompt = cardPrompt ?? (helpMeWriteOpen ? prompt : null);
  const prompted = activePrompt !== null;

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const animate = (duration?: number) => {
      if (Platform.OS !== 'ios') return;
      LayoutAnimation.configureNext({
        duration: duration || 250,
        update: { type: LayoutAnimation.Types.keyboard },
      });
    };
    const showSub = Keyboard.addListener(showEvt, e => {
      animate(e.duration);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvt, e => {
      animate(e?.duration);
      setKeyboardHeight(0);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const responseWordCount = response.trim() === '' ? 0 : response.trim().split(/\s+/).length;
  const hasUnsavedContent = isRank
    ? rankItems.some(i => i.trim() !== '') || defense.trim() !== ''
    : responseWordCount >= DISCARD_WARN_MIN_WORDS;

  // Guard every exit path when there's meaningful unsaved input. beforeRemove
  // covers the back button and Android hardware back; disabling the swipe
  // gesture covers the iOS modal drag-to-dismiss (which native-stack's
  // beforeRemove can't reliably intercept). savedRef lets a real save through.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !hasUnsavedContent });
    const unsub = navigation.addListener('beforeRemove', e => {
      if (savedRef.current || !hasUnsavedContent) return;
      e.preventDefault();
      Alert.alert(DISCARD_COPY.title, DISCARD_COPY.body, [
        { text: DISCARD_COPY.keep, style: 'cancel' },
        { text: DISCARD_COPY.discard, style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsub;
  }, [navigation, hasUnsavedContent]);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      setOfflineMode((await getSetting(db, 'offline_mode')) === 'true');

      const storedChips = await getSetting(db, 'help_me_write_chips');
      if (storedChips) {
        try {
          setModifiers({ ...DEFAULT_MODIFIERS, ...JSON.parse(storedChips) });
        } catch {}
      }

      const shouldAutoLocate = (await getSetting(db, 'auto_location')) === 'true';
      if (shouldAutoLocate) {
        try {
          const loc = await captureLocation();
          if (loc) {
            setLocationLabel(loc.label ?? '');
            setLocationCoords({ lat: loc.lat, lng: loc.lng });
          }
        } catch {}
      }
    })();
  }, []);

  async function loadPrompt(activeModifiers: PromptModifiers) {
    setPromptLoading(true);
    try {
      const db = await getDb();
      const result = await getContextualPrompt(db, activeModifiers);
      setPrompt(result);
    } finally {
      setPromptLoading(false);
    }
  }

  async function handleToggleHelpMeWrite() {
    if (helpMeWriteOpen) {
      setHelpMeWriteOpen(false);
      return;
    }
    setHelpMeWriteOpen(true);
    if (!prompt) {
      await loadPrompt(modifiers);
    }
  }

  async function handleToggleModifier(key: keyof PromptModifiers) {
    const next = { ...modifiers, [key]: !modifiers[key] };
    setModifiers(next);
    setPromptLoading(true);
    try {
      const db = await getDb();
      await setSetting(db, 'help_me_write_chips', JSON.stringify(next));
      const fresh = await forceRefreshContextualPrompt(db, next);
      setPrompt(fresh);
    } catch {
      Alert.alert('Could not update prompt', 'Please try again.');
    } finally {
      setPromptLoading(false);
    }
  }

  async function handleSubmit() {
    const rankData = { items: rankItems.map(i => i.trim()), defense: defense.trim() };
    const rankComplete = rankData.items.every(i => i !== '') && rankData.defense !== '';
    if (isRank ? !rankComplete : !response.trim()) {
      Alert.alert('Write something first', isRank
        ? 'Fill all three slots and defend your #1.'
        : 'Your response cannot be empty.');
      return;
    }
    setSubmitting(true);
    try {
      const db = await getDb();
      const entryId = await createEntry(db, {
        prompt_text: activePrompt?.text ?? '',
        response_text: isRank ? renderRankResponseText(rankData) : response.trim(),
        location_label: locationLabel || undefined,
        location_lat: locationCoords?.lat,
        location_lng: locationCoords?.lng,
        entry_mode: prompted ? 'prompted' : 'freeform',
        entry_kind: isRank ? 'rank' : 'text',
        game_data: isRank ? JSON.stringify(rankData) : null,
        category: prompted ? activePrompt?.category ?? null : null,
      });
      if (locationCoords && !locationLabel) {
        await queuePendingGeocode(db, entryId, locationCoords.lat, locationCoords.lng);
      }
      if (locationCoords) {
        try {
          await checkEntryAgainstPlaces(db, {
            id: entryId,
            lat: locationCoords.lat,
            lng: locationCoords.lng,
          });
        } catch (e) {
          console.warn('checkEntryAgainstPlaces failed:', e);
        }
      }
      await getNextPrompt(db);
      savedRef.current = true;
      showToast();
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save your entry. Please try again.');
      setSubmitting(false);
    }
  }

  const catStyle = activePrompt ? categoryStyles[activePrompt.category] : null;
  // Help Me Write prompts are chip-driven, not tied to the homescreen's
  // observe/reflect/personal/creative taxonomy — swap the pill label (but
  // keep the card's hue for visual variety) so it never reads as a home card.
  const activeChipLabels = CHIP_KEYS.filter(k => modifiers[k]).map(k => CHIP_LABELS[k]);
  const promptPillLabel = cardPrompt
    ? catStyle?.label
    : (activeChipLabels.length > 0 ? activeChipLabels.join(' + ') : 'SPARK');
  const headerLabel = prompted ? REPLY_COPY.promptedLabel : REPLY_COPY.freeformLabel;
  const sendLabel = prompted ? REPLY_COPY.promptedSend : REPLY_COPY.freeformSend;
  const rankFilled = rankItems.every(i => i.trim() !== '') && defense.trim() !== '';
  const sendDisabled = (isRank ? !rankFilled : !response.trim())
    || submitting || (helpMeWriteOpen && promptLoading);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <IconSticker glyph="←" onPress={() => router.back()} />
            <Text style={[styles.headerLabel, { color: colors.textPrimary }]}>{headerLabel}</Text>
          </View>

          {/* Freeform gets the option to summon a prompt */}
          {!cardPrompt && !helpMeWriteOpen && (
            <Chip label="HELP ME WRITE" onPress={handleToggleHelpMeWrite} shadow={SHADOW_SM} style={styles.helpChip} />
          )}

          {activePrompt && (
            <Sticker
              color={catStyle!.color}
              borderColor={INK}
              borderWidth={KEYLINE_HEAVY}
              shadow={SHADOW_STICKER}
              radius={20}
              style={styles.promptCard}
            >
              <View style={styles.promptMeta}>
                <View style={styles.catPill}>
                  <Text style={styles.catPillTxt}>{promptPillLabel}</Text>
                </View>
                {!offlineMode && activePrompt.source === 'ai' && (
                  <View style={styles.catPill}>
                    <Text style={styles.catPillTxt}>AI</Text>
                  </View>
                )}
              </View>
              <Text style={styles.promptTxt}>
                {promptLoading ? '…' : activePrompt.text}
              </Text>
              {/* Help Me Write can be dismissed from the corner; rerolling is
                  done by toggling a chip below, so no ANOTHER button needed. */}
              {!cardPrompt && (
                <TouchableOpacity
                  onPress={handleToggleHelpMeWrite}
                  hitSlop={12}
                  style={styles.promptClose}
                >
                  <Text style={styles.promptCloseTxt}>✕</Text>
                </TouchableOpacity>
              )}
              <View style={styles.miniMascot} pointerEvents="none">
                <Mascot size={50} variant="yellow" bobDirection="right" />
              </View>
            </Sticker>
          )}

          {helpMeWriteOpen && !cardPrompt && !offlineMode && (
            <View style={styles.chipRow}>
              {CHIP_KEYS.map(key => (
                <Chip
                  key={key}
                  label={CHIP_LABELS[key]}
                  active={modifiers[key]}
                  onPress={promptLoading ? undefined : () => handleToggleModifier(key)}
                />
              ))}
            </View>
          )}

          {isRank ? (
            <View style={styles.rankStack}>
              {rankSlots.slice(0, RANK_SLOT_COUNT).map((slotPlaceholder, i) => (
                <Sticker key={i} borderWidth={KEYLINE_HEAVY} shadow={SHADOW_SM} radius={14} style={styles.rankSlot}>
                  <OutlinedNumber value={String(i + 1)} tilt={RANK_TILTS[i]} size={52} />
                  <TextInput
                    style={[styles.rankInput, { color: colors.textPrimary }]}
                    placeholder={slotPlaceholder}
                    placeholderTextColor={colors.when}
                    autoFocus={i === 0}
                    value={rankItems[i]}
                    onChangeText={text => {
                      setRankItems(items => items.map((it, j) => (j === i ? text : it)));
                    }}
                  />
                </Sticker>
              ))}
              <Sticker color={DEFEND_PAD} borderColor={INK} borderWidth={KEYLINE_HEAVY} shadow={SHADOW_SM} radius={14} style={styles.defendPad}>
                <Text style={styles.defendLabel}>DEFEND YOUR #1</Text>
                <TextInput
                  style={styles.defendInput}
                  placeholder="no scoring. just commit to the bit."
                  placeholderTextColor="#b6b3a6"
                  multiline
                  value={defense}
                  onChangeText={setDefense}
                />
              </Sticker>
            </View>
          ) : (
          <Sticker borderWidth={KEYLINE_HEAVY} shadow={4} radius={16} style={styles.inputCard}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder={prompted ? REPLY_COPY.promptedPlaceholder : REPLY_COPY.freeformPlaceholder}
              placeholderTextColor={colors.when}
              multiline
              autoFocus
              value={response}
              onChangeText={setResponse}
            />
          </Sticker>
          )}

          {locationLabel !== '' && (
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.locationInput, { color: colors.textPrimary, borderBottomColor: colors.border }]}
                value={locationLabel}
                onChangeText={setLocationLabel}
                placeholder="Edit place name"
                placeholderTextColor={colors.when}
              />
              <TouchableOpacity onPress={() => { setLocationLabel(''); setLocationCoords(null); }} hitSlop={8}>
                <Text style={styles.removeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer scrolls with the content (no opaque overlay bar). The
              parent View's paddingBottom shrinks the scroll region when the
              keyboard is up, so the send button still lands above it. */}
          <View style={styles.footerRow}>
            <Text style={[styles.counter, { color: colors.textMuted }]}>
              {isRank ? (rankFilled ? 'committed to the bit' : 'no scoring. just commit.') : wordCounterLine(response)}
            </Text>
            <ActionButton
              label={submitting ? 'SAVING…' : sendLabel}
              onPress={handleSubmit}
              disabled={sendDisabled}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerLabel: { fontFamily: FONTS.label, fontSize: 13, letterSpacing: 1 },
  helpChip: { alignSelf: 'flex-start' },
  promptCard: { padding: 14, paddingBottom: 16, marginBottom: 8 },
  promptMeta: { flexDirection: 'row', gap: 6 },
  catPill: { backgroundColor: CHIP_SCRIM, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' },
  catPillTxt: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 1, color: '#fff' },
  promptTxt: {
    fontFamily: FONTS.display, fontSize: 21, lineHeight: 24, letterSpacing: -0.3,
    color: '#fff', marginTop: 7, maxWidth: 250,
  },
  promptClose: { position: 'absolute', top: 8, right: 12, zIndex: 2 },
  promptCloseTxt: { fontFamily: FONTS.label, fontSize: 15, color: 'rgba(255,255,255,.85)' },
  miniMascot: { position: 'absolute', bottom: -15, right: 16 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  inputCard: { flex: 1, minHeight: 180, padding: 16 },
  rankStack: { gap: 9 },
  rankSlot: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 52, paddingHorizontal: 13, overflow: 'visible',
  },
  rankInput: { flex: 1, fontFamily: FONTS.bodySemiBold, fontSize: 16, paddingVertical: 0 },
  defendPad: { minHeight: 110, paddingVertical: 11, paddingHorizontal: 13 },
  defendLabel: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 1, color: '#141414' },
  defendInput: {
    fontFamily: FONTS.body, fontSize: 16, lineHeight: 22, color: '#141414',
    marginTop: 5, minHeight: 66, textAlignVertical: 'top',
  },
  input: {
    flex: 1, fontFamily: FONTS.body, fontSize: 18, lineHeight: 26, minHeight: 150,
    textAlignVertical: 'top',
  },
  removeTxt: { color: '#FF4438', fontFamily: FONTS.label, fontSize: 11, letterSpacing: 0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationInput: { flex: 1, fontFamily: FONTS.body, fontSize: 14, borderBottomWidth: 1, paddingVertical: 4 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  counter: { fontFamily: FONTS.labelRegular, fontSize: 13, flex: 1 },
});

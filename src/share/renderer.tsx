import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/tokens';
import { pick, FREEFORM_KICKERS, SHARE_TAGLINES } from '../theme/copy';
import { Mascot } from '../components/ui/Mascot';
import { resolveBand, resolveBandColor, footerMeta } from './card-content';
import type { PromptCategory } from '../types';

export interface ShareCardProps {
  promptText: string;
  responseText: string;
  createdAt: string | null;
  location: string | null;
  showDate: boolean;
  showLocation: boolean;
  entryMode: 'prompted' | 'freeform';
  category: PromptCategory | null;
}

export const ShareCard = React.forwardRef<View, ShareCardProps>(
  ({ promptText, responseText, createdAt, location, showDate, showLocation, entryMode, category }, ref) => {
    const { colors, categoryStyles } = useTheme();
    // Picked once per mount so the live preview matches the captured PNG.
    const [freeformKicker] = useState(() => pick(FREEFORM_KICKERS));
    const [tagline] = useState(() => pick(SHARE_TAGLINES));

    const band = resolveBand(entryMode, category, promptText, freeformKicker);
    const bandColor = resolveBandColor(category, categoryStyles);
    const meta = footerMeta(createdAt, location, showDate, showLocation);

    return (
      <View
        ref={ref}
        style={[
          styles.card,
          { backgroundColor: colors.bg, borderColor: colors.cardBorder, shadowColor: colors.shadowColor },
        ]}
      >
        <View style={[styles.band, { backgroundColor: bandColor }]}>
          <Text style={styles.kicker}>{band.kicker}</Text>
          {band.setupLine !== null && <Text style={styles.setup}>{band.setupLine}</Text>}
        </View>

        <View style={styles.punchWrap}>
          <Text style={[styles.punch, { color: colors.textPrimary }]}>{responseText}</Text>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.cardBorder }]}>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{meta}</Text>
          <View style={styles.lockup}>
            <Mascot size={30} variant="red" bob={false} />
            <View>
              <Text style={[styles.wordmark, { color: colors.textPrimary }]}>BoredNotes</Text>
              <Text style={[styles.tagline, { color: colors.textMuted }]}>{tagline}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    width: 320,
    borderRadius: 18,
    borderWidth: 3,
    overflow: 'hidden',
    transform: [{ rotate: '-1.4deg' }],
    shadowOffset: { width: 7, height: 7 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  band: { paddingVertical: 14, paddingHorizontal: 18, gap: 4, minHeight: 64 },
  kicker: {
    fontFamily: FONTS.label,
    fontSize: 9,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
  },
  setup: { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 14, lineHeight: 19, color: '#FFFFFF' },
  punchWrap: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  punch: { fontFamily: FONTS.display, fontSize: 22, lineHeight: 26 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 3,
    borderStyle: 'dashed',
  },
  meta: { fontFamily: FONTS.label, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase' },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontFamily: FONTS.display, fontSize: 12 },
  tagline: { fontFamily: FONTS.label, fontSize: 7.5, letterSpacing: 0.5, textTransform: 'uppercase' },
});

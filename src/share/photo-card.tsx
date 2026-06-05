import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { PhotoTokens } from './templates';

export interface PhotoCardProps {
  tokens: PhotoTokens;
  promptText: string;
  responseText: string;
  createdAt: string | null;
  location: string | null;
  photoUri: string | null;
  showDate: boolean;
  showLocation: boolean;
  entryMode: 'prompted' | 'freeform';
}

function formatDate(createdAt: string | null): string | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export const PhotoCard = React.forwardRef<View, PhotoCardProps>(
  ({ tokens: t, promptText, responseText, createdAt, location, photoUri, showDate, showLocation, entryMode }, ref) => {
    const showLoc = showLocation && !!location;
    const dateStr = showDate ? formatDate(createdAt) : null;
    const captionParts = ([showLoc && location, dateStr]).filter(Boolean) as string[];
    const caption = captionParts.join(' · ');
    const showPrompt = entryMode === 'prompted' && !!promptText;

    return (
      <View ref={ref} style={[styles.card, { backgroundColor: t.bg }]}>
        {photoUri ? (
          <Image
            testID="photo-image"
            source={{ uri: photoUri }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View
            testID="photo-placeholder"
            style={[styles.photo, { backgroundColor: t.photoPlaceholder }]}
          />
        )}
        <View style={styles.body}>
          {showPrompt && (
            <Text style={[styles.prompt, { color: t.muted }]}>{`"${promptText}"`}</Text>
          )}
          <Text style={[styles.response, { color: t.text }]}>{responseText}</Text>
        </View>
        <View style={styles.footer}>
          {!!caption && (
            <Text style={[styles.caption, { color: t.muted }]}>{caption}</Text>
          )}
          <Text style={[styles.watermark, { color: t.muted }]}>borednotes</Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: 320, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 10, elevation: 8,
  },
  photo: { width: '100%', height: 150 },
  body: { paddingTop: 14, paddingHorizontal: 18, paddingBottom: 4, gap: 7 },
  prompt: { fontSize: 10.5, fontStyle: 'italic', fontFamily: 'Georgia' },
  response: { fontSize: 13, lineHeight: 21.5, fontFamily: 'Georgia' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14,
  },
  caption: { fontSize: 11.5, fontStyle: 'italic', fontFamily: 'Georgia', flex: 1 },
  watermark: { fontSize: 8, letterSpacing: 1.8 },
});

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { ShareTemplate } from './templates';

interface ShareCardProps {
  template: ShareTemplate;
  promptText: string;
  responseText: string;
  date: string | null;
  location: string | null;
  photoUri: string | null;
  showDate: boolean;
  showLocation: boolean;
}

export const ShareCard = React.forwardRef<View, ShareCardProps>(
  ({ template, promptText, responseText, date, location, photoUri, showDate, showLocation }, ref) => {
    const isSerif = template.fontFamily === 'serif';

    return (
      <View ref={ref} style={[styles.card, { backgroundColor: template.bg, width: 320 }]}>
        {template.accentStyle === 'topbar' && (
          <View style={[styles.topbar, { backgroundColor: template.accentColor }]} />
        )}
        <View style={styles.inner}>
          {template.accentStyle === 'sidebar' && (
            <View style={[styles.sidebar, { backgroundColor: template.accentColor }]} />
          )}
          <View style={styles.body}>
            <Text style={[styles.appLabel, { color: template.metaColor }]}>BORED NOTES</Text>
            {!!promptText && (
              <Text style={[styles.prompt, { color: template.promptColor, fontStyle: isSerif ? 'italic' : 'normal' }]}>
                {`"${promptText}"`}
              </Text>
            )}
            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            )}
            <Text style={[styles.response, { color: template.textColor, fontFamily: isSerif ? 'Georgia' : undefined }]}>
              {responseText}
            </Text>
            {(showDate || showLocation) && (
              <Text style={[styles.meta, { color: template.metaColor }]}>
                {[showDate && date, showLocation && location].filter(Boolean).join('  ·  ')}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: { borderRadius: 12, overflow: 'hidden' },
  topbar: { height: 4 },
  inner: { flexDirection: 'row' },
  sidebar: { width: 4 },
  body: { flex: 1, padding: 20, gap: 10 },
  appLabel: { fontSize: 9, letterSpacing: 2 },
  prompt: { fontSize: 11 },
  photo: { width: '100%', height: 140, borderRadius: 6 },
  response: { fontSize: 14, lineHeight: 22 },
  meta: { fontSize: 10, marginTop: 4 },
});

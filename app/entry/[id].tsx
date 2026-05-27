import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import { getDb } from '../../src/db/database';
import { getEntry } from '../../src/db/entries';
import { getMediaForEntry } from '../../src/db/media';
import type { Entry, MediaItem } from '../../src/types';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [player, setPlayer] = useState<AudioPlayer | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const e = await getEntry(db, Number(id));
      setEntry(e);
      if (e) setMedia(await getMediaForEntry(db, e.id));
    })();
    return () => { player?.remove(); };
  }, [id]);

  const photo = media.find(m => m.type === 'photo');
  const voice = media.find(m => m.type === 'voice');

  async function togglePlayback() {
    if (!voice) return;
    if (playing && player) {
      player.pause();
      setPlaying(false);
    } else if (player) {
      player.play();
      setPlaying(true);
    } else {
      const p = createAudioPlayer({ uri: voice.file_path });
      p.addListener('playbackStatusUpdate', (status: any) => {
        if (status.didJustFinish) setPlaying(false);
      });
      p.play();
      setPlayer(p);
      setPlaying(true);
    }
  }

  if (!entry) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.dateTime}>{formatDateTime(entry.created_at)}</Text>
        {entry.location_label && (
          <Text style={styles.location}>📍 {entry.location_label}</Text>
        )}

        <Text style={styles.prompt}>{entry.prompt_text}</Text>

        {photo && (
          <Image source={{ uri: photo.file_path }} style={styles.photo} resizeMode="cover" />
        )}

        <Text style={styles.response}>{entry.response_text}</Text>

        {voice && (
          <TouchableOpacity style={styles.voiceBtn} onPress={togglePlayback}>
            <Text style={styles.voiceTxt}>{playing ? '⏸ Pause voice memo' : '▶ Play voice memo'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => router.push(`/share/${entry.id}`)}
        >
          <Text style={styles.shareTxt}>Share this entry</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  back: { paddingVertical: 4 },
  backTxt: { color: '#888', fontSize: 15 },
  dateTime: { fontSize: 13, color: '#aaa' },
  location: { fontSize: 13, color: '#aaa' },
  prompt: { fontSize: 16, color: '#888', fontStyle: 'italic', lineHeight: 24 },
  photo: { width: '100%', height: 220, borderRadius: 12 },
  response: { fontSize: 18, color: '#1a1a1a', lineHeight: 28 },
  voiceBtn: { backgroundColor: '#f4f4f4', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  voiceTxt: { color: '#555', fontSize: 15 },
  shareBtn: { backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  shareTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

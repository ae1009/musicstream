import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Track } from '../../types/track';
import { ArtworkImage } from '../shared/ArtworkImage';
import { colors, spacing, fontSizes, borderRadius } from '../../constants/theme';
import { usePlayerStore } from '../../stores/playerStore';

interface Props {
  track: Track;
  queue?: Track[];
  width?: number;
}

function trackToQueueItem(t: Track) {
  return {
    id: t.id, title: t.title, artist: t.artist,
    artwork_url: t.artwork_url, stream_url: t.stream_url,
    duration_s: t.duration_s, source: t.source,
  };
}

export function TrackCard({ track, queue = [], width = 140 }: Props) {
  const play = usePlayerStore((s) => s.play);

  const handlePress = () => {
    const queueItems = queue.length > 0 ? queue.map(trackToQueueItem) : [trackToQueueItem(track)];
    play(trackToQueueItem(track), queueItems);
  };

  return (
    <TouchableOpacity style={[styles.card, { width }]} onPress={handlePress} activeOpacity={0.8}>
      <ArtworkImage uri={track.artwork_url} size={width} radius={borderRadius.md} />
      <Text style={styles.title} numberOfLines={2}>{track.title}</Text>
      <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: spacing.md },
  title: { color: colors.text, fontSize: fontSizes.sm, fontWeight: '600', marginTop: spacing.sm },
  artist: { color: colors.textSecondary, fontSize: fontSizes.xs, marginTop: 2 },
});

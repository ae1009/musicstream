import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Track } from '../../types/track';
import { ArtworkImage } from '../shared/ArtworkImage';
import { colors, spacing, fontSizes } from '../../constants/theme';
import { formatDuration } from '../../utils/format';
import { usePlayerStore } from '../../stores/playerStore';

interface Props {
  track: Track;
  queue?: Track[];
  showDuration?: boolean;
}

function trackToQueueItem(t: Track) {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    artwork_url: t.artwork_url,
    stream_url: t.stream_url,
    duration_s: t.duration_s,
    source: t.source,
  };
}

export function TrackRow({ track, queue = [], showDuration = true }: Props) {
  const play = usePlayerStore((s) => s.play);
  const currentItem = usePlayerStore((s) => s.currentItem);
  const isActive = currentItem?.id === track.id;

  const handlePress = () => {
    const queueItems = queue.length > 0 ? queue.map(trackToQueueItem) : [trackToQueueItem(track)];
    play(trackToQueueItem(track), queueItems);
  };

  return (
    <TouchableOpacity style={styles.row} onPress={handlePress} activeOpacity={0.7}>
      <ArtworkImage uri={track.artwork_url} size={48} />
      <View style={styles.info}>
        <Text style={[styles.title, isActive && styles.activeText]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>
      {showDuration && (
        <Text style={styles.duration}>{formatDuration(track.duration_s)}</Text>
      )}
      <TouchableOpacity style={styles.more}>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  info: { flex: 1 },
  title: { color: colors.text, fontSize: fontSizes.md, fontWeight: '500' },
  activeText: { color: colors.primary },
  artist: { color: colors.textSecondary, fontSize: fontSizes.sm, marginTop: 2 },
  duration: { color: colors.textMuted, fontSize: fontSizes.sm },
  more: { padding: spacing.xs },
});

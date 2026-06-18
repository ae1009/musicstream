import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { YouTubeVideo } from '../../types/youtube';
import { ArtworkImage } from '../shared/ArtworkImage';
import { colors, spacing, fontSizes, borderRadius } from '../../constants/theme';
import { formatDuration, formatViews } from '../../utils/format';
import { usePlayerStore } from '../../stores/playerStore';

interface Props {
  video: YouTubeVideo;
}

export function YouTubeCard({ video }: Props) {
  const play = usePlayerStore((s) => s.play);

  const handlePress = () => {
    play({
      id: `yt:${video.id}`,
      title: video.title,
      artist: video.artist,
      artwork_url: video.artwork_url,
      stream_url: video.stream_url,
      duration_s: video.duration_s,
      source: 'youtube',
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.thumb}>
        <ArtworkImage uri={video.artwork_url} size={120} radius={borderRadius.sm} />
        {video.duration_s && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatDuration(video.duration_s)}</Text>
          </View>
        )}
        <View style={styles.playBtn}>
          <Ionicons name="play-circle" size={32} color="white" />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{video.artist}</Text>
        {video.view_count && (
          <Text style={styles.views}>{formatViews(video.view_count)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  thumb: { position: 'relative' },
  badge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3,
  },
  badgeText: { color: 'white', fontSize: fontSizes.xs },
  playBtn: {
    position: 'absolute', top: '50%', left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  info: { flex: 1, justifyContent: 'center' },
  title: { color: colors.text, fontSize: fontSizes.md, fontWeight: '500' },
  artist: { color: colors.textSecondary, fontSize: fontSizes.sm, marginTop: 4 },
  views: { color: colors.textMuted, fontSize: fontSizes.xs, marginTop: 2 },
});

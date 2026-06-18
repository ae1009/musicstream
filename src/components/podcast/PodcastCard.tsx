import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Podcast } from '../../types/podcast';
import { ArtworkImage } from '../shared/ArtworkImage';
import { colors, spacing, fontSizes, borderRadius } from '../../constants/theme';

interface Props {
  podcast: Podcast;
  onPress: (podcast: Podcast) => void;
  width?: number;
}

export function PodcastCard({ podcast, onPress, width = 130 }: Props) {
  return (
    <TouchableOpacity style={[styles.card, { width }]} onPress={() => onPress(podcast)} activeOpacity={0.8}>
      <ArtworkImage uri={podcast.artwork_url} size={width} radius={borderRadius.md} />
      <Text style={styles.title} numberOfLines={2}>{podcast.title}</Text>
      {podcast.author && (
        <Text style={styles.author} numberOfLines={1}>{podcast.author}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: spacing.md },
  title: { color: colors.text, fontSize: fontSizes.sm, fontWeight: '600', marginTop: spacing.sm },
  author: { color: colors.textSecondary, fontSize: fontSizes.xs, marginTop: 2 },
});

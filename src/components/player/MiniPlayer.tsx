import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '../../navigation/context';
import { ArtworkImage } from '../shared/ArtworkImage';
import { usePlayerStore } from '../../stores/playerStore';
import { colors, spacing, fontSizes } from '../../constants/theme';

export function MiniPlayer() {
  const { currentItem, isPlaying, pause, resume } = usePlayerStore();
  const navigation = useNavigation<any>();

  if (!currentItem) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('FullPlayer')}
      activeOpacity={0.9}
    >
      <ArtworkImage uri={currentItem.artwork_url} size={44} radius={6} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{currentItem.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentItem.artist}</Text>
      </View>
      <TouchableOpacity
        onPress={isPlaying ? pause : resume}
        style={styles.playBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => usePlayerStore.getState().next()}
        style={styles.playBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="play-skip-forward" size={22} color={colors.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  info: { flex: 1 },
  title: { color: colors.text, fontSize: fontSizes.sm, fontWeight: '600' },
  artist: { color: colors.textSecondary, fontSize: fontSizes.xs },
  playBtn: { padding: spacing.xs },
});

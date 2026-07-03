import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '../../navigation/context';
import { ArtworkImage } from '../../components/shared/ArtworkImage';
import { ProgressBar } from '../../components/player/ProgressBar';
import { PlaybackControls } from '../../components/player/PlaybackControls';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { colors, spacing, fontSizes } from '../../constants/theme';

interface Props {
  onPlayBtnLayout?: (top: number, left: number, size: number) => void;
}

export function FullPlayerScreen({ onPlayBtnLayout }: Props) {
  const navigation = useNavigation();
  const { currentItem } = usePlayerStore();
  const { favoriteIds, toggleFavorite } = useLibraryStore();

  if (!currentItem) return null;

  const isFav = favoriteIds.has(currentItem.id);

  const handleFavorite = () => {
    toggleFavorite({
      id: currentItem.id,
      type: 'track',
      title: currentItem.title,
      artist: currentItem.artist,
      artwork_url: currentItem.artwork_url,
      stream_url: currentItem.stream_url,
      source: currentItem.source,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reproduciendo</Text>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Artwork */}
      <View style={styles.artworkContainer}>
        <ArtworkImage uri={currentItem.artwork_url} size={280} radius={16} />
      </View>

      {/* Info + Like */}
      <View style={styles.infoRow}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentItem.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentItem.artist}</Text>
        </View>
        <TouchableOpacity onPress={handleFavorite} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={26} color={isFav ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <ProgressBar />

      {/* Controls */}
      <View style={styles.controls}>
        <PlaybackControls size="full" onPlayBtnLayout={onPlayBtnLayout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: { color: colors.text, fontSize: fontSizes.sm, fontWeight: '600', letterSpacing: 1 },
  artworkContainer: { alignItems: 'center', marginVertical: spacing.xl },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  info: { flex: 1 },
  title: { color: colors.text, fontSize: fontSizes.xl, fontWeight: '700' },
  artist: { color: colors.textSecondary, fontSize: fontSizes.md, marginTop: 4 },
  controls: { marginTop: spacing.lg },
});

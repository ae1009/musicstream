import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, SectionList,
} from 'react-native';
import { useNavigation } from '../../navigation/context';
import { Ionicons } from '@expo/vector-icons';
import { ArtworkImage } from '../../components/shared/ArtworkImage';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import { colors, spacing, fontSizes, borderRadius } from '../../constants/theme';

export function LibraryScreen() {
  const navigation = useNavigation<any>();
  const { favorites, subscriptions, playlists, history, loadAll } = useLibraryStore();
  const play = usePlayerStore((s) => s.play);

  useEffect(() => { loadAll(); }, []);

  const sections = [
    ...(subscriptions.length > 0 ? [{
      title: 'Podcasts suscritos',
      data: subscriptions,
      type: 'podcast' as const,
    }] : []),
    ...(playlists.length > 0 ? [{
      title: 'Mis playlists',
      data: playlists,
      type: 'playlist' as const,
    }] : []),
    ...(favorites.length > 0 ? [{
      title: 'Me gusta',
      data: favorites,
      type: 'favorite' as const,
    }] : []),
  ];

  const renderItem = ({ item, section }: any) => {
    if (section.type === 'podcast') {
      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Podcasts', { screen: 'PodcastDetail', params: { feedId: item.feed_id } })}
        >
          <ArtworkImage uri={item.artwork_url} size={52} />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.sub} numberOfLines={1}>{item.author ?? 'Podcast'}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    if (section.type === 'favorite') {
      return (
        <TouchableOpacity
          style={styles.row}
          onPress={() => item.stream_url && play({
            id: item.id, title: item.title, artist: item.artist ?? '',
            artwork_url: item.artwork_url, stream_url: item.stream_url, source: item.source,
          })}
        >
          <ArtworkImage uri={item.artwork_url} size={52} />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.sub} numberOfLines={1}>{item.artist ?? ''}</Text>
          </View>
          <Ionicons name="heart" size={18} color={colors.primary} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={styles.row}>
        <View style={[styles.playlistIcon, { width: 52, height: 52 }]}>
          <Ionicons name="list" size={24} color={colors.textSecondary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.sub}>Playlist</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (sections.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Tu biblioteca</Text>
        <View style={styles.empty}>
          <Ionicons name="library" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Tu biblioteca está vacía</Text>
          <Text style={styles.emptyText}>
            Dale ♥ a canciones, suscríbete a podcasts y crea playlists
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Tu biblioteca</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item, i) => item.id ?? item.feed_id ?? String(i)}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    color: colors.text,
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  info: { flex: 1 },
  title: { color: colors.text, fontSize: fontSizes.md, fontWeight: '500' },
  sub: { color: colors.textSecondary, fontSize: fontSizes.sm, marginTop: 2 },
  playlistIcon: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emptyTitle: { color: colors.text, fontSize: fontSizes.lg, fontWeight: '700' },
  emptyText: { color: colors.textSecondary, fontSize: fontSizes.md, textAlign: 'center' },
});

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '../../navigation/context';
import { Ionicons } from '@expo/vector-icons';
import { Podcast, Episode } from '../../types/podcast';
import { ArtworkImage } from '../../components/shared/ArtworkImage';
import { podcastsApi } from '../../services/api/podcasts';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import { colors, spacing, fontSizes, borderRadius } from '../../constants/theme';
import { formatDuration, formatDate, truncate } from '../../utils/format';

export function PodcastDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { feedId, podcast: initialPodcast } = route.params ?? {};

  const [podcast, setPodcast] = useState<Podcast | null>(initialPodcast ?? null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  const { subscribedIds, toggleSubscription } = useLibraryStore();
  const play = usePlayerStore((s) => s.play);
  const isSubscribed = subscribedIds.has(feedId);

  useEffect(() => {
    const load = async () => {
      try {
        const [pod, eps] = await Promise.all([
          podcastsApi.getPodcast(feedId),
          podcastsApi.getEpisodes(feedId),
        ]);
        if (pod) setPodcast(pod);
        setEpisodes(eps);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [feedId]);

  const handleSubscribe = () => {
    if (!podcast) return;
    toggleSubscription({
      feed_id: podcast.feed_id,
      title: podcast.title,
      author: podcast.author,
      artwork_url: podcast.artwork_url,
      feed_url: podcast.feed_url,
    });
  };

  const playEpisode = (episode: Episode) => {
    play({
      id: episode.id,
      title: episode.title,
      artist: podcast?.title ?? '',
      artwork_url: episode.artwork_url ?? podcast?.artwork_url,
      stream_url: episode.audio_url,
      duration_s: episode.duration_s,
      source: 'podcast',
    });
  };

  if (loading || !podcast) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={episodes}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ArtworkImage uri={podcast.artwork_url} size={140} radius={12} />
            <Text style={styles.title}>{podcast.title}</Text>
            {podcast.author && <Text style={styles.author}>{podcast.author}</Text>}
            {podcast.description && (
              <Text style={styles.desc}>{truncate(podcast.description, 200)}</Text>
            )}
            <TouchableOpacity
              style={[styles.subBtn, isSubscribed && styles.subBtnActive]}
              onPress={handleSubscribe}
            >
              <Text style={styles.subBtnText}>
                {isSubscribed ? '✓ Suscrito' : 'Suscribirse'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.episodeHeader}>Episodios</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.episode} onPress={() => playEpisode(item)}>
            <View style={styles.episodeInfo}>
              <Text style={styles.episodeTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.episodeMeta}>
                {item.pub_date && <Text style={styles.meta}>{formatDate(item.pub_date)}</Text>}
                {item.duration_s && <Text style={styles.meta}>{formatDuration(item.duration_s)}</Text>}
              </View>
            </View>
            <Ionicons name="play-circle-outline" size={36} color={colors.primary} />
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { alignItems: 'center', padding: spacing.md, paddingTop: 0 },
  backBtn: { alignSelf: 'flex-start', padding: spacing.sm },
  title: { color: colors.text, fontSize: fontSizes.xl, fontWeight: '700', textAlign: 'center', marginTop: spacing.md },
  author: { color: colors.textSecondary, fontSize: fontSizes.md, marginTop: 4 },
  desc: { color: colors.textSecondary, fontSize: fontSizes.sm, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  subBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.text,
  },
  subBtnActive: { backgroundColor: colors.text },
  subBtnText: { color: colors.background, fontWeight: '700', fontSize: fontSizes.sm },
  episodeHeader: {
    alignSelf: 'flex-start',
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  episode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  episodeInfo: { flex: 1 },
  episodeTitle: { color: colors.text, fontSize: fontSizes.md, fontWeight: '500' },
  episodeMeta: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  meta: { color: colors.textMuted, fontSize: fontSizes.xs },
});

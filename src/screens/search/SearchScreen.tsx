import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, SafeAreaView, Image,
} from 'react-native';
import { useNavigation } from '../../navigation/context';
import { Ionicons } from '@expo/vector-icons';
import { TrackRow } from '../../components/music/TrackRow';
import { PodcastCard } from '../../components/podcast/PodcastCard';
import { useSearch } from '../../hooks/useSearch';
import { youtubeApi } from '../../services/api/youtube';
import { YouTubeVideo } from '../../types/youtube';
import { usePlayerStore } from '../../stores/playerStore';
import { colors, spacing, fontSizes, borderRadius } from '../../constants/theme';
import { formatDuration, formatViews as fmtViews } from '../../utils/format';

type Tab = 'music' | 'podcasts' | 'youtube';

function YoutubeResults({ query }: { query: string }) {
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const play = usePlayerStore((s) => s.play);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await youtubeApi.search(query, 20);
        if (!cancelled) setResults(data);
      } catch { if (!cancelled) setResults([]); }
      finally { if (!cancelled) setLoading(false); }
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const handlePlay = async (video: YouTubeVideo) => {
    if (loadingId) return;
    setLoadingId(video.id);
    try {
      // Fetch audio-only URL — no video, saves data
      const audioUrl = await youtubeApi.getAudioUrl(video.id);
      await play({
        id: `youtube:${video.id}`,
        title: video.title,
        artist: video.artist,
        artwork_url: video.artwork_url,
        stream_url: audioUrl,
        duration_s: video.duration_s,
        source: 'youtube',
      });
    } catch {
      // silently fail — Invidious instance may be down
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  if (!query || results.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="logo-youtube" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>{query ? 'Sin resultados en YouTube' : 'Busca canciones en YouTube (solo audio)'}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(v) => v.id}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const isLoading = loadingId === item.id;
        return (
          <TouchableOpacity
            style={styles.videoRow}
            onPress={() => handlePlay(item)}
            activeOpacity={0.7}
            disabled={!!loadingId}
          >
            <Image source={{ uri: item.artwork_url }} style={styles.videoThumb} resizeMode="cover" />
            {item.duration_s ? (
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{formatDuration(item.duration_s)}</Text>
              </View>
            ) : null}
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.videoChannel} numberOfLines={1}>{item.artist}</Text>
              {item.view_count ? (
                <Text style={styles.videoViews}>{fmtViews(item.view_count)}</Text>
              ) : null}
            </View>
            {isLoading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="play-circle-outline" size={28} color={colors.textMuted} />}
          </TouchableOpacity>
        );
      }}
    />
  );
}

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<Tab>('music');
  const { query, setQuery, results, loading } = useSearch(['music', 'podcasts']);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'music',    label: 'Música' },
    { key: 'podcasts', label: 'Podcasts' },
    { key: 'youtube',  label: 'YouTube' },
  ];

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="search" size={48} color={colors.textMuted} />
      <Text style={styles.emptyText}>
        {query ? 'Sin resultados' : 'Busca canciones o podcasts'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Buscar..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'youtube' ? (
        <YoutubeResults query={query} />
      ) : loading && query ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <>
          {activeTab === 'music' && (
            <FlatList
              data={results.tracks}
              keyExtractor={(t) => t.id}
              renderItem={({ item }) => <TrackRow track={item} queue={results.tracks} />}
              ListEmptyComponent={renderEmpty}
              showsVerticalScrollIndicator={false}
            />
          )}
          {activeTab === 'podcasts' && (
            <FlatList
              data={results.podcasts}
              keyExtractor={(p) => p.feed_id}
              numColumns={2}
              columnWrapperStyle={styles.grid}
              renderItem={({ item }) => (
                <PodcastCard
                  podcast={item}
                  onPress={(p) => navigation.navigate('Podcasts', { screen: 'PodcastDetail', params: { feedId: p.feed_id } })}
                  width={160}
                />
              )}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={{ padding: spacing.md }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    margin: spacing.md,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.text, fontSize: fontSizes.md },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '600' },
  tabTextActive: { color: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: fontSizes.md, textAlign: 'center' },
  grid: { gap: spacing.md },
  // YouTube video row
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceVariant,
  },
  videoThumb: {
    width: 120,
    height: 68,
    borderRadius: 6,
    backgroundColor: colors.surfaceVariant,
  },
  durationBadge: {
    position: 'absolute',
    bottom: spacing.sm + 4,
    left: spacing.md + 84,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  durationText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  videoInfo: { flex: 1, gap: 2 },
  videoTitle: { color: colors.text, fontSize: fontSizes.sm, fontWeight: '600', lineHeight: 18 },
  videoChannel: { color: colors.textSecondary, fontSize: fontSizes.xs },
  videoViews: { color: colors.textMuted, fontSize: fontSizes.xs },
});

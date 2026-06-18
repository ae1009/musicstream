import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, FlatList,
  ActivityIndicator, StyleSheet, RefreshControl, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Track } from '../../types/track';
import { Podcast } from '../../types/podcast';
import { TrackCard } from '../../components/music/TrackCard';
import { TrackRow } from '../../components/music/TrackRow';
import { PodcastCard } from '../../components/podcast/PodcastCard';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { musicApi } from '../../services/api/music';
import { podcastsApi } from '../../services/api/podcasts';
import { useLibraryStore } from '../../stores/libraryStore';
import { colors, spacing, fontSizes } from '../../constants/theme';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [featured, setFeatured] = useState<Track[]>([]);
  const [trending, setTrending] = useState<Track[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const history = useLibraryStore((s) => s.history);

  const loadData = async () => {
    try {
      const [feat, trend, pods] = await Promise.all([
        musicApi.getFeatured(10),
        musicApi.getTrending(20),
        podcastsApi.getTrending(10),
      ]);
      setFeatured(feat);
      setTrending(trend);
      setPodcasts(pods);
    } catch {
      // Mostrar lo que se haya cargado
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.greeting}>{greeting}</Text>

        {/* Escuchado recientemente */}
        {history.length > 0 && (
          <>
            <SectionHeader title="Escuchado recientemente" />
            <FlatList
              data={history.slice(0, 10)}
              keyExtractor={(item) => item.content_id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              renderItem={({ item }) => (
                <TrackCard
                  track={{
                    id: item.content_id,
                    source: item.source,
                    title: item.title,
                    artist: item.artist ?? '',
                    artwork_url: item.artwork_url,
                    stream_url: item.stream_url ?? '',
                  }}
                  width={120}
                />
              )}
            />
          </>
        )}

        {/* Música destacada */}
        {featured.length > 0 && (
          <>
            <SectionHeader title="Destacados de la semana" />
            <FlatList
              data={featured}
              keyExtractor={(t) => t.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              renderItem={({ item }) => <TrackCard track={item} queue={featured} />}
            />
          </>
        )}

        {/* Tendencias */}
        {trending.length > 0 && (
          <>
            <SectionHeader title="Tendencias" onSeeAll={() => navigation.navigate('Search', { q: '' })} />
            {trending.slice(0, 6).map((t) => (
              <TrackRow key={t.id} track={t} queue={trending} />
            ))}
          </>
        )}

        {/* Podcasts populares */}
        {podcasts.length > 0 && (
          <>
            <SectionHeader title="Podcasts populares" onSeeAll={() => navigation.navigate('Podcasts')} />
            <FlatList
              data={podcasts}
              keyExtractor={(p) => p.feed_id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              renderItem={({ item }) => (
                <PodcastCard
                  podcast={item}
                  onPress={(p) => navigation.navigate('Podcasts', { screen: 'PodcastDetail', params: { feedId: p.feed_id } })}
                />
              )}
            />
          </>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  greeting: {
    color: colors.text,
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  hList: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
});

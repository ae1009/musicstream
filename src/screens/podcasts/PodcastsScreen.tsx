import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Podcast } from '../../types/podcast';
import { PodcastCard } from '../../components/podcast/PodcastCard';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { podcastsApi } from '../../services/api/podcasts';
import { colors, spacing, fontSizes } from '../../constants/theme';

export function PodcastsScreen() {
  const navigation = useNavigation<any>();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await podcastsApi.getTrending(30);
      setPodcasts(data);
    } catch {
      //
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const goToDetail = (podcast: Podcast) => {
    navigation.navigate('PodcastDetail', { feedId: podcast.feed_id, podcast });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Podcasts</Text>
      <FlatList
        data={podcasts}
        keyExtractor={(p) => p.feed_id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <PodcastCard podcast={item} onPress={goToDetail} width={160} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    color: colors.text, fontSize: fontSizes.xxl,
    fontWeight: '700', padding: spacing.md,
  },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  row: { justifyContent: 'space-between', marginBottom: spacing.md },
});

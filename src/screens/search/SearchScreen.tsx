import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TrackRow } from '../../components/music/TrackRow';
import { PodcastCard } from '../../components/podcast/PodcastCard';
import { YouTubeCard } from '../../components/youtube/YouTubeCard';
import { useSearch } from '../../hooks/useSearch';
import { colors, spacing, fontSizes, borderRadius } from '../../constants/theme';

type Tab = 'music' | 'podcasts' | 'youtube';

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<Tab>('music');
  const [youtubeAccepted, setYoutubeAccepted] = useState(false);

  const { query, setQuery, results, loading } = useSearch(['music', 'podcasts', 'youtube']);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'music', label: 'Música' },
    { key: 'podcasts', label: 'Podcasts' },
    { key: 'youtube', label: 'YouTube' },
  ];

  const handleYoutubeTab = () => {
    if (!youtubeAccepted) {
      Alert.alert(
        'Contenido de YouTube',
        'Este contenido proviene de YouTube a través de Invidious. Es una zona gris legal. ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => { setYoutubeAccepted(true); setActiveTab('youtube'); } },
        ],
      );
    } else {
      setActiveTab('youtube');
    }
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="search" size={48} color={colors.textMuted} />
      <Text style={styles.emptyText}>
        {query ? 'Sin resultados' : 'Busca canciones, podcasts o videos'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Buscar..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={key === 'youtube' ? handleYoutubeTab : () => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Resultados */}
      {loading && query ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
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
          {activeTab === 'youtube' && (
            <FlatList
              data={results.youtube}
              keyExtractor={(v) => v.id}
              renderItem={({ item }) => <YouTubeCard video={item} />}
              ListEmptyComponent={renderEmpty}
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
});

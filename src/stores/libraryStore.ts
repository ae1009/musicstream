import { create } from 'zustand';
import {
  addFavorite, removeFavorite, isFavorite, getFavorites,
  subscribeToPodcast, unsubscribeFromPodcast, isSubscribed, getSubscriptions,
  createPlaylist, getPlaylists, deletePlaylist, addTrackToPlaylist,
  getHistory,
} from '../services/storage/database';

interface LibraryStore {
  favorites: any[];
  subscriptions: any[];
  playlists: any[];
  history: any[];
  favoriteIds: Set<string>;
  subscribedIds: Set<string>;

  loadAll: () => Promise<void>;
  toggleFavorite: (item: {
    id: string; type: string; title: string; artist?: string;
    artwork_url?: string; stream_url?: string; source: string;
  }) => Promise<void>;
  toggleSubscription: (podcast: {
    feed_id: string; title: string; author?: string;
    artwork_url?: string; feed_url: string;
  }) => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<number>;
  deletePlaylist: (id: number) => Promise<void>;
  addTrackToPlaylist: (playlistId: number, trackId: string) => Promise<void>;
  refreshHistory: () => Promise<void>;
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  favorites: [],
  subscriptions: [],
  playlists: [],
  history: [],
  favoriteIds: new Set(),
  subscribedIds: new Set(),

  loadAll: async () => {
    const [favorites, subscriptions, playlists, history] = await Promise.all([
      getFavorites(),
      getSubscriptions(),
      getPlaylists(),
      getHistory(50),
    ]);
    set({
      favorites,
      subscriptions,
      playlists,
      history,
      favoriteIds: new Set(favorites.map((f: any) => f.id)),
      subscribedIds: new Set(subscriptions.map((s: any) => s.feed_id)),
    });
  },

  toggleFavorite: async (item) => {
    const { favoriteIds } = get();
    if (favoriteIds.has(item.id)) {
      await removeFavorite(item.id);
    } else {
      await addFavorite(item);
    }
    await get().loadAll();
  },

  toggleSubscription: async (podcast) => {
    const { subscribedIds } = get();
    if (subscribedIds.has(podcast.feed_id)) {
      await unsubscribeFromPodcast(podcast.feed_id);
    } else {
      await subscribeToPodcast(podcast);
    }
    await get().loadAll();
  },

  createPlaylist: async (name, description) => {
    const id = await createPlaylist(name, description);
    await get().loadAll();
    return id;
  },

  deletePlaylist: async (id) => {
    await deletePlaylist(id);
    await get().loadAll();
  },

  addTrackToPlaylist: async (playlistId, trackId) => {
    await addTrackToPlaylist(playlistId, trackId);
    await get().loadAll();
  },

  refreshHistory: async () => {
    const history = await getHistory(50);
    set({ history });
  },
}));

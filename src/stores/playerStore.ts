import { create } from 'zustand';
import TrackPlayer, { State } from 'react-native-track-player';
import { QueueItem, RepeatMode } from '../types/player';
import { playItem, setRepeatMode } from '../services/audio/trackPlayer';

interface PlayerStore {
  currentItem: QueueItem | null;
  queue: QueueItem[];
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  playbackRate: number;
  repeatMode: RepeatMode;
  shuffleMode: boolean;

  // Acciones
  play: (item: QueueItem, queue?: QueueItem[]) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  setRate: (rate: number) => Promise<void>;
  setRepeat: (mode: RepeatMode) => Promise<void>;
  toggleShuffle: () => void;
  addToQueue: (item: QueueItem) => Promise<void>;
  // Sincronización desde eventos RNTP
  _sync: (patch: Partial<PlayerStore>) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentItem: null,
  queue: [],
  isPlaying: false,
  isBuffering: false,
  position: 0,
  duration: 0,
  playbackRate: 1,
  repeatMode: 'off',
  shuffleMode: false,

  play: async (item, queue = []) => {
    const fullQueue = queue.length > 0 ? queue : [item];
    await playItem(item, fullQueue);
    set({ currentItem: item, queue: fullQueue, isPlaying: true });
  },

  pause: async () => {
    await TrackPlayer.pause();
    set({ isPlaying: false });
  },

  resume: async () => {
    await TrackPlayer.play();
    set({ isPlaying: true });
  },

  next: async () => {
    await TrackPlayer.skipToNext();
  },

  previous: async () => {
    const { position } = get();
    if (position > 3) {
      await TrackPlayer.seekTo(0);
    } else {
      await TrackPlayer.skipToPrevious();
    }
  },

  seekTo: async (seconds) => {
    await TrackPlayer.seekTo(seconds);
    set({ position: seconds });
  },

  setRate: async (rate) => {
    await TrackPlayer.setRate(rate);
    set({ playbackRate: rate });
  },

  setRepeat: async (mode) => {
    await setRepeatMode(mode);
    set({ repeatMode: mode });
  },

  toggleShuffle: () => set((s) => ({ shuffleMode: !s.shuffleMode })),

  addToQueue: async (item) => {
    await TrackPlayer.add([{
      id: item.id,
      url: item.stream_url,
      title: item.title,
      artist: item.artist,
      artwork: item.artwork_url,
      duration: item.duration_s,
    }]);
    set((s) => ({ queue: [...s.queue, item] }));
  },

  _sync: (patch) => set(patch as any),
}));

import { create } from 'zustand';
import { QueueItem, RepeatMode } from '../types/player';
import {
  loadAndPlay, pauseAudio, resumeAudio, seekAudio, setAudioRate, stopAudio,
} from '../services/audio/audioPlayer';
import { addToHistory } from '../services/storage/database';

interface PlayerStore {
  currentItem: QueueItem | null;
  queue: QueueItem[];
  queueIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  playbackRate: number;
  repeatMode: RepeatMode;
  shuffleMode: boolean;

  play: (item: QueueItem, queue?: QueueItem[]) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  setRate: (rate: number) => Promise<void>;
  setRepeat: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  addToQueue: (item: QueueItem) => void;
  _onStatus: (status: any) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentItem: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  isBuffering: false,
  position: 0,
  duration: 0,
  playbackRate: 1,
  repeatMode: 'off',
  shuffleMode: false,

  play: async (item, queue = []) => {
    const fullQueue = queue.length > 0 ? queue : [item];
    const idx = fullQueue.findIndex((t) => t.id === item.id);
    set({ currentItem: item, queue: fullQueue, queueIndex: idx < 0 ? 0 : idx, isPlaying: true });
    await loadAndPlay(item.stream_url, get()._onStatus);
    addToHistory({ content_id: item.id, type: 'track', title: item.title, artist: item.artist, artwork_url: item.artwork_url, source: item.source }).catch(() => {});
  },

  pause: async () => {
    await pauseAudio();
    set({ isPlaying: false });
  },

  resume: async () => {
    await resumeAudio();
    set({ isPlaying: true });
  },

  next: async () => {
    const { queue, queueIndex, repeatMode } = get();
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      if (repeatMode === 'queue') nextIdx = 0;
      else { await stopAudio(); set({ isPlaying: false }); return; }
    }
    const nextItem = queue[nextIdx];
    set({ currentItem: nextItem, queueIndex: nextIdx, isPlaying: true });
    await loadAndPlay(nextItem.stream_url, get()._onStatus);
  },

  previous: async () => {
    const { queue, queueIndex, position } = get();
    if (position > 3) { await seekAudio(0); return; }
    const prevIdx = Math.max(0, queueIndex - 1);
    const prevItem = queue[prevIdx];
    if (!prevItem) return;
    set({ currentItem: prevItem, queueIndex: prevIdx, isPlaying: true });
    await loadAndPlay(prevItem.stream_url, get()._onStatus);
  },

  seekTo: async (seconds) => {
    await seekAudio(seconds * 1000);
    set({ position: seconds });
  },

  setRate: async (rate) => {
    await setAudioRate(rate);
    set({ playbackRate: rate });
  },

  setRepeat: (mode) => set({ repeatMode: mode }),
  toggleShuffle: () => set((s) => ({ shuffleMode: !s.shuffleMode })),
  addToQueue: (item) => set((s) => ({ queue: [...s.queue, item] })),

  _onStatus: (status) => {
    if (!status.isLoaded) { set({ isPlaying: false, isBuffering: false }); return; }
    const positionSec = (status.positionMillis ?? 0) / 1000;
    const durationSec = (status.durationMillis ?? 0) / 1000;
    set({
      isPlaying: status.isPlaying,
      isBuffering: status.isBuffering,
      position: positionSec,
      duration: durationSec,
    });
    if (status.didJustFinish) {
      get().next();
    }
  },
}));

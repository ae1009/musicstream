import { Track } from './track';
import { Episode } from './podcast';
import { YouTubeVideo } from './youtube';

export type PlayableItem = Track | Episode | YouTubeVideo;

export interface QueueItem {
  id: string;
  title: string;
  artist: string;
  artwork_url?: string;
  stream_url: string;
  duration_s?: number;
  source: string;
}

export type RepeatMode = 'off' | 'track' | 'queue';

export interface PlayerState {
  currentItem: QueueItem | null;
  queue: QueueItem[];
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  playbackRate: number;
  repeatMode: RepeatMode;
  shuffleMode: boolean;
}

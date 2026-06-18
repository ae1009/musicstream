import { useEffect } from 'react';
import TrackPlayer, {
  useActiveTrack,
  usePlaybackState,
  useProgress,
  State,
  Event,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import { usePlayerStore } from '../stores/playerStore';
import { QueueItem } from '../types/player';

const EVENTS = [
  Event.PlaybackActiveTrackChanged,
  Event.PlaybackState,
  Event.PlaybackProgressUpdated,
];

export function usePlayerEvents() {
  const _sync = usePlayerStore((s) => s._sync);
  const activeTrack = useActiveTrack();
  const { state } = usePlaybackState();
  const { position, duration } = useProgress(500);

  useEffect(() => {
    const isPlaying = state === State.Playing;
    const isBuffering = state === State.Buffering || state === State.Loading;
    _sync({ isPlaying, isBuffering, position, duration });
  }, [state, position, duration]);

  useEffect(() => {
    if (activeTrack) {
      _sync({
        currentItem: {
          id: activeTrack.id as string,
          title: activeTrack.title ?? '',
          artist: activeTrack.artist ?? '',
          artwork_url: activeTrack.artwork as string | undefined,
          stream_url: activeTrack.url as string,
          duration_s: activeTrack.duration,
          source: (activeTrack.id as string)?.startsWith('yt') ? 'youtube' : 'jamendo',
        } as QueueItem,
      });
    }
  }, [activeTrack]);
}

export function usePlayer() {
  return usePlayerStore();
}

import TrackPlayer, {
  Capability,
  AppKilledPlaybackBehavior,
  Event,
  RepeatMode as RNTPRepeatMode,
} from 'react-native-track-player';
import { QueueItem } from '../../types/player';
import { addToHistory } from '../storage/database';

export async function setupPlayer(): Promise<boolean> {
  try {
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 10, // 10MB buffer
    });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      progressUpdateEventThrottle: 1000,
    });

    return true;
  } catch {
    // setupPlayer lanza error si ya fue inicializado — ignorar
    return false;
  }
}

export function toRNTPTrack(item: QueueItem) {
  return {
    id: item.id,
    url: item.stream_url,
    title: item.title,
    artist: item.artist,
    artwork: item.artwork_url,
    duration: item.duration_s,
  };
}

export async function playItem(item: QueueItem, queue: QueueItem[] = []): Promise<void> {
  await TrackPlayer.reset();
  const tracks = queue.length > 0 ? queue : [item];
  const startIndex = tracks.findIndex((t) => t.id === item.id);

  await TrackPlayer.add(tracks.map(toRNTPTrack));
  if (startIndex > 0) await TrackPlayer.skip(startIndex);
  await TrackPlayer.play();

  // Registrar en historial
  addToHistory({
    content_id: item.id,
    type: item.source === 'youtube' ? 'youtube' : item.id.startsWith('fma') ? 'track' : 'track',
    title: item.title,
    artist: item.artist,
    artwork_url: item.artwork_url,
    source: item.source,
  }).catch(() => {});
}

export async function setRepeatMode(mode: 'off' | 'track' | 'queue'): Promise<void> {
  const rntp = {
    off: RNTPRepeatMode.Off,
    track: RNTPRepeatMode.Track,
    queue: RNTPRepeatMode.Queue,
  }[mode];
  await TrackPlayer.setRepeatMode(rntp);
}

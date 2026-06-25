import { setAudioModeAsync, createAudioPlayer, AudioPlayer } from 'expo-audio';

let player: AudioPlayer | null = null;
let statusSub: ReturnType<AudioPlayer['addListener']> | null = null;

export async function setupAudio(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  } as any);
}

export async function loadAndPlay(
  url: string,
  onStatus: (s: any) => void,
): Promise<void> {
  if (player) {
    statusSub?.remove();
    player.remove();
    player = null;
  }

  player = createAudioPlayer({ uri: url });

  statusSub = player.addListener('playbackStatusUpdate', (status: any) => {
    const pos = status.currentTime ?? status.positionMillis ?? 0;
    const dur = status.duration ?? status.durationMillis ?? 0;
    // expo-audio reports in seconds; normalise to ms for the store
    const posMs = pos > 1000 ? pos : pos * 1000;
    const durMs = dur > 1000 ? dur : dur * 1000;

    onStatus({
      isLoaded: true,
      isPlaying: status.playing ?? status.isPlaying ?? false,
      isBuffering: status.buffering ?? status.isBuffering ?? false,
      positionMillis: posMs,
      durationMillis: durMs,
      didJustFinish: status.ended ?? status.didJustFinish ?? false,
    });
  });

  player.play();
}

export async function pauseAudio(): Promise<void> {
  player?.pause();
}

export async function resumeAudio(): Promise<void> {
  player?.play();
}

export async function seekAudio(positionMs: number): Promise<void> {
  if (!player) return;
  player.seekTo(positionMs / 1000);
}

export async function setAudioRate(rate: number): Promise<void> {
  if (!player) return;
  (player as any).rate = rate;
}

export async function stopAudio(): Promise<void> {
  if (player) {
    statusSub?.remove();
    statusSub = null;
    player.remove();
    player = null;
  }
}

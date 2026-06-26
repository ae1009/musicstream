import Sound from 'react-native-sound';
import * as FileSystem from 'expo-file-system';

Sound.setCategory('Playback');

const TEMP_FILE = (FileSystem.cacheDirectory ?? '') + 'audio_preview.mp3';

let currentSound: Sound | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let isPlaying = false;
let cancelToken = { id: 0 };

function releaseAll() {
  cancelToken.id++;
  isPlaying = false;
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (currentSound) { currentSound.stop(); currentSound.release(); currentSound = null; }
}

export async function setupAudio(): Promise<void> {
  Sound.setCategory('Playback');
}

export async function loadAndPlay(url: string, onStatus: (s: any) => void): Promise<void> {
  releaseAll();
  const myToken = cancelToken.id;

  onStatus({ isLoaded: true, isPlaying: false, isBuffering: true, positionMillis: 0, durationMillis: 0, didJustFinish: false });

  try {
    await FileSystem.downloadAsync(url, TEMP_FILE);
  } catch (_) {
    if (cancelToken.id !== myToken) return;
    onStatus({ isLoaded: false, isPlaying: false, isBuffering: false, positionMillis: 0, durationMillis: 0, didJustFinish: false });
    return;
  }

  if (cancelToken.id !== myToken) return;

  const snd = new Sound(TEMP_FILE, '', (err: any) => {
    if (cancelToken.id !== myToken) return;

    if (err) {
      onStatus({ isLoaded: false, isPlaying: false, isBuffering: false, positionMillis: 0, durationMillis: 0, didJustFinish: false });
      return;
    }

    const durMs = snd.getDuration() * 1000;
    isPlaying = true;

    snd.play((success: boolean) => {
      if (cancelToken.id !== myToken) return;
      isPlaying = false;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      onStatus({ isLoaded: true, isPlaying: false, isBuffering: false, positionMillis: durMs, durationMillis: durMs, didJustFinish: success });
    });

    pollTimer = setInterval(() => {
      if (cancelToken.id !== myToken || !currentSound) return;
      snd.getCurrentTime((seconds: number) => {
        if (cancelToken.id !== myToken) return;
        onStatus({ isLoaded: true, isPlaying, isBuffering: false, positionMillis: seconds * 1000, durationMillis: durMs, didJustFinish: false });
      });
    }, 500);

    onStatus({ isLoaded: true, isPlaying: true, isBuffering: false, positionMillis: 0, durationMillis: durMs, didJustFinish: false });
  });

  currentSound = snd;
}

export async function pauseAudio(): Promise<void> {
  if (currentSound && isPlaying) { currentSound.pause(); isPlaying = false; }
}

export async function resumeAudio(): Promise<void> {
  if (currentSound && !isPlaying) {
    isPlaying = true;
    currentSound.play((success: boolean) => {
      isPlaying = false;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    });
  }
}

export async function seekAudio(positionMs: number): Promise<void> {
  currentSound?.setCurrentTime(positionMs / 1000);
}

export async function setAudioRate(_rate: number): Promise<void> {}

export async function stopAudio(): Promise<void> { releaseAll(); }

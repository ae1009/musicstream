import Sound from 'react-native-sound';

Sound.setCategory('Playback');

let currentSound: Sound | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let isPlaying = false;

function releaseAll() {
  isPlaying = false;
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (currentSound) { currentSound.stop(); currentSound.release(); currentSound = null; }
}

export async function setupAudio(): Promise<void> {
  Sound.setCategory('Playback');
}

export async function loadAndPlay(url: string, onStatus: (s: any) => void): Promise<void> {
  releaseAll();

  const snd = new Sound(url, '', (err: any) => {
    if (currentSound !== snd) return;

    if (err) {
      onStatus({ isLoaded: false, isPlaying: false, isBuffering: false, positionMillis: 0, durationMillis: 0, didJustFinish: false });
      return;
    }

    const durMs = snd.getDuration() * 1000;
    isPlaying = true;

    snd.play((success: boolean) => {
      if (currentSound !== snd) return;
      isPlaying = false;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      onStatus({ isLoaded: true, isPlaying: false, isBuffering: false, positionMillis: durMs, durationMillis: durMs, didJustFinish: success });
    });

    pollTimer = setInterval(() => {
      if (currentSound !== snd) return;
      snd.getCurrentTime((seconds: number) => {
        if (currentSound !== snd) return;
        onStatus({ isLoaded: true, isPlaying, isBuffering: false, positionMillis: seconds * 1000, durationMillis: durMs, didJustFinish: false });
      });
    }, 500);

    onStatus({ isLoaded: true, isPlaying: true, isBuffering: false, positionMillis: 0, durationMillis: durMs, didJustFinish: false });
  });

  currentSound = snd;
}

export async function pauseAudio(): Promise<void> {
  if (currentSound && isPlaying) {
    currentSound.pause();
    isPlaying = false;
  }
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

export async function setAudioRate(_rate: number): Promise<void> {
  // react-native-sound does not support setSpeed on Android — no-op
}

export async function stopAudio(): Promise<void> {
  releaseAll();
}

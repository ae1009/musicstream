import { Audio, AVPlaybackStatus } from 'expo-av';

let sound: Audio.Sound | null = null;
let statusCallback: ((s: AVPlaybackStatus) => void) | null = null;

export async function setupAudio(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

export async function loadAndPlay(
  url: string,
  onStatus: (s: AVPlaybackStatus) => void
): Promise<void> {
  if (sound) {
    await sound.unloadAsync().catch(() => {});
    sound = null;
  }
  statusCallback = onStatus;
  sound = new Audio.Sound();
  sound.setOnPlaybackStatusUpdate(onStatus);
  await sound.loadAsync({ uri: url }, { shouldPlay: true });
}

export async function pauseAudio(): Promise<void> {
  await sound?.pauseAsync();
}

export async function resumeAudio(): Promise<void> {
  await sound?.playAsync();
}

export async function seekAudio(positionMs: number): Promise<void> {
  await sound?.setPositionAsync(positionMs);
}

export async function setAudioRate(rate: number): Promise<void> {
  await sound?.setRateAsync(rate, true);
}

export async function stopAudio(): Promise<void> {
  if (sound) {
    await sound.stopAsync().catch(() => {});
    await sound.unloadAsync().catch(() => {});
    sound = null;
  }
}

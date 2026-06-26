// Audio stub — no native audio module until a compatible one is found
// expo-av and expo-audio both crash on this device

export async function setupAudio(): Promise<void> {}

export async function loadAndPlay(
  _url: string,
  _onStatus: (s: any) => void,
): Promise<void> {
  // Simulate loaded state so UI doesn't hang
  setTimeout(() => {
    _onStatus({
      isLoaded: true,
      isPlaying: true,
      isBuffering: false,
      positionMillis: 0,
      durationMillis: 0,
      didJustFinish: false,
    });
  }, 200);
}

export async function pauseAudio(): Promise<void> {}
export async function resumeAudio(): Promise<void> {}
export async function seekAudio(_positionMs: number): Promise<void> {}
export async function setAudioRate(_rate: number): Promise<void> {}
export async function stopAudio(): Promise<void> {}

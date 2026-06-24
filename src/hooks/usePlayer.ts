export function usePlayerEvents() {
  // expo-av status updates go through playerStore._onStatus callback
  // No event subscription needed here
}

export function usePlayer() {
  const { usePlayerStore } = require('../stores/playerStore');
  return usePlayerStore();
}

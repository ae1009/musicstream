import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { PlaybackService } from './src/services/audio/PlaybackService';

// Registrar el servicio de playback — necesario para background audio y controles de lock screen
TrackPlayer.registerPlaybackService(() => PlaybackService);

registerRootComponent(App);

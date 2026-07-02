import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, StatusBar, Platform, Dimensions, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';

// Height of Android software navigation bar (back/home/recents)
const { height: SCREEN_H } = Dimensions.get('screen');
const { height: WINDOW_H } = Dimensions.get('window');
const NAV_BAR_H = Math.max(0, SCREEN_H - WINDOW_H - (StatusBar.currentHeight ?? 0));
import { Ionicons } from '@expo/vector-icons';
import { NavContext } from './src/navigation/context';
import { HomeScreen } from './src/screens/home/HomeScreen';
import { SearchScreen } from './src/screens/search/SearchScreen';
import { LibraryScreen } from './src/screens/library/LibraryScreen';
import { PodcastsScreen } from './src/screens/podcasts/PodcastsScreen';
import { PodcastDetailScreen } from './src/screens/podcasts/PodcastDetailScreen';
import { FullPlayerScreen } from './src/screens/player/FullPlayerScreen';
import { MiniPlayer } from './src/components/player/MiniPlayer';
import { usePlayerStore } from './src/stores/playerStore';
import { setupAudio, AUDIO_HTML, registerAudioWebView, handleAudioMessage, setWebViewReady, getAudioDebug } from './src/services/audio/audioPlayer';
import { initDatabase } from './src/services/storage/database';
import { useLibraryStore } from './src/stores/libraryStore';
import { colors, spacing, fontSizes } from './src/constants/theme';

const TABS = [
  { key: 'Home',     label: 'Inicio',   icon: 'home-outline',    iconActive: 'home' },
  { key: 'Search',   label: 'Buscar',   icon: 'search-outline',  iconActive: 'search' },
  { key: 'Library',  label: 'Librería', icon: 'library-outline', iconActive: 'library' },
  { key: 'Podcasts', label: 'Podcasts', icon: 'mic-outline',     iconActive: 'mic' },
];

export default function App() {
  const audioWebViewRef = useRef(null);
  const [activeTab, setActiveTab] = useState('Home');
  const [podcastStack, setPodcastStack] = useState([]);
  const [routeParams, setRouteParams] = useState({});
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [audioDebug, setAudioDebug] = useState('init');
  const currentItem = usePlayerStore((s) => s.currentItem);

  useEffect(() => {
    (async () => {
      await setupAudio();
      await initDatabase();
      useLibraryStore.getState().loadAll();
    })().catch(console.error);
  }, []);

  const navigate = useCallback((screen, params) => {
    if (screen === 'FullPlayer') {
      setShowFullPlayer(true);
    } else if (screen === 'PodcastDetail') {
      setRouteParams(params ?? {});
      setPodcastStack(prev => [...prev, { screen, params }]);
    } else if (TABS.find(t => t.key === screen)) {
      setActiveTab(screen);
      if (screen === 'Podcasts' && params?.screen === 'PodcastDetail') {
        setRouteParams(params.params ?? {});
        setPodcastStack([{ screen: 'PodcastDetail', params: params.params }]);
      } else if (screen !== 'Podcasts') {
        setPodcastStack([]);
      }
    }
  }, []);

  const goBack = useCallback(() => {
    if (podcastStack.length > 0) {
      setPodcastStack(prev => prev.slice(0, -1));
    } else {
      setActiveTab('Home');
    }
  }, [podcastStack]);

  const navValue = {
    navigate,
    goBack,
    push: navigate,
    setOptions: () => {},
    route: { params: routeParams },
  };

  const renderContent = () => {
    if (activeTab === 'Podcasts' && podcastStack.length > 0) {
      return <PodcastDetailScreen />;
    }
    switch (activeTab) {
      case 'Home':     return <HomeScreen />;
      case 'Search':   return <SearchScreen />;
      case 'Library':  return <LibraryScreen />;
      case 'Podcasts': return <PodcastsScreen />;
      default:         return <HomeScreen />;
    }
  };

  return (
    <NavContext.Provider value={navValue}>
      <View style={styles.root}>
        <StatusBar backgroundColor={colors.primary} barStyle="light-content" translucent={false} />

        {/* Audio WebView: must have real dimensions to run JS on Android.
            opacity:0.01 makes it invisible but Android still renders and executes it. */}
        <WebView
          ref={(ref) => { audioWebViewRef.current = ref; registerAudioWebView(ref); }}
          source={{ html: AUDIO_HTML }}
          onMessage={(e) => {
            handleAudioMessage(e.nativeEvent.data);
            setAudioDebug('msg:' + e.nativeEvent.data.substring(0, 40));
          }}
          onLoad={() => { setWebViewReady(); setAudioDebug('loaded'); }}
          onError={(e) => setAudioDebug('wverr:' + e.nativeEvent.description)}
          mediaPlaybackRequiresUserGesture={false}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 80,
            height: 80,
            opacity: 0.01,
          }}
        />

        <View style={styles.content}>{renderContent()}</View>

        {/* Debug overlay — shows WebView audio status */}
        <View style={{ backgroundColor: '#000', paddingHorizontal: 8, paddingVertical: 2 }} pointerEvents="none">
          <Text style={{ color: '#0f0', fontSize: 10, fontFamily: 'monospace' }} numberOfLines={1}>
            {audioDebug}
          </Text>
        </View>

        {currentItem && <MiniPlayer />}

        <View style={styles.tabBar}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => {
                  setActiveTab(tab.key);
                  if (tab.key !== 'Podcasts') setPodcastStack([]);
                }}
              >
                <Ionicons
                  name={active ? tab.iconActive : tab.icon}
                  size={24}
                  color={active ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Modal visible={showFullPlayer} animationType="slide" onRequestClose={() => setShowFullPlayer(false)}>
          <NavContext.Provider value={{ ...navValue, goBack: () => setShowFullPlayer(false) }}>
            <FullPlayerScreen />
          </NavContext.Provider>
        </Modal>
      </View>
    </NavContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? Math.max(10, NAV_BAR_H) : 20,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  tabLabelActive: { color: colors.primary, fontWeight: '600' },
});

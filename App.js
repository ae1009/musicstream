import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Platform, Dimensions, BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { height: SCREEN_H } = Dimensions.get('screen');
const { height: WINDOW_H, width: WINDOW_W } = Dimensions.get('window');
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
import {
  setupAudio, registerAudioWebView, registerSourceSetter,
  handleAudioMessage, setWebViewReady,
} from './src/services/audio/audioPlayer';
import { initDatabase } from './src/services/storage/database';
import { useLibraryStore } from './src/stores/libraryStore';
import { colors, spacing, fontSizes } from './src/constants/theme';

const TABS = [
  { key: 'Home',     label: 'Inicio',   icon: 'home-outline',    iconActive: 'home' },
  { key: 'Search',   label: 'Buscar',   icon: 'search-outline',  iconActive: 'search' },
  { key: 'Library',  label: 'Librería', icon: 'library-outline', iconActive: 'library' },
  { key: 'Podcasts', label: 'Podcasts', icon: 'mic-outline',     iconActive: 'mic' },
];

// WebView is the actual play button — positioned absolutely over whichever play button is visible.
// This lets user touches land inside the WebView, so play() has a real gesture context.
const HIDDEN_POS = { top: -200, left: 0, width: 44, height: 44 };

export default function App() {
  const audioWebViewRef = useRef(null);
  const [webViewSource, setWebViewSource] = useState({ html: '<html><body style="background:transparent"></body></html>' });
  const [webViewPos, setWebViewPos] = useState(HIDDEN_POS);
  const [audioDebug, setAudioDebug] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  const [podcastStack, setPodcastStack] = useState([]);
  const [routeParams, setRouteParams] = useState({});
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const currentItem = usePlayerStore((s) => s.currentItem);

  useEffect(() => {
    registerSourceSetter(setWebViewSource);
    (async () => {
      await setupAudio();
      await initDatabase();
      useLibraryStore.getState().loadAll();
    })().catch(console.error);
  }, []);

  // Hide WebView when no song is loaded
  useEffect(() => {
    if (!currentItem) setWebViewPos(HIDDEN_POS);
  }, [currentItem]);

  // Android back button closes FullPlayer
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showFullPlayer) { setShowFullPlayer(false); return true; }
      return false;
    });
    return () => handler.remove();
  }, [showFullPlayer]);

  // Callback: MiniPlayer or PlaybackControls reports play button absolute position
  const onPlayBtnLayout = useCallback((top, left, size) => {
    setWebViewPos({ top, left, width: size, height: size });
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
    if (activeTab === 'Podcasts' && podcastStack.length > 0) return <PodcastDetailScreen />;
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

        <View style={styles.content}>{renderContent()}</View>

        {currentItem && (
          <MiniPlayer onPlayBtnLayout={showFullPlayer ? undefined : onPlayBtnLayout} />
        )}

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

        {/* FullPlayer as absolute overlay — allows WebView (with higher elevation) to sit on top */}
        {showFullPlayer && (
          <View style={[StyleSheet.absoluteFillObject, styles.fullPlayerOverlay]}>
            <NavContext.Provider value={{ ...navValue, goBack: () => setShowFullPlayer(false) }}>
              <FullPlayerScreen onPlayBtnLayout={onPlayBtnLayout} />
            </NavContext.Provider>
          </View>
        )}

        {/* Audio WebView IS the play button — positioned over whichever play button is active.
            Real user touches inside this WebView let play() succeed (bypass Android autoplay policy). */}
        {currentItem && (
          <WebView
            ref={(ref) => { audioWebViewRef.current = ref; registerAudioWebView(ref); }}
            source={webViewSource}
            onMessage={(e) => {
              handleAudioMessage(e.nativeEvent.data);
              setAudioDebug(e.nativeEvent.data.substring(0, 60));
            }}
            onLoad={() => { setWebViewReady(); setAudioDebug('loaded'); }}
            onError={(e) => setAudioDebug('wverr:' + e.nativeEvent.description)}
            mediaPlaybackRequiresUserGesture={false}
            allowsInlineMediaPlayback
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            style={[styles.audioWebView, {
              top: webViewPos.top,
              left: webViewPos.left,
              width: webViewPos.width,
              height: webViewPos.height,
            }]}
          />
        )}

        {/* Debug bar */}
        <View style={styles.debugBar} pointerEvents="none">
          <Text style={styles.debugText} numberOfLines={1}>{audioDebug}</Text>
        </View>
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
  fullPlayerOverlay: {
    backgroundColor: colors.background,
    zIndex: 50,
    elevation: 10,
  },
  audioWebView: {
    position: 'absolute',
    zIndex: 100,
    elevation: 20,
    backgroundColor: 'transparent',
  },
  debugBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 999,
  },
  debugText: { color: '#0f0', fontSize: 9, fontFamily: 'monospace' },
});

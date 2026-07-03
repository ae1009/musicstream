import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Platform, Dimensions, BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
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
import { colors, fontSizes } from './src/constants/theme';

// ── Screen dimensions & navigation bar height ─────────────────────────────────
const { height: SCREEN_H } = Dimensions.get('screen');
const { height: WINDOW_H, width: WINDOW_W } = Dimensions.get('window');
const NAV_BAR_H = Math.max(0, SCREEN_H - WINDOW_H - (StatusBar.currentHeight ?? 0));

// ── Hardcoded play-button positions (no measureInWindow) ──────────────────────
// Tab bar: paddingTop(8) + icon(24) + label(13) + paddingBottom(max(10,NAV_BAR_H))
const TAB_BAR_H = 8 + 24 + 13 + Math.max(10, NAV_BAR_H);
// MiniPlayer height: paddingVertical(8)*2 + artwork(44) = 60dp
const MINI_PLAYER_H = 60;

// Center of MiniPlayer play-button from screen bottom
const MINI_BTN_BOTTOM = TAB_BAR_H + MINI_PLAYER_H / 2;   // center Y from bottom
// Center of MiniPlayer play-button from screen right:
//   paddingRight(16) + skip(32) + gap(8) + half-of-playBtn(16) = 72
const MINI_BTN_RIGHT = 72;

// 44×44 WebView centered over that button
const MINI_WV = {
  bottom: MINI_BTN_BOTTOM - 22,
  right: MINI_BTN_RIGHT - 22,
  width: 44,
  height: 44,
};

// FullPlayer play-button: 56×56, centered horizontally, ~65% down the window
const FULL_WV = {
  top: Math.round(WINDOW_H * 0.655 - 28),
  left: Math.round((WINDOW_W - 56) / 2),
  width: 56,
  height: 56,
};

// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'Home',     label: 'Inicio',   icon: 'home-outline',    iconActive: 'home' },
  { key: 'Search',   label: 'Buscar',   icon: 'search-outline',  iconActive: 'search' },
  { key: 'Library',  label: 'Librería', icon: 'library-outline', iconActive: 'library' },
  { key: 'Podcasts', label: 'Podcasts', icon: 'mic-outline',     iconActive: 'mic' },
];

export default function App() {
  const [webViewSource, setWebViewSource] = useState({
    html: '<html><body style="background:transparent"></body></html>',
  });
  const [audioDebug, setAudioDebug] = useState('init');
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

  // Hardware back closes FullPlayer
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showFullPlayer) { setShowFullPlayer(false); return true; }
      return false;
    });
    return () => sub.remove();
  }, [showFullPlayer]);

  // WebView position: hidden when no track, MiniPlayer pos, or FullPlayer pos
  const wvStyle = useMemo(() => {
    if (!currentItem) return styles.wvHidden;
    if (showFullPlayer) return [styles.wvBase, FULL_WV];
    return [styles.wvBase, MINI_WV];
  }, [currentItem, showFullPlayer]);

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

  const navValue = useMemo(() => ({
    navigate,
    goBack,
    push: navigate,
    setOptions: () => {},
    route: { params: routeParams },
  }), [navigate, goBack, routeParams]);

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

        {/* FullPlayer: absolute overlay (not Modal) so WebView can sit above via elevation */}
        {showFullPlayer && (
          <View style={[StyleSheet.absoluteFillObject, styles.fullPlayerOverlay]}>
            <NavContext.Provider value={{ ...navValue, goBack: () => setShowFullPlayer(false) }}>
              <FullPlayerScreen />
            </NavContext.Provider>
          </View>
        )}

        {/* Audio WebView IS the play button.
            elevation:20 puts it above FullPlayer overlay (elevation:10).
            Position switches between MiniPlayer and FullPlayer button locations. */}
        <WebView
          ref={(ref) => registerAudioWebView(ref)}
          source={webViewSource}
          onMessage={(e) => {
            handleAudioMessage(e.nativeEvent.data);
            setAudioDebug(e.nativeEvent.data.substring(0, 80));
          }}
          onLoad={() => { setWebViewReady(); setAudioDebug('wv-loaded'); }}
          onError={(e) => setAudioDebug('wv-err:' + e.nativeEvent.description)}
          mediaPlaybackRequiresUserGesture={false}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          style={wvStyle}
        />

        {/* Debug bar — tap-through (pointerEvents=none) */}
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
  fullPlayerOverlay: { backgroundColor: colors.background, zIndex: 50, elevation: 10 },
  wvBase: { position: 'absolute', zIndex: 100, elevation: 20 },
  wvHidden: { position: 'absolute', top: -400, left: 0, width: 44, height: 44 },
  debugBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 8, paddingVertical: 3,
    zIndex: 999, elevation: 30,
  },
  debugText: { color: '#0f0', fontSize: 9, fontFamily: 'monospace' },
});

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

// ── Dimensions ────────────────────────────────────────────────────────────────
const { height: SCREEN_H } = Dimensions.get('screen');
const { height: WINDOW_H, width: WINDOW_W } = Dimensions.get('window');
const NAV_BAR_H = Math.max(0, SCREEN_H - WINDOW_H - (StatusBar.currentHeight ?? 0));

// ── Tab bar height (same formula as tabBar paddingBottom) ─────────────────────
const TAB_BAR_H = 8 + 24 + 13 + Math.max(10, NAV_BAR_H); // paddingTop+icon+label+paddingBottom
const MINI_H = 60; // MiniPlayer height: paddingV(8)*2 + artwork(44)

// ── MiniPlayer play-button position ───────────────────────────────────────────
// Center from bottom: tabBar + half miniPlayer
const MINI_BTN_BOTTOM = TAB_BAR_H + MINI_H / 2;
// Center from right: paddingRight(16) + skip(32) + gap(8) + half-play(16) = 72
const MINI_BTN_RIGHT = 72;
const MINI_WV = {
  bottom: MINI_BTN_BOTTOM - 22,
  right: MINI_BTN_RIGHT - 22,
  width: 44,
  height: 44,
};

// ── FullPlayer play-button position ───────────────────────────────────────────
// Calculated from FullPlayer layout (header52 + artwork344 + info64 + progress54 + margin24 + btn_half28 = 566dp)
// Use 75% of WINDOW_H as approximation; shown in debug bar for calibration
const FULL_WV_TOP = Math.round(WINDOW_H * 0.75 - 28);
const FULL_WV = {
  top: FULL_WV_TOP,
  left: Math.round((WINDOW_W - 56) / 2),
  width: 56,
  height: 56,
};

const TABS = [
  { key: 'Home',     label: 'Inicio',   icon: 'home-outline',    iconActive: 'home' },
  { key: 'Search',   label: 'Buscar',   icon: 'search-outline',  iconActive: 'search' },
  { key: 'Library',  label: 'Librería', icon: 'library-outline', iconActive: 'library' },
  { key: 'Podcasts', label: 'Podcasts', icon: 'mic-outline',     iconActive: 'mic' },
];

export default function App() {
  const [webViewSource, setWebViewSource] = useState({ html: '' });
  const [audioDebug, setAudioDebug] = useState(`W:${WINDOW_W} H:${WINDOW_H} FT:${FULL_WV_TOP}`);
  const [activeTab, setActiveTab] = useState('Home');
  const [podcastStack, setPodcastStack] = useState([]);
  const [routeParams, setRouteParams] = useState({});
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  const currentItem = usePlayerStore((s) => s.currentItem);

  useEffect(() => {
    // registerSourceSetter immediately sets INITIAL_HTML — WebView loads once
    registerSourceSetter(setWebViewSource);
    (async () => {
      await setupAudio();
      await initDatabase();
      useLibraryStore.getState().loadAll();
    })().catch(console.error);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showFullPlayer) { setShowFullPlayer(false); return true; }
      return false;
    });
    return () => sub.remove();
  }, [showFullPlayer]);

  // WebView is always last child → always on top. Position switches based on view.
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

  const baseNav = useMemo(() => ({
    navigate, goBack, push: navigate, setOptions: () => {}, route: { params: routeParams },
  }), [navigate, goBack, routeParams]);

  const fullPlayerNav = useMemo(() => ({
    ...baseNav, goBack: () => setShowFullPlayer(false),
  }), [baseNav]);

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
    <NavContext.Provider value={baseNav}>
      <View style={styles.root}>
        <StatusBar backgroundColor={colors.primary} barStyle="light-content" translucent={false} />

        {showFullPlayer ? (
          // FullPlayer fills entire root (no MiniPlayer, no TabBar)
          // This avoids z-index battles with the overlay approach
          <NavContext.Provider value={fullPlayerNav}>
            <FullPlayerScreen />
          </NavContext.Provider>
        ) : (
          <>
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
          </>
        )}

        {/* Audio WebView: always the last child → always on top regardless of z-index.
            Position: over MiniPlayer play-btn (MINI_WV) or FullPlayer play-btn (FULL_WV).
            Hidden off-screen when no track is loaded. */}
        <WebView
          ref={(ref) => registerAudioWebView(ref)}
          source={webViewSource}
          onMessage={(e) => {
            handleAudioMessage(e.nativeEvent.data);
            setAudioDebug(e.nativeEvent.data.substring(0, 80));
          }}
          onLoad={() => { setWebViewReady(); setAudioDebug(`wv-ok W:${WINDOW_W} H:${WINDOW_H} FT:${FULL_WV_TOP}`); }}
          onError={(e) => setAudioDebug('wv-err:' + e.nativeEvent.description)}
          mediaPlaybackRequiresUserGesture={false}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          style={wvStyle}
        />

        {/* Debug bar (pointer-events:none so it never blocks taps) */}
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
  // WebView is always the last child in root → naturally on top (Android painter's order)
  // elevation:20 ensures it's above any views that use elevation
  wvBase: { position: 'absolute', elevation: 20 },
  wvHidden: { position: 'absolute', top: -400, left: 0, width: 44, height: 44 },
  debugBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 8, paddingVertical: 3,
    elevation: 30,
  },
  debugText: { color: '#0f0', fontSize: 9, fontFamily: 'monospace' },
});

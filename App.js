import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { setupAudio } from './src/services/audio/audioPlayer';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useLibraryStore } from './src/stores/libraryStore';
import { colors } from './src/constants/theme';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const NAV_THEME = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

export default function App() {
  const [ready, setReady] = useState(false);
  const loadLibrary = useLibraryStore((s) => s.loadAll);

  useEffect(() => {
    const init = async () => {
      try { await setupAudio(); } catch (_) {}
      try { await loadLibrary(); } catch (_) {}
      setReady(true);
    };
    init();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer theme={NAV_THEME}>
          <RootNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { setupPlayer } from './src/services/audio/trackPlayer';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useLibraryStore } from './src/stores/libraryStore';
import { usePlayerEvents } from './src/hooks/usePlayer';
import { colors } from './src/constants/theme';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Servicio de playback — requerido por react-native-track-player
// Este archivo se registra en index.js
function PlayerSync() {
  usePlayerEvents();
  return null;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const loadLibrary = useLibraryStore((s) => s.loadAll);

  useEffect(() => {
    const init = async () => {
      try {
        await setupPlayer();
      } catch (e) {
        // TrackPlayer ya inicializado — ignorar
      }
      try {
        await loadLibrary();
      } catch (e) {
        // Continuar sin datos previos si SQLite falla
      }
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
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.primary,
          },
        }}
      >
        <PlayerSync />
        <RootNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🎵</Text>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.msg}>{this.state.error?.message ?? 'Error desconocido'}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => this.setState({ hasError: false })}>
            <Text style={styles.btnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  msg: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  btn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

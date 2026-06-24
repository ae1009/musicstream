import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={s.container}>
      <Text style={s.emoji}>🎵</Text>
      <Text style={s.title}>MusicStream</Text>
      <Text style={s.sub}>Build 14 — funcionando</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 80, marginBottom: 16 },
  title: { color: '#fff', fontSize: 36, fontWeight: '900' },
  sub: { color: '#E8F5E9', fontSize: 16, marginTop: 12 },
});

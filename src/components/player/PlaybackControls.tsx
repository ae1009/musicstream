import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../constants/theme';
import { usePlayerStore } from '../../stores/playerStore';

interface Props {
  size?: 'compact' | 'full';
}

export function PlaybackControls({ size = 'full' }: Props) {
  const { isPlaying, isBuffering, pause, resume, next, previous, repeatMode, setRepeat, shuffleMode, toggleShuffle } =
    usePlayerStore();

  const iconSize = size === 'full' ? 28 : 22;
  const playSize = size === 'full' ? 56 : 40;

  return (
    <View style={styles.row}>
      {size === 'full' && (
        <TouchableOpacity onPress={toggleShuffle} style={styles.btn}>
          <Ionicons
            name="shuffle"
            size={22}
            color={shuffleMode ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={previous} style={styles.btn}>
        <Ionicons name="play-skip-back" size={iconSize} color={colors.text} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={isPlaying ? pause : resume}
        style={[styles.playBtn, { width: playSize, height: playSize, borderRadius: playSize / 2 }]}
      >
        {isBuffering ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={playSize * 0.45}
            color={colors.background}
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={next} style={styles.btn}>
        <Ionicons name="play-skip-forward" size={iconSize} color={colors.text} />
      </TouchableOpacity>

      {size === 'full' && (
        <TouchableOpacity
          onPress={() => setRepeat(repeatMode === 'off' ? 'queue' : repeatMode === 'queue' ? 'track' : 'off')}
          style={styles.btn}
        >
          <Ionicons
            name={repeatMode === 'track' ? 'repeat-outline' : 'repeat'}
            size={22}
            color={repeatMode !== 'off' ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  btn: { padding: spacing.xs },
  playBtn: {
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

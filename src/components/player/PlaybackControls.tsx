import React, { useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../constants/theme';
import { usePlayerStore } from '../../stores/playerStore';

interface Props {
  size?: 'compact' | 'full';
  onPlayBtnLayout?: (top: number, left: number, size: number) => void;
}

export function PlaybackControls({ size = 'full', onPlayBtnLayout }: Props) {
  const { next, previous, repeatMode, setRepeat, shuffleMode, toggleShuffle } = usePlayerStore();
  const playBtnRef = useRef<View>(null);

  const iconSize = size === 'full' ? 28 : 22;
  const playSize = size === 'full' ? 56 : 40;

  const handlePlayBtnLayout = useCallback(() => {
    playBtnRef.current?.measureInWindow((x, y, _w, _h) => {
      onPlayBtnLayout?.(y, x, playSize);
    });
  }, [onPlayBtnLayout, playSize]);

  return (
    <View style={styles.row}>
      {size === 'full' && (
        <TouchableOpacity onPress={toggleShuffle} style={styles.btn}>
          <Ionicons name="shuffle" size={22} color={shuffleMode ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={previous} style={styles.btn}>
        <Ionicons name="play-skip-back" size={iconSize} color={colors.text} />
      </TouchableOpacity>

      {/* Placeholder: WebView is absolutely positioned over this */}
      <View
        ref={playBtnRef}
        onLayout={handlePlayBtnLayout}
        style={[styles.playBtn, { width: playSize, height: playSize, borderRadius: playSize / 2 }]}
      />

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

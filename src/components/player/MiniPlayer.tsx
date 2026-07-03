import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '../../navigation/context';
import { ArtworkImage } from '../shared/ArtworkImage';
import { usePlayerStore } from '../../stores/playerStore';
import { colors, spacing, fontSizes } from '../../constants/theme';

interface Props {
  onPlayBtnLayout?: (top: number, left: number, size: number) => void;
}

export function MiniPlayer({ onPlayBtnLayout }: Props) {
  const { currentItem } = usePlayerStore();
  const navigation = useNavigation<any>();
  const placeholderRef = useRef<View>(null);

  if (!currentItem) return null;

  const handleLayout = useCallback(() => {
    // measureInWindow gives absolute screen coordinates
    placeholderRef.current?.measureInWindow((x, y, _w, _h) => {
      onPlayBtnLayout?.(y, x, 44);
    });
  }, [onPlayBtnLayout]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('FullPlayer')}
      activeOpacity={0.9}
    >
      <ArtworkImage uri={currentItem.artwork_url} size={44} radius={6} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{currentItem.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentItem.artist}</Text>
      </View>
      {/* Placeholder where WebView play button will be positioned */}
      <View
        ref={placeholderRef}
        style={styles.playBtn}
        onLayout={handleLayout}
      />
      <TouchableOpacity
        onPress={() => usePlayerStore.getState().next()}
        style={styles.playBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="play-skip-forward" size={22} color={colors.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  info: { flex: 1 },
  title: { color: colors.text, fontSize: fontSizes.sm, fontWeight: '600' },
  artist: { color: colors.textSecondary, fontSize: fontSizes.xs },
  playBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', padding: spacing.xs },
});

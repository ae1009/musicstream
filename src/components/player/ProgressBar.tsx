import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing, fontSizes } from '../../constants/theme';
import { formatDuration } from '../../utils/format';
import { usePlayerStore } from '../../stores/playerStore';

export function ProgressBar() {
  const { position, duration, seekTo } = usePlayerStore();

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration || 1}
        value={position}
        onSlidingComplete={seekTo}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />
      <View style={styles.times}>
        <Text style={styles.time}>{formatDuration(position)}</Text>
        <Text style={styles.time}>{formatDuration(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: spacing.md },
  slider: { width: '100%', height: 40 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { color: colors.textSecondary, fontSize: fontSizes.xs },
});

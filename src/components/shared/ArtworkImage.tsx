import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius } from '../../constants/theme';

interface Props {
  uri?: string;
  size: number;
  radius?: number;
}

export function ArtworkImage({ uri, size, radius = borderRadius.md }: Props) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.img, { width: size, height: size, borderRadius: radius }]}
      />
    );
  }
  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: radius }]}>
      <Ionicons name="musical-note" size={size * 0.4} color={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: colors.surfaceVariant },
  placeholder: {
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

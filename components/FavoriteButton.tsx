import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { AppPost } from '../api/types';

interface Props {
  post: AppPost;
  size?: number;
  /** solid white circle behind icon — for image overlays */
  overlay?: boolean;
}

export default function FavoriteButton({ post, size = 22, overlay }: Props) {
  const { theme, isFavorite, toggleFavorite } = useApp();
  const active = isFavorite(post.id);

  return (
    <TouchableOpacity
      onPress={() => toggleFavorite(post)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[
        styles.btn,
        overlay && {
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderRadius: 20,
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
      accessibilityLabel={active ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={size}
        color={active ? theme.colors.danger : overlay ? '#0F172A' : theme.colors.textMuted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
  },
});

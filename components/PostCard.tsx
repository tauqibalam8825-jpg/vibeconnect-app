/**
 * Post cards — list, grid, and masonry variants.
 * All variants navigate to PostDetail on press.
 */

import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppPost } from '../api/types';
import { useApp } from '../context/AppContext';
import { formatRelativeDate } from '../utils/dates';
import { truncate } from '../utils/html';
import FavoriteButton from './FavoriteButton';
import config from '../config/config';
import type { RootStackParamList } from '../navigation/types';

interface Props {
  post: AppPost;
  variant?: 'list' | 'grid' | 'masonry';
}

export default function PostCard({ post, variant = 'list' }: Props) {
  const { theme } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width: screenW } = useWindowDimensions();

  const open = () => navigation.navigate('PostDetail', { postId: post.id, preview: post });

  const categoryLabel = post.categories[0]?.name;

  const masonryHeight = useMemo(() => {
    if (variant !== 'masonry') return 140;
    if (post.imageWidth && post.imageHeight) {
      const colW = (screenW - 36) / 2;
      const ratio = post.imageHeight / post.imageWidth;
      return Math.min(260, Math.max(110, colW * ratio));
    }
    // Deterministic pseudo-random height from id
    return 120 + (post.id % 5) * 28;
  }, [variant, post, screenW]);

  if (variant === 'grid' || variant === 'masonry') {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={open}
        style={[
          styles.gridCard,
          {
            backgroundColor: theme.colors.card,
            borderRadius: theme.cardRadius,
            shadowColor: '#000',
          },
        ]}
      >
        <View style={styles.gridImageWrap}>
          {post.imageUrl ? (
            <Image
              source={{ uri: post.imageUrl }}
              style={{ width: '100%', height: masonryHeight }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { height: masonryHeight, backgroundColor: theme.colors.chipBg },
              ]}
            >
              <Ionicons name="image-outline" size={28} color={theme.colors.textMuted} />
            </View>
          )}
          <View style={styles.favOverlay}>
            <FavoriteButton post={post} overlay size={18} />
          </View>
        </View>
        <View style={styles.gridBody}>
          {!!categoryLabel && (
            <Text style={[styles.cat, { color: theme.colors.primary }]} numberOfLines={1}>
              {categoryLabel}
            </Text>
          )}
          <Text style={[styles.gridTitle, { color: theme.colors.text }]} numberOfLines={3}>
            {post.title}
          </Text>
          {config.showDate && (
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
              {formatRelativeDate(post.date)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // ── List / magazine-style horizontal-ish full-width card ──
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={open}
      style={[
        styles.listCard,
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.cardRadius,
          shadowColor: '#000',
        },
      ]}
    >
      {post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.listImage}
          contentFit="cover"
          transition={220}
        />
      ) : (
        <View style={[styles.listImage, styles.imagePlaceholder, { backgroundColor: theme.colors.chipBg }]}>
          <Ionicons name="newspaper-outline" size={36} color={theme.colors.textMuted} />
        </View>
      )}

      <View style={styles.favOverlay}>
        <FavoriteButton post={post} overlay size={18} />
      </View>

      <View style={styles.listBody}>
        <View style={styles.metaRow}>
          {!!categoryLabel && (
            <View style={[styles.chip, { backgroundColor: theme.colors.chipBg }]}>
              <Text style={[styles.chipText, { color: theme.colors.primary }]} numberOfLines={1}>
                {categoryLabel}
              </Text>
            </View>
          )}
          {config.showDate && (
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
              {formatRelativeDate(post.date)}
            </Text>
          )}
        </View>

        <Text style={[styles.listTitle, { color: theme.colors.text }]} numberOfLines={3}>
          {post.title}
        </Text>

        {!!post.excerpt && (
          <Text style={[styles.excerpt, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {truncate(post.excerpt, 140)}
          </Text>
        )}

        <View style={styles.footer}>
          {config.showAuthor && (
            <View style={styles.authorRow}>
              {post.authorAvatar ? (
                <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.colors.chipBg, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="person" size={12} color={theme.colors.textMuted} />
                </View>
              )}
              <Text style={[styles.author, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {post.authorName}
              </Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  listImage: {
    width: '100%',
    height: 190,
  },
  listBody: {
    padding: 16,
    gap: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  excerpt: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '70%',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  meta: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  author: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  gridCard: {
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  gridImageWrap: {
    position: 'relative',
  },
  gridBody: {
    padding: 12,
    gap: 4,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  cat: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  favOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});

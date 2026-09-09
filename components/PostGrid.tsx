import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../lib/store';
import { radii } from '../lib/theme';
import { formatDuration } from '../lib/format';
import { Routes } from '../lib/routes';
import type { Post } from '../lib/types';

/** Tapping a tile opens the right surface for that post type. */
export function openPost(post: Post, navigation: ReturnType<typeof useNavigation<any>>) {
  if (post.type === 'short') navigation.navigate(Routes.Shorts, { startId: post.id });
  else if (post.type === 'video') navigation.navigate(Routes.VideoDetail, { id: post.id });
  else navigation.navigate(Routes.PostDetail, { id: post.id });
}

export function PostGrid({ posts, columns = 3 }: { posts: Post[]; columns?: number }) {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const gap = 4;
  const tile = (Math.min(width, 720) - gap * (columns + 1)) / columns;

  return (
    <View style={styles.wrap}>
      {posts.map((post) => {
        const media = post.media[0];
        const isVideo = post.type === 'video' || post.type === 'short';
        return (
          <Pressable key={post.id} onPress={() => openPost(post, navigation)} style={[styles.tile, { width: tile, height: tile, backgroundColor: theme.surfaceAlt }]}>
            {post.type === 'text' ? (
              <View style={styles.textTile}>
                <Ionicons name="text" size={18} color={theme.brand} />
                <Text numberOfLines={4} style={{ color: theme.textMuted, fontSize: 10.5, lineHeight: 14, marginTop: 6 }}>
                  {post.caption}
                </Text>
              </View>
            ) : media ? (
              <Image source={{ uri: media.thumb ?? media.uri }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={180} />
            ) : null}
            {isVideo ? (
              <View style={styles.badge}>
                <Ionicons name="play" size={10} color="#fff" />
                {post.durationMs ? <Text style={styles.badgeText}>{formatDuration(post.durationMs)}</Text> : null}
              </View>
            ) : null}
            {post.media.length > 1 ? (
              <View style={[styles.stack, { backgroundColor: 'rgba(11,9,18,0.6)' }]}>
                <Ionicons name="copy-outline" size={11} color="#fff" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  tile: { borderRadius: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  textTile: { padding: 8, alignItems: 'center' },
  badge: { position: 'absolute', bottom: 5, right: 5, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '700' },
  stack: { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});

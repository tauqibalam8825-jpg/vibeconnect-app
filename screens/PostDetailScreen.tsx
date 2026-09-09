/**
 * Full post detail — featured image, meta, HTML body via react-native-render-html.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import RenderHTML from 'react-native-render-html';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import config from '../config/config';
import { useApp } from '../context/AppContext';
import { fetchPost } from '../api/wordpress';
import { AppPost } from '../api/types';
import FavoriteButton from '../components/FavoriteButton';
import { formatFullDate } from '../utils/dates';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

export default function PostDetailScreen({ route, navigation }: Props) {
  const { postId, preview } = route.params;
  const { theme, isInReadingList, toggleReadingList } = useApp();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [post, setPost] = useState<AppPost | null>(preview || null);
  const [loading, setLoading] = useState(!preview?.content);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const full = await fetchPost(postId);
        if (alive) {
          setPost(full);
          setError(null);
        }
      } catch (e: unknown) {
        if (alive && !preview) {
          setError(e instanceof Error ? e.message : 'Failed to load post');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [postId, preview]);

  const onShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `${post.title}\n${post.link}`,
        url: post.link,
        title: post.title,
      });
    } catch {
      // user cancelled
    }
  };

  if (error && !post) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={40} color={theme.colors.danger} />
        <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const inList = isInReadingList(post.id);
  const contentWidth = width - 32;

  const tagsStyles = {
    body: {
      color: theme.colors.text,
      fontSize: 16,
      lineHeight: 26,
    },
    p: { marginBottom: 14, color: theme.colors.text },
    a: { color: theme.colors.primary },
    h1: { color: theme.colors.text, fontSize: 24, marginVertical: 12 },
    h2: { color: theme.colors.text, fontSize: 20, marginVertical: 10 },
    h3: { color: theme.colors.text, fontSize: 18, marginVertical: 8 },
    img: { borderRadius: 12, marginVertical: 12 },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
      paddingLeft: 12,
      marginVertical: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic' as const,
    },
    li: { marginBottom: 6, color: theme.colors.text },
    code: {
      backgroundColor: theme.colors.inputBg,
      padding: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {post.imageUrl ? (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.hero}
            contentFit="cover"
            transition={250}
          />
        ) : (
          <View style={[styles.hero, { backgroundColor: theme.colors.chipBg, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="document-text-outline" size={48} color={theme.colors.textMuted} />
          </View>
        )}

        {/* Floating action bar over hero bottom edge */}
        <View style={styles.actionBar}>
          <FavoriteButton post={post} overlay size={20} />
          {config.enableReadingList && (
            <TouchableOpacity
              onPress={() => toggleReadingList(post)}
              style={styles.actionBtn}
              accessibilityLabel="Toggle reading list"
            >
              <Ionicons
                name={inList ? 'book' : 'book-outline'}
                size={20}
                color={inList ? theme.colors.primary : '#0F172A'}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onShare} style={styles.actionBtn} accessibilityLabel="Share">
            <Ionicons name="share-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {post.categories.length > 0 && (
            <View style={styles.cats}>
              {post.categories.slice(0, 3).map((c) => (
                <View
                  key={c.id}
                  style={[styles.catChip, { backgroundColor: theme.colors.chipBg }]}
                >
                  <Text style={[styles.catText, { color: theme.colors.primary }]}>{c.name}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.title, { color: theme.colors.text }]}>{post.title}</Text>

          <View style={styles.metaRow}>
            {config.showAuthor && (
              <View style={styles.author}>
                {post.authorAvatar ? (
                  <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: theme.colors.chipBg, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="person" size={14} color={theme.colors.textMuted} />
                  </View>
                )}
                <Text style={[styles.authorName, { color: theme.colors.textSecondary }]}>
                  {post.authorName}
                </Text>
              </View>
            )}
            {config.showDate && (
              <Text style={[styles.date, { color: theme.colors.textMuted }]}>
                {formatFullDate(post.date)}
              </Text>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {loading && !post.content ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <RenderHTML
              contentWidth={contentWidth}
              source={{ html: post.content || '<p></p>' }}
              tagsStyles={tagsStyles}
              baseStyle={{ color: theme.colors.text }}
              enableExperimentalMarginCollapsing
            />
          )}

          {post.tags.length > 0 && (
            <View style={styles.tags}>
              <Text style={[styles.tagsLabel, { color: theme.colors.textMuted }]}>Tags</Text>
              <View style={styles.tagRow}>
                {post.tags.map((t) => (
                  <View
                    key={t.id}
                    style={[styles.tag, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                  >
                    <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>#{t.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 15,
  },
  hero: {
    width: '100%',
    height: 280,
  },
  actionBar: {
    position: 'absolute',
    top: 240,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 28,
  },
  cats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  catText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  tags: {
    marginTop: 28,
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { gradients, radii, shadow, spacing } from '../../lib/theme';
import { formatCount, timeAgo, formatDuration } from '../../lib/format';
import { Routes } from '../../lib/routes';
import { EmptyState, IconButton, SectionTitle } from '../../components/UI';
import { DurationBadge } from '../../components/VideoSurface';
import type { Post } from '../../lib/types';

function VideoCard({ post, wide, onResume }: { post: Post; wide?: boolean; onResume?: number }) {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const author = db.userById(post.authorId);
  const media = post.media[0];
  if (!author) return null;
  const progress = post.durationMs && onResume ? Math.min(1, (onResume * 1000) / post.durationMs) : 0;

  return (
    <Pressable
      onPress={() => navigation.navigate(Routes.VideoDetail, { id: post.id })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.94 : 1, width: wide ? '100%' : undefined },
        shadow(2, theme),
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: theme.surfaceAlt }]}>
        {media ? <Image source={{ uri: media.thumb ?? media.uri }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={200} /> : null}
        <LinearGradient colors={['transparent', 'rgba(11,9,18,0.5)']} style={styles.thumbScrim} />
        <View style={styles.playBadge}>
          <Ionicons name="play" size={18} color="#fff" />
        </View>
        {post.durationMs ? <DurationBadge ms={post.durationMs} /> : null}
        {progress > 0 ? (
          <View style={styles.resumeTrack}>
            <View style={[styles.resumeFill, { width: `${progress * 100}%` }]} />
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, padding: 12 }}>
        <Text numberOfLines={2} style={{ color: theme.text, fontWeight: '700', fontSize: 14.5, lineHeight: 19 }}>
          {post.title ?? post.caption}
        </Text>
        <Text numberOfLines={1} style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 6 }}>
          {author.displayName} \u00b7 {formatCount(post.views)} views \u00b7 {timeAgo(post.createdAt)}
        </Text>
        {progress > 0 ? <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '700', marginTop: 4 }}>Resume at {formatDuration(onResume! * 1000)}</Text> : null}
      </View>
    </Pressable>
  );
}

export function WatchScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { me, db: store, version } = useApp();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const wide = width >= 900;

  const videos = useMemo(() => (store && me ? db.watchVideos(me) : []), [store, me, version]);
  const continueWatching = useMemo(() => {
    if (!store || !me) return [];
    return store.watchProgress
      .filter((w) => w.userId === me.id && w.seconds > 5)
      .map((w) => ({ progress: w, post: store.posts.find((p) => p.id === w.postId) }))
      .filter((x) => !!x.post && x.post.type === 'video')
      .sort((a, b) => b.progress.updatedAt - a.progress.updatedAt)
      .slice(0, 6);
  }, [store, me, version]);

  if (!store || !me) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={{ color: theme.text, fontSize: 21, fontWeight: '900', letterSpacing: -0.6 }}>Watch</Text>
          <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 2 }}>Long-form from creators you follow</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton icon="flash-outline" onPress={() => navigation.navigate(Routes.Shorts)} />
          <IconButton icon="search-outline" onPress={() => navigation.navigate(Routes.Explore)} />
        </View>
      </View>

      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 500); }} tintColor={theme.brand} colors={[theme.brand]} />}
        numColumns={wide ? 2 : 1}
        columnWrapperStyle={wide ? { gap: spacing.lg } : undefined}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
        ListHeaderComponent={
          <View>
            <Pressable onPress={() => navigation.navigate(Routes.Shorts)}>
              <LinearGradient colors={gradients.brand as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.shortsBanner, shadow(6, theme)]}>
                <View style={styles.shortsIcon}>
                  <Ionicons name="flash" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shortsTitle}>Vibe Shorts</Text>
                  <Text style={styles.shortsBody}>Vertical, full-screen, sixty seconds at a time.</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </Pressable>

            {continueWatching.length > 0 ? (
              <View style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
                <SectionTitle title="Continue watching" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}>
                  {continueWatching.map(({ post, progress }) => (
                    <View key={progress.id} style={{ width: 260 }}>
                      <VideoCard post={post!} onResume={progress.seconds} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
              <SectionTitle title="Fresh uploads" action={videos.length > 4 ? 'See all' : undefined} onAction={() => {}} />
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 40)} style={{ flex: wide ? 1 : undefined, marginBottom: spacing.lg }}>
            <VideoCard post={item} wide={!wide} />
          </Animated.View>
        )}
        ListEmptyComponent={<EmptyState icon="videocam-outline" title="No long videos yet" subtitle="When creators you follow upload a full video it lands here." actionLabel="Upload a video" onAction={() => navigation.navigate(Routes.Create, { mode: 'video' })} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  card: { flexDirection: 'row', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 0 },
  thumb: { width: 150, height: 104, alignItems: 'center', justifyContent: 'center' },
  thumbScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
  playBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(11,9,18,0.55)', alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  resumeTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  resumeFill: { height: '100%', backgroundColor: '#A84CF1' },
  shortsBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radii.lg },
  shortsIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  shortsTitle: { color: '#fff', fontSize: 16.5, fontWeight: '800', letterSpacing: -0.3 },
  shortsBody: { color: 'rgba(255,255,255,0.82)', fontSize: 12.5, marginTop: 2 },
});

import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { radii, spacing } from '../../lib/theme';
import { Routes } from '../../lib/routes';
import { Chip, EmptyState, IconButton } from '../../components/UI';
import { PostCard, PostSkeleton } from '../../components/PostCard';
import { StoryRail } from '../../components/StoryRail';
import { TabHeader } from '../../components/Screen';
import { Avatar } from '../../components/Avatar';

type Filter = 'all' | 'photo' | 'video' | 'short' | 'text';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'For you' },
  { value: 'photo', label: 'Photos' },
  { value: 'video', label: 'Watch' },
  { value: 'short', label: 'Shorts' },
  { value: 'text', label: 'Text' },
];

export function HomeScreen() {
  const theme = useTheme();
  const { me, db: store, version } = useApp();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const wide = width >= 900;

  const posts = useMemo(() => {
    if (!store || !me) return [];
    const feed = db.homeFeed(me);
    if (filter === 'all') return feed;
    return feed.filter((p) => p.type === filter);
  }, [store, me, filter, version]);

  const onRefresh = () => {
    setRefreshing(true);
    db.purgeExpiredStories();
    setTimeout(() => setRefreshing(false), 550);
  };

  if (!store || !me) return null;
  const unread = db.unreadNotificationCount(me.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <TabHeader
        left={<Text style={{ color: theme.text, fontSize: 21, fontWeight: '900', letterSpacing: -0.7 }}>Your feed</Text>}
        right={
          <>
            <IconButton icon="paper-plane-outline" onPress={() => navigation.navigate(Routes.Messages)} badge={db.unreadMessageCount(me.id)} />
            <IconButton icon="notifications-outline" onPress={() => navigation.navigate(Routes.Notifications)} badge={unread} />
          </>
        }
      />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
        ListHeaderComponent={
          <View>
            <StoryRail onAddStory={() => navigation.navigate(Routes.Create, { mode: 'story' })} />
            <Pressable onPress={() => navigation.navigate(Routes.Create)} style={[styles.composer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Avatar uri={me.avatar} name={me.displayName} size={36} />
              <Text style={{ color: theme.textFaint, flex: 1, fontSize: 14.5 }}>Share a photo, clip or thought\u2026</Text>
              <Ionicons name="add-circle" size={24} color={theme.brand} />
            </Pressable>
            <View style={styles.filters}>
              {FILTERS.map((f) => (
                <Chip key={f.value} label={f.label} active={filter === f.value} onPress={() => setFilter(f.value)} />
              ))}
            </View>
            {wide ? <View style={{ alignSelf: 'center', width: 620, maxWidth: '100%' }} /> : null}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: spacing.lg, alignItems: wide ? 'center' : undefined }}
        renderItem={({ item }) => (
          <View style={wide ? { width: 620, maxWidth: '100%' } : { width: '100%' }}>
            <PostCard post={item} />
          </View>
        )}
        ListEmptyComponent={
          !store ? (
            <View style={{ gap: spacing.lg, paddingTop: spacing.md }}>
              <PostSkeleton />
              <PostSkeleton />
            </View>
          ) : (
            <EmptyState
              icon="sparkles-outline"
              title={filter === 'all' ? 'Your feed is warming up' : `No ${filter} posts yet`}
              subtitle={filter === 'all' ? 'Follow a few creators and their vibe will show up here first.' : 'Try another filter, or create the first one yourself.'}
              actionLabel="Create something"
              onAction={() => navigation.navigate(Routes.Create)}
            />
          )
        }
        ListFooterComponent={
          posts.length > 0 ? (
            <Animated.View entering={FadeIn} style={styles.footer}>
              <View style={[styles.footerLine, { backgroundColor: theme.divider }]} />
              <Text style={{ color: theme.textFaint, fontSize: 13, fontWeight: '600' }}>You are all caught up</Text>
              <View style={[styles.footerLine, { backgroundColor: theme.divider }]} />
            </Animated.View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  composer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.md },
  filters: { flexDirection: 'row', gap: 8, paddingBottom: spacing.md, flexWrap: 'wrap' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: spacing.xl },
  footerLine: { flex: 1, height: StyleSheet.hairlineWidth },
});

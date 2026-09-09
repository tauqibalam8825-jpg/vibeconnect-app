import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { feedFor, trendingPosts, unreadNotificationCount, userById, liveShorts } from '../store/selectors';
import { PostCard } from '../components/PostCard';
import { StoryTray } from '../components/StoryTray';
import { Avatar, Button, Chip, DemoTag, EmptyState, IconBtn, Logo, Segmented, Skeleton } from '../components/ui';
import { Media } from '../components/Media';
import { fmtCount } from '../lib/format';
import type { Nav } from '../navigation/types';

const PAGE = 6;

export const HomeScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, me } = useStore();
  const [tab, setTab] = useState<'following' | 'foryou'>('following');
  const [limit, setLimit] = useState(PAGE);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, []);

  const meId = me?.id ?? '';
  const following = useMemo(() => feedFor(state, meId), [state, meId]);
  const forYou = useMemo(
    () => trendingPosts(state).filter((p) => p.authorId !== meId),
    [state, meId]
  );
  const data = tab === 'following' ? following : forYou;
  const visible = data.slice(0, limit);
  const shorts = useMemo(() => liveShorts(state, meId).slice(0, 6), [state, meId]);
  const unread = meId ? unreadNotificationCount(state, meId) : 0;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  const header = (
    <View>
      <StoryTray nav={nav} />
      {shorts.length > 0 && (
        <View style={styles.vibes}>
          <View style={styles.vibesHead}>
            <Ionicons name="flash" size={15} color={theme.primary} />
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14.5 }}>Vibes</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => nav.navigate('Shorts')} accessibilityRole="button" accessibilityLabel="Open vibes feed">
              <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 12.5 }}>See all</Text>
            </Pressable>
          </View>
          <FlatList
            horizontal
            data={shorts}
            keyExtractor={(s) => s.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 12, paddingBottom: 12 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => nav.navigate('Shorts')}
                style={[styles.vibeCard, { backgroundColor: theme.surfaceAlt }]}
                accessibilityRole="button"
                accessibilityLabel={`Play vibe: ${item.caption.slice(0, 30)}`}
              >
                <Media uri={item.poster} style={StyleSheet.absoluteFill as object} />
                <View style={styles.vibeShade} />
                <View style={styles.vibeMeta}>
                  <Avatar uri={userById(state, item.authorId)?.avatar} name="" size={22} />
                  <Text numberOfLines={2} style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                    {item.caption}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="play" size={10} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '700' }}>{fmtCount(item.views)}</Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Segmented
          value={tab}
          onChange={(k) => { setTab(k as 'following' | 'foryou'); setLimit(PAGE); }}
          options={[
            { key: 'following', label: 'Following', icon: 'people-outline' },
            { key: 'foryou', label: 'For you', icon: 'sparkles-outline' },
          ]}
        />
      </View>
      {tab === 'following' && following.length === 0 && (
        <EmptyState
          icon="people-outline"
          title="Your circle is quiet"
          subtitle="Follow a few creators and their posts will land here. Try the For you tab to discover someone new."
          action={<Button title="Explore creators" onPress={() => nav.navigate('Tabs')} variant="soft" icon="compass-outline" />}
        />
      )}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Logo size={30} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <IconBtn name="create-outline" accessibilityLabel="Create new content" onPress={() => nav.navigate('Create')} />
          <IconBtn
            name="notifications-outline"
            accessibilityLabel="Notifications"
            badge={unread}
            onPress={() => nav.navigate('Notifications')}
          />
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => setLimit((l) => Math.min(l + PAGE, data.length))}
        initialNumToRender={4}
        windowSize={7}
        removeClippedSubviews
        ListFooterComponent={
          limit < data.length ? (
            <Pressable onPress={() => setLimit((l) => l + PAGE)} style={{ alignItems: 'center', padding: 16 }} accessibilityRole="button">
              <Chip label="Load more posts" icon="arrow-down-outline" />
            </Pressable>
          ) : data.length > 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ color: theme.textFaint, fontSize: 12.5 }}>You are all caught up</Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 4) * 45).duration(260)}>
            <PostCard post={item} nav={nav} />
          </Animated.View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 14, paddingHorizontal: 12 }}>
              {[0, 1].map((i) => (
                <View key={i} style={{ borderRadius: 22, overflow: 'hidden', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}>
                  <View style={{ flexDirection: 'row', gap: 10, padding: 12, alignItems: 'center' }}>
                    <Skeleton height={40} radius={20} style={{ width: 40 }} />
                    <Skeleton height={12} radius={6} style={{ flex: 1 }} />
                  </View>
                  <Skeleton height={320} radius={0} />
                </View>
              ))}
            </View>
          ) : null
        }
      />
      <View style={styles.demoBar}>
        <DemoTag />
        <Text style={{ color: theme.textFaint, fontSize: 11 }}>
          Sample content while the API is offline
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  vibes: { marginBottom: 14 },
  vibesHead: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginBottom: 10 },
  vibeCard: { width: 108, height: 158, borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end' },
  vibeShade: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,6,20,0.35)' },
  vibeMeta: { padding: 8, gap: 5 },
  demoBar: {
    position: 'absolute', bottom: 84, alignSelf: 'center', flexDirection: 'row',
    alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(120,110,180,0.16)',
  },
});

import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import {
  isFollowing,
  liveVideos,
  searchAll,
  suggestedCreators,
  trendingPosts,
  userById,
} from '../store/selectors';
import { Avatar, Card, Chip, DemoTag, EmptyState, SectionTitle, Segmented, Stat } from '../components/ui';
import { Media } from '../components/Media';
import { fmtCount, timeAgo } from '../lib/format';
import type { Nav } from '../navigation/types';

const TOPICS = ['night photography', 'van life', 'cooking', 'dance', 'modular synth', 'ceramics', 'drone', 'trail running'];

export const ExploreScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, me, toggleFollow } = useStore();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'top' | 'people' | 'posts' | 'videos'>('top');

  const meId = me?.id ?? '';
  const results = useMemo(() => searchAll(state, query), [state, query]);
  const trending = useMemo(() => trendingPosts(state).slice(0, 12), [state]);
  const creators = useMemo(() => suggestedCreators(state, meId).slice(0, 6), [state, meId]);
  const videos = useMemo(() => liveVideos(state), [state]);
  const searching = query.trim().length > 0;

  const people = searching ? results.users : creators;

  const renderUser = (u: (typeof creators)[number]) => {
    const following = isFollowing(state, meId, u.id);
    const isMe = u.id === meId;
    return (
      <Pressable
        key={u.id}
        onPress={() => nav.navigate('UserProfile', { userId: u.id })}
        style={[styles.userRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
        accessibilityRole="button"
        accessibilityLabel={`Open profile of ${u.username}`}
      >
        <Avatar uri={u.avatar} name={u.displayName} size={46} online={u.online} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14.5 }}>{u.displayName}</Text>
            {u.verified && <Ionicons name="checkmark-circle" size={13} color={theme.primary} />}
            {u.isDemo && <DemoTag />}
          </View>
          <Text style={{ color: theme.textFaint, fontSize: 12.5 }} numberOfLines={1}>
            @{u.username} · {u.bio || 'No bio yet'}
          </Text>
        </View>
        {!isMe && (
          <Pressable
            onPress={() => toggleFollow(u.id)}
            accessibilityRole="button"
            accessibilityLabel={following ? 'Unfollow' : 'Follow'}
            style={[
              styles.followBtn,
              { backgroundColor: following ? theme.surfaceAlt : theme.primary, borderColor: following ? theme.border : theme.primary },
            ]}
          >
            <Text style={{ color: following ? theme.textDim : '#fff', fontWeight: '800', fontSize: 12.5 }}>
              {following ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        )}
      </Pressable>
    );
  };

  const grid = searching ? results.posts : trending;

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.8 }}>Explore</Text>
        <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={17} color={theme.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search people, posts, videos, tags"
            placeholderTextColor={theme.textFaint}
            style={{ flex: 1, color: theme.text, fontSize: 14.5, paddingVertical: 10 }}
            returnKeyType="search"
            accessibilityLabel="Search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={17} color={theme.textFaint} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
          <Segmented
            value={tab}
            onChange={(k) => setTab(k as typeof tab)}
            scroll
            options={[
              { key: 'top', label: 'Top', icon: 'flame-outline' },
              { key: 'people', label: 'People', icon: 'person-outline' },
              { key: 'posts', label: 'Posts', icon: 'images-outline' },
              { key: 'videos', label: 'Videos', icon: 'videocam-outline' },
            ]}
          />
        </View>

        {!searching && tab === 'top' && (
          <>
            <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {TOPICS.map((t) => (
                  <Chip key={t} label={`#${t.replace(/ /g, '')}`} onPress={() => setQuery(t.split(' ')[0])} />
                ))}
              </ScrollView>
            </View>

            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <Card>
                <View style={{ flexDirection: 'row' }}>
                  <Stat value={state.posts.length + state.shorts.length + state.videos.length} label="Posts" />
                  <Stat value={state.users.length} label="Creators" />
                  <Stat value={trending.reduce((n, p) => n + p.views, 0)} label="Views" />
                </View>
              </Card>
            </View>

            <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
              <SectionTitle title="Suggested creators" />
            </View>
            <View style={{ gap: 10, paddingHorizontal: 16, marginBottom: 20 }}>
              {creators.map(renderUser)}
            </View>
          </>
        )}

        {(tab === 'people' || (searching && tab === 'top')) && (
          <View style={{ gap: 10, paddingHorizontal: 16, marginBottom: 12 }}>
            {people.length === 0 ? (
              <EmptyState icon="person-outline" title="No people found" subtitle={`Nothing matched "${query}".`} />
            ) : (
              people.map(renderUser)
            )}
          </View>
        )}

        {(tab === 'posts' || (tab === 'top' && !searching) || (searching && tab === 'top')) && (
          <View style={{ paddingHorizontal: 12 }}>
            <SectionTitle title={searching ? `Posts for "${query}"` : 'Trending now'} />
            {grid.length === 0 ? (
              <EmptyState icon="images-outline" title="Nothing here yet" subtitle="Try another search term." />
            ) : (
              <View style={styles.grid}>
                {grid.map((p, i) => (
                  <Animated.View key={p.id} entering={FadeInDown.delay(Math.min(i, 6) * 40).duration(240)} style={styles.gridItem}>
                    <Pressable
                      onPress={() => nav.navigate('PostDetail', { postId: p.id })}
                      style={[styles.gridCard, { backgroundColor: theme.surfaceAlt }]}
                      accessibilityRole="button"
                      accessibilityLabel="Open post"
                    >
                      <Media uri={p.thumb ?? p.uri} style={StyleSheet.absoluteFill as object} />
                      {p.kind === 'video' && (
                        <View style={styles.playTag}>
                          <Ionicons name="play" size={11} color="#fff" />
                        </View>
                      )}
                      <View style={styles.gridMeta}>
                        <Ionicons name="heart" size={11} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{fmtCount(p.likes.length)}</Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        )}

        {(tab === 'videos' || (searching && tab === 'top')) && (
          <View style={{ paddingHorizontal: 16 }}>
            <SectionTitle title={searching ? `Videos for "${query}"` : 'Long-form picks'} />
            {videos.length === 0 && <EmptyState icon="videocam-outline" title="No videos yet" />}
            <View style={{ gap: 12 }}>
              {(searching ? results.videos : videos).map((v, i) => (
                <Animated.View key={v.id} entering={FadeInDown.delay(Math.min(i, 5) * 45).duration(240)}>
                  <Pressable
                    onPress={() => nav.navigate('VideoDetail', { videoId: v.id })}
                    style={[styles.videoRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Play ${v.title}`}
                  >
                    <View style={{ width: 132, height: 82, borderRadius: 12, overflow: 'hidden' }}>
                      <Media uri={v.thumb} style={StyleSheet.absoluteFill as object} />
                      <View style={styles.playTag}>
                        <Ionicons name="play" size={12} color="#fff" />
                      </View>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text numberOfLines={2} style={{ color: theme.text, fontWeight: '700', fontSize: 13.5, lineHeight: 18 }}>
                        {v.title}
                      </Text>
                      <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 4 }}>
                        {userById(state, v.authorId)?.displayName} · {fmtCount(v.views)} views · {timeAgo(v.at)}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                        <Chip label={v.category} />
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16,
    paddingHorizontal: 14, marginTop: 12, borderWidth: 1,
  },
  userRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, borderWidth: 1,
  },
  followBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '48.5%' },
  gridCard: { aspectRatio: 1, borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end' },
  gridMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  playTag: {
    position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(8,6,20,0.55)',
    borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4,
  },
  videoRow: { flexDirection: 'row', padding: 10, borderRadius: 18, borderWidth: 1 },
});

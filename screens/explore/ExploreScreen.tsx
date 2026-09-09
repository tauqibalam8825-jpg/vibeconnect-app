import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { gradients, radii, shadow, spacing } from '../../lib/theme';
import { EXPLORE_CATEGORIES } from '../../lib/media';
import { Routes } from '../../lib/routes';
import { formatCount } from '../../lib/format';
import { Chip, EmptyState, SectionTitle, Skeleton } from '../../components/UI';
import { Avatar } from '../../components/Avatar';
import { UserRow } from '../../components/Actions';
import { PostCard } from '../../components/PostCard';

type Tab = 'top' | 'people' | 'posts' | 'videos' | 'tags';

export function ExploreScreen() {
  const theme = useTheme();
  const { me, db: store, version } = useApp();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState((route.params?.query as string) ?? '');
  const [submitted, setSubmitted] = useState((route.params?.query as string) ?? '');
  const [tab, setTab] = useState<Tab>('top');
  const [category, setCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (route.params?.query) {
      setQuery(route.params.query);
      setSubmitted(route.params.query);
    }
  }, [route.params?.query]);

  const searching = submitted.trim().length > 0;
  const results = useMemo(() => (searching ? db.search(submitted, me) : null), [submitted, searching, me, version]);
  const explore = useMemo(() => db.exploreFeed(me, category), [me, category, version]);
  const trending = useMemo(() => db.trendingHashtags(8), [version]);
  const suggested = useMemo(() => db.suggestedUsers(me, 5), [me, version]);
  const columns = width >= 900 ? 4 : 2;

  if (!store || !me) return null;

  const posts = tab === 'videos' ? (results?.videos ?? []) : (results?.posts ?? []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => setSubmitted(query)}
            placeholder="Search people, posts, #hashtags\u2026"
            placeholderTextColor={theme.textFaint}
            returnKeyType="search"
            style={{ flex: 1, color: theme.text, fontSize: 15, paddingVertical: 12, outlineStyle: 'none' } as any}
          />
          {query ? (
            <Pressable
              hitSlop={10}
              onPress={() => {
                setQuery('');
                setSubmitted('');
              }}
            >
              <Ionicons name="close-circle" size={18} color={theme.textFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={searching && (tab === 'posts' || tab === 'videos') ? posts : []}
        keyExtractor={(item) => item.id}
        numColumns={searching && (tab === 'posts' || tab === 'videos') ? 1 : 1}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 500); }} tintColor={theme.brand} colors={[theme.brand]} />}
        contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: spacing.lg }}
        ListHeaderComponent={
          <View>
            <View style={styles.tabs}>
              {([
                { value: 'top', label: 'Top' },
                { value: 'people', label: 'People' },
                { value: 'posts', label: 'Posts' },
                { value: 'videos', label: 'Videos' },
                { value: 'tags', label: 'Hashtags' },
              ] as Array<{ value: Tab; label: string }>).map((t) => (
                <Pressable key={t.value} onPress={() => setTab(t.value)} style={[styles.tab, tab === t.value && { borderBottomColor: theme.brand, borderBottomWidth: 2 }]}>
                  <Text style={{ color: tab === t.value ? theme.text : theme.textFaint, fontWeight: tab === t.value ? '800' : '600', fontSize: 13.5 }}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            {!searching ? (
              <>
                <SectionTitle title="Browse vibes" />
                <View style={styles.categoryGrid}>
                  {EXPLORE_CATEGORIES.map((c, i) => {
                    const active = category === c.key;
                    return (
                      <Animated.View key={c.key} entering={FadeInDown.delay(i * 25)} style={{ width: `${100 / 3 - 2}%`, marginBottom: 8 }}>
                        <Pressable onPress={() => setCategory(c.key)}>
                          <LinearGradient
                            colors={active ? (gradients.brand as unknown as string[]) : [theme.surface, theme.surfaceAlt]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.category, { borderColor: active ? 'transparent' : theme.border }]}
                          >
                            <Ionicons name={c.icon as any} size={18} color={active ? '#fff' : theme.brand} />
                            <Text style={{ color: active ? '#fff' : theme.textMuted, fontSize: 12.5, fontWeight: '700' }}>{c.label}</Text>
                          </LinearGradient>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>

                <SectionTitle title="Trending signals" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl }}>
                  {trending.map((t) => (
                    <Chip key={t.tag} label={`#${t.tag}`} count={t.count} onPress={() => { setQuery(`#${t.tag}`); setSubmitted(`#${t.tag}`); }} />
                  ))}
                </View>

                {suggested.length > 0 ? (
                  <>
                    <SectionTitle title="Creators to watch" />
                    <View style={{ marginBottom: spacing.xl }}>
                      {suggested.map((u) => (
                        <UserRow
                          key={u.id}
                          user={u}
                          onPress={() => navigation.navigate(Routes.UserProfile, { id: u.id })}
                          right={
                            <Pressable
                              onPress={() => db.toggleFollow(u.id)}
                              style={[styles.followBtn, { backgroundColor: me.following.includes(u.id) ? theme.surfaceAlt : theme.brand, borderColor: theme.border }]}
                            >
                              <Text style={{ color: me.following.includes(u.id) ? theme.textMuted : '#fff', fontWeight: '800', fontSize: 12.5 }}>
                                {me.following.includes(u.id) ? 'Following' : 'Follow'}
                              </Text>
                            </Pressable>
                          }
                        />
                      ))}
                    </View>
                  </>
                ) : null}

                <SectionTitle title={category === 'all' ? 'Rising posts' : `In ${category}`} />
              </>
            ) : null}

            {searching && tab === 'people' ? (
              <View style={{ marginTop: spacing.sm }}>
                {results?.people.length ? (
                  results.people.map((u) => (
                    <UserRow key={u.id} user={u} onPress={() => navigation.navigate(Routes.UserProfile, { id: u.id })} right={<Ionicons name="chevron-forward" size={16} color={theme.textFaint} />} />
                  ))
                ) : (
                  <EmptyState icon="person-outline" title="No people found" subtitle={`Nobody matches \u201c${submitted}\u201d yet.`} />
                )}
              </View>
            ) : null}

            {searching && tab === 'tags' ? (
              <View style={{ marginTop: spacing.sm, gap: 8 }}>
                {results?.hashtags.length ? (
                  results.hashtags.map((t) => (
                    <Pressable key={t.tag} onPress={() => setTab('posts')} style={[styles.tagRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <View style={[styles.tagIcon, { backgroundColor: theme.brandSoft }]}>
                        <Text style={{ color: theme.brand, fontWeight: '900', fontSize: 16 }}>#</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>#{t.tag}</Text>
                        <Text style={{ color: theme.textFaint, fontSize: 12.5 }}>{formatCount(t.count * 128)} vibes</Text>
                      </View>
                      <Ionicons name="trending-up" size={16} color={theme.accent} />
                    </Pressable>
                  ))
                ) : (
                  <EmptyState icon="pricetag-outline" title="No hashtags found" subtitle="Try a broader search term." />
                )}
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 40)}>
            <PostCard post={item} />
          </Animated.View>
        )}
        ListEmptyComponent={
          searching ? (
            tab === 'people' || tab === 'tags' ? null : (
              <EmptyState
                icon="search-outline"
                title={`Nothing for \u201c${submitted}\u201d`}
                subtitle="Check the spelling, or switch tabs to look for people and hashtags."
                actionLabel="Clear search"
                onAction={() => {
                  setQuery('');
                  setSubmitted('');
                }}
              />
            )
          ) : explore.length === 0 ? (
            <EmptyState icon="compass-outline" title="Nothing here yet" subtitle="Once people post in this vibe it will fill up." actionLabel="Create the first" onAction={() => navigation.navigate(Routes.Create)} />
          ) : (
            explore.map((p, i) => (
              <Animated.View key={p.id} entering={FadeInDown.delay(Math.min(i, 6) * 40)}>
                <PostCard post={p} />
              </Animated.View>
            ))
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth },
  tabs: { flexDirection: 'row', gap: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent', marginBottom: spacing.lg },
  tab: { paddingBottom: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl },
  category: { borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 14, alignItems: 'center', gap: 6 },
  followBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth },
  tagIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

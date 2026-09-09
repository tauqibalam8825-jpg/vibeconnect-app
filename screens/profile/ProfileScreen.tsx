import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { gradients, radii, shadow, spacing } from '../../lib/theme';
import { formatCount, money } from '../../lib/format';
import { deepLinkForUser, shareContent } from '../../lib/share';
import { Routes } from '../../lib/routes';
import { Avatar } from '../../components/Avatar';
import { Button, Chip, EmptyState, ProgressBar, SectionTitle, Segmented, IconButton } from '../../components/UI';
import { PostGrid } from '../../components/PostGrid';

type Tab = 'posts' | 'shorts' | 'saved';

export function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { me, db: store, toast, confirm, version } = useApp();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('posts');

  const posts = useMemo(() => (me && store ? db.postsByUser(me.id, me, 'photo') : []), [me, store, tab, version]);
  const shorts = useMemo(() => (me && store ? db.postsByUser(me.id, me, 'short') : []), [me, store, tab, version]);
  const saved = useMemo(() => (me && store ? db.savedPosts(me).filter((p) => p.type === 'photo') : []), [me, store, tab, version]);
  const stats = useMemo(() => (me ? db.creatorStats(me.id) : null), [me, version]);

  if (!me || !store || !stats) return null;

  const list = tab === 'posts' ? posts : tab === 'shorts' ? shorts : saved;
  const wide = width >= 900;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.coverWrap}>
          <LinearGradient colors={gradients.brand as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cover} />
          <View style={styles.coverActions}>
            <IconButton icon="notifications-outline" onPress={() => navigation.navigate(Routes.Notifications)} badge={db.unreadNotificationCount(me.id)} style={{ backgroundColor: 'rgba(11,9,18,0.35)', borderColor: 'transparent' }} />
            <IconButton icon="settings-outline" onPress={() => navigation.navigate(Routes.Settings)} style={{ backgroundColor: 'rgba(11,9,18,0.35)', borderColor: 'transparent' }} />
          </View>
        </View>

        <View style={[styles.body, { backgroundColor: theme.bg }]}>
          <View style={styles.avatarRow}>
            <Avatar uri={me.avatar} name={me.displayName} size={92} ring={false} />
            <View style={styles.statsRow}>
              <Pressable style={styles.stat} onPress={() => navigation.navigate(Routes.FollowList, { userId: me.id, mode: 'followers' })}>
                <Text style={[styles.statValue, { color: theme.text }]}>{formatCount(db.followerCount(me))}</Text>
                <Text style={[styles.statLabel, { color: theme.textFaint }]}>Followers</Text>
              </Pressable>
              <Pressable style={styles.stat} onPress={() => navigation.navigate(Routes.FollowList, { userId: me.id, mode: 'following' })}>
                <Text style={[styles.statValue, { color: theme.text }]}>{formatCount(db.followingCount(me))}</Text>
                <Text style={[styles.statLabel, { color: theme.textFaint }]}>Following</Text>
              </Pressable>
              <Pressable style={styles.stat} onPress={() => setTab('posts')}>
                <Text style={[styles.statValue, { color: theme.text }]}>{formatCount(stats.posts)}</Text>
                <Text style={[styles.statLabel, { color: theme.textFaint }]}>Posts</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.displayName, { color: theme.text }]}>{me.displayName}</Text>
              {me.verified ? <Ionicons name="checkmark-circle" size={17} color={theme.brand} /> : null}
              {me.settings.privateAccount ? (
                <View style={[styles.privateTag, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Ionicons name="lock-closed" size={10} color={theme.textMuted} />
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700' }}>Private</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color: theme.textFaint, fontSize: 14 }}>@{me.username} \u00b7 {me.category}</Text>
            {me.bio ? <Text style={{ color: theme.text, fontSize: 14.5, lineHeight: 21, marginTop: 8 }}>{me.bio}</Text> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
              {me.location ? (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={theme.textFaint} />
                  <Text style={{ color: theme.textFaint, fontSize: 13 }}>{me.location}</Text>
                </View>
              ) : null}
              {me.website ? (
                <View style={styles.metaItem}>
                  <Ionicons name="link-outline" size={14} color={theme.brand} />
                  <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '600' }}>{me.website.replace(/^https?:\/\//, '')}</Text>
                </View>
              ) : null}
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={theme.textFaint} />
                <Text style={{ color: theme.textFaint, fontSize: 13 }}>Joined {new Date(me.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.lg }}>
            <Button label="Edit profile" variant="secondary" size="sm" icon="create-outline" onPress={() => navigation.navigate(Routes.EditProfile)} style={{ flex: 1 }} />
            <Button
              label="Share"
              variant="secondary"
              size="sm"
              icon="share-outline"
              onPress={async () => {
                const r = await shareContent(`${me.displayName} on VibeConnect`, `Follow @${me.username} on VibeConnect`, deepLinkForUser(me.username));
                if (r === 'copied') toast('Profile link copied');
              }}
              style={{ flex: 1 }}
            />
            <IconButton icon="settings-outline" onPress={() => navigation.navigate(Routes.Settings)} />
          </View>

          {/* Creator status card */}
          <Pressable onPress={() => navigation.navigate(me.isCreator || me.monetization.status === 'approved' ? Routes.Studio : Routes.Studio)}>
            <LinearGradient
              colors={
                me.monetization.status === 'approved'
                  ? (gradients.mint as unknown as string[])
                  : me.monetization.status === 'pending'
                    ? (gradients.gold as unknown as string[])
                    : (gradients.brandSoft as unknown as string[])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.creatorCard, shadow(4, theme)]}
            >
              <View style={styles.creatorIcon}>
                <Ionicons
                  name={me.monetization.status === 'approved' ? 'diamond' : me.monetization.status === 'pending' ? 'hourglass' : 'trending-up'}
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.creatorTitle}>
                  {me.monetization.status === 'approved'
                    ? 'Creator monetization active'
                    : me.monetization.status === 'pending'
                      ? 'Application under review'
                      : me.monetization.status === 'rejected'
                        ? 'Monetization needs rework'
                        : 'Unlock creator earnings'}
                </Text>
                <Text style={styles.creatorBody}>
                  {me.monetization.status === 'approved'
                    ? `${money(db.walletBalance(me.id))} available \u00b7 open your studio`
                    : me.monetization.status === 'pending'
                      ? 'A moderator will decide within 5 days.'
                      : 'Studio, analytics, tips and payouts \u2014 all in one place.'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </LinearGradient>
          </Pressable>

          <View style={{ marginTop: spacing.xl }}>
            <Segmented<Tab>
              value={tab}
              onChange={setTab}
              options={[
                { value: 'posts', label: 'Posts', icon: 'grid-outline' },
                { value: 'shorts', label: 'Shorts', icon: 'flash-outline' },
                { value: 'saved', label: 'Saved', icon: 'bookmark-outline' },
              ]}
            />
          </View>

          <View style={{ marginTop: spacing.lg, paddingHorizontal: wide ? spacing.lg : 0 }}>
            {list.length > 0 ? (
              <PostGrid posts={list} columns={width >= 700 ? 4 : 3} />
            ) : (
              <EmptyState
                icon={tab === 'saved' ? 'bookmark-outline' : tab === 'shorts' ? 'flash-outline' : 'images-outline'}
                title={tab === 'saved' ? 'Nothing saved yet' : tab === 'shorts' ? 'No shorts yet' : 'No posts yet'}
                subtitle={
                  tab === 'saved'
                    ? 'Tap the bookmark on any post to keep it here.'
                    : tab === 'shorts'
                      ? 'Short vertical clips show up here.'
                      : 'Share your first photo, clip or thought.'
                }
                actionLabel={tab === 'saved' ? undefined : 'Create a post'}
                onAction={tab === 'saved' ? undefined : () => navigation.navigate(Routes.Create, { mode: tab === 'shorts' ? 'short' : 'photo' })}
              />
            )}
          </View>

          {stats.top.length > 0 && tab !== 'saved' ? (
            <View style={{ marginTop: spacing.xl }}>
              <SectionTitle title="Top content" action="Studio" onAction={() => navigation.navigate(Routes.Studio)} />
              {stats.top.slice(0, 3).map((post, i) => (
                <Animated.View key={post.id} entering={FadeInDown.delay(i * 50)}>
                  <Pressable onPress={() => navigation.navigate(Routes.PostDetail, { id: post.id })} style={[styles.topRow, { borderColor: theme.divider }]}>
                    <Text style={{ color: theme.textFaint, fontWeight: '800', width: 20 }}>{i + 1}</Text>
                    <Text numberOfLines={1} style={{ color: theme.text, flex: 1, fontSize: 14 }}>{post.caption}</Text>
                    <Text style={{ color: theme.brand, fontWeight: '800', fontSize: 12.5 }}>{formatCount(post.views)}</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  coverWrap: { height: 148 },
  cover: { flex: 1, opacity: 0.95 },
  coverActions: { position: 'absolute', top: spacing.sm, right: spacing.lg, flexDirection: 'row', gap: 8 },
  body: { marginTop: -34, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.lg },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 6 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  displayName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  privateTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  creatorCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radii.lg, marginTop: spacing.xl },
  creatorIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  creatorTitle: { color: '#fff', fontWeight: '800', fontSize: 15.5, letterSpacing: -0.2 },
  creatorBody: { color: 'rgba(255,255,255,0.88)', fontSize: 12.5, marginTop: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});

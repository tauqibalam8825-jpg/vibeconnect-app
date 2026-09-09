import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import {
  followersOf,
  followingOf,
  isBlocked,
  isFollowing,
  isMuted,
  statsFor,
  userById,
} from '../store/selectors';
import { Avatar, Button, Chip, DemoTag, EmptyState, IconBtn, Pill, useToast } from './ui';
import { Media } from './Media';
import { BottomSheet } from '../screens/WatchScreen';
import { fmtCount, timeAgo } from '../lib/format';
import type { Nav } from '../navigation/types';

type Tab = 'posts' | 'vibes' | 'videos' | 'saved';

/**
 * Shared profile surface for both my own profile and other people's.
 * Own-profile adds editing, studio, wallet and settings entry points.
 */
export const ProfileView: React.FC<{
  userId: string;
  nav: Nav;
  isOwn: boolean;
  header?: React.ReactNode;
}> = ({ userId, nav, isOwn, header }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const { state, me, toggleFollow, submitReport, blockUser, unblockUser, muteUser, unmuteUser } = useStore();
  const [tab, setTab] = useState<Tab>(isOwn ? 'posts' : 'posts');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const toast = useToast();

  const user = userById(state, userId);
  const stats = useMemo(() => statsFor(state, userId), [state, userId]);

  if (!user) {
    return <EmptyState icon="person-outline" title="Account not found" />;
  }

  const blockedByMe = me ? isBlocked(state, me.id, user.id) : false;
  const mutedByMe = me ? isMuted(state, me.id, user.id) : false;
  const following = me ? isFollowing(state, me.id, user.id) : false;
  const privateLocked = user.private && !isOwn && !following;
  const cell = (width - 32 - 8) / 2;

  const posts = state.posts.filter((p) => p.authorId === user.id && !p.removed);
  const shorts = state.shorts.filter((s) => s.authorId === user.id && !s.removed);
  const videos = state.videos.filter((v) => v.authorId === user.id && !v.removed);
  const savedItems = isOwn
    ? [
        ...state.posts.filter((p) => p.saves.includes(user.id)).map((p) => ({ id: p.id, uri: p.thumb ?? p.uri, kind: 'post' as const })),
        ...state.shorts.filter((s) => s.saves.includes(user.id)).map((s) => ({ id: s.id, uri: s.poster, kind: 'short' as const })),
        ...state.videos.filter((v) => v.saves.includes(user.id)).map((v) => ({ id: v.id, uri: v.thumb, kind: 'video' as const })),
      ]
    : [];

type GridItem = { id: string; uri: string; kind: 'post' | 'short' | 'video'; badge: boolean };

  const gridData: GridItem[] =
    tab === 'posts'
      ? posts.map((p) => ({ id: p.id, uri: p.thumb ?? p.uri, kind: 'post' as const, badge: p.kind === 'video' }))
      : tab === 'vibes'
        ? shorts.map((s) => ({ id: s.id, uri: s.poster, kind: 'short' as const, badge: true }))
        : tab === 'videos'
          ? videos.map((v) => ({ id: v.id, uri: v.thumb, kind: 'video' as const, badge: true }))
          : savedItems.map((s) => ({ id: s.id, uri: s.uri, kind: s.kind, badge: s.kind !== 'post' }));

  const openItem = (item: { id: string; kind: string }) => {
    if (item.kind === 'short') nav.navigate('Shorts');
    else if (item.kind === 'video') nav.navigate('VideoDetail', { videoId: item.id });
    else nav.navigate('PostDetail', { postId: item.id });
  };

  return (
    <>
    <FlatList
      data={gridData}
      keyExtractor={(g) => g.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 8 }}
      contentContainerStyle={{ paddingBottom: 120, gap: 8, paddingHorizontal: 0 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          {header}
          <Media uri={user.banner} style={{ width: '100%', height: 132 }} />
          <View style={{ paddingHorizontal: 16 }}>
            <View style={{ marginTop: -34, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={{ borderWidth: 4, borderColor: theme.bg, borderRadius: 60 }}>
                <Avatar uri={user.avatar} name={user.displayName} size={84} online={user.online && state.settings.showOnline} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                {isOwn ? (
                  <>
                    <Button title="Edit profile" size="sm" variant="secondary" icon="create-outline" onPress={() => nav.navigate('EditProfile')} />
                    <IconBtn name="settings-outline" accessibilityLabel="Settings" onPress={() => nav.navigate('Settings')} />
                  </>
                ) : (
                  <>
                    <Button
                      title={following ? 'Following' : 'Follow'}
                      size="sm"
                      variant={following ? 'secondary' : 'primary'}
                      onPress={() => toggleFollow(user.id)}
                      accessibilityLabel={following ? 'Unfollow user' : 'Follow user'}
                    />
                    <Button title="Message" size="sm" variant="soft" icon="chatbubble-outline" onPress={() => nav.navigate('Chat', { userId: user.id })} />
                    <IconBtn
                      name="ellipsis-horizontal"
                      accessibilityLabel="Profile options"
                      onPress={() => setOptionsOpen(true)}
                    />
                  </>
                )}
              </View>
            </View>

            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}>{user.displayName}</Text>
              {user.verified && <Ionicons name="checkmark-circle" size={16} color={theme.primary} />}
              {user.isDemo && <DemoTag />}
              {user.private && <Pill text="Private" icon="lock-closed" />}
              {user.suspended && <Pill text="Suspended" icon="warning" color={theme.danger} />}
            </View>
            <Text style={{ color: theme.textFaint, fontSize: 13, marginTop: 2 }}>
              @{user.username}{user.location ? ` · ${user.location}` : ''}
            </Text>
            {user.bio ? (
              <Text style={{ color: theme.text, fontSize: 13.5, lineHeight: 20, marginTop: 8 }}>{user.bio}</Text>
            ) : (
              <Text style={{ color: theme.textFaint, fontSize: 13.5, marginTop: 8 }}>No bio yet.</Text>
            )}

            <View style={[styles.stats, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <StatBlock value={fmtCount(stats.posts)} label="Posts" />
              <StatBlock value={fmtCount(stats.followers)} label="Followers" onPress={() => nav.navigate('List', { userId: user.id, type: 'followers' })} />
              <StatBlock value={fmtCount(stats.following)} label="Following" onPress={() => nav.navigate('List', { userId: user.id, type: 'following' })} />
              <StatBlock value={fmtCount(stats.views)} label="Views" />
            </View>

            {isOwn && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button title="Creator Studio" size="sm" variant="soft" icon="stats-chart-outline" onPress={() => nav.navigate('Studio')} />
                <Button title="Wallet" size="sm" variant="soft" icon="wallet-outline" onPress={() => nav.navigate('Wallet')} />
                {user.role === 'admin' && (
                  <Button title="Admin" size="sm" variant="danger" icon="shield-checkmark-outline" onPress={() => nav.navigate('Admin')} />
                )}
              </View>
            )}

            {blockedByMe && !isOwn && (
              <View style={[styles.notice, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <Ionicons name="ban-outline" size={16} color={theme.textDim} />
                <Text style={{ color: theme.textDim, fontSize: 12.5, flex: 1 }}>
                  You blocked @{user.username}. Their content is hidden from you.
                </Text>
                <Button title="Unblock" size="sm" variant="ghost" onPress={() => unblockUser(user.id)} />
              </View>
            )}

            <View style={{ marginTop: 16, marginBottom: 12 }}>
              <FlatList
                horizontal
                data={['posts', 'vibes', 'videos', ...(isOwn ? ['saved'] : [])] as Tab[]}
                keyExtractor={(t) => t}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => (
                  <Chip
                    label={item === 'vibes' ? 'Vibes' : item === 'videos' ? 'Videos' : item === 'saved' ? 'Saved' : 'Posts'}
                    active={tab === item}
                    onPress={() => setTab(item)}
                  />
                )}
              />
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        privateLocked ? (
          <EmptyState
            icon="lock-closed-outline"
            title="This account is private"
            subtitle="Follow to see their posts, vibes and videos."
            action={<Button title={following ? 'Following' : 'Follow to view'} onPress={() => toggleFollow(user.id)} />}
          />
        ) : blockedByMe ? (
          <EmptyState icon="ban-outline" title="Hidden" subtitle="You blocked this account." action={<Button title="Unblock" onPress={() => unblockUser(user.id)} />} />
        ) : (
          <EmptyState
            icon={tab === 'saved' ? 'bookmark-outline' : 'images-outline'}
            title={tab === 'saved' ? 'Nothing saved yet' : `No ${tab === 'vibes' ? 'vibes' : tab} yet`}
            subtitle={isOwn ? 'Use the + tab to publish your first one.' : undefined}
          />
        )
      }
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 30).duration(220)} style={{ width: cell }}>
          <Pressable
            onPress={() => openItem(item)}
            style={[styles.cell, { backgroundColor: theme.surfaceAlt, height: cell }]}
            accessibilityRole="button"
            accessibilityLabel="Open content"
          >
            <Media uri={item.uri} style={StyleSheet.absoluteFill as object} />
            {item.badge && (
              <View style={styles.cellBadge}>
                <Ionicons name="play" size={11} color="#fff" />
              </View>
            )}
          </Pressable>
        </Animated.View>
      )}
      />

      {optionsOpen && (
        <BottomSheet title={`@${user.username}`} onClose={() => setOptionsOpen(false)}>
          <OptionRow
            icon="flag-outline"
            label="Report account"
            danger
            onPress={() => {
              setOptionsOpen(false);
              submitReport({
                targetType: 'user',
                targetId: user.id,
                targetLabel: `@${user.username}`,
                reason: 'Something else',
                details: 'Reported from the profile screen.',
              });
              toast.show('Report submitted for review', 'flag');
            }}
          />
          <OptionRow
            icon={mutedByMe ? 'volume-high-outline' : 'volume-mute-outline'}
            label={mutedByMe ? 'Unmute account' : 'Mute account'}
            onPress={() => {
              setOptionsOpen(false);
              if (mutedByMe) { unmuteUser(user.id); toast.show('Account unmuted'); }
              else { muteUser(user.id); toast.show('Account muted', 'volume-mute'); }
            }}
          />
          <OptionRow
            icon={blockedByMe ? 'lock-open-outline' : 'ban-outline'}
            label={blockedByMe ? 'Unblock account' : 'Block account'}
            danger={!blockedByMe}
            onPress={() => {
              setOptionsOpen(false);
              if (blockedByMe) { unblockUser(user.id); toast.show('Account unblocked'); }
              else { blockUser(user.id); toast.show('Account blocked', 'ban'); }
            }}
          />
        </BottomSheet>
      )}
    </>
  );
};

const OptionRow: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
}> = ({ icon, label, onPress, danger }) => {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={optionStyles.row}>
      <Ionicons name={icon} size={20} color={danger ? theme.danger : theme.text} />
      <Text style={{ color: danger ? theme.danger : theme.text, fontSize: 15, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
};

const optionStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
});

const useWindowDimensionsSafe = () => {
  const { width } = useWindowDimensions();
  return { width };
};

/* eslint-disable @typescript-eslint/no-unused-vars */
const _unusedHelper = useWindowDimensionsSafe;

const StatBlock: React.FC<{ value: string; label: string; onPress?: () => void }> = ({ value, label, onPress }) => {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center' }} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>{value}</Text>
      <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 2 }}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row', marginTop: 14, borderRadius: 20, borderWidth: 1, paddingVertical: 14,
  },
  notice: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, padding: 12,
    borderRadius: 16, borderWidth: 1,
  },
  cell: { borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cellBadge: {
    position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(8,6,20,0.55)',
    borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4,
  },
});

import React, { useMemo } from 'react';
import { SectionList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { radii, spacing } from '../../lib/theme';
import { timeAgo } from '../../lib/format';
import { Routes } from '../../lib/routes';
import { AppHeader } from '../../components/Screen';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/UI';
import type { AppNotification, NotificationType } from '../../lib/types';

const META: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; tint: string; describe: (n: AppNotification, actor?: string) => string }> = {
  follow: { icon: 'person-add', tint: '#6C4CF1', describe: (_n, actor) => `${actor} started following you` },
  like: { icon: 'spark', tint: '#FF5C7A', describe: (_n, actor) => `${actor} liked your post` },
  comment: { icon: 'chatbubble-dots', tint: '#A84CF1', describe: (n, actor) => `${actor} commented: ${n.text ?? ''}` },
  share: { icon: 'paper-plane', tint: '#2BE0C8', describe: (_n, actor) => `${actor} shared your post` },
  mention: { icon: 'at', tint: '#4C8CF1', describe: (_n, actor) => `${actor} mentioned you` },
  story_view: { icon: 'eye', tint: '#FFC24C', describe: (_n, actor) => `${actor} viewed your story` },
  system: { icon: 'shield-checkmark', tint: '#6F688C', describe: (n) => n.text ?? 'Update from VibeConnect' },
  monetization: { icon: 'diamond', tint: '#3DDC97', describe: (n) => n.text ?? 'Creator monetization update' },
  wallet: { icon: 'wallet', tint: '#FFC24C', describe: (n) => n.text ?? 'Wallet update' },
};

export function NotificationsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { me, db: store, version } = useApp();

  const sections = useMemo(() => {
    if (!me || !store) return [];
    const items = db.notificationsFor(me.id);
    const now = Date.now();
    const day = 24 * 3600 * 1000;
    const today = items.filter((n) => now - n.createdAt < day);
    const week = items.filter((n) => now - n.createdAt >= day && now - n.createdAt < 7 * day);
    const earlier = items.filter((n) => now - n.createdAt >= 7 * day);
    return [
      { title: 'Today', data: today },
      { title: 'This week', data: week },
      { title: 'Earlier', data: earlier },
    ].filter((s) => s.data.length > 0);
  }, [me, store, version]);

  if (!me || !store) return null;
  const unread = db.unreadNotificationCount(me.id);

  const open = (n: AppNotification) => {
    const actor = db.userById(n.actorId);
    if (n.type === 'follow') {
      if (actor) navigation.navigate(Routes.UserProfile, { id: actor.id });
      return;
    }
    if ((n.type === 'like' || n.type === 'comment' || n.type === 'share' || n.type === 'mention') && n.entityId) {
      const post = store.posts.find((p) => p.id === n.entityId);
      if (post) {
        if (post.type === 'short') navigation.navigate(Routes.Shorts, { startId: post.id });
        else if (post.type === 'video') navigation.navigate(Routes.VideoDetail, { id: post.id });
        else navigation.navigate(Routes.PostDetail, { id: post.id });
      }
      return;
    }
    if (n.type === 'monetization') navigation.navigate(Routes.Studio);
    if (n.type === 'wallet') navigation.navigate(Routes.Wallet);
    if (n.type === 'story_view') navigation.navigate(Routes.Profile);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader
        title="Notifications"
        subtitle={unread ? `${unread} new` : 'All caught up'}
        right={
          <Pressable onPress={() => db.markNotificationsRead(me.id)} hitSlop={8}>
            <Text style={{ color: theme.brand, fontWeight: '800', fontSize: 13 }}>Read all</Text>
          </Pressable>
        }
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={<EmptyState icon="notifications-off-outline" title="No notifications yet" subtitle="Likes, comments, follows and wallet updates land here." />}
        renderSectionHeader={({ section }) => (
          <Text style={{ color: theme.textFaint, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10, marginTop: 6 }}>
            {section.title}
          </Text>
        )}
        renderItem={({ item, index }) => {
          const meta = META[item.type];
          const actor = db.userById(item.actorId);
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 30)}>
              <Pressable
                onPress={() => open(item)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: pressed ? theme.surfaceAlt : item.read ? 'transparent' : theme.dark ? 'rgba(155,123,255,0.08)' : 'rgba(108,76,241,0.05)',
                    borderColor: theme.divider,
                  },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: theme.dark ? `${meta.tint}22` : `${meta.tint}18` }]}>
                  <Ionicons name={meta.icon} size={17} color={meta.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20, fontWeight: item.read ? '500' : '700' }}>
                    {meta.describe(item, actor ? `@${actor.username}` : 'Someone')}
                  </Text>
                  <Text style={{ color: theme.textFaint, fontSize: 12, marginTop: 3 }}>{timeAgo(item.createdAt)}</Text>
                </View>
                {actor ? <Avatar uri={actor.avatar} name={actor.displayName} size={38} onPress={() => navigation.navigate(Routes.UserProfile, { id: actor.id })} /> : null}
                {!item.read ? <View style={[styles.dot, { backgroundColor: theme.brand }]} /> : null}
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  iconWrap: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

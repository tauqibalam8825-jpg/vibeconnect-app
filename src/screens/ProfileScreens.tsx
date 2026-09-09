import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { userById } from '../store/selectors';
import { ProfileView } from '../components/ProfileView';
import { Avatar, Button, DemoTag, EmptyState, IconBtn, Logo } from '../components/ui';
import { fmtCount, timeAgo } from '../lib/format';
import type { Nav } from '../navigation/types';

/* ------------------------------------------------------------- my profile */

export const ProfileScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { me } = useStore();

  if (!me) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + 40 }}>
        <EmptyState icon="person-outline" title="Not signed in" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <ProfileView
        userId={me.id}
        nav={nav}
        isOwn
        header={
          <View style={styles.topBar}>
            <Logo size={28} />
            <View style={{ flexDirection: 'row', gap: 2 }}>
              <IconBtn name="notifications-outline" accessibilityLabel="Notifications" onPress={() => nav.navigate('Notifications')} />
              <IconBtn name="settings-outline" accessibilityLabel="Settings" onPress={() => nav.navigate('Settings')} />
            </View>
          </View>
        }
      />
    </View>
  );
};

/* -------------------------------------------------------- other's profile */

export const UserProfileScreen: React.FC<{ nav: Nav; userId: string }> = ({ nav, userId }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { me } = useStore();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
        <IconBtn name="chevron-back" accessibilityLabel="Go back" onPress={() => nav.goBack()} />
      </View>
      <ProfileView userId={userId} nav={nav} isOwn={userId === me?.id} />
    </View>
  );
};

/* ------------------------------------------------------ followers/following */

export const ListScreen: React.FC<{ nav: Nav; userId: string; type: 'followers' | 'following' }> = ({
  nav, userId, type,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, me, toggleFollow } = useStore();

  const users = useMemo(() => {
    const rel = state.follows.filter((f) =>
      type === 'followers' ? f.followeeId === userId : f.followerId === userId
    );
    const ids = rel.map((f) => (type === 'followers' ? f.followerId : f.followeeId));
    return ids
      .map((id) => userById(state, id))
      .filter((u): u is NonNullable<typeof u> => !!u);
  }, [state, userId, type]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={styles.rowBar}>
        <IconBtn name="chevron-back" accessibilityLabel="Go back" onPress={() => nav.goBack()} />
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>
          {type === 'followers' ? 'Followers' : 'Following'} · {users.length}
        </Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 60 }}
        ListEmptyComponent={<EmptyState icon="people-outline" title="Nothing here yet" />}
        renderItem={({ item }) => {
          const isMe = item.id === me?.id;
          const following = me ? state.follows.some((f) => f.followerId === me.id && f.followeeId === item.id) : false;
          return (
            <Pressable
              onPress={() => nav.navigate('UserProfile', { userId: item.id })}
              style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.username}`}
            >
              <Avatar uri={item.avatar} name={item.displayName} size={44} online={item.online} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{item.displayName}</Text>
                  {item.verified && <Ionicons name="checkmark-circle" size={13} color={theme.primary} />}
                  {item.isDemo && <DemoTag />}
                </View>
                <Text style={{ color: theme.textFaint, fontSize: 12.5 }} numberOfLines={1}>@{item.username}</Text>
              </View>
              {!isMe && (
                <Button
                  title={following ? 'Following' : 'Follow'}
                  size="sm"
                  variant={following ? 'secondary' : 'primary'}
                  onPress={() => toggleFollow(item.id)}
                />
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
};

/* ------------------------------------------------------------ notifications */

export const NotificationsScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, me, markNotificationsRead } = useStore();

  const list = useMemo(
    () => state.notifications.filter((n) => n.userId === me?.id).sort((a, b) => b.at - a.at),
    [state.notifications, me?.id]
  );
  const unread = list.filter((n) => !n.read).length;

  const iconFor = (type: string): React.ComponentProps<typeof Ionicons>['name'] => {
    switch (type) {
      case 'follow': return 'person-add';
      case 'like': return 'heart';
      case 'comment': return 'chatbubble';
      case 'share': return 'paper-plane';
      case 'message': return 'mail';
      case 'story_reply': return 'sparkles';
      case 'gift': return 'gift';
      case 'wallet': return 'wallet';
      default: return 'notifications';
    }
  };

  const open = (n: (typeof list)[number]) => {
    if (n.targetKind === 'profile' && n.targetId) nav.navigate('UserProfile', { userId: n.targetId });
    else if (n.targetKind === 'post' && n.targetId) nav.navigate('PostDetail', { postId: n.targetId });
    else if (n.targetKind === 'chat' && n.targetId) nav.navigate('Chat', { convoId: n.targetId });
    else if (n.targetKind === 'video' && n.targetId) nav.navigate('VideoDetail', { videoId: n.targetId });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={[styles.rowBar, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <IconBtn name="chevron-back" accessibilityLabel="Go back" onPress={() => nav.goBack()} />
          <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>Notifications</Text>
        </View>
        {unread > 0 && <Button title={`Mark all read (${unread})`} size="sm" variant="ghost" onPress={markNotificationsRead} />}
      </View>

      <FlatList
        data={list}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 60 }}
        ListEmptyComponent={
          <EmptyState icon="notifications-outline" title="No notifications" subtitle="Likes, follows and replies will show up here." />
        }
        renderItem={({ item }) => {
          const actor = item.actorId ? userById(state, item.actorId) : undefined;
          return (
            <Pressable
              onPress={() => open(item)}
              style={[
                styles.note,
                {
                  backgroundColor: item.read ? theme.surface : theme.primarySoft,
                  borderColor: item.read ? theme.border : 'transparent',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${actor ? `@${actor.username} ` : 'VibeConnect '}${item.text}`}
            >
              <View style={[styles.noteIcon, { backgroundColor: theme.surface }]}>
                <Ionicons name={iconFor(item.type)} size={16} color={theme.primary} />
              </View>
              {actor ? <Avatar uri={actor.avatar} name={actor.displayName} size={34} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 13.5, lineHeight: 19 }}>
                  <Text style={{ fontWeight: '800' }}>{actor ? `@${actor.username} ` : 'VibeConnect '}</Text>
                  {item.text}
                </Text>
                <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 3 }}>
                  {timeAgo(item.at)} ago{item.isDemo ? ' · DEMO' : ''}
                </Text>
              </View>
              {!item.read && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
            </Pressable>
          );
        }}
      />
    </View>
  );
};

/* ------------------------------------------------------------------ styles */

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  rowBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, borderWidth: 1 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, borderWidth: 1 },
  noteIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

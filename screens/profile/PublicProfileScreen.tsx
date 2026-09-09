import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { gradients, radii, shadow, spacing } from '../../lib/theme';
import { formatCount } from '../../lib/format';
import { deepLinkForUser, shareContent } from '../../lib/share';
import { Routes } from '../../lib/routes';
import { Avatar } from '../../components/Avatar';
import { AppHeader } from '../../components/Screen';
import { Button, EmptyState, IconButton, Segmented, Banner } from '../../components/UI';
import { PostGrid } from '../../components/PostGrid';
import { ActionSheet, ReportSheet } from '../../components/Actions';

type Tab = 'posts' | 'shorts';

export function PublicProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { me, db: store, toast, confirm, version } = useApp();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('posts');
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const user = db.userById(route.params?.id as string);
  const isMe = me?.id === user?.id;
  const following = !!me && !!user && me.following.includes(user.id);
  const blocked = !!me && !!user && me.blocked.includes(user.id);
  const canSee = !!user && !!me && (!user.settings.privateAccount || following || isMe || me.role === 'admin');

  const posts = useMemo(() => (user && me ? db.postsByUser(user.id, me, 'photo') : []), [user, me, tab, version]);
  const shorts = useMemo(() => (user && me ? db.postsByUser(user.id, me, 'short') : []), [user, me, tab, version]);

  if (!user || !me || !store) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <AppHeader title="Profile" />
        <EmptyState icon="person-remove-outline" title="Profile unavailable" subtitle="This account may have been deleted or suspended." />
      </SafeAreaView>
    );
  }

  const list = tab === 'posts' ? posts : shorts;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader
        title={`@${user.username}`}
        right={
          <IconButton
            icon="ellipsis-horizontal"
            variant="ghost"
            onPress={() => {
              if (isMe) navigation.navigate(Routes.Settings);
              else setMenuOpen(true);
            }}
          />
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <LinearGradient colors={gradients.sunset as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cover} />
        <View style={[styles.body, { backgroundColor: theme.bg }]}>
          <View style={styles.headRow}>
            <Avatar uri={user.avatar} name={user.displayName} size={92} />
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: theme.text }]}>{formatCount(db.followerCount(user))}</Text>
                <Text style={[styles.statLabel, { color: theme.textFaint }]}>Followers</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: theme.text }]}>{formatCount(db.followingCount(user))}</Text>
                <Text style={[styles.statLabel, { color: theme.textFaint }]}>Following</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: theme.text }]}>{formatCount(db.creatorViews(user.id))}</Text>
                <Text style={[styles.statLabel, { color: theme.textFaint }]}>Views</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.displayName, { color: theme.text }]}>{user.displayName}</Text>
              {user.verified ? <Ionicons name="checkmark-circle" size={17} color={theme.brand} /> : null}
              {user.isCreator ? (
                <View style={[styles.tag, { backgroundColor: theme.dark ? `${theme.accent}22` : `${theme.accent}18` }]}>
                  <Text style={{ color: theme.accent, fontSize: 10.5, fontWeight: '800' }}>CREATOR</Text>
                </View>
              ) : null}
              {user.suspended ? (
                <View style={[styles.tag, { backgroundColor: `${theme.danger}1F` }]}>
                  <Text style={{ color: theme.danger, fontSize: 10.5, fontWeight: '800' }}>SUSPENDED</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color: theme.textFaint, fontSize: 14 }}>@{user.username} \u00b7 {user.category}</Text>
            {user.bio ? <Text style={{ color: theme.text, fontSize: 14.5, lineHeight: 21, marginTop: 8 }}>{user.bio}</Text> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
              {user.location ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="location-outline" size={14} color={theme.textFaint} />
                  <Text style={{ color: theme.textFaint, fontSize: 13 }}>{user.location}</Text>
                </View>
              ) : null}
              {user.website ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="link-outline" size={14} color={theme.brand} />
                  <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '600' }}>{user.website.replace(/^https?:\/\//, '')}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {!isMe ? (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.lg }}>
              <Button
                label={following ? 'Following' : user.settings.privateAccount ? 'Request to follow' : 'Follow'}
                variant={following ? 'secondary' : 'primary'}
                size="sm"
                onPress={async () => {
                  if (!following && user.settings.privateAccount) {
                    const ok = await confirm({ title: `Request to follow @${user.username}?`, message: 'They will approve or decline your request.', confirmLabel: 'Send request' });
                    if (!ok) return;
                  }
                  const now = db.toggleFollow(user.id);
                  toast(now ? `Following @${user.username}` : `Unfollowed @${user.username}`);
                }}
                style={{ flex: 1.4 }}
              />
              <Button
                label="Message"
                variant="secondary"
                size="sm"
                icon="paper-plane-outline"
                onPress={() => {
                  const allowed = db.canMessage(me, user);
                  if (!allowed.ok) {
                    toast(allowed.reason ?? 'Cannot message this account');
                    return;
                  }
                  db.findOrCreateConversation(me.id, user.id);
                  navigation.navigate(Routes.Chat, { userId: user.id });
                }}
                style={{ flex: 1 }}
              />
              <IconButton
                icon="share-outline"
                onPress={async () => {
                  const r = await shareContent(user.displayName, `Follow @${user.username} on VibeConnect`, deepLinkForUser(user.username));
                  if (r === 'copied') toast('Profile link copied');
                }}
              />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.lg }}>
              <Button label="Edit profile" variant="secondary" size="sm" onPress={() => navigation.navigate(Routes.EditProfile)} style={{ flex: 1 }} />
              <Button label="Creator studio" variant="secondary" size="sm" icon="stats-chart-outline" onPress={() => navigation.navigate(Routes.Studio)} style={{ flex: 1 }} />
            </View>
          )}

          <View style={{ marginTop: spacing.lg }}>
            <Segmented<Tab>
              value={tab}
              onChange={setTab}
              options={[
                { value: 'posts', label: 'Posts', icon: 'grid-outline' },
                { value: 'shorts', label: 'Shorts', icon: 'flash-outline' },
              ]}
            />
          </View>

          <View style={{ marginTop: spacing.lg }}>
            {!canSee ? (
              <View>
                <Banner text={`@${user.username} keeps their vibe private. Follow to see their posts and shorts.`} icon="lock-closed-outline" />
                <EmptyState icon="lock-closed-outline" title="Private account" subtitle="You will see their content once they accept your follow." />
              </View>
            ) : blocked ? (
              <EmptyState icon="ban-outline" title="You blocked this account" subtitle="Unblock them from Settings \u2192 Blocked accounts to see their content again." actionLabel="Manage blocked accounts" onAction={() => navigation.navigate(Routes.Blocked)} />
            ) : list.length > 0 ? (
              <PostGrid posts={list} columns={width >= 700 ? 4 : 3} />
            ) : (
              <EmptyState icon="images-outline" title={tab === 'shorts' ? 'No shorts yet' : 'No posts yet'} subtitle={`@${user.username} has not published here yet.`} />
            )}
          </View>
        </View>
      </ScrollView>

      <ActionSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={`@${user.username}`}
        actions={[
          { label: 'Copy profile link', icon: 'link-outline', onPress: async () => { await shareContent(user.displayName, deepLinkForUser(user.username), deepLinkForUser(user.username)); toast('Link copied'); } },
          { label: 'Report account', icon: 'flag-outline', destructive: true, onPress: () => setReportOpen(true) },
          {
            label: blocked ? 'Unblock account' : 'Block account',
            icon: blocked ? 'lock-open-outline' : 'ban-outline',
            destructive: !blocked,
            onPress: async () => {
              if (blocked) {
                db.unblockUser(user.id);
                toast('Account unblocked');
                return;
              }
              const ok = await confirm({ title: `Block @${user.username}?`, message: 'They will not be able to see your profile, posts or message you.', confirmLabel: 'Block', destructive: true });
              if (ok) {
                db.blockUser(user.id);
                toast('Account blocked');
              }
            },
          },
        ]}
      />
      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} targetType="user" targetId={user.id} targetLabel={`@${user.username}`} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cover: { height: 110, opacity: 0.9 },
  body: { marginTop: -30, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.lg },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 6 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  displayName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
});

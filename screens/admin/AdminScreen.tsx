import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { radii, spacing } from '../../lib/theme';
import { formatCount, formatDateTime, timeAgo } from '../../lib/format';
import { Routes } from '../../lib/routes';
import { AppHeader } from '../../components/Screen';
import { Avatar } from '../../components/Avatar';
import { BarList } from '../../components/Charts';
import { Banner, Button, Card, Chip, EmptyState, SectionTitle, Segmented, StatTile } from '../../components/UI';
import { UserRow } from '../../components/Actions';

type Tab = 'queue' | 'users' | 'content' | 'analytics';

export function AdminScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { me, db: store, toast, confirm, version } = useApp();
  const [tab, setTab] = useState<Tab>('queue');
  const [userQuery, setUserQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'open' | 'all'>('open');

  const stats = useMemo(() => (db.isAdmin() ? db.adminStats() : null), [version]);
  const reports = useMemo(() => (db.isAdmin() ? db.reportsFor() : []), [version]);
  const users = useMemo(() => {
    if (!store) return [];
    const q = userQuery.trim().toLowerCase();
    return store.users.filter((u) => !q || u.username.includes(q) || u.displayName.toLowerCase().includes(q));
  }, [store, userQuery, version]);
  const content = useMemo(() => (store ? [...store.posts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 40) : []), [store, version]);

  if (!me || !store || !stats || !db.isAdmin()) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
        <AppHeader title="Admin" />
        <EmptyState icon="shield-half-outline" title="Admins only" subtitle="This panel requires a moderator or admin role. Sign in with @admin to explore it." actionLabel="Back to settings" onAction={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const visibleReports = statusFilter === 'open' ? reports.filter((r) => r.status === 'open' || r.status === 'reviewing') : reports;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="Admin panel" subtitle={`Signed in as @${me.username} \u00b7 ${me.role}`} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile label="Users" value={formatCount(stats.users)} icon="people-outline" />
          <StatTile label="Active today" value={formatCount(stats.activeToday)} icon="pulse-outline" tint={theme.accent} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <StatTile label="Open reports" value={formatCount(stats.openReports)} icon="flag-outline" tint={theme.danger} />
          <StatTile label="Hidden posts" value={formatCount(stats.hiddenPosts)} icon="eye-off-outline" tint={theme.warning} />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'queue', label: 'Queue', icon: 'flag' },
              { value: 'users', label: 'Users', icon: 'people' },
              { value: 'content', label: 'Content', icon: 'albums' },
              { value: 'analytics', label: 'Analytics', icon: 'bar-chart' },
            ]}
          />
        </View>

        {tab === 'queue' ? (
          <View style={{ marginTop: spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
              <Chip label={`Needs review (${stats.openReports + stats.reviewReports})`} active={statusFilter === 'open'} onPress={() => setStatusFilter('open')} />
              <Chip label="All reports" active={statusFilter === 'all'} onPress={() => setStatusFilter('all')} />
            </View>
            {visibleReports.length === 0 ? (
              <EmptyState icon="checkmark-done-outline" title="Queue is clear" subtitle="New reports from the community appear here instantly." />
            ) : (
              visibleReports.map((report, index) => {
                const reporter = db.userById(report.reporterId);
                const targetUser = report.targetType === 'user' ? db.userById(report.targetId) : undefined;
                const targetPost = report.targetType === 'post' || report.targetType === 'video' ? store.posts.find((p) => p.id === report.targetId) : undefined;
                const targetLabel = targetUser ? `@${targetUser.username}` : (targetPost?.caption ?? 'content').slice(0, 70);
                return (
                  <Animated.View key={report.id} entering={FadeInDown.delay(Math.min(index, 6) * 40)}>
                    <Card style={{ marginBottom: spacing.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <View style={[styles.tag, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                          <Text style={{ color: theme.brand, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>{report.targetType}</Text>
                        </View>
                        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14, flex: 1 }}>{report.reason}</Text>
                        <View style={[styles.statusPill, { backgroundColor: report.status === 'open' ? `${theme.danger}1A` : report.status === 'reviewing' ? `${theme.warning}1A` : `${theme.success}1A` }]}>
                          <Text style={{ color: report.status === 'open' ? theme.danger : report.status === 'reviewing' ? theme.warning : theme.success, fontSize: 10.5, fontWeight: '900' }}>
                            {report.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
                        Target: {targetLabel}
                      </Text>
                      {report.note ? (
                        <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 6, fontStyle: 'italic' }}>\u201c{report.note}\u201d</Text>
                      ) : null}
                      <Text style={{ color: theme.textFaint, fontSize: 12, marginTop: 8 }}>
                        Reported by @{reporter?.username ?? 'unknown'} \u00b7 {timeAgo(report.createdAt)}
                      </Text>
                      {report.resolution ? (
                        <Text style={{ color: theme.success, fontSize: 12.5, marginTop: 8, lineHeight: 18 }}>{report.resolution}</Text>
                      ) : null}
                      {report.status === 'open' || report.status === 'reviewing' ? (
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                          <Button label="Take action" size="sm" onPress={() => db.resolveReport(report.id, 'resolved', 'Reviewed and actioned by moderation.')} style={{ flex: 1 }} />
                          <Button label="Review" variant="secondary" size="sm" onPress={() => { db.resolveReport(report.id, 'reviewing'); toast('Marked as under review'); }} style={{ flex: 1 }} />
                          <Button label="Dismiss" variant="ghost" size="sm" onPress={async () => {
                              const ok = await confirm({ title: 'Dismiss this report?', message: 'No action will be taken against the reported account.', confirmLabel: 'Dismiss' });
                              if (ok) {
                                db.resolveReport(report.id, 'dismissed', 'Dismissed \u2014 no policy violation found.');
                                toast('Report dismissed');
                              }
                            }} style={{ flex: 1 }} />
                        </View>
                      ) : null}
                    </Card>
                  </Animated.View>
                );
              })
            )}
          </View>
        ) : null}

        {tab === 'users' ? (
          <View style={{ marginTop: spacing.lg }}>
            <View style={[styles.search, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Ionicons name="search" size={17} color={theme.textFaint} />
              <TextInput value={userQuery} onChangeText={setUserQuery} placeholder="Search users\u2026" placeholderTextColor={theme.textFaint} style={{ flex: 1, color: theme.text, paddingVertical: 10, outlineStyle: 'none' } as any} />
            </View>
            {users.map((user) => (
              <View key={user.id} style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider, paddingBottom: 8 }}>
                <UserRow user={user} onPress={() => navigation.navigate(Routes.UserProfile, { id: user.id })} />
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingLeft: 58, paddingBottom: 10 }}>
                  <Chip label={user.suspended ? 'Restore' : 'Suspend'} active={user.suspended} icon={user.suspended ? 'checkmark-circle-outline' : 'ban-outline'} onPress={() => { db.setSuspended(user.id, !user.suspended); toast(user.suspended ? 'Account restored' : 'Account suspended'); }} />
                  <Chip label={user.verified ? 'Unverify' : 'Verify'} active={user.verified} icon="checkmark-done-outline" onPress={() => { db.setVerified(user.id, !user.verified); toast(user.verified ? 'Verification removed' : 'Account verified'); }} />
                  <Chip label={user.role === 'moderator' ? 'Remove mod' : 'Make moderator'} icon="shield-half-outline" onPress={() => { db.setRole(user.id, user.role === 'moderator' ? 'user' : 'moderator'); toast('Role updated'); }} />
                  <Chip label={user.monetization.status === 'approved' ? 'Revoke creator' : 'Approve creator'} active={user.monetization.status === 'approved'} icon="diamond-outline" onPress={() => { db.decideMonetization(user.id, user.monetization.status === 'approved' ? 'rejected' : 'approved', 'Decided from the admin panel.'); toast('Monetization status updated'); }} />
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {tab === 'content' ? (
          <View style={{ marginTop: spacing.lg }}>
            <Banner text={`${stats.hiddenPosts} post(s) hidden. Hidden posts stay in the database for appeals but disappear from every feed.`} icon="eye-off-outline" />
            {content.map((post) => {
              const author = db.userById(post.authorId);
              return (
                <Pressable key={post.id} onPress={() => navigation.navigate(post.type === 'video' ? Routes.VideoDetail : Routes.PostDetail, { id: post.id })}>
                  <View style={[styles.contentRow, { borderColor: theme.divider, opacity: post.hidden ? 0.6 : 1 }]}>
                    <Avatar uri={author?.avatar} name={author?.displayName ?? '?'} size={38} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13.5 }}>{author?.username}</Text>
                        <Text style={{ color: theme.textFaint, fontSize: 11.5 }}>\u00b7 {post.type}</Text>
                        {post.reports.length > 0 ? (
                          <View style={[styles.statusPill, { backgroundColor: `${theme.danger}1A` }]}>
                            <Text style={{ color: theme.danger, fontSize: 10, fontWeight: '900' }}>{post.reports.length} REPORTS</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text numberOfLines={2} style={{ color: theme.textMuted, fontSize: 13, marginTop: 3, lineHeight: 18 }}>{post.caption}</Text>
                      <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 4 }}>{formatCount(post.views)} views \u00b7 {formatDateTime(post.createdAt)}</Text>
                    </View>
                    <Button
                      label={post.hidden ? 'Restore' : 'Hide'}
                      variant={post.hidden ? 'secondary' : 'ghost'}
                      size="sm"
                      full={false}
                      onPress={() => {
                        db.togglePostHidden(post.id);
                        toast(post.hidden ? 'Post restored' : 'Post hidden');
                      }}
                      style={{ width: 86 }}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {tab === 'analytics' ? (
          <View style={{ marginTop: spacing.lg }}>
            <Card>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: spacing.md }}>Platform health</Text>
              <BarList
                data={[
                  { label: 'Posts', value: stats.posts },
                  { label: 'Media objects', value: stats.media },
                  { label: 'Messages', value: stats.messages },
                  { label: 'Accounts', value: stats.users },
                ]}
              />
            </Card>
            <Card style={{ marginTop: spacing.md }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: spacing.md }}>Moderation</Text>
              <BarList
                color={theme.warning}
                data={[
                  { label: 'Open', value: stats.openReports },
                  { label: 'In review', value: stats.reviewReports },
                  { label: 'Suspended accounts', value: stats.suspended },
                  { label: 'Hidden content', value: stats.hiddenPosts },
                ]}
              />
            </Card>
            <Card style={{ marginTop: spacing.md }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: spacing.md }}>Monetization</Text>
              <BarList
                color={theme.success}
                data={[
                  { label: 'Creator applications pending', value: stats.creatorApps },
                  { label: 'Payout volume (USD)', value: Math.round(stats.payoutVolume) },
                ]}
                unit=""
              />
              <Text style={{ color: theme.textFaint, fontSize: 12, marginTop: 12, lineHeight: 17 }}>
                Approve or revoke creator access from the Users tab. Every decision notifies the account and is written to the ledger.
              </Text>
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.md },
  contentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});

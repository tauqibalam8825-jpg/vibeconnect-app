import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { moderatorSummary, userById } from '../store/selectors';
import { Avatar, Button, Card, Chip, DemoTag, EmptyState, IconBtn, SectionTitle, Stat } from '../components/ui';
import { Media } from '../components/Media';
import { MODERATION_LABELS } from '../lib/validate';
import { fmtCount, timeAgo } from '../lib/format';
import type { Nav } from '../navigation/types';

type Tab = 'overview' | 'users' | 'content' | 'reports';

/**
 * Admin panel. Role-guarded in the store (every mutation re-checks the admin
 * role) and in the UI. Wire to an RBAC-protected API in production.
 */
export const AdminScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, me, adminSetSuspended, adminSetReport, adminRemoveContent } = useStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [reportFilter, setReportFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const summary = useMemo(() => moderatorSummary(state), [state]);

  if (!me || me.role !== 'admin') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + 20 }}>
        <View style={{ paddingHorizontal: 8 }}>
          <IconBtn name="chevron-back" accessibilityLabel="Go back" onPress={() => nav.goBack()} />
        </View>
        <EmptyState
          icon="lock-closed-outline"
          title="Not authorised"
          subtitle="The admin panel is restricted to platform moderators. Sign in with the demo admin account to inspect it."
        />
      </View>
    );
  }

  const content = [
    ...state.posts.map((p) => ({ id: p.id, kind: 'post' as const, authorId: p.authorId, label: p.caption.slice(0, 46) || 'Photo post', thumb: p.thumb ?? p.uri, at: p.at, views: p.views, removed: !!p.removed, isDemo: p.isDemo })),
    ...state.shorts.map((s) => ({ id: s.id, kind: 'short' as const, authorId: s.authorId, label: s.caption.slice(0, 46) || 'Short video', thumb: s.poster, at: s.at, views: s.views, removed: !!s.removed, isDemo: s.isDemo })),
    ...state.videos.map((v) => ({ id: v.id, kind: 'video' as const, authorId: v.authorId, label: v.title, thumb: v.thumb, at: v.at, views: v.views, removed: !!v.removed, isDemo: v.isDemo })),
  ].sort((a, b) => b.at - a.at);

  const reports = state.reports
    .filter((r) => (reportFilter === 'all' ? true : reportFilter === 'open' ? r.status === 'open' || r.status === 'reviewing' : r.status === 'resolved' || r.status === 'dismissed'))
    .sort((a, b) => b.at - a.at);

  const topContent = [...content].sort((a, b) => b.views - a.views).slice(0, 5);
  const maxViews = Math.max(1, ...topContent.map((c) => c.views));

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={styles.bar}>
        <IconBtn name="chevron-back" accessibilityLabel="Go back" onPress={() => nav.goBack()} />
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>Admin panel</Text>
        <View style={styles.secureTag}>
          <Ionicons name="lock-closed" size={11} color={theme.success} />
          <Text style={{ color: theme.success, fontSize: 10.5, fontWeight: '800' }}>SECURE</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(['overview', 'users', 'content', 'reports'] as Tab[]).map((t) => (
            <Chip
              key={t}
              label={t === 'overview' ? 'Analytics' : t === 'content' ? 'Content' : t[0].toUpperCase() + t.slice(1)}
              active={tab === t}
              onPress={() => setTab(t)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {tab === 'overview' && (
          <>
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row' }}>
                <Stat value={summary.users} label="Total users" />
                <Stat value={summary.activeUsers} label="Active" />
                <Stat value={summary.suspended} label="Suspended" />
              </View>
              <View style={[styles.hr, { backgroundColor: theme.border }]} />
              <View style={{ flexDirection: 'row' }}>
                <Stat value={summary.posts} label="Content" />
                <Stat value={summary.open} label="Open reports" />
                <Stat value={summary.resolved} label="Actioned" />
              </View>
            </Card>

            <SectionTitle title="Platform content" />
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row' }}>
                <Stat value={state.posts.length} label="Posts" />
                <Stat value={state.shorts.length} label="Vibes" />
                <Stat value={state.videos.length} label="Videos" />
              </View>
              <View style={[styles.hr, { backgroundColor: theme.border }]} />
              <View style={{ flexDirection: 'row' }}>
                <Stat value={fmtCount(content.reduce((n, c) => n + c.views, 0))} label="Total views" />
                <Stat value={state.comments.length} label="Comments" />
                <Stat value={state.messages.length} label="Messages" />
              </View>
            </Card>

            <SectionTitle title="Top content" />
            {topContent.map((c) => (
              <View key={c.id} style={[styles.topRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Media uri={c.thumb} style={{ width: 44, height: 44, borderRadius: 12 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
                    {c.label}
                  </Text>
                  <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
                    <View style={[styles.fill, { width: `${Math.round((c.views / maxViews) * 100)}%`, backgroundColor: theme.primary }]} />
                  </View>
                </View>
                <Text style={{ color: theme.textFaint, fontSize: 11.5, marginLeft: 8 }}>{fmtCount(c.views)}</Text>
              </View>
            ))}
          </>
        )}

        {tab === 'users' && (
          <>
            <SectionTitle title={`Users · ${state.users.length}`} />
            {state.users.map((u, i) => (
              <Animated.View key={u.id} entering={FadeInDown.delay(Math.min(i, 8) * 30).duration(220)}>
                <View style={[styles.userRow, { backgroundColor: u.suspended ? (theme.mode === 'dark' ? '#2A1420' : '#FDECEF') : theme.surface, borderColor: theme.border }]}>
                  <Avatar uri={u.avatar} name={u.displayName} size={40} />
                  <Pressable
                    style={{ flex: 1, marginLeft: 10 }}
                    onPress={() => nav.navigate('UserProfile', { userId: u.id })}
                    accessibilityRole="button"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13.5 }}>{u.displayName}</Text>
                      {u.role === 'admin' && <Ionicons name="shield-checkmark" size={12} color={theme.primary} />}
                      {u.isDemo && <DemoTag />}
                    </View>
                    <Text style={{ color: theme.textFaint, fontSize: 11.5 }}>
                      @{u.username} · {fmtCount(state.follows.filter((f) => f.followeeId === u.id).length)} followers
                      {u.suspended ? ' · SUSPENDED' : ''}
                    </Text>
                  </Pressable>
                  {u.role !== 'admin' && (
                    <Button
                      title={u.suspended ? 'Restore' : 'Suspend'}
                      size="sm"
                      variant={u.suspended ? 'secondary' : 'danger'}
                      onPress={() => adminSetSuspended(u.id, !u.suspended)}
                    />
                  )}
                </View>
              </Animated.View>
            ))}
          </>
        )}

        {tab === 'content' && (
          <>
            <SectionTitle title={`All content · ${content.length}`} />
            {content.map((c, i) => (
              <Animated.View key={c.id} entering={FadeInDown.delay(Math.min(i, 8) * 30).duration(220)}>
                <View style={[styles.userRow, { backgroundColor: c.removed ? theme.surfaceAlt : theme.surface, borderColor: theme.border }]}>
                  <Media uri={c.thumb} style={{ width: 44, height: 44, borderRadius: 12 }} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
                      {c.label || '(untitled)'}
                    </Text>
                    <Text style={{ color: theme.textFaint, fontSize: 11.5 }}>
                      {c.kind.toUpperCase()} · @{userById(state, c.authorId)?.username} · {fmtCount(c.views)} views
                      {c.removed ? ' · HIDDEN' : ''}
                    </Text>
                  </View>
                  <Button
                    title={c.removed ? 'Restore' : 'Hide'}
                    size="sm"
                    variant={c.removed ? 'secondary' : 'danger'}
                    onPress={() => adminRemoveContent(c.kind, c.id, !c.removed)}
                  />
                </View>
              </Animated.View>
            ))}
          </>
        )}

        {tab === 'reports' && (
          <>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              <Chip label="All" active={reportFilter === 'all'} onPress={() => setReportFilter('all')} />
              <Chip label="Open" active={reportFilter === 'open'} onPress={() => setReportFilter('open')} />
              <Chip label="Resolved" active={reportFilter === 'resolved'} onPress={() => setReportFilter('resolved')} />
            </View>
            {reports.length === 0 ? (
              <EmptyState icon="flag-outline" title="No reports in this view" subtitle="The queue is clear." />
            ) : (
              reports.map((r, i) => {
                const reporter = userById(state, r.reporterId);
                return (
                  <Animated.View key={r.id} entering={FadeInDown.delay(Math.min(i, 8) * 30).duration(220)}>
                    <Card style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Ionicons name="flag" size={15} color={theme.danger} />
                        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>
                          {MODERATION_LABELS[r.reason] ?? r.reason}
                        </Text>
                        <View style={{ flex: 1 }} />
                        <Chip
                          label={r.status}
                          active={r.status === 'open'}
                          onPress={() => adminSetReport(r.id, r.status === 'open' ? 'reviewing' : 'open')}
                        />
                      </View>
                      <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '600' }}>{r.targetLabel}</Text>
                      <Text style={{ color: theme.textDim, fontSize: 12.5, lineHeight: 18, marginTop: 5 }}>{r.details}</Text>
                      <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 8 }}>
                        Reported by @{reporter?.username ?? 'unknown'} · {timeAgo(r.at)} ago
                        {r.isDemo ? ' · DEMO' : ''}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        <Button title="Reviewing" size="sm" variant="secondary" onPress={() => adminSetReport(r.id, 'reviewing')} />
                        <Button title="Resolve" size="sm" variant="soft" onPress={() => adminSetReport(r.id, 'resolved')} />
                        <Button title="Dismiss" size="sm" variant="ghost" onPress={() => adminSetReport(r.id, 'dismissed')} />
                      </View>
                    </Card>
                  </Animated.View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  secureTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 999, backgroundColor: 'rgba(47,211,166,0.14)',
  },
  hr: { height: 1, marginVertical: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 11, borderRadius: 18, borderWidth: 1, marginBottom: 8 },
  track: { height: 5, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

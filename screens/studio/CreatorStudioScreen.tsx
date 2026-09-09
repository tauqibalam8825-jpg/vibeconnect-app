import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { gradients, radii, shadow, spacing } from '../../lib/theme';
import { formatCount, money, timeAgo } from '../../lib/format';
import { Routes } from '../../lib/routes';
import { AppHeader } from '../../components/Screen';
import { AreaChart, BarList } from '../../components/Charts';
import { Banner, Button, Card, EmptyState, SectionTitle, Segmented, StatTile } from '../../components/UI';

type Tab = 'overview' | 'content' | 'earnings';

const ELIGIBILITY = [
  { label: 'At least 100 followers', test: (followers: number) => followers >= 100 },
  { label: 'At least 1,000 lifetime views', test: (_v: number, views: number) => views >= 1000 },
  { label: 'Account in good standing', test: () => true },
  { label: 'Accepted the creator terms', test: () => true },
];

export function CreatorStudioScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { me, db: store, toast, confirm, version } = useApp();
  const [tab, setTab] = useState<Tab>('overview');

  const stats = useMemo(() => (me ? db.creatorStats(me.id) : null), [me, version]);
  const trend = useMemo(() => (me ? db.lastSevenDays(me.id) : []), [me, version]);
  const own = useMemo(() => (me ? store?.posts.filter((p) => p.authorId === me.id) ?? [] : []), [me, store, version]);
  const transactions = useMemo(() => (me ? db.transactionsFor(me.id) : []), [me, version]);

  if (!me || !store || !stats) return null;
  const status = me.monetization.status;
  const eligible = db.followerCount(me) >= 100 && stats.views >= 1000;
  const balance = db.walletBalance(me.id);
  const pending = transactions.filter((t) => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="Creator studio" subtitle={`@${me.username}`} right={<Pressable onPress={() => navigation.navigate(Routes.Wallet)}><Text style={{ color: theme.brand, fontWeight: '800', fontSize: 13 }}>Wallet</Text></Pressable>} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'overview', label: 'Overview', icon: 'analytics-outline' },
            { value: 'content', label: 'Content', icon: 'albums-outline' },
            { value: 'earnings', label: 'Earnings', icon: 'diamond-outline' },
          ]}
        />

        {tab === 'overview' ? (
          <View style={{ marginTop: spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatTile label="Views" value={formatCount(stats.views)} icon="eye-outline" />
              <StatTile label="Followers" value={formatCount(stats.followers)} icon="people-outline" tint={theme.accent} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <StatTile label="Engagement" value={`${stats.engagementRate.toFixed(1)}%`} icon="spark-outline" tint={theme.warning} />
              <StatTile label="Watch minutes" value={formatCount(stats.watchMinutes)} icon="time-outline" tint={theme.danger} />
            </View>

            <Card style={{ marginTop: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>Views \u00b7 last 7 days</Text>
                <View style={[styles.trendPill, { backgroundColor: theme.dark ? `${theme.success}22` : `${theme.success}18` }]}>
                  <Ionicons name="trending-up" size={12} color={theme.success} />
                  <Text style={{ color: theme.success, fontSize: 11.5, fontWeight: '800' }}>+18%</Text>
                </View>
              </View>
              <AreaChart data={trend.map((t) => ({ label: t.label, value: t.views }))} />
            </Card>

            <Card style={{ marginTop: spacing.md }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: spacing.md }}>Reach by day</Text>
              <BarList data={trend.slice(-4).map((t) => ({ label: t.label, value: t.views }))} unit=" views" color={theme.accent} />
            </Card>

            <Card style={{ marginTop: spacing.md }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: 6 }}>Audience snapshot</Text>
              <Row label="Posts published" value={formatCount(stats.posts)} />
              <Row label="Average views per post" value={formatCount(stats.avgViewsPerPost)} />
              <Row label="Comments received" value={formatCount(stats.comments)} />
              <Row label="Likes received" value={formatCount(stats.likes)} />
            </Card>
          </View>
        ) : null}

        {tab === 'content' ? (
          <View style={{ marginTop: spacing.lg }}>
            {own.length === 0 ? (
              <EmptyState icon="spark-outline" title="Publish something first" subtitle="Your analytics fill in as soon as people see your work." actionLabel="Create a post" onAction={() => navigation.navigate(Routes.Create)} />
            ) : (
              [...own]
                .sort((a, b) => b.views - a.views)
                .map((post) => (
                  <Pressable key={post.id} onPress={() => navigation.navigate(post.type === 'video' ? Routes.VideoDetail : post.type === 'short' ? Routes.Shorts : Routes.PostDetail, post.type === 'short' ? { startId: post.id } : { id: post.id })}>
                    <Card style={{ marginBottom: spacing.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <View style={[styles.typeTag, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                          <Ionicons
                            name={post.type === 'video' ? 'videocam' : post.type === 'short' ? 'flash' : post.type === 'text' ? 'text' : 'image'}
                            size={13}
                            color={theme.brand}
                          />
                          <Text style={{ color: theme.brand, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>{post.type}</Text>
                        </View>
                        <Text style={{ color: theme.textFaint, fontSize: 12 }}>{timeAgo(post.createdAt)}</Text>
                        {post.hidden ? (
                          <View style={[styles.typeTag, { backgroundColor: `${theme.danger}1A`, borderColor: 'transparent' }]}>
                            <Text style={{ color: theme.danger, fontSize: 10.5, fontWeight: '800' }}>HIDDEN BY MODERATION</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text numberOfLines={2} style={{ color: theme.text, fontSize: 14.5, fontWeight: '600', lineHeight: 20 }}>{post.caption}</Text>
                      <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}>
                        <Metric icon="eye-outline" value={formatCount(post.views)} />
                        <Metric icon="spark-outline" value={formatCount(post.likes.length)} />
                        <Metric icon="chatbubble-dots-outline" value={formatCount(db.commentCount(post))} />
                        <Metric icon="paper-plane-outline" value={formatCount(post.shares)} />
                      </View>
                    </Card>
                  </Pressable>
                ))
            )}
          </View>
        ) : null}

        {tab === 'earnings' ? (
          <View style={{ marginTop: spacing.lg }}>
            <LinearGradient
              colors={status === 'approved' ? (gradients.mint as unknown as string[]) : status === 'pending' ? (gradients.gold as unknown as string[]) : (gradients.brand as unknown as string[])}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.balanceCard, shadow(8, theme)]}
            >
              <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
              <Text style={styles.balanceValue}>{money(status === 'approved' ? balance : 0)}</Text>
              <Text style={styles.balanceSub}>
                {status === 'approved' ? `${money(pending)} pending \u00b7 next payout Friday` : 'Payouts unlock when your application is approved'}
              </Text>
              {status === 'approved' ? (
                <View style={{ marginTop: 14 }}>
                  <Button label="Open wallet" variant="secondary" size="sm" full={false} onPress={() => navigation.navigate(Routes.Wallet)} style={{ width: 170 }} />
                </View>
              ) : null}
            </LinearGradient>

            <Card style={{ marginTop: spacing.lg }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: 4 }}>Monetization status</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={[styles.dot, { backgroundColor: status === 'approved' ? theme.success : status === 'pending' ? theme.warning : status === 'rejected' ? theme.danger : theme.textFaint }]} />
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, textTransform: 'capitalize' }}>{status === 'none' ? 'Not applied' : status}</Text>
              </View>
              {me.monetization.note ? <Banner text={me.monetization.note} tone={status === 'rejected' ? 'danger' : 'info'} icon="document-text-outline" /> : null}
              {status === 'pending' ? <Banner text="A moderator reviews your content history and audience quality. Decisions usually arrive within 5 days and you will be notified." icon="hourglass-outline" tone="warning" /> : null}
            </Card>

            <Card style={{ marginTop: spacing.md }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: spacing.md }}>Eligibility rules</Text>
              {ELIGIBILITY.map((rule) => {
                const passed = rule.label === 'Account in good standing' ? !me.suspended : rule.label === 'Accepted the creator terms' ? status !== 'none' : rule.test(db.followerCount(me), stats.views);
                return (
                  <View key={rule.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Ionicons name={passed ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={passed ? theme.success : theme.textFaint} />
                    <Text style={{ color: passed ? theme.text : theme.textMuted, fontSize: 13.5, flex: 1 }}>{rule.label}</Text>
                  </View>
                );
              })}
              <View style={{ height: spacing.sm }} />
              <Button
                label={status === 'none' ? 'Apply for monetization' : status === 'rejected' ? 'Reapply' : 'Application submitted'}
                disabled={status === 'pending' || (!eligible && status !== 'rejected')}
                onPress={async () => {
                  const ok = await confirm({
                    title: 'Apply for creator monetization?',
                    message: 'You confirm your content follows the Community Guidelines. A moderator reviews every application.',
                    confirmLabel: 'Submit application',
                  });
                  if (!ok) return;
                  const result = db.applyForMonetization();
                  toast(result.ok ? 'Application submitted' : (result.error ?? 'Could not apply'));
                }}
              />
              {!eligible && status === 'none' ? (
                <Text style={{ color: theme.textFaint, fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                  {formatCount(Math.max(0, 100 - db.followerCount(me)))} more followers and {formatCount(Math.max(0, 1000 - stats.views))} more views to unlock the button.
                </Text>
              ) : null}
            </Card>

            <Card style={{ marginTop: spacing.md }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: spacing.md }}>Revenue streams</Text>
              {[
                { icon: 'megaphone-outline', label: 'Ad revenue share', detail: 'Share of ad revenue from Watch playback on your videos.' },
                { icon: 'heart-outline', label: 'Viewer tips', detail: 'One-off support from viewers, settled to your wallet instantly.' },
                { icon: 'people-outline', label: 'Memberships', detail: 'Phase 3 \u2014 monthly tiers with exclusive posts and stories.' },
                { icon: 'flash-outline', label: 'Shorts bonus', detail: 'Quality bonus for shorts that hold attention past 80%.' },
              ].map((stream) => (
                <View key={stream.label} style={{ flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <View style={[styles.streamIcon, { backgroundColor: theme.brandSoft }]}>
                    <Ionicons name={stream.icon as any} size={16} color={theme.brand} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{stream.label}</Text>
                    <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 2, lineHeight: 17 }}>{stream.detail}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider }}>
      <Text style={{ color: theme.textMuted, fontSize: 13.5 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

function Metric({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Ionicons name={icon} size={14} color={theme.textFaint} />
      <Text style={{ color: theme.textMuted, fontSize: 12.5, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  trendPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  typeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  balanceCard: { borderRadius: radii.xl, padding: spacing.xl },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  balanceValue: { color: '#fff', fontSize: 38, fontWeight: '900', letterSpacing: -1.2, marginTop: 8 },
  balanceSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  streamIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

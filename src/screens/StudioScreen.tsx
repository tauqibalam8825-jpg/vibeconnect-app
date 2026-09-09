import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { contentStats, statsFor, userById } from '../store/selectors';
import { Avatar, Button, Card, Chip, DemoTag, EmptyState, IconBtn, ProgressRing, SectionTitle } from '../components/ui';
import { Media } from '../components/Media';
import { fmtCount, fmtMoney, timeAgo } from '../lib/format';
import type { Nav } from '../navigation/types';

const RANGES = [
  { key: '7d', label: '7 days', ms: 7 * 86400000 },
  { key: '28d', label: '28 days', ms: 28 * 86400000 },
  { key: 'all', label: 'All time', ms: Number.MAX_SAFE_INTEGER },
];

/** Creator dashboard: performance, engagement and monetisation overview. */
export const StudioScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, me, updateProfile } = useStore();
  const [range, setRange] = useState('28d');

  const meId = me?.id ?? '';
  const stats = useMemo(() => statsFor(state, meId), [state, meId]);
  const items = useMemo(() => contentStats(state, meId), [state, meId]);
  const rangeMs = RANGES.find((r) => r.key === range)?.ms ?? Number.MAX_SAFE_INTEGER;
  const cutoff = Date.now() - rangeMs;

  const windowed = items.filter((i) => i.at >= cutoff);
  const viewsInRange = windowed.reduce((n, i) => n + i.views, 0);
  const likesInRange = windowed.reduce((n, i) => n + i.likes, 0);
  const commentsInRange = windowed.reduce((n, i) => n + i.comments, 0);
  const sharesInRange = windowed.reduce((n, i) => n + i.shares, 0);

  const walletTx = state.wallet.filter((w) => w.userId === meId && w.at >= cutoff);
  const earningsInRange = walletTx.filter((w) => w.amount > 0).reduce((n, w) => n + w.amount, 0);
  const estFromViews = (viewsInRange / 1000) * stats.estCpm;

  const maxViews = Math.max(1, ...windowed.map((i) => i.views));
  const subs = state.subscriptions.filter((s) => s.creatorId === meId && s.active);
  const eligible = !!me?.creator && stats.followers >= 0;

  const requirements = [
    { label: 'Creator mode enabled', met: !!me?.creator },
    { label: 'Account in good standing', met: !me?.suspended },
    { label: 'At least 3 published posts', met: stats.posts + stats.shorts + stats.videos >= 3 },
    { label: 'Identity verified with our provider', met: false },
  ];

  if (!me) return <EmptyState icon="person-outline" title="Sign in to open the studio" />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={styles.bar}>
        <IconBtn name="chevron-back" accessibilityLabel="Go back" onPress={() => nav.goBack()} />
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>Creator Studio</Text>
        <IconBtn name="wallet-outline" accessibilityLabel="Open wallet" onPress={() => nav.navigate('Wallet')} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 16 }}>
          <Chip label="7 days" active={range === '7d'} onPress={() => setRange('7d')} />
          <View style={{ height: 8 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
          {RANGES.map((r) => (
            <Chip key={r.key} label={r.label} active={range === r.key} onPress={() => setRange(r.key)} />
          ))}
        </View>

        <Animated.View entering={FadeInDown.duration(260)}>
          <LinearGradient
            colors={['#6A45FF', '#22D3EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar uri={me.avatar} name={me.displayName} size={46} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{me.displayName}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5 }}>
                  @{me.username} · {fmtCount(stats.followers)} followers
                </Text>
              </View>
              <ProgressRing value={Math.min(1, stats.views / 500000)} size={62} />
            </View>
            <View style={styles.heroStats}>
              <HeroStat value={fmtCount(viewsInRange)} label="Views" />
              <HeroStat value={fmtCount(likesInRange)} label="Likes" />
              <HeroStat value={fmtCount(commentsInRange)} label="Comments" />
              <HeroStat value={fmtCount(sharesInRange)} label="Shares" />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 10 }}>
              {RANGES.find((r) => r.key === range)?.label} · updated just now
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={{ marginTop: 22 }}>
          <SectionTitle title="Estimated earnings" />
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: theme.textFaint, fontSize: 12 }}>Ad-share estimate (this period)</Text>
                <Text style={{ color: theme.text, fontSize: 28, fontWeight: '800', marginTop: 4 }}>{fmtMoney(estFromViews)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: theme.textFaint, fontSize: 12 }}>Credited to wallet</Text>
                <Text style={{ color: theme.success, fontSize: 20, fontWeight: '800', marginTop: 4 }}>{fmtMoney(earningsInRange)}</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <Ionicons name="information-circle-outline" size={16} color={theme.warn} />
              <Text style={{ color: theme.textDim, fontSize: 11.5, lineHeight: 17, flex: 1 }}>
                Estimates only. Actual creator earnings depend on eligibility, platform rules, available advertising
                revenue, payment-provider fees and applicable law. Nothing here is a promise of income.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Button title="Open wallet" size="sm" icon="wallet-outline" onPress={() => nav.navigate('Wallet')} />
              <Button
                title="Payout policy"
                size="sm"
                variant="ghost"
                onPress={() => nav.navigate('Legal', { doc: 'monetization' })}
              />
            </View>
          </Card>
        </View>

        <View style={{ marginTop: 22 }}>
          <SectionTitle title="Monetisation" />
          <Card>
            <MonoRow icon="people-outline" title={`${subs.length} active subscribers`} sub="Channel memberships pay out monthly share" />
            <MonoRow icon="gift-outline" title="Gifts & tips" sub="Viewers can send one-off gifts on your content" />
            <MonoRow icon="megaphone-outline" title="Sponsored content" sub="Brand partnerships via the creator marketplace" />
            <MonoRow icon="play-circle-outline" title="Ad revenue sharing" sub="Enabled on eligible long videos and vibes" />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={{ color: theme.textFaint, fontSize: 11.5, fontWeight: '700', marginBottom: 10 }}>ELIGIBILITY</Text>
            {requirements.map((r) => (
              <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name={r.met ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={r.met ? theme.success : theme.textFaint} />
                <Text style={{ color: r.met ? theme.text : theme.textDim, fontSize: 13 }}>{r.label}</Text>
              </View>
            ))}
            {!me.creator && (
              <Button
                title="Turn on creator mode"
                size="sm"
                variant="soft"
                style={{ marginTop: 8 }}
                onPress={() => updateProfile({ creator: true })}
              />
            )}
          </Card>
        </View>

        <View style={{ marginTop: 22 }}>
          <SectionTitle title="Content performance" />
          {windowed.length === 0 ? (
            <EmptyState icon="bar-chart-outline" title="No content in this period" subtitle="Publish something to see how it performs." />
          ) : (
            windowed.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(Math.min(index, 6) * 40).duration(240)}>
                <Pressable
                  onPress={() => {
                    if (item.kind === 'video') nav.navigate('VideoDetail', { videoId: item.id });
                    else if (item.kind === 'post') nav.navigate('PostDetail', { postId: item.id });
                    else nav.navigate('Shorts');
                  }}
                  style={[styles.perfRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.label}`}
                >
                  <Media uri={item.thumb} style={{ width: 62, height: 62, borderRadius: 14 }} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '700', fontSize: 13.5 }}>
                      {item.label}
                    </Text>
                    <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 2 }}>
                      {item.kind.toUpperCase()} · {timeAgo(item.at)} ago
                    </Text>
                    <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${Math.round((item.views / maxViews) * 100)}%`, backgroundColor: theme.primary },
                        ]}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                      <Mini icon="eye-outline" value={fmtCount(item.views)} />
                      <Mini icon="heart-outline" value={fmtCount(item.likes)} />
                      <Mini icon="chatbubble-outline" value={fmtCount(item.comments)} />
                      <Mini icon="paper-plane-outline" value={fmtCount(item.shares)} />
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, justifyContent: 'center' }}>
          <DemoTag />
          <Text style={{ color: theme.textFaint, fontSize: 11 }}>Numbers come from demo content until analytics are connected</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const HeroStat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{value}</Text>
    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 }}>{label}</Text>
  </View>
);

const MonoRow: React.FC<{ icon: React.ComponentProps<typeof Ionicons>['name']; title: string; sub: string }> = ({ icon, title, sub }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
      <View style={[styles.monoIcon, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={17} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13.5 }}>{title}</Text>
        <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 2 }}>{sub}</Text>
      </View>
    </View>
  );
};

const Mini: React.FC<{ icon: React.ComponentProps<typeof Ionicons>['name']; value: string }> = ({ icon, value }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={12} color={theme.textFaint} />
      <Text style={{ color: theme.textFaint, fontSize: 11.5, fontWeight: '600' }}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  hero: { borderRadius: 24, padding: 18 },
  heroStats: { flexDirection: 'row', marginTop: 18 },
  divider: { height: 1, marginVertical: 14 },
  perfRow: { flexDirection: 'row', padding: 10, borderRadius: 20, borderWidth: 1, marginBottom: 10 },
  track: { height: 6, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  monoIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

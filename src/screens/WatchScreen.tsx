import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { liveVideos, userById } from '../store/selectors';
import { Avatar, Button, Chip, DemoTag, EmptyState, IconBtn, Skeleton, useToast } from '../components/ui';
import { Media, VibeVideo } from '../components/Media';
import { CommentsModal } from '../components/Comments';
import { fmtCount, timeAgo } from '../lib/format';
import type { Nav } from '../navigation/types';

const CATEGORIES = ['All', 'Travel', 'Food', 'Music', 'Photography', 'Dance', 'Craft'];

export const WatchScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const [cat, setCat] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const videos = useMemo(() => {
    const all = liveVideos(state);
    return cat === 'All' ? all : all.filter((v) => v.category === cat);
  }, [state, cat]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <View>
          <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.8 }}>Watch</Text>
          <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 2 }}>Long-form from creators you follow</Text>
        </View>
        <IconBtn name="stats-chart-outline" accessibilityLabel="Creator studio" onPress={() => nav.navigate('Studio')} />
      </View>

      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={videos}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); }}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 16 }}>
              {[0, 1].map((i) => (
                <View key={i} style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: theme.surface }}>
                  <Skeleton height={200} radius={0} />
                  <View style={{ padding: 12, gap: 8 }}>
                    <Skeleton height={14} style={{ width: '80%' }} />
                    <Skeleton height={11} style={{ width: '50%' }} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="videocam-outline"
              title="No videos in this category"
              subtitle="Try another category, or upload your own long video."
              action={<Button title="Upload video" variant="soft" onPress={() => nav.navigate('Create', { mode: 'long' })} />}
            />
          )
        }
        renderItem={({ item, index }) => {
          const creator = userById(state, item.authorId);
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 4) * 50).duration(280)}>
              <Pressable
                onPress={() => nav.navigate('VideoDetail', { videoId: item.id })}
                accessibilityRole="button"
                accessibilityLabel={`Play ${item.title}`}
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              >
                <View style={[styles.thumb, { backgroundColor: theme.surfaceAlt }]}>
                  <Media uri={item.thumb} style={StyleSheet.absoluteFill as object} />
                  <View style={styles.thumbShade} />
                  <View style={styles.duration}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                      {Math.floor(item.durationSec / 60)}:{String(item.durationSec % 60).padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={styles.playBtn}>
                    <Ionicons name="play" size={22} color="#fff" />
                  </View>
                  {item.isDemo && (
                    <View style={{ position: 'absolute', top: 10, left: 10 }}>
                      <DemoTag />
                    </View>
                  )}
                </View>
                <View style={styles.meta}>
                  <Avatar uri={creator?.avatar} name={creator?.displayName} size={36} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text numberOfLines={2} style={{ color: theme.text, fontWeight: '700', fontSize: 14.5, lineHeight: 19 }}>
                      {item.title}
                    </Text>
                    <Text style={{ color: theme.textFaint, fontSize: 12, marginTop: 3 }}>
                      {creator?.displayName} · {fmtCount(item.views)} views · {timeAgo(item.at)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </View>
  );
};

/* ------------------------------------------------------------------ detail */

export const VideoDetailScreen: React.FC<{ nav: Nav; videoId: string }> = ({ nav, videoId }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, me, toggleLike, toggleSave, shareItem, deleteContent, recordView, submitReport, sendGift } = useStore();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftAmount, setGiftAmount] = useState(5);

  const video = state.videos.find((v) => v.id === videoId);
  const creator = video ? userById(state, video.authorId) : undefined;

  if (!video || !creator) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + 20 }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Video unavailable"
          subtitle="It may have been removed by the creator or by moderation."
          action={<Button title="Go back" onPress={() => nav.goBack()} />}
        />
      </View>
    );
  }

  const liked = me ? video.likes.includes(me.id) : false;
  const saved = me ? video.saves.includes(me.id) : false;
  const comments = state.comments.filter((c) => c.postId === video.id && !c.removed);
  const mine = video.authorId === me?.id;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingTop: insets.top }}>
        <Pressable onPress={() => nav.goBack()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <VibeVideo
          uri={video.uri}
          poster={video.thumb}
          style={{ width: '100%', aspectRatio: 16 / 9 }}
          contentFit="contain"
          onActive={() => recordView('video', video.id)}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: theme.text, fontSize: 18.5, fontWeight: '800', lineHeight: 25 }}>{video.title}</Text>
        <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 6 }}>
          {fmtCount(video.views)} views · {timeAgo(video.at)} ago · {video.category}
          {video.isDemo ? ' · DEMO' : ''}
        </Text>

        <Pressable
          onPress={() => nav.navigate('UserProfile', { userId: creator.id })}
          style={[styles.creatorRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${creator.username}'s profile`}
        >
          <Avatar uri={creator.avatar} name={creator.displayName} size={42} ring="story" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14.5 }}>{creator.displayName}</Text>
              {creator.verified && <Ionicons name="checkmark-circle" size={13} color={theme.primary} />}
            </View>
            <Text style={{ color: theme.textFaint, fontSize: 12 }}>
              @{creator.username} · {fmtCount(state.follows.filter((f) => f.followeeId === creator.id).length)} followers
            </Text>
          </View>
          <Button title="Support" size="sm" variant="soft" icon="gift-outline" onPress={() => setGiftOpen(true)} />
        </Pressable>

        <View style={styles.actionRow}>
          <ActionPill icon={liked ? 'heart' : 'heart-outline'} label={fmtCount(video.likes.length)} active={liked} color={liked ? theme.danger : theme.text} onPress={() => toggleLike('video', video.id)} />
          <ActionPill icon="chatbubble-outline" label={fmtCount(comments.length)} onPress={() => setCommentsOpen(true)} />
          <ActionPill icon="paper-plane-outline" label={fmtCount(video.shares)} onPress={() => { shareItem('video', video.id, `Watch "${video.title}" on VibeConnect`); toast.show('Share sheet opened', 'paper-plane'); }} />
          <ActionPill icon={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? 'Saved' : 'Save'} active={saved} onPress={() => toggleSave('video', video.id)} />
          <ActionPill icon="ellipsis-horizontal" label="More" onPress={() => setMenuOpen(true)} />
        </View>

        <View style={[styles.descCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontSize: 13.5, lineHeight: 20 }}>
            {expanded ? video.description : `${video.description.slice(0, 120)}${video.description.length > 120 ? '…' : ''}`}
          </Text>
          {video.description.length > 120 && (
            <Pressable onPress={() => setExpanded((e) => !e)} accessibilityRole="button">
              <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13, marginTop: 6 }}>
                {expanded ? 'Show less' : 'Read more'}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>
            {fmtCount(comments.length)} comments
          </Text>
          {comments.slice(-3).map((c) => {
            const a = userById(state, c.authorId);
            return (
              <View key={c.id} style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <Avatar uri={a?.avatar} name={a?.displayName} size={30} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textDim, fontSize: 12.5, fontWeight: '700' }}>@{a?.username}</Text>
                  <Text style={{ color: theme.text, fontSize: 13.5, lineHeight: 19 }}>{c.text}</Text>
                </View>
              </View>
            );
          })}
          <Button title="Add a comment" variant="ghost" icon="create-outline" onPress={() => setCommentsOpen(true)} />
        </View>
      </ScrollView>

      <CommentsModal visible={commentsOpen} onClose={() => setCommentsOpen(false)} kind="video" targetId={video.id} />

      {giftOpen && (
        <BottomSheet title={`Send a gift to ${creator.displayName}`} onClose={() => setGiftOpen(false)}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {[3, 5, 10, 25].map((a) => (
              <Chip key={a} label={`$${a}`} active={giftAmount === a} onPress={() => setGiftAmount(a)} />
            ))}
          </View>
          <Text style={{ color: theme.textFaint, fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
            Gifts are optional and routed through our payment provider. Payouts depend on creator eligibility,
            platform rules, available revenue and applicable law — earnings are never guaranteed.
          </Text>
          <Button
            title={`Send $${giftAmount}.00 gift`}
            icon="gift-outline"
            full
            onPress={() => {
              const res = sendGift(creator.id, giftAmount, 'Keep creating!');
              if (res.ok) {
                toast.show('Gift sent. Thank you for supporting creators!');
                setGiftOpen(false);
              } else toast.show(res.error.message, 'alert-circle');
            }}
          />
        </BottomSheet>
      )}

      {menuOpen && (
        <BottomSheet title="Video options" onClose={() => setMenuOpen(false)}>
          <Pressable
            style={styles.menuRow}
            onPress={() => {
              setMenuOpen(false);
              submitReport({
                targetType: 'video',
                targetId: video.id,
                targetLabel: `Video: ${video.title}`,
                reason: 'Something else',
                details: 'Reported from the video menu.',
              });
              toast.show('Report submitted for review', 'flag');
            }}
            accessibilityRole="button"
          >
            <Ionicons name="flag-outline" size={20} color={theme.danger} />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Report video</Text>
          </Pressable>
          {mine && (
            <Pressable
              style={styles.menuRow}
              onPress={() => { setMenuOpen(false); deleteContent('video', video.id); toast.show('Video deleted', 'trash'); nav.goBack(); }}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={20} color={theme.danger} />
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Delete my video</Text>
            </Pressable>
          )}
        </BottomSheet>
      )}
    </View>
  );
};

/* --------------------------------------------------------------- fragments */

export const BottomSheet: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title, onClose, children,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(6,4,16,0.55)', justifyContent: 'flex-end', zIndex: 40 }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      <View
        style={{
          backgroundColor: theme.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26,
          padding: 20, paddingBottom: insets.bottom + 20,
        }}
      >
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17, marginBottom: 16 }}>{title}</Text>
        {children}
      </View>
    </View>
  );
};

const ActionPill: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
  color?: string;
}> = ({ icon, label, onPress, active, color }) => {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: active ? theme.primarySoft : theme.surface,
          borderColor: active ? theme.primary : theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={color ?? (active ? theme.primary : theme.text)} />
      <Text style={{ color: color ?? (active ? theme.primary : theme.text), fontSize: 12.5, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14 },
  thumb: { width: '100%', aspectRatio: 16 / 9, borderRadius: 20, overflow: 'hidden' },
  thumbShade: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,6,20,0.18)' },
  duration: { position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(8,6,20,0.72)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  playBtn: {
    position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -26,
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(10,8,22,0.55)',
    alignItems: 'center', justifyContent: 'center', paddingLeft: 4,
  },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  back: {
    position: 'absolute', top: 8, left: 8, zIndex: 20, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(10,8,22,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  creatorRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, borderWidth: 1, marginTop: 14 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  descCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginTop: 16 },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
});

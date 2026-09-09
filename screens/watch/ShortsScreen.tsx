import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View, ViewToken, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { spacing } from '../../lib/theme';
import { formatCount, timeAgo } from '../../lib/format';
import { deepLinkForPost, shareContent } from '../../lib/share';
import { Routes } from '../../lib/routes';
import { Avatar } from '../../components/Avatar';
import { ShortVideoSurface } from '../../components/VideoSurface';
import { CommentsSheet } from '../../components/CommentsSheet';
import { ActionSheet, ReportSheet } from '../../components/Actions';
import { EmptyState } from '../../components/UI';
import { RichText } from '../../components/PostCard';
import type { Post } from '../../lib/types';

function RailButton({ icon, label, active, onPress, tint }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean; onPress: () => void; tint?: string }) {
  return (
    <Pressable onPress={onPress} style={styles.railBtn} hitSlop={6}>
      <View style={styles.railIcon}>
        <Ionicons name={icon} size={26} color={active ? (tint ?? '#FF5C7A') : '#fff'} />
      </View>
      <Text style={styles.railLabel}>{label}</Text>
    </Pressable>
  );
}

function ShortCard({ post, active, height, onOpenComments, onOpenMenu }: { post: Post; active: boolean; height: number; onOpenComments: () => void; onOpenMenu: () => void }) {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { me, toast, confirm } = useApp();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const author = db.userById(post.authorId);
  if (!author) return null;
  const liked = !!me && post.likes.includes(me.id);
  const saved = !!me && post.saves.includes(me.id);
  const following = !!me && me.following.includes(author.id);

  return (
    <View style={{ height, width: '100%', backgroundColor: '#000' }}>
      <ShortVideoSurface uri={post.media[0]?.uri ?? ''} active={active} onProgress={(s, d) => { setProgress(s); setDuration(d); }} />
      <LinearGradient colors={['rgba(11,9,18,0.55)', 'transparent', 'rgba(11,9,18,0.85)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      {duration > 0 ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, (progress / duration) * 100)}%` }]} />
        </View>
      ) : null}

      <View style={styles.rightRail}>
        <RailButton
          icon={liked ? 'spark' : 'spark-outline'}
          label={formatCount(post.likes.length)}
          active={liked}
          onPress={() => db.toggleLike(post.id)}
        />
        <RailButton icon="chatbubble-dots-outline" label={formatCount(db.commentCount(post))} onPress={onOpenComments} />
        <RailButton
          icon="paper-plane-outline"
          label={formatCount(post.shares)}
          onPress={async () => {
            const result = await shareContent(`${author.displayName} on VibeConnect`, post.caption.slice(0, 120), deepLinkForPost(post.id));
            if (result === 'shared') db.sharePost(post.id);
            if (result === 'copied') toast('Link copied');
          }}
        />
        <RailButton icon={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? 'Saved' : 'Save'} tint="#2BE0C8" onPress={() => { const nowSaved = db.toggleSave(post.id); toast(nowSaved ? 'Saved' : 'Removed from saved'); }} />
        <Pressable onPress={onOpenMenu} style={styles.railBtn} hitSlop={6}>
          <View style={styles.railIcon}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </View>
        </Pressable>
      </View>

      <View style={styles.bottomInfo} pointerEvents="box-none">
        <Pressable style={styles.authorRow} onPress={() => navigation.navigate(Routes.UserProfile, { id: author.id })}>
          <Avatar uri={author.avatar} name={author.displayName} size={40} />
          <Text style={styles.authorName}>{author.displayName}</Text>
          {author.verified ? <Ionicons name="checkmark-circle" size={14} color="#A84CF1" /> : null}
        </Pressable>
        {!following ? (
          <Pressable
            onPress={async () => {
              if (author.settings.privateAccount) {
                const ok = await confirm({ title: `Request to follow @${author.username}?`, message: 'This account is private, so they will approve your request.', confirmLabel: 'Send request' });
                if (!ok) return;
              }
              const now = db.toggleFollow(author.id);
              toast(now ? `Following @${author.username}` : 'Unfollowed');
            }}
            style={styles.followPill}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }}>{author.settings.privateAccount ? 'Request' : 'Follow'}</Text>
          </Pressable>
        ) : null}
        <View style={{ marginTop: 10 }}>
          <RichText text={post.caption} size={14.5} color="#fff" onPressTag={(tag) => navigation.navigate(Routes.Explore, { query: tag })} />
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="flash" size={13} color="#2BE0C8" />
          <Text style={styles.metaText}>VIBE SHORT \u00b7 {timeAgo(post.createdAt)} \u00b7 {formatCount(post.views)} views</Text>
        </View>
      </View>
    </View>
  );
}

export function ShortsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { me, db: store, version } = useApp();
  const { height: windowHeight } = useWindowDimensions();
  const height = windowHeight;
  const [index, setIndex] = useState(0);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<Post | null>(null);
  const [reportFor, setReportFor] = useState<Post | null>(null);
  const listRef = useRef<FlatList<Post>>(null);

  const shorts = store && me ? db.shortsFeed(me) : [];
  const startIndex = route.params?.startId ? Math.max(0, shorts.findIndex((s) => s.id === route.params.startId)) : 0;

  useEffect(() => {
    if (startIndex > 0 && listRef.current) {
      setTimeout(() => listRef.current?.scrollToIndex({ index: startIndex, animated: false }), 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;

  if (!store || !me) return null;

  if (shorts.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0912' }}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Vibe Shorts</Text>
          <View style={{ width: 26 }} />
        </View>
        <EmptyState icon="flash-outline" title="No shorts yet" subtitle="Short vertical videos from people you follow will play here." actionLabel="Create the first short" onAction={() => navigation.navigate(Routes.Create, { mode: 'short' })} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <FlatList
        ref={listRef}
        data={shorts}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        renderItem={({ item, index: i }) => <ShortCard post={item} active={i === index} height={height} onOpenComments={() => setCommentsFor(item.id)} onOpenMenu={() => setMenuFor(item)} />}
      />

      <SafeAreaView style={styles.header} pointerEvents="box-none" edges={['top']}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Vibe Shorts</Text>
        <Pressable onPress={() => navigation.navigate(Routes.Create, { mode: 'short' })} hitSlop={10}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
        </Pressable>
      </SafeAreaView>

      <Modal visible={!!commentsFor} transparent animationType="slide" onRequestClose={() => setCommentsFor(null)} statusBarTranslucent>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(6,5,12,0.6)' }]} onPress={() => setCommentsFor(null)} />
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>{commentsFor ? <CommentsSheet visible postId={commentsFor} onClose={() => setCommentsFor(null)} /> : null}</View>
      </Modal>

      {menuFor ? (
        <ActionSheet
          visible
          onClose={() => setMenuFor(null)}
          title={`@${db.userById(menuFor.authorId)?.username ?? ''}`}
          actions={[
            { label: 'Open profile', icon: 'person-outline', onPress: () => navigation.navigate(Routes.UserProfile, { id: menuFor.authorId }) },
            { label: 'Copy link', icon: 'link-outline', onPress: async () => { await shareContent('Vibe Short', deepLinkForPost(menuFor.id), deepLinkForPost(menuFor.id)); } },
            { label: 'Report short', icon: 'flag-outline', destructive: true, onPress: () => setReportFor(menuFor) },
          ]}
        />
      ) : null}
      {reportFor ? <ReportSheet visible onClose={() => setReportFor(null)} targetType="post" targetId={reportFor.id} targetLabel="a short" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 54, paddingBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  rightRail: { position: 'absolute', right: 12, bottom: 130, alignItems: 'center', gap: 20 },
  railBtn: { alignItems: 'center', gap: 5 },
  railIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,9,18,0.4)' },
  railLabel: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  bottomInfo: { position: 'absolute', left: 0, right: 76, bottom: 0, paddingHorizontal: spacing.lg, paddingBottom: 40 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorName: { color: '#fff', fontWeight: '800', fontSize: 15.5 },
  followPill: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(168,76,241,0.92)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  metaText: { color: 'rgba(255,255,255,0.8)', fontSize: 11.5, fontWeight: '700', letterSpacing: 0.3 },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: '100%', backgroundColor: '#A84CF1' },
});

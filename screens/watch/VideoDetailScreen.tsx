import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { radii, spacing } from '../../lib/theme';
import { formatCount, timeAgo } from '../../lib/format';
import { deepLinkForPost, shareContent } from '../../lib/share';
import { Routes } from '../../lib/routes';
import { Avatar } from '../../components/Avatar';
import { WatchPlayer } from '../../components/VideoSurface';
import { CommentsSheet } from '../../components/CommentsSheet';
import { ActionSheet, ReportSheet } from '../../components/Actions';
import { Banner, EmptyState, IconButton } from '../../components/UI';
import { RichText } from '../../components/PostCard';

export function VideoDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { me, db: store, toast, version } = useApp();
  const { width } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const postId = route.params?.id as string;
  const post = useMemo(() => store?.posts.find((p) => p.id === postId), [store, postId, version]);
  const related = useMemo(() => (store && me ? db.watchVideos(me).filter((v) => v.id !== postId).slice(0, 8) : []), [store, me, postId, version]);
  const resumeAt = useMemo(() => (post ? db.watchProgressFor(post.id) : 0), [post, store?.version]);

  useEffect(() => {
    if (post) db.markPostView(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  if (!post || !store || !me) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <EmptyState icon="videocam-off-outline" title="Video unavailable" subtitle="This upload may have been removed by the creator or moderation." />
      </SafeAreaView>
    );
  }

  const author = db.userById(post.authorId)!;
  const liked = post.likes.includes(me.id);
  const saved = post.saves.includes(me.id);
  const following = me.following.includes(author.id);
  const playerWidth = Math.min(width, 900);
  const playerHeight = (playerWidth * 9) / 16;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={{ backgroundColor: '#000', width: playerWidth, height: playerHeight, alignSelf: 'center' }}>
        <WatchPlayer
          key={post.id}
          uri={post.media[0]?.uri ?? ''}
          startAt={resumeAt > 5 ? resumeAt : 0}
          onProgress={(seconds) => {
            setCurrent(seconds);
            if (Math.floor(seconds) % 5 === 0) db.saveWatchProgress(post.id, Math.floor(seconds));
          }}
        />
        <View style={styles.playerHeader}>
          <IconButton icon="chevron-back" size={36} iconSize={20} onPress={() => navigation.goBack()} style={{ backgroundColor: 'rgba(11,9,18,0.6)' }} />
          <IconButton icon="ellipsis-horizontal" size={36} iconSize={18} onPress={() => setMenuOpen(true)} style={{ backgroundColor: 'rgba(11,9,18,0.6)' }} />
        </View>
      </View>

      <FlatList
        data={related}
        keyExtractor={(v) => v.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        ListHeaderComponent={
          <View>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', lineHeight: 24, letterSpacing: -0.3 }}>{post.title ?? post.caption}</Text>
            <Text style={{ color: theme.textFaint, fontSize: 13, marginTop: 8 }}>
              {formatCount(post.views)} views \u00b7 {timeAgo(post.createdAt)}
              {post.durationMs ? ` \u00b7 ${Math.round(post.durationMs / 60000)} min` : ''}
            </Text>

            <View style={[styles.creatorRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Avatar uri={author.avatar} name={author.displayName} size={44} onPress={() => navigation.navigate(Routes.UserProfile, { id: author.id })} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14.5 }}>{author.displayName}</Text>
                  {author.verified ? <Ionicons name="checkmark-circle" size={13} color={theme.brand} /> : null}
                </View>
                <Text style={{ color: theme.textFaint, fontSize: 12.5 }}>{formatCount(db.followerCount(author))} followers</Text>
              </View>
              {author.id !== me.id ? (
                <Pressable
                  onPress={() => {
                    const now = db.toggleFollow(author.id);
                    toast(now ? 'Subscribed \u2014 you will get their uploads' : 'Unsubscribed');
                  }}
                  style={[styles.subscribe, following && { backgroundColor: theme.surfaceAlt, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border }]}
                >
                  <Text style={{ color: following ? theme.textMuted : '#fff', fontWeight: '800', fontSize: 13 }}>{following ? 'Subscribed' : 'Subscribe'}</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.actionRow}>
              {[
                { icon: (liked ? 'spark' : 'spark-outline'), label: formatCount(post.likes.length), active: liked, onPress: () => db.toggleLike(post.id) },
                { icon: 'chatbubble-dots-outline', label: formatCount(db.commentCount(post)), active: false, onPress: () => setCommentsOpen(true) },
                { icon: 'paper-plane-outline', label: formatCount(post.shares), active: false, onPress: async () => { const r = await shareContent(post.title ?? 'Video', post.caption.slice(0, 100), deepLinkForPost(post.id)); if (r === 'shared') db.sharePost(post.id); if (r === 'copied') toast('Link copied'); } },
                { icon: (saved ? 'bookmark' : 'bookmark-outline'), label: saved ? 'Saved' : 'Save', active: saved, onPress: () => { const now = db.toggleSave(post.id); toast(now ? 'Saved' : 'Removed'); } },
              ].map((action) => (
                <Pressable key={action.label} onPress={action.onPress} style={styles.actionBtn}>
                  <Ionicons name={action.icon} size={20} color={action.active ? theme.brand : theme.textMuted} />
                  <Text style={{ color: action.active ? theme.brand : theme.textMuted, fontSize: 12.5, fontWeight: '700' }}>{action.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={[styles.description, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <RichText text={expanded ? post.description ?? post.caption : (post.description ?? post.caption).slice(0, 180) + ((post.description ?? post.caption).length > 180 ? '\u2026' : '')} size={14} />
              {(post.description ?? '').length > 180 ? (
                <Pressable onPress={() => setExpanded((e) => !e)} style={{ marginTop: 8 }}>
                  <Text style={{ color: theme.brand, fontWeight: '800', fontSize: 13 }}>{expanded ? 'Show less' : 'Show more'}</Text>
                </Pressable>
              ) : null}
              {post.hashtags.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                  {post.hashtags.map((t) => (
                    <Text key={t} style={{ color: theme.brand, fontSize: 13, fontWeight: '700' }}>#{t}</Text>
                  ))}
                </View>
              ) : null}
            </View>

            {author.monetization.status === 'approved' ? (
              <Banner text={`@${author.username} is a verified VibeConnect creator. Tips and subscriptions directly support their work.`} icon="diamond-outline" tone="success" />
            ) : null}

            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16, marginTop: spacing.lg, marginBottom: spacing.md }}>Up next</Text>
          </View>
        }
        renderItem={({ item }) => {
          const nextAuthor = db.userById(item.authorId);
          return (
            <Pressable
              onPress={() => {
                db.saveWatchProgress(post.id, Math.floor(current));
                navigation.push(Routes.VideoDetail, { id: item.id });
              }}
              style={[styles.nextRow, { borderColor: theme.divider }]}
            >
              <View style={[styles.nextThumb, { backgroundColor: theme.surfaceAlt }]}>
                {item.media[0] ? <Image source={{ uri: item.media[0].thumb ?? item.media[0].uri }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={180} /> : null}
                {item.durationMs ? (
                  <View style={styles.nextDuration}>
                    <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '700' }}>{Math.round(item.durationMs / 60000)}m</Text>
                  </View>
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ color: theme.text, fontWeight: '700', fontSize: 14, lineHeight: 19 }}>{item.title ?? item.caption}</Text>
                <Text numberOfLines={1} style={{ color: theme.textFaint, fontSize: 12, marginTop: 4 }}>
                  {nextAuthor?.displayName} \u00b7 {formatCount(item.views)} views
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <CommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} postId={post.id} />

      <ActionSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={post.title ?? 'Video'}
        actions={[
          { label: 'Copy link', icon: 'link-outline', onPress: async () => { await shareContent('VibeConnect video', deepLinkForPost(post.id), deepLinkForPost(post.id)); toast('Link copied'); } },
          { label: saved ? 'Remove from saved' : 'Save video', icon: (saved ? 'bookmark' : 'bookmark-outline'), onPress: () => db.toggleSave(post.id) },
          ...(author.id === me.id
            ? [{ label: 'Delete video', icon: 'trash-outline', destructive: true, onPress: () => { db.deletePost(post.id); navigation.goBack(); } }]
            : [{ label: 'Report video', icon: 'flag-outline', destructive: true, onPress: () => setReportOpen(true) }]),
        ]}
      />
      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} targetType="video" targetId={post.id} targetLabel="this video" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  playerHeader: { position: 'absolute', top: 10, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, marginTop: spacing.lg },
  subscribe: { backgroundColor: '#6C4CF1', paddingHorizontal: 16, paddingVertical: 9, borderRadius: radii.pill },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, backgroundColor: 'transparent' },
  actionBtn: { alignItems: 'center', gap: 5, flex: 1 },
  description: { padding: 14, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, marginTop: spacing.lg },
  nextRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  nextThumb: { width: 140, height: 84, borderRadius: radii.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  nextDuration: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(11,9,18,0.78)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
});

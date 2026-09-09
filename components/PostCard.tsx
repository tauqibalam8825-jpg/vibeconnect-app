import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import * as db from '../lib/db';
import { useApp, useTheme } from '../lib/store';
import { gradients, radii, shadow, spacing } from '../lib/theme';
import { formatCount, timeAgo, formatDuration } from '../lib/format';
import { deepLinkForPost, shareContent } from '../lib/share';
import { Routes } from '../lib/routes';
import type { Post } from '../lib/types';
import { Avatar } from './Avatar';
import { ActionSheet, ReportSheet } from './Actions';
import { IconButton, Skeleton } from './UI';

type IconName = keyof typeof Ionicons.glyphMap;

export function RichText({ text, onPressTag, size = 15, color }: { text: string; onPressTag?: (tag: string) => void; size?: number; color?: string }) {
  const theme = useTheme();
  const parts = useMemo(() => text.split(/([#@][\p{L}\p{N}_\.]+)/gu), [text]);
  return (
    <Text style={{ fontSize: size, lineHeight: size * 1.5, color: color ?? theme.text }}>
      {parts.map((part, i) => {
        if (/^[#@]/.test(part)) {
          return (
            <Text key={i} style={{ color: theme.brand, fontWeight: '700' }} onPress={onPressTag ? () => onPressTag(part) : undefined}>
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

function MediaCarousel({ post, width, onPress }: { post: Post; width: number; onPress?: () => void }) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const height = Math.min(width * 1.15, 460);
  if (post.media.length === 0) return null;
  return (
    <Pressable onPress={onPress}>
      <View style={[styles.mediaWrap, { height, borderRadius: radii.lg, backgroundColor: theme.surfaceAlt }]}>
        <FlatList
          data={post.media}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(m) => m.id}
          onViewableItemsChanged={({ viewableItems }) => setIndex(viewableItems[0]?.index ?? 0)}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={({ item }) => (
            <Image source={{ uri: item.thumb ?? item.uri }} style={{ width, height }} contentFit="cover" transition={220} />
          )}
        />
        {post.media.length > 1 ? (
          <View style={styles.dots}>
            {post.media.map((m, i) => (
              <View key={m.id} style={[styles.dot, { backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.45)', width: i === index ? 18 : 6 }]} />
            ))}
          </View>
        ) : null}
        {post.location ? (
          <View style={styles.locationChip}>
            <Ionicons name="location" size={11} color="#fff" />
            <Text style={styles.locationText}>{post.location}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function VideoPreview({ post, width, onPress }: { post: Post; width: number; onPress?: () => void }) {
  const theme = useTheme();
  const media = post.media[0];
  const height = Math.min(width * 1.25, 470);
  return (
    <Pressable onPress={onPress}>
      <View style={[styles.mediaWrap, { height, borderRadius: radii.lg, backgroundColor: theme.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
        {media ? <Image source={{ uri: media.thumb ?? media.uri }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={220} /> : null}
        <LinearGradient colors={['rgba(11,9,18,0)', 'rgba(11,9,18,0.72)']} style={styles.videoScrim} />
        <View style={[styles.playBadge, { backgroundColor: 'rgba(11,9,18,0.55)' }]}>
          <Ionicons name="play" size={26} color="#fff" />
        </View>
        {post.type === 'short' ? (
          <View style={styles.shortTag}>
            <Ionicons name="flash" size={11} color="#fff" />
            <Text style={styles.shortTagText}>VIBE SHORT</Text>
          </View>
        ) : null}
        {post.durationMs ? (
          <View style={styles.durationTag}>
            <Text style={styles.durationText}>{formatDuration(post.durationMs)}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function TextCard({ post, onPress }: { post: Post; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress}>
      <LinearGradient colors={gradients.brandSoft as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.textCard, { borderColor: `${theme.brand}33` }]}>
        <View style={styles.quoteBar}>
          <View style={{ width: 3, flex: 1, backgroundColor: theme.brand, borderRadius: 2 }} />
        </View>
        <Text style={{ color: theme.text, fontSize: 16.5, lineHeight: 25, fontWeight: '600', letterSpacing: -0.2 }}>{post.caption}</Text>
        <View style={styles.textCardFooter}>
          <Ionicons name="text" size={13} color={theme.brand} />
          <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '700' }}>TEXT VIBE</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export function PostCard({ post, showFollow = true }: { post: Post; showFollow?: boolean }) {
  const theme = useTheme();
  const { me, toast, confirm } = useApp();
  const navigation = useNavigation<any>();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, 720) - spacing.lg * 2;
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const author = db.userById(post.authorId);
  const isMine = me?.id === post.authorId;
  const liked = !!me && post.likes.includes(me.id);
  const saved = !!me && post.saves.includes(me.id);
  const following = !!me && me.following.includes(post.authorId);
  const likes = useSharedValue(1);
  const sparkStyle = useAnimatedStyle(() => ({ transform: [{ scale: likes.value }] }));

  useEffect(() => {
    db.markPostView(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  if (!author) return null;

  const doLike = () => {
    const next = db.toggleLike(post.id);
    likes.value = withSequence(withSpring(next ? 1.35 : 0.9, { damping: 8 }), withSpring(1, { damping: 12 }));
  };

  const openMedia = () => {
    if (post.type === 'short') navigation.navigate(Routes.Shorts, { startId: post.id });
    else if (post.type === 'video') navigation.navigate(Routes.VideoDetail, { id: post.id });
    else navigation.navigate(Routes.PostDetail, { id: post.id });
  };

  const doShare = async () => {
    const result = await shareContent(`${author.displayName} on VibeConnect`, post.caption.slice(0, 140), deepLinkForPost(post.id));
    if (result === 'copied') toast('Link copied to clipboard');
    if (result === 'shared') {
      db.sharePost(post.id);
      toast('Shared');
    }
  };

  const menuActions = [
    { label: saved ? 'Remove from saved' : 'Save post', icon: (saved ? 'bookmark' : 'bookmark-outline') as IconName, onPress: () => { db.toggleSave(post.id); toast(saved ? 'Removed from saved' : 'Saved to your collection'); } },
    { label: 'Copy link', icon: 'link-outline', onPress: async () => { await Share.share({ message: deepLinkForPost(post.id) }).catch(() => {}); } },
    ...(isMine
      ? [
          {
            label: post.visibility === 'private' ? 'Make public' : 'Make private',
            icon: (post.visibility === 'private' ? 'earth-outline' : 'lock-closed-outline') as IconName,
            onPress: () => {
              const next = db.togglePostVisibility(post.id);
              toast(next === 'private' ? 'Post is now private' : 'Post is now public');
            },
          },
          {
            label: 'Delete post',
            icon: 'trash-outline' as IconName,
            destructive: true,
            onPress: async () => {
              const ok = await confirm({ title: 'Delete this post?', message: 'Comments and engagement on it will be removed too.', confirmLabel: 'Delete', destructive: true });
              if (ok) {
                db.deletePost(post.id);
                toast('Post deleted');
              }
            },
          },
        ]
      : [
          { label: `Unfollow @${author.username}`, icon: 'person-remove-outline' as IconName, onPress: () => { if (following) db.toggleFollow(author.id); toast('Unfollowed'); } },
          { label: `Block @${author.username}`, icon: 'ban-outline' as IconName, destructive: true, onPress: async () => {
              const ok = await confirm({ title: `Block @${author.username}?`, message: 'They will not be able to see your profile, posts or message you.', confirmLabel: 'Block', destructive: true });
              if (ok) { db.blockUser(author.id); toast('Account blocked'); }
            } },
          { label: 'Report post', icon: 'flag-outline' as IconName, destructive: true, onPress: () => setReportOpen(true) },
        ]),
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, shadow(2, theme)]}>
      <View style={styles.header}>
        <Avatar
          uri={author.avatar}
          name={author.displayName}
          size={44}
          ring={db.activeStories(me).some((s) => s.authorId === author.id)}
          ringColor={theme.brand}
          onPress={() => navigation.navigate(Routes.UserProfile, { id: author.id })}
        />
        <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate(Routes.UserProfile, { id: author.id })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '800', fontSize: 15, letterSpacing: -0.2 }}>
              {author.displayName}
            </Text>
            {author.verified ? <Ionicons name="checkmark-circle" size={14} color={theme.brand} /> : null}
            {author.isCreator ? (
              <View style={[styles.creatorTag, { backgroundColor: theme.dark ? `${theme.accent}22` : `${theme.accent}1A` }]}>
                <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '800' }}>CREATOR</Text>
              </View>
            ) : null}
          </View>
          <Text numberOfLines={1} style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 1 }}>
            @{author.username} \u00b7 {timeAgo(post.createdAt)}
            {post.visibility === 'private' ? ' \u00b7 Private' : ''}
            {post.visibility === 'followers' ? ' \u00b7 Followers' : ''}
          </Text>
        </Pressable>
        {!isMine && showFollow && me ? (
          <Pressable
            onPress={() => {
              const nowFollowing = db.toggleFollow(author.id);
              toast(nowFollowing ? `Following @${author.username}` : `Unfollowed @${author.username}`);
            }}
            style={[
              styles.followBtn,
              following ? { backgroundColor: theme.surfaceAlt, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth } : { backgroundColor: 'transparent', borderWidth: 0 },
            ]}
          >
            <Text style={{ color: following ? theme.textMuted : theme.brand, fontWeight: '800', fontSize: 13 }}>{following ? 'Following' : 'Follow'}</Text>
          </Pressable>
        ) : null}
        <IconButton icon="ellipsis-horizontal" size={34} iconSize={18} onPress={() => setMenuOpen(true)} variant="ghost" />
      </View>

      {post.type === 'text' ? (
        <TextCard post={post} onPress={openMedia} />
      ) : post.type === 'photo' ? (
        <MediaCarousel post={post} width={width} onPress={openMedia} />
      ) : (
        <VideoPreview post={post} width={width} onPress={openMedia} />
      )}

      {post.type !== 'text' && post.caption ? (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <RichText text={post.caption} onPressTag={(tag) => navigation.navigate(Routes.Explore, { query: tag })} />
        </View>
      ) : null}
      {post.type === 'text' && post.hashtags.length ? (
        <View style={styles.tagRow}>
          {post.hashtags.slice(0, 4).map((t) => (
            <Pressable key={t} onPress={() => navigation.navigate(Routes.Explore, { query: `#${t}` })}>
              <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '700' }}>#{t}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={doLike} hitSlop={8} style={styles.actionBtn}>
          <Animated.View style={sparkStyle}>
            <Ionicons name={liked ? 'spark' : 'spark-outline'} size={22} color={liked ? theme.danger : theme.textMuted} />
          </Animated.View>
          <Text style={[styles.actionText, { color: liked ? theme.danger : theme.textMuted }]}>{formatCount(post.likes.length)}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate(Routes.PostDetail, { id: post.id })} hitSlop={8} style={styles.actionBtn}>
          <Ionicons name="chatbubble-dots-outline" size={21} color={theme.textMuted} />
          <Text style={[styles.actionText, { color: theme.textMuted }]}>{formatCount(db.commentCount(post))}</Text>
        </Pressable>
        <Pressable onPress={doShare} hitSlop={8} style={styles.actionBtn}>
          <Ionicons name="paper-plane-outline" size={21} color={theme.textMuted} />
          <Text style={[styles.actionText, { color: theme.textMuted }]}>{formatCount(post.shares)}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={{ color: theme.textFaint, fontSize: 12, fontWeight: '600', marginRight: 10 }}>{formatCount(post.views)} views</Text>
        <Pressable
          onPress={() => {
            const nowSaved = db.toggleSave(post.id);
            toast(nowSaved ? 'Saved to your collection' : 'Removed from saved');
          }}
          hitSlop={8}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={21} color={saved ? theme.brand : theme.textMuted} />
        </Pressable>
      </View>

      <ActionSheet visible={menuOpen} onClose={() => setMenuOpen(false)} title={`@${author.username}`} actions={menuActions} />
      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} targetType="post" targetId={post.id} targetLabel={`a post by @${author.username}`} />
    </View>
  );
}

export function PostSkeleton() {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: spacing.lg }]}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Skeleton height={44} width={44} radius={22} />
        <View style={{ gap: 6, flex: 1 }}>
          <Skeleton height={12} width="45%" />
          <Skeleton height={10} width="28%" />
        </View>
      </View>
      <Skeleton height={240} radius={radii.lg} style={{ marginTop: spacing.lg }} />
      <View style={{ gap: 8, marginTop: spacing.lg }}>
        <Skeleton height={12} width="90%" />
        <Skeleton height={12} width="62%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.lg, paddingBottom: spacing.md, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  creatorTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  followBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.pill, marginRight: 2 },
  mediaWrap: { marginHorizontal: spacing.lg, overflow: 'hidden', borderRadius: radii.lg },
  dots: { position: 'absolute', top: 10, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot: { height: 6, borderRadius: 3 },
  locationChip: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(11,9,18,0.6)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radii.pill },
  locationText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  videoScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  playBadge: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },
  shortTag: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(168,76,241,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.sm },
  shortTagText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  durationTag: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(11,9,18,0.75)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  durationText: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  textCard: { marginHorizontal: spacing.lg, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg, minHeight: 150, justifyContent: 'space-between' },
  quoteBar: { flexDirection: 'row', height: 26, marginBottom: spacing.md },
  textCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: spacing.lg, marginTop: spacing.md, paddingTop: spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13.5, fontWeight: '700' },
});

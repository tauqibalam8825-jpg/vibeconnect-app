import React, { memo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { userById } from '../store/selectors';
import { fmtCount, timeAgo } from '../lib/format';
import type { Post } from '../types';
import { Avatar, DemoTag, IconBtn, useToast } from './ui';
import { Media, VibeVideo } from './Media';
import { CommentsModal } from './Comments';
import type { Nav } from '../navigation/types';

interface Props {
  post: Post;
  nav: Nav;
  onOptions?: () => void;
}

export const PostCard: React.FC<Props> = memo(({ post, nav }) => {
  const { theme } = useTheme();
  const { state, me, toggleLike, toggleSave, shareItem, deleteContent, recordView, submitReport } = useStore();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const heart = useSharedValue(0);

  const author = userById(state, post.authorId);
  const liked = me ? post.likes.includes(me.id) : false;
  const saved = me ? post.saves.includes(me.id) : false;
  const commentCount = state.comments.filter((c) => c.postId === post.id && !c.removed).length;
  const mine = post.authorId === me?.id;

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      heart.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 320 }));
      if (!liked) toggleLike('post', post.id);
    });

  const heartStyle = useAnimatedStyle(() => ({
    opacity: heart.value,
    transform: [{ scale: 0.6 + heart.value * 0.7 }],
  }));

  const like = () => {
    heart.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 300 }));
    toggleLike('post', post.id);
  };

  const openProfile = () => nav.navigate('UserProfile', { userId: post.authorId });

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* header */}
      <View style={styles.header}>
        <Pressable style={styles.headerLeft} onPress={openProfile} accessibilityRole="button" accessibilityLabel={`Open ${author?.username}`}>
          <Avatar uri={author?.avatar} name={author?.displayName} size={40} ring={author?.creator ? 'story' : 'none'} />
          <View style={{ marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{author?.displayName ?? 'Unknown'}</Text>
              {author?.verified && <Ionicons name="checkmark-circle" size={13} color={theme.primary} />}
              {post.isDemo && <DemoTag />}
            </View>
            <Text style={{ color: theme.textFaint, fontSize: 12 }}>
              @{author?.username ?? 'unknown'}
              {post.location ? ` · ${post.location}` : ''}
            </Text>
          </View>
        </Pressable>
        <IconBtn name="ellipsis-horizontal" accessibilityLabel="Post options" onPress={() => setMenuOpen(true)} size={20} />
      </View>

      {/* media */}
      <GestureDetector gesture={doubleTap}>
        <View style={styles.media}>
          {post.kind === 'video' ? (
            <VibeVideo
              uri={post.uri}
              poster={post.thumb}
              style={{ width: '100%', aspectRatio: 4 / 5 }}
              onActive={() => recordView('post', post.id)}
            />
          ) : (
            <Pressable onPress={() => nav.navigate('PostDetail', { postId: post.id })} accessibilityLabel="Open post">
              <Media uri={post.thumb ?? post.uri} style={{ width: '100%', aspectRatio: 1 }} />
            </Pressable>
          )}
          <Animated.View style={[styles.heartOverlay, heartStyle]} pointerEvents="none">
            <Ionicons name="heart" size={92} color="rgba(255,255,255,0.92)" />
          </Animated.View>
        </View>
      </GestureDetector>

      {/* actions */}
      <View style={styles.actions}>
        <Action
          icon={liked ? 'heart' : 'heart-outline'}
          color={liked ? theme.danger : theme.text}
          label={`${fmtCount(post.likes.length)} likes`}
          onPress={like}
          accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
        />
        <Action icon="chatbubble-outline" label={`${fmtCount(commentCount)}`} onPress={() => setCommentsOpen(true)} accessibilityLabel="Open comments" />
        <Action icon="paper-plane-outline" label={`${fmtCount(post.shares)}`} onPress={() => { shareItem('post', post.id, `Check out @${author?.username}'s post on VibeConnect`); toast.show('Share sheet opened', 'paper-plane'); }} accessibilityLabel="Share post" />
        <View style={{ flex: 1 }} />
        <Action
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          label={saved ? 'Saved' : 'Save'}
          onPress={() => { toggleSave('post', post.id); toast.show(saved ? 'Removed from saved' : 'Saved to collection', 'bookmark'); }}
          accessibilityLabel={saved ? 'Remove from saved' : 'Save post'}
        />
      </View>

      {/* meta */}
      <View style={styles.body}>
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13.5 }}>
          {fmtCount(post.likes.length)} likes · {fmtCount(post.views)} views
        </Text>
        <Pressable onPress={() => setExpanded((e) => !e)} accessibilityRole="button">
          <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20, marginTop: 5 }}>
            <Text style={{ fontWeight: '700' }}>{author?.username ?? 'unknown'} </Text>
            {expanded ? post.caption : post.caption.length > 110 ? `${post.caption.slice(0, 110)}… ` : post.caption}
            {!expanded && post.caption.length > 110 && <Text style={{ color: theme.textFaint }}>more</Text>}
          </Text>
        </Pressable>
        {commentCount > 0 && (
          <Pressable onPress={() => setCommentsOpen(true)} accessibilityRole="button" accessibilityLabel="View all comments">
            <Text style={{ color: theme.textFaint, fontSize: 13, marginTop: 6 }}>
              View all {fmtCount(commentCount)} comments
            </Text>
          </Pressable>
        )}
        <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 6 }}>{timeAgo(post.at)} ago</Text>
      </View>

      {/* options menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { backgroundColor: theme.elevated, borderColor: theme.border }]}>
            <MenuRow
              icon="person-outline"
              label="View profile"
              onPress={() => { setMenuOpen(false); openProfile(); }}
            />
            <MenuRow
              icon="link-outline"
              label="Copy link"
              onPress={() => { setMenuOpen(false); shareItem('post', post.id, 'VibeConnect post link'); }}
            />
            {!mine && (
              <MenuRow
                icon="flag-outline"
                label="Report post"
                danger
                onPress={() => {
                  setMenuOpen(false);
                  submitReport({
                    targetType: 'post',
                    targetId: post.id,
                    targetLabel: `Post by @${author?.username ?? 'unknown'}`,
                    reason: 'Something else',
                    details: 'Reported from the post options menu.',
                  });
                  toast.show('Report submitted. Our moderation team will review it.', 'flag');
                }}
              />
            )}
            {mine && (
              <MenuRow
                icon="trash-outline"
                label="Delete post"
                danger
                onPress={() => { setMenuOpen(false); deleteContent('post', post.id); toast.show('Post deleted', 'trash'); }}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      <CommentsModal visible={commentsOpen} onClose={() => setCommentsOpen(false)} kind="post" targetId={post.id} />
    </View>
  );
});

const Action: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  color?: string;
  accessibilityLabel: string;
}> = ({ icon, label, onPress, color, accessibilityLabel }) => {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} size={23} color={color ?? theme.text} />
      <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
};

export const MenuRow: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
}> = ({ icon, label, onPress, danger }) => {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} size={19} color={danger ? theme.danger : theme.text} />
      <Text style={{ color: danger ? theme.danger : theme.text, fontSize: 15, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 22, marginHorizontal: 12, marginBottom: 16, overflow: 'hidden', borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  media: { overflow: 'hidden' },
  heartOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  body: { paddingHorizontal: 12, paddingBottom: 14 },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(6,4,16,0.55)', justifyContent: 'flex-end' },
  menu: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingVertical: 10, borderWidth: 1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 15 },
});

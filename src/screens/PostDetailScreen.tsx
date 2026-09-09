import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { commentsFor, userById } from '../store/selectors';
import { Avatar, Button, DemoTag, EmptyState, IconBtn, useToast } from '../components/ui';
import { Media, VibeVideo } from '../components/Media';
import { BottomSheet } from './WatchScreen';
import { ReportSheet } from '../components/ReportSheet';
import { fmtCount, timeAgo } from '../lib/format';
import type { Nav } from '../navigation/types';

export const PostDetailScreen: React.FC<{ nav: Nav; postId: string }> = ({ nav, postId }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, me, toggleLike, toggleSave, shareItem, addComment, deleteComment, deleteContent, recordView, submitReport } = useStore();
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const post = state.posts.find((p) => p.id === postId);
  const comments = useMemo(
    () => (post ? commentsFor(state, post.id, 'post') : []),
    [state, post]
  );

  useEffect(() => {
    if (post) recordView('post', post.id);
  }, [post?.id, recordView, post]);

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + 20 }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Post unavailable"
          subtitle="It may have been deleted by the author or removed by moderation."
          action={<Button title="Go back" onPress={() => nav.goBack()} />}
        />
      </View>
    );
  }

  const author = userById(state, post.authorId);
  const liked = me ? post.likes.includes(me.id) : false;
  const saved = me ? post.saves.includes(me.id) : false;
  const mine = post.authorId === me?.id;

  const send = () => {
    const value = text.trim();
    if (!value) return;
    addComment('post', post.id, value);
    setText('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.bar}>
        <IconBtn name="chevron-back" accessibilityLabel="Go back" onPress={() => nav.goBack()} />
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>Post</Text>
        <IconBtn name="ellipsis-horizontal" accessibilityLabel="Post options" onPress={() => setMenuOpen(true)} />
      </View>

      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.head}>
              <Pressable onPress={() => nav.navigate('UserProfile', { userId: post.authorId })} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} accessibilityRole="button">
                <Avatar uri={author?.avatar} name={author?.displayName} size={42} ring="story" />
                <View style={{ marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14.5 }}>{author?.displayName}</Text>
                    {author?.verified && <Ionicons name="checkmark-circle" size={13} color={theme.primary} />}
                    {post.isDemo && <DemoTag />}
                  </View>
                  <Text style={{ color: theme.textFaint, fontSize: 12 }}>
                    @{author?.username}
                    {post.location ? ` · ${post.location}` : ''} · {timeAgo(post.at)} ago
                  </Text>
                </View>
              </Pressable>
            </View>

            {post.kind === 'video' ? (
              <VibeVideo uri={post.uri} poster={post.thumb} style={{ width: '100%', aspectRatio: 4 / 5 }} onActive={() => recordView('post', post.id)} />
            ) : (
              <Media uri={post.thumb ?? post.uri} style={{ width: '100%', aspectRatio: 1 }} />
            )}

            <View style={styles.actions}>
              <Act icon={liked ? 'heart' : 'heart-outline'} label={`${fmtCount(post.likes.length)}`} color={liked ? theme.danger : theme.text} onPress={() => toggleLike('post', post.id)} />
              <Act icon="chatbubble-outline" label={fmtCount(comments.length)} onPress={() => setText((t) => t)} />
              <Act icon="paper-plane-outline" label={fmtCount(post.shares)} onPress={() => { shareItem('post', post.id, 'VibeConnect post'); toast.show('Share sheet opened', 'paper-plane'); }} />
              <View style={{ flex: 1 }} />
              <Act icon={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? 'Saved' : 'Save'} onPress={() => toggleSave('post', post.id)} />
            </View>

            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <Text style={{ color: theme.text, fontSize: 14.5, lineHeight: 21 }}>
                <Text style={{ fontWeight: '800' }}>{author?.username} </Text>
                {post.caption}
              </Text>
            </View>

            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14.5, paddingHorizontal: 16, marginTop: 10, marginBottom: 4 }}>
              {fmtCount(comments.length)} comments
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="chatbubble-outline" title="No comments yet" subtitle="Start the conversation." />
        }
        renderItem={({ item, index }) => {
          const cAuthor = userById(state, item.authorId);
          const canDelete = item.authorId === me?.id || mine;
          return (
            <Animated.View entering={FadeInUpish(index)} style={styles.comment}>
              <Pressable onPress={() => nav.navigate('UserProfile', { userId: item.authorId })}>
                <Avatar uri={cAuthor?.avatar} name={cAuthor?.displayName} size={34} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: theme.textDim, fontWeight: '700', fontSize: 13 }}>@{cAuthor?.username}</Text>
                  <Text style={{ color: theme.textFaint, fontSize: 11.5 }}>{timeAgo(item.at)}</Text>
                  {item.isDemo && <Text style={{ color: theme.textFaint, fontSize: 9.5, fontWeight: '800' }}>DEMO</Text>}
                </View>
                <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20, marginTop: 2 }}>{item.text}</Text>
              </View>
              {canDelete && (
                <IconBtn name="trash-outline" size={17} color={theme.textFaint} accessibilityLabel="Delete comment" onPress={() => deleteComment(item.id)} />
              )}
            </Animated.View>
          );
        }}
      />

      <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + 10 }]}>
        <Avatar uri={me?.avatar} name={me?.displayName} size={32} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a comment…"
          placeholderTextColor={theme.textFaint}
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={send}
          accessibilityLabel="Comment input"
        />
        <Button title="Post" size="sm" onPress={send} disabled={!text.trim()} />
      </View>

      {menuOpen && (
        <BottomSheet title="Post options" onClose={() => setMenuOpen(false)}>
          <Pressable style={styles.menuRow} onPress={() => { setMenuOpen(false); setReportOpen(true); }} accessibilityRole="button">
            <Ionicons name="flag-outline" size={20} color={theme.danger} />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Report post</Text>
          </Pressable>
          {mine && (
            <Pressable
              style={styles.menuRow}
              onPress={() => { setMenuOpen(false); deleteContent('post', post.id); toast.show('Post deleted', 'trash'); nav.goBack(); }}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={20} color={theme.danger} />
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Delete my post</Text>
            </Pressable>
          )}
        </BottomSheet>
      )}

      {reportOpen && (
        <ReportSheet
          visible
          onClose={() => setReportOpen(false)}
          targetType="post"
          targetId={post.id}
          targetLabel={`Post by @${author?.username ?? 'unknown'}`}
          extraUserId={post.authorId}
          extraLabel="Block user"
        />
      )}
    </KeyboardAvoidingView>
  );
};

const FadeInUpish = (index: number) => FadeInDown.delay(Math.min(index, 6) * 30).duration(220);

const Act: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  color?: string;
}> = ({ icon, label, onPress, color }) => {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.act, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={22} color={color ?? theme.text} />
      <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6 },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 16, paddingVertical: 12 },
  act: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  comment: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'flex-start' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 110 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
});

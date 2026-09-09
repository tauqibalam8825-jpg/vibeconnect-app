import React, { useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { radii, spacing } from '../../lib/theme';
import { timeAgo, formatCount } from '../../lib/format';
import { AppHeader } from '../../components/Screen';
import { Avatar } from '../../components/Avatar';
import { PostCard } from '../../components/PostCard';
import { EmptyState, IconButton, Sheet } from '../../components/UI';
import { ActionSheet, ReportSheet } from '../../components/Actions';
import { Routes } from '../../lib/routes';
import type { Comment } from '../../lib/types';

function CommentRow({ comment, onMenu }: { comment: Comment; onMenu: (c: Comment) => void }) {
  const theme = useTheme();
  const { me } = useApp();
  const author = db.userById(comment.authorId);
  if (!author || comment.hidden) return null;
  const liked = !!me && comment.likes.includes(me.id);
  return (
    <View style={[styles.commentRow, { borderBottomColor: theme.divider }]}>
      <Avatar uri={author.avatar} name={author.displayName} size={36} onPress={() => {}} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13.5 }}>{author.displayName}</Text>
          {author.verified ? <Ionicons name="checkmark-circle" size={12} color={theme.brand} /> : null}
          <Text style={{ color: theme.textFaint, fontSize: 12 }}>{timeAgo(comment.createdAt)}</Text>
        </View>
        <Text style={{ color: theme.text, fontSize: 14.5, lineHeight: 20, marginTop: 3 }}>{comment.text}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}>
          <Pressable onPress={() => db.toggleCommentLike(comment.id)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name={liked ? 'spark' : 'spark-outline'} size={15} color={liked ? theme.danger : theme.textFaint} />
            <Text style={{ color: liked ? theme.danger : theme.textFaint, fontSize: 12.5, fontWeight: '700' }}>{comment.likes.length || ''}</Text>
          </Pressable>
          <Pressable onPress={() => onMenu(comment)} hitSlop={8}>
            <Text style={{ color: theme.textFaint, fontSize: 12.5, fontWeight: '700' }}>Options</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function PostDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { me, db: store, toast, confirm, version } = useApp();
  const [text, setText] = useState('');
  const [focusedComment, setFocusedComment] = useState<Comment | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const listRef = useRef<FlatList>(null);

  const post = useMemo(() => store?.posts.find((p) => p.id === route.params?.id), [store, route.params?.id]);
  const comments = useMemo(() => (post ? db.commentsFor(post.id) : []), [post, version]);

  if (!post || !store) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <AppHeader title="Post" />
        <EmptyState icon="eye-off-outline" title="This post is unavailable" subtitle="It may have been deleted by its creator or removed by moderation." />
      </SafeAreaView>
    );
  }

  const send = () => {
    if (!text.trim()) return;
    db.addComment(post.id, text);
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="Post" subtitle={`${formatCount(db.commentCount(post))} comments`} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <FlatList
          ref={listRef}
          data={comments}
          keyExtractor={(c) => c.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
          ListHeaderComponent={<PostCard post={post} showFollow={false} />}
          ListEmptyComponent={<EmptyState icon="chatbubble-ellipses-outline" title="No comments yet" subtitle={post.commentsEnabled ? 'Be the first to say something kind.' : 'The creator turned comments off for this post.'} />}
          renderItem={({ item }) => (
            <CommentRow
              comment={item}
              onMenu={(c) => {
                setFocusedComment(c);
                setMenuOpen(true);
              }}
            />
          )}
        />
        {post.commentsEnabled ? (
          <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.divider }]}>
            <Avatar uri={me?.avatar} name={me?.displayName ?? '?'} size={34} />
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Add a comment\u2026"
              placeholderTextColor={theme.textFaint}
              style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
              multiline
              maxLength={500}
              onSubmitEditing={send}
            />
            <IconButton icon="send" size={38} iconSize={18} variant="gradient" onPress={send} />
          </View>
        ) : (
          <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.divider }]}>
            <Text style={{ color: theme.textFaint, fontSize: 13.5, flex: 1, textAlign: 'center' }}>Comments are turned off for this post</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      <ActionSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Comment options"
        actions={[
          ...(focusedComment && me?.id === focusedComment.authorId
            ? [
                {
                  label: 'Delete comment',
                  icon: 'trash-outline' as const,
                  destructive: true,
                  onPress: async () => {
                    const ok = await confirm({ title: 'Delete comment?', confirmLabel: 'Delete', destructive: true });
                    if (ok && focusedComment) {
                      db.deleteComment(focusedComment.id);
                      toast('Comment deleted');
                    }
                  },
                },
              ]
            : [
                {
                  label: 'Report comment',
                  icon: 'flag-outline' as const,
                  destructive: true,
                  onPress: () => setReportOpen(true),
                },
                {
                  label: 'Copy text',
                  icon: 'copy-outline' as const,
                  onPress: () => toast('Copied'),
                },
              ]),
        ]}
      />
      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="comment"
        targetId={focusedComment?.id ?? ''}
        targetLabel="a comment"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  commentRow: { flexDirection: 'row', gap: 12, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.lg, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14.5, maxHeight: 110, borderWidth: StyleSheet.hairlineWidth },
});

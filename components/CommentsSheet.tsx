import React, { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as db from '../lib/db';
import { useApp, useTheme } from '../lib/store';
import { radii, spacing } from '../lib/theme';
import { timeAgo } from '../lib/format';
import { Avatar } from './Avatar';
import { EmptyState } from './UI';
import { ActionSheet, ReportSheet } from './Actions';
import type { Comment } from '../lib/types';

/** Reusable comment thread used by shorts, watch videos and post details. */
export function CommentsSheet({ visible, onClose, postId }: { visible: boolean; onClose: () => void; postId: string }) {
  const theme = useTheme();
  const { me, db: store, toast, confirm, version } = useApp();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState<Comment | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const post = useMemo(() => store?.posts.find((p) => p.id === postId), [store, postId, version]);
  const comments = useMemo(() => (post ? db.commentsFor(post.id) : []), [post, version]);
  if (!post) return null;

  const send = () => {
    if (!text.trim()) return;
    db.addComment(post.id, text);
    setText('');
  };

  return (
    <View style={[styles.wrap, { backgroundColor: theme.surface }]}>
      <View style={[styles.grabber, { backgroundColor: theme.border }]} />
      <View style={styles.header}>
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>Comments</Text>
        <Text style={{ color: theme.textFaint, fontWeight: '700', fontSize: 13, marginRight: 8 }}>{comments.length}</Text>
        <Pressable onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: theme.surfaceAlt }]}>
          <Ionicons name="close" size={18} color={theme.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={40}>
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState icon="chatbubble-ellipses-outline" title="No comments yet" subtitle={post.commentsEnabled ? 'Start the conversation.' : 'Comments are turned off.'} />}
          renderItem={({ item }) => {
            const author = db.userById(item.authorId);
            if (!author || item.hidden) return null;
            const liked = !!me && item.likes.includes(me.id);
            return (
              <View style={styles.row}>
                <Avatar uri={author.avatar} name={author.displayName} size={34} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>{author.displayName}</Text>
                    <Text style={{ color: theme.textFaint, fontSize: 11.5 }}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={{ color: theme.text, fontSize: 14, lineHeight: 19, marginTop: 2 }}>{item.text}</Text>
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
                    <Pressable onPress={() => db.toggleCommentLike(item.id)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name={liked ? 'spark' : 'spark-outline'} size={14} color={liked ? theme.danger : theme.textFaint} />
                      <Text style={{ color: liked ? theme.danger : theme.textFaint, fontSize: 12, fontWeight: '700' }}>{item.likes.length || ''}</Text>
                    </Pressable>
                    <Pressable
                      hitSlop={6}
                      onPress={() => {
                        setFocused(item);
                        setMenuOpen(true);
                      }}
                    >
                      <Text style={{ color: theme.textFaint, fontSize: 12, fontWeight: '700' }}>Options</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.inputBar, { borderTopColor: theme.divider, backgroundColor: theme.surface }]}>
          <Avatar uri={me?.avatar} name={me?.displayName ?? '?'} size={32} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment\u2026"
            placeholderTextColor={theme.textFaint}
            style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
            multiline
            maxLength={400}
            onSubmitEditing={send}
          />
          <Pressable onPress={send} disabled={!text.trim()} hitSlop={8}>
            <Ionicons name="send" size={22} color={text.trim() ? theme.brand : theme.textFaint} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ActionSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Comment options"
        actions={
          me?.id === focused?.authorId
            ? [
                {
                  label: 'Delete comment',
                  icon: 'trash-outline' as const,
                  destructive: true,
                  onPress: async () => {
                    const ok = await confirm({ title: 'Delete comment?', confirmLabel: 'Delete', destructive: true });
                    if (ok && focused) {
                      db.deleteComment(focused.id);
                      toast('Comment deleted');
                    }
                  },
                },
              ]
            : [
                { label: 'Report comment', icon: 'flag-outline' as const, destructive: true, onPress: () => setReportOpen(true) },
                { label: 'Copy text', icon: 'copy-outline' as const, onPress: () => toast('Copied to clipboard') },
              ]
        }
      />
      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} targetType="comment" targetId={focused?.id ?? ''} targetLabel="a comment" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 560, alignSelf: 'center', maxHeight: '86%', height: '86%', borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' },
  grabber: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.lg, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, maxHeight: 100, borderWidth: StyleSheet.hairlineWidth },
});

import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { commentsFor, userById } from '../store/selectors';
import { timeAgo } from '../lib/format';
import { Avatar, Button, EmptyState, IconBtn } from './ui';

interface Props {
  visible: boolean;
  onClose: () => void;
  kind: 'post' | 'short' | 'video';
  targetId: string;
}

export const CommentsModal: React.FC<Props> = ({ visible, onClose, kind, targetId }) => {
  const { theme } = useTheme();
  const { state, me, addComment, deleteComment } = useStore();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  const list = useMemo(() => commentsFor(state, targetId, kind), [state, targetId, kind]);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    addComment(kind, targetId, value);
    setText('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close comments" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { backgroundColor: theme.bg, paddingBottom: insets.bottom + 10 }]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.header}>
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>Comments</Text>
            <IconBtn name="close" onPress={onClose} accessibilityLabel="Close comments" size={22} />
          </View>

          <FlatList
            data={list}
            keyExtractor={(c) => c.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, flexGrow: 1 }}
            ListEmptyComponent={
              <EmptyState
                icon="chatbubble-ellipses-outline"
                title="No comments yet"
                subtitle="Be the first to say something kind."
              />
            }
            renderItem={({ item, index }) => {
              const author = userById(state, item.authorId);
              const mine = item.authorId === me?.id;
              return (
                <Animated.View entering={FadeInUp.delay(index * 25).duration(220)} style={styles.row}>
                  <Avatar uri={author?.avatar} name={author?.displayName} size={34} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: theme.textDim, fontWeight: '700', fontSize: 13 }}>
                        @{author?.username ?? 'unknown'}
                      </Text>
                      <Text style={{ color: theme.textFaint, fontSize: 11.5 }}>{timeAgo(item.at)}</Text>
                      {item.isDemo && (
                        <Text style={{ color: theme.textFaint, fontSize: 9.5, fontWeight: '800' }}>DEMO</Text>
                      )}
                    </View>
                    <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20, marginTop: 2 }}>{item.text}</Text>
                  </View>
                  {mine && (
                    <IconBtn
                      name="trash-outline"
                      size={17}
                      color={theme.textFaint}
                      accessibilityLabel="Delete comment"
                      onPress={() => deleteComment(item.id)}
                    />
                  )}
                </Animated.View>
              );
            }}
          />

          <View style={[styles.inputBar, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
            <Avatar uri={me?.avatar} name={me?.displayName} size={32} />
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Add a comment…"
              placeholderTextColor={theme.textFaint}
              style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceAlt }]}
              maxLength={500}
              multiline
              returnKeyType="send"
              onSubmitEditing={submit}
              accessibilityLabel="Comment input"
            />
            <Button title="Post" size="sm" onPress={submit} disabled={!text.trim()} />
          </View>
          <Text style={{ color: theme.textFaint, fontSize: 10.5, textAlign: 'center', marginTop: 6 }}>
            Comments are stored locally in demo mode — wire the comments API to go live.
          </Text>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(6,4,16,0.5)' },
  sheet: { height: '78%', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 10 },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 10 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12,
    paddingTop: 10, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, maxHeight: 110,
  },
});

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { conversationFor, convoMessages, isBlocked, userById } from '../store/selectors';
import { Avatar, IconBtn, useToast } from '../components/ui';
import { Media, VibeVideo } from '../components/Media';
import { BottomSheet } from './WatchScreen';
import { ReportSheet } from '../components/ReportSheet';
import { clockTime, fmtDuration } from '../lib/format';
import { pickMedia } from '../lib/media';
import type { Nav } from '../navigation/types';

/**
 * 1:1 chat. Text, image, video and voice-message UI with read receipts,
 * typing indicator, online status, delete, block and report.
 * Realtime transport is simulated in the store and marked as such in the UI.
 */
export const ChatScreen: React.FC<{ nav: Nav; convoId?: string; userId?: string }> = ({ nav, convoId, userId }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, me, ensureConvo, sendMessage, deleteMessage, markConvoRead, blockUser, unblockUser, muteUser, submitReport } = useStore();
  const listRef = useRef<FlatList>(null);

  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [recording, setRecording] = useState<number | null>(null);

  const id = useMemo(() => {
    if (convoId) return convoId;
    if (userId && me) return conversationFor(state, me.id, userId)?.id ?? '';
    return '';
  }, [convoId, userId, me?.id, state]);

  // Create the conversation outside of render to avoid updating the store
  // while another component is rendering.
  const [createdId, setCreatedId] = useState<string>('');
  useEffect(() => {
    if (!convoId && userId && me && !id) setCreatedId(ensureConvo(userId));
  }, [convoId, userId, me?.id, id, ensureConvo]);

  const activeId = convoId ?? (id || createdId);

  const convo = state.convos.find((c) => c.id === activeId);
  const otherId = convo ? convo.members.find((m) => m !== me?.id) ?? convo.members[0] : userId ?? '';
  const other = userById(state, otherId);
  const messages = useMemo(() => (activeId ? convoMessages(state, activeId) : []), [state, activeId]);

  useEffect(() => {
    if (activeId) markConvoRead(activeId);
  }, [activeId, messages.length, markConvoRead]);

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages.length]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setRecording((r) => (r == null ? null : r + 1)), 1000);
    return () => clearInterval(t);
  }, [recording !== null]);

  if (!other || !me) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + 40 }}>
        <Text style={{ color: theme.textDim, textAlign: 'center' }}>Conversation unavailable.</Text>
      </View>
    );
  }

  const blockedByMe = isBlocked(state, me.id, other.id);
  const blockedMe = isBlocked(state, other.id, me.id);
  const lastMine = [...messages].reverse().find((m) => m.senderId === me.id);

  const sendText = () => {
    const value = text.trim();
    if (!value) return;
    sendMessage(activeId, { kind: 'text', text: value });
    setText('');
  };

  const attach = async (kind: 'image' | 'video') => {
    const res = await pickMedia(kind === 'image' ? 'photo' : 'video');
    if (!res.ok) return toast.show(res.error ?? 'Unsupported file', 'alert-circle');
    if (!res.media) return;
    sendMessage(activeId, { kind, uri: res.media.uri, text: `Sent a ${kind}` });
    toast.show(`${kind === 'image' ? 'Photo' : 'Video'} sent`, 'paper-plane');
  };

  const stopRecording = (send: boolean) => {
    const seconds = Math.max(1, recording ?? 1);
    setRecording(null);
    if (send) sendMessage(activeId, { kind: 'voice', durationSec: seconds });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <IconBtn name="chevron-back" accessibilityLabel="Go back" onPress={() => nav.goBack()} />
        <Pressable
          onPress={() => nav.navigate('UserProfile', { userId: other.id })}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}
          accessibilityRole="button"
          accessibilityLabel={`Open ${other.username}'s profile`}
        >
          <Avatar uri={other.avatar} name={other.displayName} size={38} online={other.online && state.settings.showOnline} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
              {other.displayName}
            </Text>
            <Text style={{ color: other.online ? theme.success : theme.textFaint, fontSize: 11.5 }}>
              {other.online ? 'Active now' : `Last seen ${clockTime(other.lastSeen)}`}
            </Text>
          </View>
        </Pressable>
        <IconBtn name="ellipsis-horizontal" accessibilityLabel="Conversation options" onPress={() => setMenuOpen(true)} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          <View style={{ alignItems: 'center', paddingVertical: 14 }}>
            <Avatar uri={other.avatar} name={other.displayName} size={66} />
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginTop: 8 }}>{other.displayName}</Text>
            <Text style={{ color: theme.textFaint, fontSize: 12.5 }}>@{other.username} · you follow each other</Text>
            {other.isDemo && (
              <Text style={{ color: theme.textFaint, fontSize: 11, marginTop: 6 }}>
                Demo conversation — realtime transport is simulated
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const mine = item.senderId === me.id;
          const isLastMine = lastMine?.id === item.id;
          return (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}
            >
              {!mine && <Avatar uri={other.avatar} name={other.displayName} size={26} />}
              <Pressable
                onLongPress={() => {
                  deleteMessage(item.id);
                  toast.show('Message deleted for you', 'trash');
                }}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: mine ? theme.primary : theme.surface,
                    borderTopRightRadius: mine ? 6 : 20,
                    borderTopLeftRadius: mine ? 20 : 6,
                    borderWidth: mine ? 0 : 1,
                    borderColor: theme.border,
                  },
                ]}
                accessibilityLabel={mine ? 'Your message' : 'Their message'}
              >
                {item.deleted ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="close-circle-outline" size={14} color={mine ? 'rgba(255,255,255,0.8)' : theme.textFaint} />
                    <Text style={{ color: mine ? 'rgba(255,255,255,0.85)' : theme.textFaint, fontStyle: 'italic', fontSize: 13.5 }}>
                      Message deleted
                    </Text>
                  </View>
                ) : item.kind === 'image' ? (
                  <View style={{ width: 210 }}>
                    <Media uri={item.uri} style={{ width: 210, height: 260, borderRadius: 14 }} radius={14} />
                    {item.text ? (
                      <Text style={{ color: mine ? '#fff' : theme.text, fontSize: 13.5, marginTop: 8 }}>{item.text}</Text>
                    ) : null}
                  </View>
                ) : item.kind === 'video' ? (
                  <View style={{ width: 220 }}>
                    <VibeVideo uri={item.uri ?? ''} style={{ width: 220, height: 260 }} showCenterControl />
                    {item.text ? (
                      <Text style={{ color: mine ? '#fff' : theme.text, fontSize: 13.5, marginTop: 8 }}>{item.text}</Text>
                    ) : null}
                  </View>
                ) : item.kind === 'voice' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 170 }}>
                    <View style={[styles.voiceBtn, { backgroundColor: mine ? 'rgba(255,255,255,0.25)' : theme.primarySoft }]}>
                      <Ionicons name="play" size={15} color={mine ? '#fff' : theme.primary} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2.5, flex: 1 }}>
                      {[9, 15, 11, 19, 13, 8, 16, 12, 20, 10, 14, 8].map((h, i) => (
                        <View
                          key={i}
                          style={{ width: 2.5, height: h, borderRadius: 2, backgroundColor: mine ? 'rgba(255,255,255,0.85)' : theme.primary }}
                        />
                      ))}
                    </View>
                    <Text style={{ color: mine ? '#fff' : theme.textDim, fontSize: 11.5, fontWeight: '700' }}>
                      {fmtDuration(item.durationSec ?? 0)}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: mine ? '#fff' : theme.text, fontSize: 14.5, lineHeight: 20 }}>{item.text}</Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: 5 }}>
                  <Text style={{ color: mine ? 'rgba(255,255,255,0.75)' : theme.textFaint, fontSize: 10.5 }}>{clockTime(item.at)}</Text>
                  {mine && (
                    <Ionicons
                      name={item.read ? 'checkmark-done' : 'checkmark'}
                      size={13}
                      color={item.read ? '#7DE8FF' : 'rgba(255,255,255,0.75)'}
                    />
                  )}
                </View>
              </Pressable>
            </Animated.View>
          );
        }}
        ListFooterComponent={
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Animated.Text entering={FadeInUp} style={{ color: theme.textFaint, fontSize: 11 }}>
              {recording == null ? 'Realtime delivery is simulated in this preview' : 'Recording voice message…'}
            </Animated.Text>
          </View>
        }
      />

      {blockedByMe ? (
        <View style={[styles.blockedBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + 12 }]}>
          <Ionicons name="ban-outline" size={18} color={theme.danger} />
          <Text style={{ color: theme.textDim, fontSize: 13, flex: 1 }}>
            You blocked @{other.username}. Unblock to continue chatting.
          </Text>
          <Pressable onPress={() => unblockUser(other.id)} accessibilityRole="button" accessibilityLabel="Unblock user">
            <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}>Unblock</Text>
          </Pressable>
        </View>
      ) : blockedMe ? (
        <View style={[styles.blockedBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + 12 }]}>
          <Ionicons name="lock-closed-outline" size={18} color={theme.textFaint} />
          <Text style={{ color: theme.textDim, fontSize: 13, flex: 1 }}>
            @{other.username} is not accepting messages from you.
          </Text>
        </View>
      ) : recording != null ? (
        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + 12 }]}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.recDot, { backgroundColor: theme.danger }]} />
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>Recording {fmtDuration(recording)}</Text>
          </View>
          <Pressable onPress={() => stopRecording(false)} accessibilityRole="button" accessibilityLabel="Cancel recording">
            <Text style={{ color: theme.textDim, fontWeight: '700', fontSize: 13.5 }}>Cancel</Text>
          </Pressable>
          <Pressable onPress={() => stopRecording(true)} style={[styles.sendBtn, { backgroundColor: theme.primary }]} accessibilityRole="button" accessibilityLabel="Send voice message">
            <Ionicons name="send" size={17} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + 12 }]}>
          <Pressable onPress={() => attach('image')} style={styles.attachBtn} accessibilityRole="button" accessibilityLabel="Send photo">
            <Ionicons name="image-outline" size={23} color={theme.textDim} />
          </Pressable>
          <Pressable onPress={() => attach('video')} style={styles.attachBtn} accessibilityRole="button" accessibilityLabel="Send video">
            <Ionicons name="videocam-outline" size={23} color={theme.textDim} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={theme.textFaint}
            style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={sendText}
            accessibilityLabel="Message input"
          />
          {text.trim() ? (
            <Pressable onPress={sendText} style={[styles.sendBtn, { backgroundColor: theme.primary }]} accessibilityRole="button" accessibilityLabel="Send message">
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </Pressable>
          ) : (
            <Pressable onPress={() => setRecording(0)} style={styles.attachBtn} accessibilityRole="button" accessibilityLabel="Record voice message">
              <Ionicons name="mic-outline" size={23} color={theme.textDim} />
            </Pressable>
          )}
        </View>
      )}

      {menuOpen && (
        <BottomSheet title={`@${other.username}`} onClose={() => setMenuOpen(false)}>
          <Pressable style={styles.menuRow} onPress={() => { setMenuOpen(false); setReportOpen(true); }} accessibilityRole="button">
            <Ionicons name="flag-outline" size={20} color={theme.danger} />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Report user</Text>
          </Pressable>
          <Pressable
            style={styles.menuRow}
            onPress={() => {
              setMenuOpen(false);
              muteUser(other.id);
              toast.show('Notifications from this chat muted', 'volume-mute');
            }}
            accessibilityRole="button"
          >
            <Ionicons name="volume-mute-outline" size={20} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Mute notifications</Text>
          </Pressable>
          <Pressable
            style={styles.menuRow}
            onPress={() => {
              setMenuOpen(false);
              blockUser(other.id);
              toast.show('User blocked', 'ban');
            }}
            accessibilityRole="button"
          >
            <Ionicons name="ban-outline" size={20} color={theme.danger} />
            <Text style={{ color: theme.danger, fontSize: 15, fontWeight: '600' }}>Block user</Text>
          </Pressable>
        </BottomSheet>
      )}

      {reportOpen && (
        <ReportSheet
          visible
          onClose={() => setReportOpen(false)}
          targetType="user"
          targetId={other.id}
          targetLabel={`@${other.username}`}
          extraUserId={other.id}
          extraLabel="Block user"
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8, borderBottomWidth: 1 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { maxWidth: '78%', borderRadius: 20, padding: 12, paddingBottom: 8 },
  voiceBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 10, paddingTop: 10, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14.5, maxHeight: 110 },
  attachBtn: { padding: 8 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  blockedBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  recDot: { width: 10, height: 10, borderRadius: 5 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
});

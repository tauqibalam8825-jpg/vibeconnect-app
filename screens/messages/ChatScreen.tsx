import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AudioModule, RecordingPresets, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { radii, spacing } from '../../lib/theme';
import { formatDayLabel, timeAgo } from '../../lib/format';
import { Routes } from '../../lib/routes';
import { Avatar } from '../../components/Avatar';
import { IconButton, Banner } from '../../components/UI';
import { MediaPicker } from '../../components/MediaPicker';
import { ActionSheet, ReportSheet } from '../../components/Actions';
import { VoiceNote } from '../../components/VoiceNote';
import { WatchPlayer } from '../../components/VideoSurface';
import type { Message } from '../../lib/types';

const REPLIES: Record<string, string[]> = {
  Music: ['Just tracked a rough take \u2014 sending it over tonight.', 'That patch you mentioned worked perfectly.', 'Studio is free Thursday if you want to record.'],
  Food: ['Service was chaos. Come by tomorrow, I will cook for you.', 'Use the starchy water. Trust me.', 'Sending you the recipe in grams, not cups.'],
  Travel: ['Leaving at 4am for the ridge \u2014 phone will be off most of the day.', 'Film is better for this light. Bring the wide lens.', 'I will send the GPX file when I am back online.'],
  Tech: ['Just wrote up the harness, pushing it tonight.', 'p95 tells the truth. Averages lie.', 'Let us sync after standup, I have numbers.'],
  Design: ['Redrew it at 16px and the whole set fell into place.', 'Ship the boring version first.', 'Lunch? I need to show you this type specimen in person.'],
  Fitness: ['Rest day. Walked 8km instead.', 'Add one rep, not one set.', 'Filming the mobility flow tomorrow morning.'],
};
const FALLBACK_REPLIES = [
  'Just saw this \u2014 give me ten minutes and I will reply properly.',
  'That is exactly what I needed to hear today.',
  'Can we talk about it tomorrow morning? My brain is soup.',
  'Sending you something related in a minute.',
  'Yes. Absolutely yes.',
];

function groupFor(userCategory: string): string[] {
  return REPLIES[userCategory] ?? FALLBACK_REPLIES;
}

export function ChatScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { me, db: store, toast, confirm, version } = useApp();
  const peerId = route.params?.userId as string;
  const peer = db.userById(peerId);

  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const [reactionFor, setReactionFor] = useState<Message | null>(null);
  const [viewer, setViewer] = useState<Message | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);

  const conversation = useMemo(() => (me && peer ? db.findOrCreateConversation(me.id, peer.id) : null), [me, peer]);
  const messages = useMemo(() => (conversation && me ? db.messagesFor(conversation.id, me.id) : []), [conversation, me, version]);
  const allowed = me && peer ? db.canMessage(me, peer) : { ok: false, reason: 'Sign in first' };

  useEffect(() => {
    if (conversation && me) db.markConversationRead(conversation.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, messages.length]);

  useEffect(() => {
    const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(timer);
  }, [messages.length, typing]);

  if (!me || !peer || !store || !conversation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.textMuted }}>Conversation unavailable</Text>
      </SafeAreaView>
    );
  }

  const simulateReply = () => {
    const pool = groupFor(peer.category);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      db.sendMessage({ conversationId: conversation.id, type: 'text', text: pool[Math.floor(Math.random() * pool.length)] });
      setTimeout(() => db.markConversationRead(conversation.id), 400);
    }, 1400 + Math.random() * 900);
  };

  const sendText = () => {
    if (!text.trim() || !allowed.ok) return;
    const message = db.sendMessage({ conversationId: conversation.id, type: 'text', text });
    setText('');
    setTimeout(() => db.markMessageRead(message.id), 1600);
    simulateReply();
  };

  const startRecording = async () => {
    setRecordingError('');
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setRecordingError('Microphone access is required for voice notes. You can still send text, photos and clips.');
        return;
      }
      await AudioModule.setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingOpen(true);
    } catch {
      setRecordingError('Voice recording is not available on this device. Text and media messages still work.');
    }
  };

  const stopRecording = async (send: boolean) => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      const duration = recorderState.durationMillis ?? 0;
      setRecordingOpen(false);
      if (send && uri && duration > 400) {
        const message = db.sendMessage({ conversationId: conversation.id, type: 'voice', mediaUri: uri, durationMs: Math.round(duration) });
        simulateReply();
        setTimeout(() => db.markMessageRead(message.id), 1600);
      }
    } catch {
      setRecordingOpen(false);
      setRecordingError('Could not finish that recording \u2014 try again.');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const mine = item.senderId === me.id;
    const bubbleStyle = mine
      ? { backgroundColor: theme.dark ? '#6C4CF1' : '#6C4CF1', borderBottomRightRadius: 6 }
      : { backgroundColor: theme.surface, borderBottomLeftRadius: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border };
    const textColor = mine ? '#fff' : theme.text;

    return (
      <Animated.View entering={FadeInUp.duration(180)} style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
        {!mine ? <Avatar uri={peer.avatar} name={peer.displayName} size={30} /> : null}
        <Pressable
          onLongPress={() => setReactionFor(item)}
          onPress={() => {
            if (item.type === 'image' || item.type === 'video') setViewer(item);
          }}
          style={[styles.bubble, bubbleStyle]}
        >
          {item.type === 'text' ? <Text style={{ color: textColor, fontSize: 15, lineHeight: 21 }}>{item.text}</Text> : null}
          {item.type === 'image' ? (
            <View>
              <Image source={{ uri: item.mediaUri }} style={styles.media} contentFit="cover" transition={200} />
              <View style={styles.mediaTag}>
                <Ionicons name="expand-outline" size={13} color="#fff" />
              </View>
            </View>
          ) : null}
          {item.type === 'video' ? (
            <View>
              <Image source={{ uri: `https://picsum.photos/seed/${item.id}/400/300` }} style={styles.media} contentFit="cover" transition={200} />
              <View style={styles.playOverlay}>
                <Ionicons name="play" size={22} color="#fff" />
              </View>
            </View>
          ) : null}
          {item.type === 'voice' ? <VoiceNote uri={item.mediaUri ?? ''} durationMs={item.durationMs} mine={mine} seed={item.id} /> : null}
          <View style={styles.metaRow}>
            <Text style={{ color: mine ? 'rgba(255,255,255,0.75)' : theme.textFaint, fontSize: 11 }}>{formatDayLabel(item.createdAt)}</Text>
            {mine ? (
              <Ionicons name={item.status === 'read' ? 'checkmark-done' : 'checkmark'} size={13} color={item.status === 'read' ? '#2BE0C8' : 'rgba(255,255,255,0.75)'} />
            ) : null}
          </View>
          {item.reactions.length > 0 ? (
            <View style={[styles.reactions, { backgroundColor: theme.elevated, borderColor: theme.border }]}>
              <Text style={{ fontSize: 13 }}>{item.reactions.join(' ')}</Text>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.divider, backgroundColor: theme.bg }]}>
        <IconButton icon="chevron-back" size={36} iconSize={20} variant="ghost" onPress={() => navigation.goBack()} />
        <Avatar uri={peer.avatar} name={peer.displayName} size={40} onPress={() => navigation.navigate(Routes.UserProfile, { id: peer.id })} />
        <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate(Routes.UserProfile, { id: peer.id })}>
          <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '800', fontSize: 15.5 }}>{peer.displayName}</Text>
          <Text style={{ color: typing ? theme.accent : theme.textFaint, fontSize: 12, fontWeight: typing ? '700' : '500' }}>
            {typing ? 'typing\u2026' : peer.settings.showActivityStatus ? `@${peer.username} \u00b7 active recently` : `@${peer.username}`}
          </Text>
        </Pressable>
        <IconButton icon="call-outline" onPress={() => navigation.navigate(Routes.Call, { userId: peer.id, kind: 'voice' })} />
        <IconButton icon="videocam-outline" onPress={() => navigation.navigate(Routes.Call, { userId: peer.id, kind: 'video' })} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={4}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderMessage}
          ListHeaderComponent={
            <View style={{ alignItems: 'center', paddingBottom: spacing.lg }}>
              <Avatar uri={peer.avatar} name={peer.displayName} size={72} />
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17, marginTop: 10 }}>{peer.displayName}</Text>
              <Text style={{ color: theme.textFaint, fontSize: 13, marginTop: 2 }}>@{peer.username} \u00b7 {db.followerCount(peer).toLocaleString()} followers</Text>
              <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 10, textAlign: 'center', maxWidth: 280 }}>
                This conversation is private between you two. Messages are stored on your device in this build.
              </Text>
            </View>
          }
          ListFooterComponent={
            typing ? (
              <View style={[styles.typingRow]}>
                <Avatar uri={peer.avatar} name={peer.displayName} size={26} />
                <View style={[styles.typingBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.dot, { backgroundColor: theme.textFaint }]} />
                  <View style={[styles.dot, { backgroundColor: theme.textFaint, opacity: 0.7 }]} />
                  <View style={[styles.dot, { backgroundColor: theme.textFaint, opacity: 0.45 }]} />
                </View>
              </View>
            ) : null
          }
        />

        {!allowed.ok ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
            <Banner text={allowed.reason ?? 'Messaging unavailable'} tone="warning" icon="lock-closed-outline" />
          </View>
        ) : (
          <View style={[styles.composer, { backgroundColor: theme.bg, borderTopColor: theme.divider }]}>
            <IconButton icon="image-outline" onPress={() => setPickerOpen(true)} />
            <IconButton icon="mic-outline" onPress={startRecording} />
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={`Message @${peer.username}\u2026`}
              placeholderTextColor={theme.textFaint}
              style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
              multiline
              maxLength={800}
              onSubmitEditing={sendText}
            />
            <IconButton icon="send" variant="gradient" onPress={sendText} />
          </View>
        )}
      </KeyboardAvoidingView>

      {/* recording overlay */}
      {recordingOpen ? (
        <View style={[styles.recordOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.recordCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.pulse, { backgroundColor: theme.danger }]} />
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>Recording voice note</Text>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 26, fontWeight: '800', marginTop: 12, letterSpacing: 1 }}>
              {String(Math.floor((recorderState.durationMillis ?? 0) / 60000)).padStart(2, '0')}:{String(Math.floor(((recorderState.durationMillis ?? 0) % 60000) / 1000)).padStart(2, '0')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <Pressable onPress={() => stopRecording(false)} style={[styles.recordBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
                <Text style={{ color: theme.danger, fontWeight: '800' }}>Discard</Text>
              </Pressable>
              <Pressable onPress={() => stopRecording(true)} style={[styles.recordBtn, { backgroundColor: theme.brand }]}>
                <Ionicons name="send" size={17} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800' }}>Send</Text>
              </Pressable>
            </View>
            <Text style={{ color: theme.textFaint, fontSize: 12, marginTop: 14, textAlign: 'center' }}>Hold the mic again next time for a quick note.</Text>
          </View>
        </View>
      ) : null}

      {recordingError ? (
        <View style={{ padding: spacing.lg }}>
          <Banner text={recordingError} tone="warning" icon="warning-outline" onAction={() => setRecordingError('')} actionLabel="OK" />
        </View>
      ) : null}

      <MediaPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        kind="any"
        title="Send media"
        onSelect={(items) => {
          const item = items[0];
          if (!item) return;
          db.sendMessage({
            conversationId: conversation.id,
            type: item.type === 'video' ? 'video' : 'image',
            mediaUri: item.uri,
            mediaType: item.type,
            durationMs: item.durationMs,
          });
          toast(item.type === 'video' ? 'Video sent' : 'Photo sent');
          simulateReply();
        }}
      />

      {reactionFor ? (
        <View style={[styles.reactionOverlay, { backgroundColor: theme.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setReactionFor(null)} />
          <View style={[styles.reactionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={{ color: theme.textMuted, fontSize: 12.5, fontWeight: '700', marginBottom: 10 }}>React</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {['\u2764\uFE0F', '\U0001F602', '\U0001F44D', '\U0001F525', '\U0001F62E'].map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => {
                    db.reactToMessage(reactionFor.id, emoji);
                    setReactionFor(null);
                  }}
                  style={[styles.emoji, { backgroundColor: theme.surfaceAlt }]}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable
                onPress={() => {
                  setMenuOpen(true);
                  setReactionFor(null);
                }}
                style={[styles.recordBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, flex: 1 }]}
              >
                <Ionicons name="ellipsis-horizontal" size={17} color={theme.text} />
                <Text style={{ color: theme.text, fontWeight: '800' }}>More</Text>
              </Pressable>
              <Pressable onPress={() => setReactionFor(null)} style={[styles.recordBtn, { backgroundColor: theme.brand, flex: 1 }]}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      <ActionSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Message options"
        actions={[
          { label: 'Delete for everyone', icon: 'trash-outline', destructive: true, onPress: async () => {
              const ok = await confirm({ title: 'Delete this message?', message: 'It disappears for both of you.', confirmLabel: 'Delete', destructive: true });
              if (ok && reactionFor) {
                db.deleteMessage(reactionFor.id);
                toast('Message deleted');
              }
            } },
          { label: 'Report message', icon: 'flag-outline', destructive: true, onPress: () => setReportOpen(true) },
          { label: 'View profile', icon: 'person-outline', onPress: () => navigation.navigate(Routes.UserProfile, { id: peer.id }) },
        ]}
      />
      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} targetType="message" targetId={reactionFor?.id ?? ''} targetLabel="a message" />

      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)} statusBarTranslucent>
        <View style={[styles.viewer, { backgroundColor: 'rgba(6,5,12,0.95)' }]}>
          <Pressable style={styles.viewerClose} onPress={() => setViewer(null)} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {viewer?.type === 'image' ? (
            <Image source={{ uri: viewer.mediaUri }} style={{ width: '90%', height: '70%', borderRadius: 12 }} contentFit="contain" />
          ) : (
            <View style={{ width: '92%', height: '60%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
              <WatchPlayer uri={viewer?.mediaUri ?? ''} />
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.sm, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 20, borderBottomRightRadius: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: 6 },
  media: { width: 210, height: 250, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.15)' },
  mediaTag: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(11,9,18,0.6)', borderRadius: 12, padding: 5 },
  playOverlay: { position: 'absolute', alignSelf: 'center', top: '42%', width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(11,9,18,0.6)', alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  reactions: { position: 'absolute', bottom: -14, left: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  typingBubble: { flexDirection: 'row', gap: 4, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  dot: { width: 7, height: 7, borderRadius: 4 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: spacing.md, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, fontSize: 15, maxHeight: 120, borderWidth: StyleSheet.hairlineWidth },
  recordOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  recordCard: { width: '100%', maxWidth: 380, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: spacing.xl, alignItems: 'center' },
  pulse: { width: 10, height: 10, borderRadius: 5 },
  recordBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth },
  reactionOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  reactionCard: { width: '100%', maxWidth: 380, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: spacing.xl },
  emoji: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  viewer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewerClose: { position: 'absolute', top: 54, right: 22, zIndex: 10 },
});

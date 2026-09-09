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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { activeStories, userById } from '../store/selectors';
import { Avatar, Button, DemoTag, EmptyState, useToast } from '../components/ui';
import { VibeVideo } from '../components/Media';
import { ReportSheet } from '../components/ReportSheet';
import { BottomSheet } from './WatchScreen';
import { STORY_TTL, type StoryItem } from '../types';
import { timeAgo } from '../lib/format';
import type { Nav } from '../navigation/types';

const AUTO_MS = 5000;

/**
 * Story viewer. Supports playback of all live stories of a user, 24h expiry,
 * owner-only viewer list, replies, deletion and reporting.
 */
export const StoryViewerScreen: React.FC<{ nav: Nav; userId?: string; storyId?: string }> = ({
  nav, userId, storyId,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const toast = useToast();
  const { state, me, markStoryViewed, replyToStory, deleteContent } = useStore();

  const [reply, setReply] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const groups = useMemo(() => activeStories(state), [state]);
  const targetUserId = userId ?? (storyId ? state.stories.find((s) => s.id === storyId)?.authorId : undefined);
  const group = targetUserId ? groups.find((g) => g.author.id === targetUserId) : undefined;

  const startIndex = storyId && group ? Math.max(0, group.items.findIndex((s) => s.id === storyId)) : 0;
  const [pos, setPos] = useState(startIndex);
  const story: StoryItem | undefined = group?.items[pos];

  useEffect(() => {
    if (story) markStoryViewed(story.id);
  }, [story?.id, markStoryViewed, story]);

  useEffect(() => {
    if (!story) return;
    const t = setTimeout(() => {
      if (group && pos < group.items.length - 1) setPos((p) => p + 1);
      else nav.goBack();
    }, AUTO_MS);
    return () => clearTimeout(t);
  }, [story?.id, pos, group, nav, story]);

  if (!group || !story) {
    return (
      <View style={{ flex: 1, backgroundColor: '#07050F', paddingTop: insets.top + 40 }}>
        <EmptyState
          icon="sparkles-outline"
          title="This story has expired"
          subtitle="Stories disappear 24 hours after they are posted."
          action={<Button title="Close" variant="ghost" onPress={() => nav.goBack()} />}
        />
      </View>
    );
  }

  const isMine = story.authorId === me?.id;
  const viewers = story.viewers.map((id) => userById(state, id)).filter(Boolean);
  const remaining = STORY_TTL - (Date.now() - story.at);

  const send = () => {
    const value = reply.trim();
    if (!value) return;
    replyToStory(story.id, value);
    setReply('');
    toast.show(`Reply sent to @${group.author.username}`, 'paper-plane');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#07050F' }}>
      <View style={{ height: '100%', width: '100%' }}>
        {story.kind === 'video' ? (
          <VibeVideo uri={story.uri} style={{ flex: 1 }} contentFit="cover" showCenterControl />
        ) : (
          <Animated.Image
            source={{ uri: story.uri }}
            entering={FadeIn.duration(220)}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        )}
        <LinearGradient colors={['rgba(7,5,15,0.75)', 'transparent']} style={styles.topFade} pointerEvents="none" />
        <LinearGradient colors={['transparent', 'rgba(7,5,15,0.85)']} style={styles.bottomFade} pointerEvents="none" />

        {/* progress bars */}
        <View style={[styles.progress, { top: insets.top + 8 }]}>
          {group.items.map((s, i) => (
            <View key={s.id} style={[styles.barTrack, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <View
                style={[
                  styles.barFill,
                  { backgroundColor: '#fff', width: i < pos ? '100%' : i === pos ? '60%' : '0%' },
                ]}
              />
            </View>
          ))}
        </View>

        {/* header */}
        <View style={[styles.header, { top: insets.top + 20 }]}>
          <Avatar uri={group.author.avatar} name={group.author.displayName} size={36} ring="story" />
          <Pressable
            onPress={() => nav.navigate('UserProfile', { userId: group.author.id })}
            style={{ flex: 1, marginLeft: 10 }}
            accessibilityRole="button"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{group.author.displayName}</Text>
              {group.author.verified && <Ionicons name="checkmark-circle" size={13} color="#22D3EE" />}
              {story.isDemo && <DemoTag />}
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11.5 }}>
              {timeAgo(story.at)} · expires in {Math.max(1, Math.round(remaining / 3600000))}h
            </Text>
          </Pressable>
          {isMine && (
            <Pressable onPress={() => setViewersOpen(true)} style={styles.viewersBtn} accessibilityRole="button" accessibilityLabel="Story viewers">
              <Ionicons name="eye-outline" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>{story.viewers.length}</Text>
            </Pressable>
          )}
          <IconBtnLight name="ellipsis-horizontal" onPress={() => setMenuOpen(true)} accessibilityLabel="Story options" />
          <IconBtnLight name="close" onPress={() => nav.goBack()} accessibilityLabel="Close stories" />
        </View>

        {/* tap zones */}
        <View style={styles.tapRow} pointerEvents="box-none">
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setPos((p) => Math.max(0, p - 1))}
            accessibilityLabel="Previous story"
            accessibilityRole="button"
          />
          <Pressable
            style={{ flex: 1 }}
            onPress={() => (group && pos < group.items.length - 1 ? setPos((p) => p + 1) : nav.goBack())}
            accessibilityLabel="Next story"
            accessibilityRole="button"
          />
        </View>

        {/* reply bar */}
        {!isMine ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.replyBar, { bottom: insets.bottom + 16 }]}>
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder={`Reply to @${group.author.username}…`}
              placeholderTextColor="rgba(255,255,255,0.65)"
              style={styles.replyInput}
              returnKeyType="send"
              onSubmitEditing={send}
              accessibilityLabel="Reply to story"
            />
            <Pressable onPress={send} disabled={!reply.trim()} style={[styles.sendBtn, { opacity: reply.trim() ? 1 : 0.5 }]} accessibilityRole="button" accessibilityLabel="Send reply">
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </Pressable>
          </KeyboardAvoidingView>
        ) : (
          <View style={[styles.replyBar, { bottom: insets.bottom + 16 }]}>
            <Pressable onPress={() => setViewersOpen(true)} style={styles.ownerPill} accessibilityRole="button">
              <Ionicons name="people-outline" size={15} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                Seen by {story.viewers.length} {story.viewers.length === 1 ? 'person' : 'people'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {menuOpen && (
        <BottomSheet title="Story options" onClose={() => setMenuOpen(false)}>
          <Pressable style={styles.menuRow} onPress={() => { setMenuOpen(false); setReportOpen(true); }} accessibilityRole="button">
            <Ionicons name="flag-outline" size={20} color="#FF5F7E" />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Report story</Text>
          </Pressable>
          {isMine && (
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                setMenuOpen(false);
                deleteContent('story', story.id);
                toast.show('Story removed', 'trash');
                nav.goBack();
              }}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={20} color="#FF5F7E" />
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Delete my story</Text>
            </Pressable>
          )}
        </BottomSheet>
      )}

      {viewersOpen && (
        <BottomSheet title="Story viewers" onClose={() => setViewersOpen(false)}>
          {viewers.length === 0 ? (
            <EmptyState icon="eye-outline" title="No views yet" subtitle="Share your story to get it seen." />
          ) : (
            <FlatList
              data={viewers}
              keyExtractor={(u) => u!.id}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.viewerRow}
                  onPress={() => { setViewersOpen(false); nav.navigate('UserProfile', { userId: item!.id }); }}
                  accessibilityRole="button"
                >
                  <Avatar uri={item!.avatar} name={item!.displayName} size={38} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{item!.displayName}</Text>
                    <Text style={{ color: theme.textFaint, fontSize: 12 }}>@{item!.username}</Text>
                  </View>
                  <Text style={{ color: theme.textFaint, fontSize: 11.5 }}>{timeAgo(story.at)}</Text>
                </Pressable>
              )}
            />
          )}
        </BottomSheet>
      )}

      {reportOpen && (
        <ReportSheet
          visible
          onClose={() => setReportOpen(false)}
          targetType="story"
          targetId={story.id}
          targetLabel={`Story by @${group.author.username}`}
          extraUserId={group.author.id}
          extraLabel="Block user"
        />
      )}
    </View>
  );
};

const IconBtnLight: React.FC<{
  name: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accessibilityLabel: string;
}> = ({ name, onPress, accessibilityLabel }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    hitSlop={8}
    style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.6 : 1 })}
  >
    <Ionicons name={name} size={22} color="#fff" />
  </Pressable>
);

const styles = StyleSheet.create({
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 },
  progress: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', gap: 4 },
  barTrack: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  header: { position: 'absolute', left: 12, right: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
  },
  tapRow: { position: 'absolute', left: 0, right: 0, top: 90, bottom: 110, flexDirection: 'row' },
  replyBar: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  replyInput: {
    flex: 1, borderRadius: 999, borderWidth: 1.2, borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 18, paddingVertical: 12, color: '#fff', backgroundColor: 'rgba(10,8,22,0.35)',
    fontSize: 14,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  ownerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  viewerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
});

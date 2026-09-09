import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { isFollowing, liveShorts, userById } from '../store/selectors';
import { Avatar, DemoTag, EmptyState, IconBtn, useToast } from '../components/ui';
import { VibeVideo } from '../components/Media';
import { CommentsModal } from '../components/Comments';
import { ReportSheet } from '../components/ReportSheet';
import { BottomSheet } from './WatchScreen';
import { fmtCount, timeAgo } from '../lib/format';
import type { Nav } from '../navigation/types';

/** Vertical, full-screen short video feed ("Vibes"). */
export const ShortsScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const toast = useToast();
  const { state, me, toggleLike, toggleSave, shareItem, deleteContent, recordView, toggleFollow, submitReport } = useStore();

  const [index, setIndex] = useState(0);
  const [commentsId, setCommentsId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());

  const items = useMemo(() => liveShorts(state, me?.id), [state, me?.id]);

  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) {
      setIndex(first.index);
      const item = first.item as { id: string };
      if (!seen.current.has(item.id)) {
        seen.current.add(item.id);
      }
    }
  }, []);

  const config = useRef({ itemVisiblePercentThreshold: 60 }).current;

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0916', paddingTop: insets.top + 40 }}>
        <EmptyState
          icon="flash-outline"
          title="No vibes yet"
          subtitle="Be the first to post a short video for your circle."
        />
        <View style={{ alignItems: 'center' }}>
          <Pressable onPress={() => nav.navigate('Create', { mode: 'short' })} style={[styles.createBtn, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800' }}>Create a vibe</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const height2 = Math.max(height, 520);

  return (
    <View style={{ flex: 1, backgroundColor: '#07050F' }}>
      <FlatList
        data={items}
        keyExtractor={(s) => s.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height2}
        decelerationRate="fast"
        onViewableItemsChanged={onViewable}
        viewabilityConfig={config}
        getItemLayout={(_, i) => ({ length: height2, offset: height2 * i, index: i })}
        renderItem={({ item, index: i }) => {
          const author = userById(state, item.authorId);
          const liked = me ? item.likes.includes(me.id) : false;
          const saved = me ? item.saves.includes(me.id) : false;
          const following = me ? isFollowing(state, me.id, item.authorId) : false;
          const comments = state.comments.filter((c) => c.postId === item.id && !c.removed);

          return (
            <View style={{ width: '100%', height: height2 }}>
              <VibeVideo
                uri={item.uri}
                poster={item.poster}
                style={{ flex: 1 }}
                contentFit="cover"
                active={i === index}
                onActive={() => recordView('short', item.id)}
              />
              <LinearGradient
                colors={['rgba(7,5,15,0.65)', 'transparent', 'rgba(7,5,15,0.9)']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {/* right rail */}
              <View style={[styles.rail, { bottom: insets.bottom + 130 }]}>
                <RailBtn
                  icon={liked ? 'heart' : 'heart-outline'}
                  label={fmtCount(item.likes.length)}
                  color={liked ? '#FB5C7E' : '#fff'}
                  onPress={() => toggleLike('short', item.id)}
                  accessibilityLabel={liked ? 'Unlike vibe' : 'Like vibe'}
                />
                <RailBtn icon="chatbubble-outline" label={fmtCount(comments.length)} onPress={() => setCommentsId(item.id)} accessibilityLabel="Open comments" />
                <RailBtn
                  icon="paper-plane-outline"
                  label={fmtCount(item.shares)}
                  onPress={() => {
                    shareItem('short', item.id, `Watch this vibe on VibeConnect`);
                    toast.show('Share sheet opened', 'paper-plane');
                  }}
                  accessibilityLabel="Share vibe"
                />
                <RailBtn
                  icon={saved ? 'bookmark' : 'bookmark-outline'}
                  label={saved ? 'Saved' : 'Save'}
                  onPress={() => { toggleSave('short', item.id); toast.show(saved ? 'Removed from saved' : 'Saved', 'bookmark'); }}
                  accessibilityLabel="Save vibe"
                />
                <RailBtn icon="ellipsis-horizontal" label="More" onPress={() => setMenuId(item.id)} accessibilityLabel="More options" />
                {author && (
                  <Pressable
                    onPress={() => nav.navigate('UserProfile', { userId: author.id })}
                    style={styles.railAvatar}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${author.username}`}
                  >
                    <Avatar uri={author.avatar} name={author.displayName} size={42} />
                    {!following && (
                      <Pressable
                        onPress={() => toggleFollow(author.id)}
                        style={[styles.followDot, { backgroundColor: theme.primary }]}
                        accessibilityLabel="Follow creator"
                      >
                        <Ionicons name="add" size={13} color="#fff" />
                      </Pressable>
                    )}
                  </Pressable>
                )}
              </View>

              {/* bottom info */}
              <View style={[styles.bottom, { bottom: insets.bottom + 24 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pressable onPress={() => author && nav.navigate('UserProfile', { userId: author.id })} accessibilityRole="button">
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>@{author?.username}</Text>
                  </Pressable>
                  {author?.verified && <Ionicons name="checkmark-circle" size={14} color="#22D3EE" />}
                  <Pressable
                    onPress={() => author && toggleFollow(author.id)}
                    style={[styles.followPill, { borderColor: following ? 'rgba(255,255,255,0.5)' : '#fff' }]}
                    accessibilityRole="button"
                    accessibilityLabel={following ? 'Unfollow' : 'Follow'}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                      {following ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                  {item.isDemo && <DemoTag />}
                </View>
                <Text style={{ color: '#fff', fontSize: 13.5, lineHeight: 19, marginTop: 8 }}>
                  {item.caption}
                </Text>
                {item.hashtags.length > 0 && (
                  <Text style={{ color: '#9EE8FF', fontSize: 13, marginTop: 4, fontWeight: '700' }}>
                    {item.hashtags.map((h) => `#${h}`).join(' ')}
                  </Text>
                )}
                <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11.5, marginTop: 8 }}>
                  {fmtCount(item.views)} views · {timeAgo(item.at)} ago
                </Text>
              </View>

              <View style={[styles.topBar, { top: insets.top + 6 }]}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>Vibes</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <IconBtn name="camera-outline" color="#fff" accessibilityLabel="Create a vibe" onPress={() => nav.navigate('Create', { mode: 'short' })} />
                  <IconBtn name="close" color="#fff" accessibilityLabel="Close vibes" onPress={() => nav.goBack()} />
                </View>
              </View>
            </View>
          );
        }}
      />

      {commentsId && (
        <CommentsModal visible onClose={() => setCommentsId(null)} kind="short" targetId={commentsId} />
      )}

      {menuId && (() => {
        const item = items.find((s) => s.id === menuId)!;
        const mine = item.authorId === me?.id;
        const author = userById(state, item.authorId);
        return (
          <BottomSheet title="Vibe options" onClose={() => setMenuId(null)}>
            <Pressable
              style={styles.menuRow}
              onPress={() => { setMenuId(null); setReportId(item.id); }}
              accessibilityRole="button"
            >
              <Ionicons name="flag-outline" size={20} color="#FF5F7E" />
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Report vibe</Text>
            </Pressable>
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                setMenuId(null);
                Share.share({ message: `${item.caption}\nhttps://vibeconnect.app/short/${item.id}` }).catch(() => {});
              }}
              accessibilityRole="button"
            >
              <Ionicons name="link-outline" size={20} color={theme.text} />
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Copy link</Text>
            </Pressable>
            {mine && (
              <Pressable
                style={styles.menuRow}
                onPress={() => { setMenuId(null); deleteContent('short', item.id); toast.show('Vibe deleted', 'trash'); nav.goBack(); }}
                accessibilityRole="button"
              >
                <Ionicons name="trash-outline" size={20} color="#FF5F7E" />
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Delete my vibe</Text>
              </Pressable>
            )}
            {!mine && author && (
              <Pressable
                style={styles.menuRow}
                onPress={() => { setMenuId(null); toggleFollow(author.id); toast.show('Unfollowed creator'); }}
                accessibilityRole="button"
              >
                <Ionicons name="person-remove-outline" size={20} color={theme.text} />
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Unfollow @{author.username}</Text>
              </Pressable>
            )}
          </BottomSheet>
        );
      })()}

      {reportId && (() => {
        const item = items.find((s) => s.id === reportId)!;
        return (
          <ReportSheet
            visible
            onClose={() => setReportId(null)}
            targetType="short"
            targetId={item.id}
            targetLabel={`Vibe by @${userById(state, item.authorId)?.username ?? 'unknown'}`}
            extraUserId={item.authorId}
            extraLabel="Block creator"
          />
        );
      })()}
    </View>
  );
};

const RailBtn: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  color?: string;
  accessibilityLabel: string;
}> = ({ icon, label, onPress, color, accessibilityLabel }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [styles.railBtn, { opacity: pressed ? 0.65 : 1 }]}
  >
    <Ionicons name={icon} size={29} color={color ?? '#fff'} />
    <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '700', marginTop: 3 }}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  rail: { position: 'absolute', right: 12, alignItems: 'center', gap: 20 },
  railBtn: { alignItems: 'center' },
  railAvatar: { marginTop: 6 },
  followDot: {
    position: 'absolute', bottom: -7, alignSelf: 'center', width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#07050F',
  },
  bottom: { position: 'absolute', left: 16, right: 88 },
  followPill: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  topBar: { position: 'absolute', left: 16, right: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
});

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { spacing } from '../../lib/theme';
import { Routes } from '../../lib/routes';
import { timeAgo, formatCount } from '../../lib/format';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/UI';

const STORY_MS = 6000;

export function StoryViewerScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { me, confirm, toast } = useApp();
  const { height } = useWindowDimensions();
  const authorId = route.params?.authorId as string;
  const groups = useMemo(() => (me ? db.storyGroups(me) : []), [me]);
  const groupIndex = Math.max(0, groups.findIndex((g) => g.author.id === authorId));
  const [group, setGroup] = useState(groupIndex);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentGroup = groups[group];
  const story = currentGroup?.stories[index];

  useEffect(() => {
    setProgress(0);
    if (!story) return;
    db.viewStory(story.id);
    const started = Date.now();
    timer.current = setInterval(() => {
      const elapsed = Date.now() - started;
      const fraction = Math.min(1, elapsed / STORY_MS);
      setProgress(fraction);
      if (fraction >= 1) next();
    }, 60);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  const next = () => {
    if (!currentGroup) return;
    if (index < currentGroup.stories.length - 1) setIndex(index + 1);
    else if (group < groups.length - 1) {
      setGroup(group + 1);
      setIndex(0);
    } else navigation.goBack();
  };

  const prev = () => {
    if (index > 0) setIndex(index - 1);
    else if (group > 0) {
      const previous = groups[group - 1];
      setGroup(group - 1);
      setIndex(previous.stories.length - 1);
    }
  };

  if (!currentGroup || !story || !me) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0912', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>This story has expired</Text>
        <View style={{ height: 16 }} />
        <Button label="Back" variant="secondary" full={false} onPress={() => navigation.goBack()} style={{ width: 160 }} />
      </SafeAreaView>
    );
  }

  const author = currentGroup.author;
  const mine = author.id === me.id;

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0912' }}>
      <Image source={{ uri: story.media.uri }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={200} />
      <LinearGradient colors={['rgba(11,9,18,0.75)', 'transparent', 'rgba(11,9,18,0.85)']} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.progressRow}>
          {currentGroup.stories.map((s, i) => (
            <View key={s.id} style={[styles.progressTrack]}>
              <View style={[styles.progressFill, { width: i < index ? '100%' : i === index ? `${progress * 100}%` : '0%', backgroundColor: '#fff' }]} />
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <Avatar uri={author.avatar} name={author.displayName} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14.5 }}>{author.displayName}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{timeAgo(story.createdAt)}</Text>
          </View>
          {mine ? (
            <View style={styles.viewerPill}>
              <Ionicons name="eye" size={13} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{formatCount(story.viewers.length)}</Text>
            </View>
          ) : null}
          <Pressable
            hitSlop={10}
            onPress={async () => {
              if (mine) {
                const ok = await confirm({ title: 'Delete this story?', message: 'It disappears for everyone immediately.', confirmLabel: 'Delete', destructive: true });
                if (ok) {
                  db.deleteStory(story.id);
                  navigation.goBack();
                }
              } else {
                const ok = await confirm({ title: `Report ${author.username}'s story?`, message: 'Our safety team reviews every report.', confirmLabel: 'Report', destructive: true });
                if (ok) {
                  db.reportContent({ targetType: 'story', targetId: story.id, reason: 'Something else', note: 'Reported from story view' });
                  toast('Report sent');
                }
              }
            }}
          >
            <Ionicons name={mine ? 'trash-outline' : 'ellipsis-horizontal'} size={20} color="#fff" />
          </Pressable>
          <Pressable hitSlop={10} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.tapZones}>
          <Pressable style={styles.zone} onPress={prev} />
          <Pressable style={styles.zone} onPress={next} />
        </View>

        {story.caption ? (
          <View style={styles.captionWrap}>
            <Text style={styles.caption}>{story.caption}</Text>
          </View>
        ) : null}

        {!mine ? (
          <Pressable
            onPress={() => {
              navigation.navigate(Routes.Chat, { userId: author.id });
            }}
            style={styles.replyBar}
          >
            <Ionicons name="paper-plane-outline" size={18} color="#fff" />
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, flex: 1 }}>Reply to {author.displayName.split(' ')[0]}\u2026</Text>
          </Pressable>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  viewerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', top: 90, bottom: 120 },
  zone: { flex: 1 },
  captionWrap: { marginTop: 'auto', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  caption: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  replyBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: spacing.xl, marginBottom: spacing.sm, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)' },
});

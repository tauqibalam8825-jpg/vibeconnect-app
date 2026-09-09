import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { Button, Card, Chip, Divider, EmptyState, IconBtn, SectionTitle } from '../components/ui';
import { Media, VibeVideo } from '../components/Media';
import { demoFallback, pickMedia, type PickedMedia } from '../lib/media';
import { useToast } from '../components/ui';
import type { Nav } from '../navigation/types';

type Kind = 'photo' | 'video' | 'short' | 'story' | 'long';

const OPTIONS: { kind: Kind; title: string; sub: string; icon: React.ComponentProps<typeof Ionicons>['name']; tint: string }[] = [
  { kind: 'photo', title: 'Photo post', sub: 'Share a frame from your day', icon: 'image-outline', tint: '#7C5CFF' },
  { kind: 'video', title: 'Video post', sub: 'Up to 3 minutes in the feed', icon: 'videocam-outline', tint: '#22D3EE' },
  { kind: 'short', title: 'Short video', sub: 'Full-screen vertical vibe', icon: 'flash-outline', tint: '#FB5C7E' },
  { kind: 'story', title: 'Story', sub: 'Disappears after 24 hours', icon: 'sparkles-outline', tint: '#FFB020' },
  { kind: 'long', title: 'Long video', sub: 'Title, description & thumbnail', icon: 'tv-outline', tint: '#25D0A4' },
];

const CATEGORIES = ['Travel', 'Food', 'Music', 'Photography', 'Dance', 'Craft', 'Tech', 'Fitness'];

export const CreateScreen: React.FC<{ nav: Nav; initialMode?: Kind }> = ({ nav, initialMode }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { createPost, createShort, createStory, createVideo } = useStore();
  const toast = useToast();

  const [kind, setKind] = useState<Kind | null>(initialMode ?? null);
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (initialMode) start(initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  const start = async (k: Kind) => {
    setKind(k);
    setError(null);
    setMedia(null);
    const needVideo = k !== 'photo' && k !== 'story';
    const res = await pickMedia(needVideo ? 'video' : 'photo');
    if (!res.ok) {
      setError(res.error ?? 'That file type is not supported.');
      return;
    }
    if (res.media) setMedia(res.media);
  };

  const reset = () => {
    setKind(null);
    setMedia(null);
    setCaption('');
    setTitle('');
    setDesc('');
    setProgress(0);
    setPublishing(false);
    setError(null);
  };

  const canPublish =
    !!media && (kind === 'long' ? title.trim().length >= 3 : caption.trim().length > 0 || kind === 'story');

  const publish = () => {
    if (!media || !canPublish) return;
    setPublishing(true);
    setProgress(0.05);
    // Simulated chunked upload. Replace with presigned S3 / GCS upload + URL.
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(1, p + 0.18);
        if (next >= 1) {
          clearInterval(timer);
          finish();
        }
        return next;
      });
    }, 180);
  };

  const finish = () => {
    if (!media || !kind) return;
    if (kind === 'photo' || kind === 'video') {
      createPost({ kind: media.kind, uri: media.uri, caption: caption.trim() });
      toast.show('Post published to your feed');
    } else if (kind === 'short') {
      createShort({
        uri: media.uri,
        poster: media.kind === 'photo' ? media.uri : media.uri,
        caption: caption.trim(),
        hashtags: caption.match(/#(\w+)/g)?.map((h) => h.slice(1)) ?? [],
      });
      toast.show('Your vibe is live in the short feed');
    } else if (kind === 'story') {
      createStory({ kind: media.kind, uri: media.uri });
      toast.show('Story added — it expires in 24h', 'sparkles');
    } else {
      createVideo({
        title: title.trim(),
        description: desc.trim(),
        uri: media.uri,
        thumb: media.kind === 'photo' ? media.uri : DEMO_THUMB,
        durationSec: Math.round((media.durationMs ?? 60000) / 1000),
        category,
      });
      toast.show('Long video published to Watch');
    }
    setTimeout(reset, 400);
    nav.navigate('Tabs');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={styles.top}>
        <IconBtn
          name={kind ? 'chevron-back' : 'close'}
          accessibilityLabel={kind ? 'Back' : 'Close create'}
          onPress={() => (kind ? reset() : nav.goBack())}
        />
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>
          {kind ? OPTIONS.find((o) => o.kind === kind)?.title : 'Create'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {!kind && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: theme.textDim, fontSize: 14, lineHeight: 21, marginBottom: 18 }}>
            What are you making today? Everything you publish lands in the right place automatically.
          </Text>
          {OPTIONS.map((o, i) => (
            <Animated.View key={o.kind} entering={FadeInDown.delay(i * 55).duration(280)}>
              <Pressable
                onPress={() => start(o.kind)}
                accessibilityRole="button"
                accessibilityLabel={`Create ${o.title}`}
                style={({ pressed }) => [
                  styles.option,
                  { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={[styles.optionIcon, { backgroundColor: `${o.tint}22` }]}>
                  <Ionicons name={o.icon} size={22} color={o.tint} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15.5 }}>{o.title}</Text>
                  <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 2 }}>{o.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textFaint} />
              </Pressable>
            </Animated.View>
          ))}

          <Divider spacing={22} />
          <Card style={{ backgroundColor: theme.primarySoft, borderColor: 'transparent' }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
              <Text style={{ color: theme.text, fontSize: 12.5, lineHeight: 18, flex: 1 }}>
                Uploads are validated for file type and size (images up to 10 MB, video up to 200 MB). In this preview
                build, media is stored locally — production uses private cloud storage with signed URLs.
              </Text>
            </View>
          </Card>
        </ScrollView>
      )}

      {kind && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
            {!media ? (
              <EmptyState
                icon="cloud-upload-outline"
                title="Select your media"
                subtitle="Pick a photo or video from your library. JPG, PNG, WEBP, GIF, MP4, MOV or WEBM."
                action={
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button title="Open library" icon="images-outline" onPress={() => start(kind)} />
                    <Button
                      title="Use demo media"
                      variant="ghost"
                      onPress={() => {
                        setMedia(demoFallback(kind === 'photo' || kind === 'story' ? 'photo' : 'video'));
                        toast.show('Demo media attached', 'images');
                      }}
                    />
                  </View>
                }
              />
            ) : (
              <>
                <View style={[styles.preview, { backgroundColor: theme.surfaceAlt }]}>
                  {media.kind === 'video' && kind !== 'story' ? (
                    <VibeVideo uri={media.uri} style={{ width: '100%', height: 260 }} contentFit="contain" />
                  ) : media.kind === 'video' && kind === 'story' ? (
                    <VibeVideo uri={media.uri} style={{ width: '100%', height: 380 }} />
                  ) : (
                    <Media uri={media.uri} style={{ width: '100%', height: kind === 'story' ? 380 : 300 }} />
                  )}
                  <Pressable
                    onPress={() => setMedia(null)}
                    style={styles.removeMedia}
                    accessibilityRole="button"
                    accessibilityLabel="Remove selected media"
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>

                {media.demo && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <Chip label="Demo media" icon="flask-outline" />
                    <Text style={{ color: theme.textFaint, fontSize: 11.5 }}>Sample asset from the built-in library</Text>
                  </View>
                )}

                {error && (
                  <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.error, { backgroundColor: theme.mode === 'dark' ? '#3A1830' : '#FDE8EE' }]}>
                    <Ionicons name="alert-circle" size={16} color={theme.danger} />
                    <Text style={{ color: theme.danger, fontSize: 13, flex: 1 }}>{error}</Text>
                  </Animated.View>
                )}

                {kind === 'long' ? (
                  <View style={{ marginTop: 18 }}>
                    <Text style={labelStyle(theme)}>VIDEO TITLE</Text>
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Give your video a clear title"
                      placeholderTextColor={theme.textFaint}
                      maxLength={100}
                      style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                    />
                    <Text style={labelStyle(theme)}>DESCRIPTION</Text>
                    <TextInput
                      value={desc}
                      onChangeText={setDesc}
                      placeholder="What is this video about? Chapters, gear, recipes…"
                      placeholderTextColor={theme.textFaint}
                      multiline
                      maxLength={1000}
                      style={[styles.input, styles.multiline, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                    />
                    <Text style={labelStyle(theme)}>CATEGORY</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      {CATEGORIES.map((c) => (
                        <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={{ marginTop: 18 }}>
                    <Text style={labelStyle(theme)}>{kind === 'short' ? 'CAPTION' : kind === 'story' ? 'ADD A CAPTION (OPTIONAL)' : 'CAPTION'}</Text>
                    <TextInput
                      value={caption}
                      onChangeText={setCaption}
                      placeholder={kind === 'short' ? 'Say something · use #hashtags' : 'Write a caption…'}
                      placeholderTextColor={theme.textFaint}
                      multiline
                      maxLength={2200}
                      style={[styles.input, styles.multiline, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                    />
                    <Text style={{ color: theme.textFaint, fontSize: 11.5, textAlign: 'right' }}>{caption.length}/2200</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {media && (
            <View style={[styles.footer, { backgroundColor: theme.tabBar, borderTopColor: theme.border, paddingBottom: insets.bottom + 12 }]}>
              {publishing ? (
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: theme.textDim, fontSize: 12.5, fontWeight: '700' }}>
                      {progress < 1 ? 'Uploading securely…' : 'Publishing…'}
                    </Text>
                    <Text style={{ color: theme.primary, fontSize: 12.5, fontWeight: '800' }}>{Math.round(progress * 100)}%</Text>
                  </View>
                  <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
                    <LinearGradient
                      colors={['#7C5CFF', '#22D3EE']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 999 }}
                    />
                  </View>
                </View>
              ) : (
                <Button title="Publish" icon="cloud-upload-outline" size="lg" full disabled={!canPublish} onPress={publish} />
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const DEMO_THUMB = 'https://picsum.photos/seed/vc-video-new/1280/720';

const labelStyle = (theme: { textDim: string }) => ({
  color: theme.textDim,
  fontSize: 12,
  fontWeight: '700' as const,
  marginBottom: 8,
  marginLeft: 2,
});

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20,
    borderWidth: 1, marginBottom: 12,
  },
  optionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  preview: { borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  removeMedia: {
    position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(10,8,22,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, padding: 12, marginTop: 12 },
  input: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 14 },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  track: { height: 8, borderRadius: 999, overflow: 'hidden' },
});

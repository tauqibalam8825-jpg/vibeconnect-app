import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as db from '../../lib/db';
import * as mediaLib from '../../lib/media';
import { useApp, useTheme } from '../../lib/store';
import { radii, spacing } from '../../lib/theme';
import { extractHashtags } from '../../lib/format';
import { Routes } from '../../lib/routes';
import { MediaPicker } from '../../components/MediaPicker';
import { AppHeader } from '../../components/Screen';
import { Avatar } from '../../components/Avatar';
import { Banner, Button, Chip, EmptyState, Field, ProgressBar, Segmented } from '../../components/UI';

type Mode = 'photo' | 'video' | 'short' | 'text' | 'story';

const LOCATIONS = ['Lisbon, PT', 'Bologna, IT', 'Seoul, KR', 'Austin, US', 'Paris, FR', 'Bengaluru, IN', 'Mexico City, MX'];

export function CreateScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { me, db: store, toast } = useApp();
  const initialMode = (route.params?.mode as Mode) ?? 'photo';

  const [mode, setMode] = useState<Mode>(initialMode);
  const [items, setItems] = useState<mediaLib.PickedMedia[]>([]);
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const tags = useMemo(() => extractHashtags(caption), [caption]);
  const needsMedia = mode !== 'text' && mode !== 'story';
  const canPost = (needsMedia && items.length > 0) || (!needsMedia && caption.trim().length > 0);

  const post = async () => {
    if (!canPost) return;
    setBusy(true);
    setError('');
    try {
      const uploaded: mediaLib.PickedMedia[] = [];
      for (let i = 0; i < items.length; i++) {
        const result = await db.uploadMedia(items[i].uri, (fraction) => setProgress((i + fraction) / Math.max(1, items.length)));
        uploaded.push({ ...items[i], uri: result.uri });
      }
      setProgress(1);

      if (mode === 'story') {
        db.createStory({ media: mediaLib.toMediaItem(uploaded[0]), caption });
        toast('Story published \u2014 it disappears in 24 hours');
        navigation.goBack();
        return;
      }

      const mediaItems = uploaded.map((p, i) => mediaLib.toMediaItem(p, i));
      const created = db.createPost({
        type: mode === 'photo' ? 'photo' : mode === 'video' ? 'video' : mode === 'short' ? 'short' : 'text',
        caption,
        media: mediaItems,
        title: mode === 'video' ? title : undefined,
        description: mode === 'video' ? description : undefined,
        location,
        visibility,
        commentsEnabled,
        durationMs: mode === 'video' || mode === 'short' ? uploaded[0]?.durationMs ?? 45000 : undefined,
      });
      toast('Published to your feed');
      setItems([]);
      setCaption('');
      setTitle('');
      setDescription('');
      navigation.navigate(Routes.PostDetail, { id: created.id });
    } catch {
      setError('Upload failed. Check your connection and try again.');
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  if (!me || !store) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader
        title="Create"
        right={
          <Button label={mode === 'story' ? 'Share story' : 'Publish'} size="sm" onPress={post} loading={busy} disabled={!canPost} full={false} style={{ width: 108 }} />
        }
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Segmented<Mode>
            value={mode}
            onChange={(next) => {
              setMode(next);
              setItems([]);
            }}
            options={[
              { value: 'photo', label: 'Photo', icon: 'image-outline' },
              { value: 'video', label: 'Video', icon: 'videocam-outline' },
              { value: 'short', label: 'Short', icon: 'flash-outline' },
              { value: 'text', label: 'Text', icon: 'text-outline' },
              { value: 'story', label: 'Story', icon: 'aperture-outline' },
            ]}
          />

          <View style={{ height: spacing.lg }} />

          {needsMedia ? (
            <>
              <Pressable onPress={() => setPickerOpen(true)} style={[styles.dropzone, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                {items.length === 0 ? (
                  <View style={{ alignItems: 'center', gap: 10, padding: spacing.xl }}>
                    <View style={[styles.dropIcon, { backgroundColor: theme.brandSoft }]}>
                      <Ionicons name="cloud-upload-outline" size={26} color={theme.brand} />
                    </View>
                    <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15.5 }}>{mode === 'short' ? 'Pick a vertical clip' : mode === 'video' ? 'Pick a video' : 'Pick photos'}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
                      {mode === 'photo' ? 'Up to 4 images. Long-press to reorder is not required \u2014 order is the order you pick.' : 'Up to 3 minutes. Clips under 60 seconds work best as shorts.'}
                    </Text>
                    <Button label="Open picker" variant="secondary" size="sm" onPress={() => setPickerOpen(true)} />
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 10 }}>
                    {items.map((item, i) => (
                      <View key={`${item.uri}-${i}`} style={[styles.thumb, { borderColor: theme.border }]}>
                        <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill as any} contentFit="cover" />
                        {item.type === 'video' ? (
                          <View style={styles.thumbBadge}>
                            <Ionicons name="play" size={12} color="#fff" />
                          </View>
                        ) : null}
                        <Pressable onPress={() => setItems(items.filter((_, k) => k !== i))} style={[styles.thumbRemove, { backgroundColor: theme.overlay }]}>
                          <Ionicons name="close" size={13} color="#fff" />
                        </Pressable>
                      </View>
                    ))}
                    {items.length < (mode === 'photo' ? 4 : 1) ? (
                      <Pressable onPress={() => setPickerOpen(true)} style={[styles.thumb, styles.addThumb, { borderColor: theme.border }]}>
                        <Ionicons name="add" size={22} color={theme.brand} />
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </Pressable>
              <View style={{ height: spacing.lg }} />
            </>
          ) : null}

          {mode === 'video' ? (
            <>
              <Field label="Title" value={title} onChangeText={setTitle} placeholder="Give your video a clear title" icon="text-outline" maxLength={90} autoCapitalize="sentences" />
              <Field label="Description" value={description} onChangeText={setDescription} placeholder="What will people learn or feel? Add timestamps here." multiline maxLength={800} autoCapitalize="sentences" />
            </>
          ) : null}

          <Field
            label={mode === 'story' ? 'Story caption (optional)' : 'Caption'}
            value={caption}
            onChangeText={setCaption}
            placeholder={mode === 'text' ? 'Say the thing\u2026' : 'Tell the story behind this \u2026 use #hashtags to help people find it'}
            multiline
            maxLength={mode === 'text' ? 500 : 600}
            autoCapitalize="sentences"
          />

          {tags.length > 0 ? (
            <View style={styles.tagRow}>
              {tags.map((t) => (
                <View key={t} style={[styles.tagChip, { backgroundColor: theme.brandSoft, borderColor: `${theme.brand}44` }]}>
                  <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 12.5 }}>#{t}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {mode !== 'story' ? (
            <>
              <View style={{ height: spacing.lg }} />
              <Field label="Location (optional)" value={location} onChangeText={setLocation} placeholder="Add a place" icon="location-outline" autoCapitalize="words" rightIcon="sparkles-outline" onRightPress={() => setLocation(LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)])} />
              <Text style={[styles.label, { color: theme.textMuted }]}>Who can see this</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.lg }}>
                <Chip label="Everyone" icon="earth-outline" active={visibility === 'public'} onPress={() => setVisibility('public')} />
                <Chip label="Followers" icon="people-outline" active={visibility === 'followers'} onPress={() => setVisibility('followers')} />
                <Chip label="Only me" icon="lock-closed-outline" active={visibility === 'private'} onPress={() => setVisibility('private')} />
              </View>
              <View style={[styles.switchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14.5 }}>Allow comments</Text>
                  <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 2 }}>Turn off to keep the conversation to yourself.</Text>
                </View>
                <Switch value={commentsEnabled} onValueChange={setCommentsEnabled} trackColor={{ true: theme.brand, false: theme.border }} thumbColor="#fff" />
              </View>
            </>
          ) : (
            <View style={{ marginTop: spacing.lg }}>
              <Banner text="Stories disappear automatically after 24 hours. Only people who can see your profile will see it." icon="time-outline" />
            </View>
          )}

          {error ? <Banner text={error} tone="danger" icon="alert-circle-outline" /> : null}
          {busy ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={{ color: theme.textMuted, fontSize: 12.5, marginBottom: 6 }}>{progress < 1 ? 'Uploading media\u2026' : 'Publishing\u2026'}</Text>
              <ProgressBar fraction={Math.max(0.05, progress)} />
            </View>
          ) : null}

          <View style={{ marginTop: spacing.xl }}>
            <Button label={mode === 'story' ? 'Share to your story' : busy ? 'Publishing\u2026' : 'Publish'} size="lg" onPress={post} loading={busy} disabled={!canPost} />
          </View>
          <Text style={{ color: theme.textFaint, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
            Posting as @{me.username} \u00b7 media {db.uploadMediaConfigured ? 'goes to secure storage' : 'stays on this device in this build'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <MediaPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} kind={mode === 'photo' ? 'image' : mode === 'text' || mode === 'story' ? 'image' : 'video'} onSelect={setItems} title={mode === 'short' ? 'Choose a short clip' : 'Choose media'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dropzone: { borderRadius: radii.lg, borderWidth: 1.5, borderStyle: 'dashed', overflow: 'hidden' },
  dropIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 96, height: 120, borderRadius: radii.md, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  addThumb: { borderStyle: 'dashed', borderWidth: 1.5 },
  thumbBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(11,9,18,0.7)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  thumbRemove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 12.5, fontWeight: '700', marginBottom: 10, letterSpacing: 0.2, textTransform: 'uppercase' as const },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth },
});

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp, useTheme } from '../../lib/store';
import { radii, spacing } from '../../lib/theme';
import { Routes } from '../../lib/routes';
import * as db from '../../lib/db';
import * as media from '../../lib/media';
import { Avatar } from '../../components/Avatar';
import { MediaPicker } from '../../components/MediaPicker';
import { Banner, Button, Chip, Field } from '../../components/UI';

const CATEGORIES = ['Music', 'Design', 'Food', 'Travel', 'Fitness', 'Gaming', 'Tech', 'Nature', 'Fashion', 'Photography'];

export function ProfileSetupScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { me, toast } = useApp();
  const fresh = !!route.params?.fresh;
  const [avatar, setAvatar] = useState<string | undefined>(me?.avatar);
  const [displayName, setDisplayName] = useState(me?.displayName ?? '');
  const [username, setUsername] = useState(me?.username ?? '');
  const [bio, setBio] = useState(me?.bio ?? '');
  const [category, setCategory] = useState(me?.category ?? 'Music');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setError('');
    const handleCheck = /^[a-z0-9_]{3,20}$/.test(username) ? { ok: true } : { ok: false, message: 'Username must be 3\u201320 lowercase characters' };
    if (!handleCheck.ok) {
      setError(handleCheck.message!);
      setBusy(false);
      return;
    }
    if (username !== me?.username && db.userByUsername(username)) {
      setError('That handle is taken');
      setBusy(false);
      return;
    }
    const result = db.updateProfile({ displayName: displayName.trim() || me!.displayName, username, bio, avatar, category });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Could not save your profile');
      return;
    }
    toast('Profile saved');
    if (fresh) navigation.reset({ index: 0, routes: [{ name: Routes.Home }] });
    else navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!fresh ? (
            <Pressable onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </Pressable>
          ) : (
            <View style={{ height: 8 }} />
          )}

          <Text style={[styles.title, { color: theme.text }]}>{fresh ? 'Set up your profile' : 'Edit profile'}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 14, marginTop: 4, marginBottom: spacing.xl }}>
            {fresh ? 'A photo and a line about you makes it far easier for people to find your vibe.' : 'This is what people see when they visit your profile.'}
          </Text>

          <View style={styles.avatarRow}>
            <Avatar uri={avatar} name={displayName || username || '?'} size={92} />
            <View style={{ flex: 1, gap: 10 }}>
              <Button label="Choose photo" icon="image-outline" variant="secondary" size="sm" onPress={() => setPickerOpen(true)} />
              <Button
                label="Use a sample"
                icon="shuffle-outline"
                variant="ghost"
                size="sm"
                onPress={() => setAvatar(media.demoAvatar(`sample-${Math.floor(Math.random() * 1000)}`))}
              />
            </View>
          </View>

          {error ? <Banner text={error} tone="danger" icon="alert-circle-outline" /> : null}

          <Field label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" icon="person-outline" autoCapitalize="words" maxLength={40} />
          <Field
            label="Username"
            value={username}
            onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="handle"
            icon="at-outline"
            hint="Letters, numbers and underscores only"
            maxLength={20}
          />
          <Field label="Bio" value={bio} onChangeText={setBio} placeholder="What do you make, love or nerd out on?" multiline maxLength={160} autoCapitalize="sentences" hint={`${bio.length}/160`} />

          <Text style={[styles.label, { color: theme.textMuted }]}>Your vibe</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>

          <View style={{ height: spacing.xl }} />
          <Button label={fresh ? 'Finish and start exploring' : 'Save profile'} size="lg" loading={busy} onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
      <MediaPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        kind="image"
        title="Profile photo"
        onSelect={(items) => {
          if (items[0]) {
            setAvatar(items[0].uri);
            toast('Photo added \u2014 save to apply it');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingTop: spacing.lg, maxWidth: 520, width: '100%', alignSelf: 'center' },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginTop: spacing.md },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginBottom: spacing.xl },
  label: { fontSize: 12.5, fontWeight: '700', marginBottom: 10, letterSpacing: 0.2, textTransform: 'uppercase' as const },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { Avatar, Button, Chip, EmptyState, IconBtn, useToast } from '../components/ui';
import { Media } from '../components/Media';
import { DEMO_PHOTOS } from '../lib/media';
import type { Nav } from '../navigation/types';

/** Edit profile: name, bio, avatar, location, privacy and creator mode. */
export const EditProfileScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { me, updateProfile } = useStore();

  const [displayName, setDisplayName] = useState(me?.displayName ?? '');
  const [bio, setBio] = useState(me?.bio ?? '');
  const [location, setLocation] = useState(me?.location ?? '');
  const [isPrivate, setIsPrivate] = useState(me?.private ?? false);
  const [isCreator, setIsCreator] = useState(me?.creator ?? false);
  const [avatar, setAvatar] = useState(me?.avatar ?? '');
  const [errors, setErrors] = useState<{ displayName?: string; bio?: string }>({});

  if (!me) return <EmptyState icon="person-outline" title="Not signed in" />;

  const save = () => {
    const next: { displayName?: string; bio?: string } = {};
    if (displayName.trim().length < 2) next.displayName = 'Display name must be at least 2 characters.';
    if (bio.length > 200) next.bio = 'Bio is limited to 200 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;
    updateProfile({
      displayName: displayName.trim(),
      bio: bio.trim(),
      location: location.trim(),
      private: isPrivate,
      creator: isCreator,
      avatar,
    });
    toast.show('Profile updated');
    nav.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.bar}>
        <IconBtn name="chevron-back" accessibilityLabel="Go back" onPress={() => nav.goBack()} />
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>Edit profile</Text>
        <Button title="Save" size="sm" onPress={save} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 18 }}>
          <Avatar uri={avatar} name={displayName} size={96} />
          <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 10, marginBottom: 8 }}>Choose a profile photo</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {DEMO_PHOTOS.map((uri) => (
              <Pressable
                key={uri}
                onPress={() => setAvatar(uri)}
                style={[styles.avatarOption, { borderColor: avatar === uri ? theme.primary : theme.border }]}
                accessibilityRole="button"
                accessibilityLabel="Use this avatar"
              >
                <Media uri={uri} style={{ width: 48, height: 48, borderRadius: 24 }} />
              </Pressable>
            ))}
            <Pressable
              onPress={() => setAvatar(`https://api.dicebear.com/9.x/shapes/png?seed=${Date.now()}`)}
              style={[styles.avatarOption, { borderColor: theme.border, alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 24 }]}
              accessibilityRole="button"
              accessibilityLabel="Generate new avatar"
            >
              <Ionicons name="refresh" size={17} color={theme.textDim} />
            </Pressable>
          </View>
        </View>

        <Text style={label(theme)}>DISPLAY NAME</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          style={[input(theme), { borderColor: errors.displayName ? theme.danger : theme.border }]}
          maxLength={40}
          accessibilityLabel="Display name"
        />
        {errors.displayName && <Err text={errors.displayName} />}

        <Text style={label(theme)}>USERNAME</Text>
        <View style={[input(theme), { flexDirection: 'row', alignItems: 'center', opacity: 0.7 }]}>
          <Ionicons name="at-outline" size={16} color={theme.textFaint} />
          <Text style={{ color: theme.textDim, fontSize: 15, marginLeft: 6 }}>{me.username}</Text>
        </View>
        <Text style={{ color: theme.textFaint, fontSize: 11.5, marginBottom: 14, marginLeft: 2 }}>
          Usernames are unique and cannot be changed in this release.
        </Text>

        <Text style={label(theme)}>BIO</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          style={[input(theme), styles.multiline, { borderColor: errors.bio ? theme.danger : theme.border }]}
          multiline
          maxLength={220}
          placeholder="Tell people what you post about"
          placeholderTextColor={theme.textFaint}
          accessibilityLabel="Bio"
        />
        <Text style={{ color: theme.textFaint, fontSize: 11.5, textAlign: 'right', marginBottom: 14 }}>{bio.length}/200</Text>
        {errors.bio && <Err text={errors.bio} />}

        <Text style={label(theme)}>LOCATION</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          style={[input(theme), { borderColor: theme.border }]}
          placeholder="City, country"
          placeholderTextColor={theme.textFaint}
          accessibilityLabel="Location"
        />

        <View style={[styles.switchCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14.5 }}>Private account</Text>
            <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 3, lineHeight: 17 }}>
              Only approved followers see your posts, vibes and videos.
            </Text>
          </View>
          <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ true: theme.primary }} accessibilityLabel="Private account" />
        </View>

        <View style={[styles.switchCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14.5 }}>Creator mode</Text>
            <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 3, lineHeight: 17 }}>
              Unlocks Creator Studio, analytics and monetisation tools where you are eligible.
            </Text>
          </View>
          <Switch value={isCreator} onValueChange={setIsCreator} trackColor={{ true: theme.primary }} accessibilityLabel="Creator mode" />
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={{ color: theme.textFaint, fontSize: 11.5, lineHeight: 17 }}>
            Profile changes are stored locally in this preview build. Private accounts, blocked users and moderation
            rules are enforced client-side here and must be re-checked by the API in production.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const Err: React.FC<{ text: string }> = ({ text }) => {
  const { theme } = useTheme();
  return <Text style={{ color: theme.danger, fontSize: 12, marginBottom: 12, marginLeft: 2 }}>{text}</Text>;
};

const label = (theme: { textDim: string }) => ({ color: theme.textDim, fontSize: 12, fontWeight: '700' as const, marginBottom: 8, marginLeft: 2 });
const input = (theme: { surface: string; text: string; border: string }) => ({
  backgroundColor: theme.surface,
  color: theme.text,
  borderColor: theme.border,
  borderWidth: 1.5,
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: 13,
  fontSize: 15,
  marginBottom: 8,
});

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  avatarOption: { borderWidth: 2, borderRadius: 26, padding: 2 },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  switchCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, borderWidth: 1, marginTop: 12 },
});

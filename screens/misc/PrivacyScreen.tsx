import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { radii, spacing } from '../../lib/theme';
import { AppHeader } from '../../components/Screen';
import { Avatar } from '../../components/Avatar';
import { Banner, Chip, SectionTitle } from '../../components/UI';

function ToggleRow({ label, subtitle, value, onChange }: { label: string; subtitle: string; value: boolean; onChange: (v: boolean) => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderColor: theme.divider }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 3, lineHeight: 17 }}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.brand, false: theme.border }} thumbColor="#fff" />
    </View>
  );
}

export function PrivacyScreen() {
  const theme = useTheme();
  const { me, db: store, toast, version } = useApp();
  if (!me || !store) return null;
  const settings = me.settings;
  const following = me.following.map((id) => db.userById(id)).filter((u): u is NonNullable<typeof u> => !!u);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="Privacy" subtitle="You are in control" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <ToggleRow
          label="Private account"
          subtitle="Only approved followers see your posts and shorts. Your existing followers keep access."
          value={settings.privateAccount}
          onChange={(v) => {
            db.updateSettings({ privateAccount: v });
            toast(v ? 'Your account is now private' : 'Your account is now public');
          }}
        />
        <ToggleRow
          label="Show activity status"
          subtitle="People in a conversation with you can see when you were last active."
          value={settings.showActivityStatus}
          onChange={(v) => db.updateSettings({ showActivityStatus: v })}
        />
        <ToggleRow
          label="Autoplay media"
          subtitle="Videos start playing as they enter view in your feed and shorts."
          value={settings.autoplayMedia}
          onChange={(v) => db.updateSettings({ autoplayMedia: v })}
        />

        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle title="Direct messages" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['everyone', 'following', 'nobody'] as const).map((option) => (
              <Chip key={option} label={option === 'everyone' ? 'Everyone' : option === 'following' ? 'People I follow' : 'Nobody'} active={settings.allowMessagesFrom === option} onPress={() => db.updateSettings({ allowMessagesFrom: option })} />
            ))}
          </View>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle title="Mentions" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['everyone', 'following', 'nobody'] as const).map((option) => (
              <Chip key={option} label={option === 'everyone' ? 'Everyone' : option === 'following' ? 'People I follow' : 'Nobody'} active={settings.allowMentions === option} onPress={() => db.updateSettings({ allowMentions: option })} />
            ))}
          </View>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle title="Default post audience" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['public', 'followers', 'private'] as const).map((option) => (
              <Chip key={option} label={option === 'public' ? 'Everyone' : option === 'followers' ? 'Followers' : 'Only me'} active={settings.defaultVisibility === option} onPress={() => db.updateSettings({ defaultVisibility: option })} />
            ))}
          </View>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle title="Hide your stories from" />
          <Banner text="Pick people who should not see your daily stories. They can still follow you and see posts." icon="eye-off-outline" />
          {following.length === 0 ? (
            <Text style={{ color: theme.textFaint, fontSize: 13.5 }}>Follow a few people to choose who your stories stay hidden from.</Text>
          ) : (
            following.map((user) => {
              const hidden = settings.hideStoriesFrom.includes(user.id);
              return (
                <View key={user.id} style={[styles.personRow, { borderColor: theme.divider }]}>
                  <Avatar uri={user.avatar} name={user.displayName} size={38} />
                  <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14.5, flex: 1 }}>{user.displayName}</Text>
                  <Chip
                    label={hidden ? 'Hidden' : 'Visible'}
                    active={!hidden}
                    icon={hidden ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => db.updateSettings({ hideStoriesFrom: hidden ? settings.hideStoriesFrom.filter((id) => id !== user.id) : [...settings.hideStoriesFrom, user.id] })}
                  />
                </View>
              );
            })
          )}
        </View>

        <View style={{ marginTop: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="information-circle-outline" size={16} color={theme.textFaint} />
          <Text style={{ color: theme.textFaint, fontSize: 12.5, flex: 1 }}>
            Privacy changes apply immediately and are stored with your account. Blocking lives in Settings \u2192 Blocked accounts.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
});

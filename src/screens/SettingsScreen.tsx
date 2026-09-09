import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { userById } from '../store/selectors';
import { Avatar, Button, Card, EmptyState, IconBtn, Logo, SectionTitle, useToast } from '../components/ui';
import type { Nav } from '../navigation/types';

export const SettingsScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { me, state, updateProfile, updateSettings, signOut, unblockUser, unmuteUser, resetDemoData } = useStore();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const blocked = (me?.blocked ?? []).map((id) => userById(state, id)).filter(Boolean);
  const muted = (me?.muted ?? []).map((id) => userById(state, id)).filter(Boolean);
  const myReports = state.reports.filter((r) => r.reporterId === me?.id);

  const doLogout = () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      toast.show('Tap again to confirm sign out', 'log-out-outline');
      setTimeout(() => setConfirmLogout(false), 3500);
      return;
    }
    signOut();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={styles.bar}>
        <IconBtn name="chevron-back" accessibilityLabel="Go back" onPress={() => nav.goBack()} />
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar uri={me?.avatar} name={me?.displayName} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>{me?.displayName}</Text>
              <Text style={{ color: theme.textFaint, fontSize: 12.5 }}>@{me?.username} · {me?.email}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Button title="Edit profile" size="sm" variant="soft" onPress={() => nav.navigate('EditProfile')} />
            <Button title="Studio" size="sm" variant="ghost" onPress={() => nav.navigate('Studio')} />
          </View>
        </Card>

        <SectionTitle title="Appearance" />
        <Card style={{ marginBottom: 20 }}>
          <View style={styles.modeRow}>
            {(['light', 'dark', 'system'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.modeBtn,
                  {
                    backgroundColor: mode === m ? theme.primary : theme.surfaceAlt,
                    borderColor: mode === m ? theme.primary : theme.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === m }}
                accessibilityLabel={`${m} theme`}
              >
                <Ionicons
                  name={m === 'light' ? 'sunny-outline' : m === 'dark' ? 'moon-outline' : 'phone-portrait-outline'}
                  size={16}
                  color={mode === m ? '#fff' : theme.textDim}
                />
                <Text style={{ color: mode === m ? '#fff' : theme.textDim, fontWeight: '700', fontSize: 13, textTransform: 'capitalize' }}>
                  {m}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <SectionTitle title="Feed & playback" />
        <Card style={{ marginBottom: 20 }}>
          <Toggle
            label="Autoplay videos"
            sub="Videos start playing as they enter the screen"
            value={state.settings.autoplay}
            onChange={(v) => updateSettings({ autoplay: v })}
          />
          <Toggle
            label="Data saver"
            sub="Loads smaller image variants on mobile data"
            value={state.settings.dataSaver}
            onChange={(v) => updateSettings({ dataSaver: v })}
          />
          <Toggle
            label="Show my active status"
            sub="People you chat with can see when you are online"
            value={state.settings.showOnline}
            onChange={(v) => updateSettings({ showOnline: v })}
          />
          <Toggle
            label="Allow story replies"
            sub="Viewers can reply to your 24h stories"
            value={state.settings.allowStoryReplies}
            onChange={(v) => updateSettings({ allowStoryReplies: v })}
          />
        </Card>

        <SectionTitle title="Privacy" />
        <Card style={{ marginBottom: 20 }}>
          <Toggle
            label="Private account"
            sub="Only approved followers see your content"
            value={!!me?.private}
            onChange={(v) => updateProfile({ private: v })}
          />
          <Pressable onPress={() => nav.navigate('Legal', { doc: 'privacy' })} style={styles.link} accessibilityRole="button">
            <Ionicons name="document-text-outline" size={18} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>Privacy Policy</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />
          </Pressable>
        </Card>

        <SectionTitle title="Safety" />
        <Card style={{ marginBottom: 20 }}>
          <Pressable onPress={() => nav.navigate('Legal', { doc: 'guidelines' })} style={styles.link} accessibilityRole="button">
            <Ionicons name="heart-outline" size={18} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>Community Guidelines</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />
          </Pressable>
          <Pressable onPress={() => nav.navigate('Legal', { doc: 'terms' })} style={styles.link} accessibilityRole="button">
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>Terms of Service</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />
          </Pressable>

          <Text style={[styles.subhead, { color: theme.textFaint }]}>BLOCKED ACCOUNTS ({blocked.length})</Text>
          {blocked.length === 0 ? (
            <Text style={{ color: theme.textFaint, fontSize: 12.5, marginBottom: 8 }}>You have not blocked anyone.</Text>
          ) : (
            blocked.map((u) => (
              <View key={u!.id} style={styles.userLine}>
                <Avatar uri={u!.avatar} name={u!.displayName} size={34} />
                <Text style={{ color: theme.text, fontSize: 13.5, flex: 1, marginLeft: 10 }}>@{u!.username}</Text>
                <Button title="Unblock" size="sm" variant="ghost" onPress={() => { unblockUser(u!.id); toast.show('User unblocked'); }} />
              </View>
            ))
          )}

          <Text style={[styles.subhead, { color: theme.textFaint }]}>MUTED ACCOUNTS ({muted.length})</Text>
          {muted.length === 0 ? (
            <Text style={{ color: theme.textFaint, fontSize: 12.5, marginBottom: 8 }}>Nobody is muted.</Text>
          ) : (
            muted.map((u) => (
              <View key={u!.id} style={styles.userLine}>
                <Avatar uri={u!.avatar} name={u!.displayName} size={34} />
                <Text style={{ color: theme.text, fontSize: 13.5, flex: 1, marginLeft: 10 }}>@{u!.username}</Text>
                <Button title="Unmute" size="sm" variant="ghost" onPress={() => { unmuteUser(u!.id); toast.show('User unmuted'); }} />
              </View>
            ))
          )}

          <Text style={[styles.subhead, { color: theme.textFaint }]}>YOUR REPORTS ({myReports.length})</Text>
          {myReports.length === 0 ? (
            <Text style={{ color: theme.textFaint, fontSize: 12.5 }}>You have not filed any reports.</Text>
          ) : (
            myReports.map((r) => (
              <View key={r.id} style={styles.reportLine}>
                <Ionicons name="flag-outline" size={15} color={theme.textDim} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ color: theme.text, fontSize: 13 }}>{r.targetLabel}</Text>
                  <Text style={{ color: theme.textFaint, fontSize: 11.5 }}>{r.reason} · {r.status}</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {me?.role === 'admin' && (
          <>
            <SectionTitle title="Moderation" />
            <Card style={{ marginBottom: 20 }}>
              <Pressable onPress={() => nav.navigate('Admin')} style={styles.link} accessibilityRole="button">
                <Ionicons name="construct-outline" size={18} color={theme.danger} />
                <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 14 }}>Open admin panel</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />
              </Pressable>
            </Card>
          </>
        )}

        <SectionTitle title="Demo data" />
        <Card style={{ marginBottom: 20 }}>
          <Text style={{ color: theme.textDim, fontSize: 12.5, lineHeight: 18, marginBottom: 12 }}>
            This preview runs entirely on local demo data, flagged with a DEMO tag and separated from what a live API
            would return. Resetting restores the original sample accounts, posts and conversations.
          </Text>
          <Button
            title="Reset demo data"
            variant="secondary"
            icon="refresh-outline"
            size="sm"
            onPress={() => {
              Alert.alert('Reset demo data?', 'Your local posts, likes and follows will be replaced by the original sample set.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: async () => {
                    await resetDemoData();
                    toast.show('Demo data restored', 'refresh');
                  },
                },
              ]);
            }}
          />
        </Card>

        <Button title={confirmLogout ? 'Tap again to sign out' : 'Log out'} variant="danger" icon="log-out-outline" full onPress={doLogout} />
        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <Logo size={26} />
          <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 8 }}>VibeConnect 1.0 · Preview build</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const Toggle: React.FC<{ label: string; sub: string; value: boolean; onChange: (v: boolean) => void }> = ({
  label, sub, value, onChange,
}) => {
  const { theme } = useTheme();
  return (
    <View style={toggleStyles.row}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{label}</Text>
        <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 2, lineHeight: 16 }}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.primary }} accessibilityLabel={label} />
    </View>
  );
};

const toggleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
});

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 14, borderWidth: 1 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  subhead: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },
  userLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  reportLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
});

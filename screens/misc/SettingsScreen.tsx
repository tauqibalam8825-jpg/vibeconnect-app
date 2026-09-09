import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { spacing } from '../../lib/theme';
import { Routes } from '../../lib/routes';
import { AppHeader } from '../../components/Screen';
import { Banner, Button, Chip } from '../../components/UI';
import { describeSecurity } from '../../lib/security';
import type { ThemeMode } from '../../lib/types';

function Row({ icon, label, subtitle, onPress, danger, right }: { icon: keyof typeof Ionicons.glyphMap; label: string; subtitle?: string; onPress?: () => void; danger?: boolean; right?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: pressed ? theme.surfaceAlt : 'transparent', borderColor: theme.divider }]}>
      <View style={[styles.rowIcon, { backgroundColor: danger ? `${theme.danger}18` : theme.surfaceAlt }]}>
        <Ionicons name={icon} size={18} color={danger ? theme.danger : theme.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? theme.danger : theme.text, fontSize: 15, fontWeight: '700' }}>{label}</Text>
        {subtitle ? <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />}
    </Pressable>
  );
}

export function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { me, toast, confirm } = useApp();
  if (!me) return null;
  const themeMode = me.settings.themeMode;

  const deleteAccount = async () => {
    const typed = await confirm({
      title: 'Delete account permanently?',
      message: 'This removes your posts, comments, messages and profile. Type your username or password in the next step to confirm.',
      confirmLabel: 'Continue',
      destructive: true,
    });
    if (!typed) return;
    let value = me.username;
    if (Alert.prompt) {
      await new Promise<void>((resolve) => {
        Alert.prompt(
          'Confirm deletion',
          'Type your password (or your username on this device) to permanently delete the account.',
          async (input) => {
            if (input) {
              const result = await db.deleteAccount(input);
              if (result.ok) {
                toast('Account deleted');
                navigation.reset({ index: 0, routes: [{ name: Routes.Welcome }] });
              } else {
                Alert.alert('Not deleted', result.error ?? 'Try again');
              }
            }
            resolve();
          },
          'secure-text',
          value,
        );
      });
      return;
    }
    const result = await db.deleteAccount(value);
    if (result.ok) {
      toast('Account deleted');
      navigation.reset({ index: 0, routes: [{ name: Routes.Welcome }] });
    } else {
      Alert.alert('Not deleted', result.error ?? 'Try again');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="Settings" />
      <View style={{ padding: spacing.lg, gap: spacing.xl }}>
        <View>
          <Text style={[styles.section, { color: theme.textFaint }]}>ACCOUNT</Text>
          <Row icon="person-outline" label="Edit profile" subtitle="Name, handle, bio, photo" onPress={() => navigation.navigate(Routes.EditProfile)} />
          <Row icon="lock-closed-outline" label="Privacy" subtitle="Who can see and message you" onPress={() => navigation.navigate(Routes.Privacy)} />
          <Row icon="shield-checkmark-outline" label="Security" subtitle={describeSecurity()} onPress={() => navigation.navigate(Routes.Security)} />
          <Row icon="ban-outline" label="Blocked accounts" subtitle={`${me.blocked.length} blocked`} onPress={() => navigation.navigate(Routes.Blocked)} />
          <Row icon="bookmark-outline" label="Saved posts" onPress={() => navigation.navigate(Routes.Saved)} />
        </View>

        <View>
          <Text style={[styles.section, { color: theme.textFaint }]}>CREATE & EARN</Text>
          <Row icon="stats-chart-outline" label="Creator studio" subtitle="Performance, audience, earnings" onPress={() => navigation.navigate(Routes.Studio)} />
          <Row icon="wallet-outline" label="Wallet" subtitle="Balance, transactions, payouts" onPress={() => navigation.navigate(Routes.Wallet)} />
        </View>

        <View>
          <Text style={[styles.section, { color: theme.textFaint }]}>APPEARANCE</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
              <Chip key={mode} label={mode === 'system' ? 'Match device' : mode === 'light' ? 'Light' : 'Dark'} active={themeMode === mode} onPress={() => db.updateSettings({ themeMode: mode })} />
            ))}
          </View>
        </View>

        <View>
          <Text style={[styles.section, { color: theme.textFaint }]}>ABOUT</Text>
          <Row icon="layers-outline" label="Architecture & roadmap" subtitle="What runs locally, what needs a service" onPress={() => navigation.navigate(Routes.Architecture)} />
          {me.role === 'admin' || me.role === 'moderator' ? (
            <Row icon="shield-half-outline" label="Admin panel" subtitle="Moderation queue, users, analytics" onPress={() => navigation.navigate(Routes.Admin)} />
          ) : null}
          <Row
            icon="refresh-outline"
            label="Reset demo data"
            subtitle="Restores the seeded content library"
            onPress={async () => {
              const ok = await confirm({ title: 'Reset demo data?', message: 'Every post, message and account created on this device is replaced by the seeded library.', confirmLabel: 'Reset', destructive: true });
              if (ok) {
                await db.resetDatabase();
                toast('Demo data restored');
                navigation.reset({ index: 0, routes: [{ name: Routes.Welcome }] });
              }
            }}
          />
        </View>

        <View>
          <Text style={[styles.section, { color: theme.textFaint }]}>SESSION</Text>
          <Banner text={`Signed in as @${me.username} \u00b7 ${me.role}. Your session token is stored in the device Keychain or Keystore and expires in 30 days.`} icon="finger-print-outline" />
          <Button
            label="Log out"
            variant="secondary"
            icon="log-out-outline"
            onPress={async () => {
              const ok = await confirm({ title: 'Log out?', message: 'You can log back in any time with your password.', confirmLabel: 'Log out' });
              if (ok) {
                await db.signOut();
                navigation.reset({ index: 0, routes: [{ name: Routes.Welcome }] });
              }
            }}
          />
          <View style={{ height: 12 }} />
          <Button label="Delete account" variant="danger" icon="trash-outline" onPress={deleteAccount} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});

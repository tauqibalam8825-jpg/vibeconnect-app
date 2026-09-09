import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { spacing } from '../../lib/theme';
import { Routes } from '../../lib/routes';
import { describeSecurity } from '../../lib/security';
import { validatePassword } from '../../lib/validation';
import { AppHeader } from '../../components/Screen';
import { Banner, Button, Card, Field, SectionTitle } from '../../components/UI';

export function SecurityScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { me, db: store, toast, confirm } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);

  if (!me || !store) return null;

  const changePassword = async () => {
    setError('');
    if (next !== confirmValue) {
      setError('Passwords do not match');
      return;
    }
    const check = validatePassword(next);
    if (!check.ok) {
      setError(check.message ?? 'Choose a stronger password');
      return;
    }
    setBusy(true);
    const result = await db.changePassword(current, next);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Could not change password');
      return;
    }
    setCurrent('');
    setNext('');
    setConfirmValue('');
    toast('Password updated');
  };

  const toggleTwoFactor = async (value: boolean) => {
    if (!value) {
      db.updateSettings({ twoFactorEnabled: false });
      toast('Two-step verification disabled');
      return;
    }
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setChallenge(generated);
    setCode('');
  };

  const confirmTwoFactor = async () => {
    if (code.trim() !== challenge) {
      setError('That code does not match');
      return;
    }
    db.updateSettings({ twoFactorEnabled: true });
    setChallenge(null);
    setCode('');
    toast('Two-step verification is on');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="Security" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Card>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Ionicons name="shield-checkmark" size={22} color={theme.success} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15.5 }}>Account protection</Text>
              <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 6, lineHeight: 19 }}>{describeSecurity()}</Text>
            </View>
          </View>
        </Card>

        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle title="Change password" />
          <Field label="Current password" value={current} onChangeText={setCurrent} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" icon="lock-closed-outline" secureTextEntry />
          <Field label="New password" value={next} onChangeText={setNext} placeholder="At least 8 characters" icon="key-outline" secureTextEntry />
          <Field label="Confirm new password" value={confirmValue} onChangeText={setConfirmValue} placeholder="Repeat it" icon="key-outline" secureTextEntry error={error || undefined} />
          <Button label="Update password" loading={busy} onPress={changePassword} disabled={!current || !next} />
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle title="Two-step verification" />
          <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>Require a code at sign in</Text>
              <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 3, lineHeight: 17 }}>
                A 6-digit code is required after your password. In production this is delivered by SMS or an authenticator app.
              </Text>
            </View>
            <Switch value={me.settings.twoFactorEnabled} onValueChange={toggleTwoFactor} trackColor={{ true: theme.brand, false: theme.border }} thumbColor="#fff" />
          </View>
          {challenge ? (
            <View style={{ marginTop: spacing.md }}>
              <Banner text={`Verification demo code: ${challenge}. Enter it below to activate two-step verification.`} icon="key-outline" />
              <Field label="Enter code" value={code} onChangeText={setCode} placeholder="6-digit code" keyboardType="number-pad" maxLength={6} autoFocus />
              <Button label="Activate two-step" onPress={confirmTwoFactor} disabled={code.length !== 6} />
            </View>
          ) : null}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle title="Sessions" />
          <Card>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14.5 }}>This device</Text>
            <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 4 }}>
              Active since {new Date(me.joinedAt).toLocaleDateString()} \u00b7 session token stored in the device keychain
            </Text>
            <View style={{ height: 12 }} />
            <Button
              label="Sign out everywhere"
              variant="secondary"
              size="sm"
              onPress={async () => {
                const ok = await confirm({ title: 'Sign out of all devices?', message: 'You will need your password to log back in.', confirmLabel: 'Sign out' });
                if (ok) {
                  await db.signOut();
                  navigation.reset({ index: 0, routes: [{ name: Routes.Welcome }] });
                }
              }}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
});

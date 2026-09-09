import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp, useTheme } from '../../lib/store';
import { spacing } from '../../lib/theme';
import { Routes } from '../../lib/routes';
import * as db from '../../lib/db';
import { validatePassword } from '../../lib/validation';
import { Banner, Button, Field, ProgressBar } from '../../components/UI';
import { LogoMark } from '../../components/Logo';

type Step = 'request' | 'verify' | 'done';

export function ForgotPasswordScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { toast } = useApp();
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [hint, setHint] = useState<{ code: string; handle: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const requestCode = async () => {
    setBusy(true);
    setError('');
    const result = await db.requestPasswordReset(identifier);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong');
      return;
    }
    setHint({ code: result.debugCode as string, handle: (result.handle as string) ?? '' });
    setStep('verify');
  };

  const reset = async () => {
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    const check = validatePassword(password);
    if (!check.ok) {
      setError(check.message ?? 'Choose a stronger password');
      return;
    }
    setBusy(true);
    setError('');
    const result = await db.confirmPasswordReset(identifier, code, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Could not reset password');
      return;
    }
    setStep('done');
  };

  const progress = step === 'request' ? 0.33 : step === 'verify' ? 0.66 : 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </Pressable>
          <View style={{ alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.lg }}>
            <LogoMark size={48} />
            <Text style={[styles.title, { color: theme.text }]}>Reset your password</Text>
            <Text style={{ color: theme.textMuted, fontSize: 14, marginTop: 4, textAlign: 'center' }}>
              {step === 'request' ? 'We will email a one-time code.' : step === 'verify' ? 'Enter the code and choose a new password.' : 'Your password has been updated.'}
            </Text>
          </View>
          <ProgressBar fraction={progress} />
          <View style={{ height: spacing.xl }} />

          {step === 'request' ? (
            <>
              <Field label="Account identifier" value={identifier} onChangeText={setIdentifier} placeholder="@username or email" icon="at-outline" autoFocus />
              <Button label="Send recovery code" loading={busy} size="lg" onPress={requestCode} disabled={!identifier.trim()} />
            </>
          ) : null}

          {step === 'verify' ? (
            <>
              <Banner
                text={
                  hint?.code
                    ? `Delivery simulation: the code for @${hint.handle} is ${hint.code}. A production build sends this from the auth service so it never appears in the client.`
                    : 'Enter the code we sent you.'
                }
                icon="mail-open-outline"
              />
              {error ? <Banner text={error} tone="danger" icon="alert-circle-outline" /> : null}
              <Field label="Recovery code" value={code} onChangeText={setCode} placeholder="6-digit code" keyboardType="number-pad" maxLength={6} />
              <Field label="New password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" icon="lock-closed-outline" secureTextEntry />
              <Field label="Confirm new password" value={confirm} onChangeText={setConfirm} placeholder="Repeat it" icon="lock-closed-outline" secureTextEntry />
              <Button label="Set new password" size="lg" loading={busy} onPress={reset} disabled={code.length !== 6 || !password} />
              <Pressable onPress={() => setStep('request')} style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 13.5 }}>Use a different account</Text>
              </Pressable>
            </>
          ) : null}

          {step === 'done' ? (
            <>
              <View style={[styles.success, { backgroundColor: theme.dark ? `${theme.success}1A` : `${theme.success}12`, borderColor: `${theme.success}55` }]}>
                <Ionicons name="shield-checkmark" size={38} color={theme.success} />
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17, marginTop: 12 }}>Password updated</Text>
                <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                  All other sessions were signed out as a precaution. Log in again with your new password.
                </Text>
              </View>
              <Button label="Back to log in" size="lg" onPress={() => { toast('Password reset complete'); navigation.replace(Routes.Login); }} />
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingTop: spacing.lg, maxWidth: 520, width: '100%', alignSelf: 'center' },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 14 },
  success: { alignItems: 'center', padding: spacing.xl, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.xl },
});

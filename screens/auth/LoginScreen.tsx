import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp, useTheme } from '../../lib/store';
import { spacing } from '../../lib/theme';
import { Routes } from '../../lib/routes';
import * as db from '../../lib/db';
import { Banner, Button, Field } from '../../components/UI';
import { LogoMark, Wordmark } from '../../components/Logo';

export function LoginScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { toast } = useApp();
  const preset = route.params?.identifier as string | undefined;

  const [identifier, setIdentifier] = useState(preset ?? '');
  const [password, setPassword] = useState(route.params?.password ?? '');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState<{ userId: string; code: string } | null>(null);
  const [code, setCode] = useState('');

  const submit = async () => {
    const next: typeof errors = {};
    if (!identifier.trim()) next.identifier = 'Enter your username or email';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    setFormError('');
    const result = await db.signIn(identifier, password);
    setBusy(false);
    if (result.ok) {
      toast('Welcome back');
      navigation.replace(Routes.Home);
      return;
    }
    if (result.needsTwoFactor) {
      setChallenge({ userId: result.userId as string, code: result.debugCode as string });
      return;
    }
    setFormError(result.error ?? 'Sign in failed');
  };

  const submitCode = async () => {
    if (!challenge) return;
    setBusy(true);
    const result = await db.verifyTwoFactorCode(challenge.userId, code);
    setBusy(false);
    if (result.ok) {
      toast('Identity confirmed');
      navigation.replace(Routes.Home);
    } else {
      setFormError(result.error ?? 'Verification failed');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <LogoMark size={58} />
            <View style={{ marginTop: 12 }}>
              <Wordmark size={24} />
            </View>
            <Text style={{ color: theme.textMuted, marginTop: 6, fontSize: 14 }}>{challenge ? 'Two-step verification' : 'Welcome back'}</Text>
          </View>

          {formError ? <Banner text={formError} tone="danger" icon="alert-circle-outline" /> : null}

          {!challenge ? (
            <>
              <Field
                label="Username or email"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="@handle or you@email.com"
                icon="at-outline"
                error={errors.identifier}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                icon="lock-closed-outline"
                secureTextEntry
                error={errors.password}
                returnKeyType="done"
                onSubmitEditing={submit}
              />
              <Pressable onPress={() => navigation.navigate(Routes.ForgotPassword)} style={{ alignSelf: 'flex-end', marginBottom: spacing.lg }}>
                <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 13.5 }}>Forgot password?</Text>
              </Pressable>
              <Button label="Log in" size="lg" loading={busy} onPress={submit} />
            </>
          ) : (
            <>
              <Banner
                text={`For your security we sent a 6-digit code to the recovery contact on this account. In this demo build the code is ${challenge.code} \u2014 in production it is delivered by SMS or your authenticator app.`}
                icon="shield-checkmark-outline"
              />
              <Field label="Verification code" value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" maxLength={6} autoFocus />
              <Button label="Verify and continue" size="lg" loading={busy} onPress={submitCode} disabled={code.length !== 6} />
              <Pressable onPress={() => setChallenge(null)} style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                <Text style={{ color: theme.textMuted, fontWeight: '600', fontSize: 13.5 }}>Use a different account</Text>
              </Pressable>
            </>
          )}

          <Pressable onPress={() => navigation.replace(Routes.Signup)} style={styles.footer}>
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>
              New here? <Text style={{ color: theme.brand, fontWeight: '800' }}>Create an account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingTop: spacing.xxl, maxWidth: 520, width: '100%', alignSelf: 'center' },
  footer: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xl },
});

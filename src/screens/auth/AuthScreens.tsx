import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Button, Field, Logo } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import type { Nav } from '../../navigation/types';

/** Shared shell for Login / Signup / Forgot password. */
export const AuthShell: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, subtitle, children, footer }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <LinearGradient
        colors={theme.mode === 'dark' ? ['#1A1240', '#0B0916'] : ['#EDE8FF', '#F4F3FB']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 340 }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 46, paddingBottom: insets.bottom + 32, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Logo size={40} />
          <Text style={{ color: theme.text, fontSize: 30, fontWeight: '800', letterSpacing: -1, marginTop: 28 }}>
            {title}
          </Text>
          <Text style={{ color: theme.textDim, fontSize: 14.5, marginTop: 8, lineHeight: 21, marginBottom: 26 }}>
            {subtitle}
          </Text>
          {children}
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export const LoginScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const { signIn, authError } = useStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const submit = async () => {
    setTouched(true);
    if (!identifier.trim() || password.length < 4) return;
    setBusy(true);
    await signIn(identifier, password);
    setBusy(false);
  };

  const fieldError = (field: string) =>
    authError && (field === 'form' || authError.toLowerCase().includes(field)) ? authError : null;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to catch up with your circle, stories and drops."
      footer={
        <View style={{ marginTop: 26, alignItems: 'center', gap: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: theme.textDim, fontSize: 14 }}>New here?</Text>
            <Pressable onPress={() => nav.navigate('Signup')} accessibilityRole="button" accessibilityLabel="Create an account">
              <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 14 }}>Create account</Text>
            </Pressable>
          </View>

          <View style={{ width: '100%', gap: 8 }}>
            <Text style={{ color: theme.textFaint, fontSize: 11.5, textAlign: 'center', letterSpacing: 0.4 }}>
              DEMO ACCOUNTS
            </Text>
            <Button
              title="Continue as creator (nova.frames)"
              variant="soft"
              size="sm"
              icon="flash-outline"
              full
              onPress={() => { setIdentifier('nova@vibeconnect.app'); setPassword('vibeconnect2026'); }}
            />
            <Button
              title="Continue as moderator (admin)"
              variant="ghost"
              size="sm"
              icon="shield-checkmark-outline"
              full
              onPress={() => { setIdentifier('admin@vibeconnect.app'); setPassword('vibeconnect2026'); }}
            />
          </View>
        </View>
      }
    >
      <Field
        label="EMAIL OR USERNAME"
        icon="at-outline"
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="next"
        value={identifier}
        onChangeText={setIdentifier}
        error={touched && !identifier.trim() ? 'Enter your email or username.' : fieldError('email')}
      />
      <Field
        label="PASSWORD"
        icon="lock-closed-outline"
        placeholder="••••••••"
        secureTextEntry={secure}
        autoComplete="password"
        returnKeyType="done"
        value={password}
        onChangeText={setPassword}
        error={touched && password.length < 4 ? 'Password is required.' : fieldError('password')}
      />
      <Pressable
        onPress={() => setSecure((s) => !s)}
        style={{ alignSelf: 'flex-end', marginTop: -6, marginBottom: 14 }}
        accessibilityRole="button"
        accessibilityLabel={secure ? 'Show password' : 'Hide password'}
      >
        <Text style={{ color: theme.textDim, fontSize: 12.5, fontWeight: '600' }}>{secure ? 'Show password' : 'Hide password'}</Text>
      </Pressable>

      {authError && (
        <View style={[styles.banner, { backgroundColor: theme.mode === 'dark' ? '#3A1830' : '#FDE8EE' }]}>
          <Text style={{ color: theme.danger, fontSize: 13, flex: 1 }}>{authError}</Text>
        </View>
      )}

      <Button title="Sign in" size="lg" full loading={busy} onPress={submit} style={{ marginTop: 6 }} />
      <Pressable
        onPress={() => nav.navigate('Forgot')}
        style={{ alignSelf: 'center', marginTop: 18 }}
        accessibilityRole="button"
        accessibilityLabel="Forgot password"
      >
        <Text style={{ color: theme.textDim, fontSize: 13.5, fontWeight: '600' }}>Forgot your password?</Text>
      </Pressable>
    </AuthShell>
  );
};

export const SignupScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const { signUp, authError } = useStore();
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '' });
  const [secure, setSecure] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const next: Record<string, string> = {};
    if (form.displayName.trim().length < 2) next.displayName = 'Tell us your name (2+ characters).';
    if (!/^[a-z0-9._]{3,20}$/i.test(form.username.trim())) next.username = '3-20 chars: letters, numbers, dot or underscore.';
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
      next.password = 'At least 8 characters with a letter and a number.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const res = await signUp({
      displayName: form.displayName,
      username: form.username,
      email: form.email,
      password: form.password,
    });
    setBusy(false);
    if (!res.ok) setErrors({ [res.error.field]: res.error.message });
  };

  const err = (k: string) => errors[k] ?? (authError && authError.toLowerCase().includes(k) ? authError : null);

  return (
    <AuthShell
      title="Join VibeConnect"
      subtitle="One place for photos, shorts, long videos, stories and your people."
      footer={
        <View style={{ marginTop: 26, alignItems: 'center' }}>
          <Pressable onPress={() => nav.navigate('Login')} accessibilityRole="button" accessibilityLabel="Back to sign in">
            <Text style={{ color: theme.textDim, fontSize: 14 }}>
              Already have an account? <Text style={{ color: theme.primary, fontWeight: '800' }}>Sign in</Text>
            </Text>
          </Pressable>
          <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 18, lineHeight: 17, textAlign: 'center' }}>
            By joining you agree to the Community Guidelines and Terms of Service,{'\n'}and to our Privacy Policy.
          </Text>
        </View>
      }
    >
      <Field
        label="DISPLAY NAME"
        icon="person-outline"
        placeholder="Alex Rivera"
        value={form.displayName}
        onChangeText={set('displayName')}
        error={err('displayName')}
        returnKeyType="next"
      />
      <Field
        label="USERNAME"
        icon="at-outline"
        placeholder="alex.rivera"
        autoCapitalize="none"
        value={form.username}
        onChangeText={set('username')}
        error={err('username')}
        helperText="Unique across VibeConnect"
        returnKeyType="next"
      />
      <Field
        label="EMAIL"
        icon="mail-outline"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={form.email}
        onChangeText={set('email')}
        error={err('email')}
        returnKeyType="next"
      />
      <Field
        label="PASSWORD"
        icon="lock-closed-outline"
        placeholder="8+ characters, letters and numbers"
        secureTextEntry={secure}
        value={form.password}
        onChangeText={set('password')}
        error={err('password')}
        returnKeyType="done"
      />
      <Pressable onPress={() => setSecure((s) => !s)} style={{ alignSelf: 'flex-end', marginTop: -6 }} accessibilityRole="button">
        <Text style={{ color: theme.textDim, fontSize: 12.5, fontWeight: '600' }}>{secure ? 'Show password' : 'Hide password'}</Text>
      </Pressable>
      <Button title="Create account" size="lg" full loading={busy} onPress={submit} style={{ marginTop: 20 }} />
    </AuthShell>
  );
};

export const ForgotPasswordScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const { requestPasswordReset, resetPassword } = useStore();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const send = async () => {
    setError(null);
    const res = await requestPasswordReset(email);
    if (!res.ok) return setError(res.error.message);
    setSentCode(res.value);
    setStep('reset');
  };

  const confirm = async () => {
    setError(null);
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
      return setError('New password needs 8+ characters with a letter and a number.');
    const res = await resetPassword(email, code, password);
    if (!res.ok) return setError(res.error.message);
    setDone(true);
  };

  return (
    <AuthShell
      title={done ? 'Password updated' : step === 'request' ? 'Reset password' : 'Enter code'}
      subtitle={
        done
          ? 'Your password has been changed. Sign in with the new one.'
          : step === 'request'
            ? 'We will email you a 6-digit recovery code.'
            : 'Enter the code we sent and choose a new password.'
      }
      footer={
        <Pressable onPress={() => nav.navigate('Login')} style={{ alignSelf: 'center', marginTop: 24 }} accessibilityRole="button">
          <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>Back to sign in</Text>
        </Pressable>
      }
    >
      {done ? (
        <Button title="Go to sign in" size="lg" full onPress={() => nav.navigate('Login')} />
      ) : step === 'request' ? (
        <>
          <Field
            label="EMAIL"
            icon="mail-outline"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={error}
            returnKeyType="done"
          />
          {sentCode && (
            <View style={[styles.banner, { backgroundColor: theme.primarySoft, marginBottom: 14 }]}>
              <Text style={{ color: theme.primary, fontSize: 13, flex: 1 }}>
                Demo mode: your recovery code is {sentCode}. In production this arrives by email.
              </Text>
            </View>
          )}
          <Button title="Send recovery code" size="lg" full onPress={send} disabled={!email.trim()} />
        </>
      ) : (
        <>
          <Field
            label="RECOVERY CODE"
            icon="key-outline"
            placeholder="6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            returnKeyType="next"
          />
          <Field
            label="NEW PASSWORD"
            icon="lock-closed-outline"
            placeholder="8+ characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={error}
            returnKeyType="done"
          />
          <Button title="Set new password" size="lg" full onPress={confirm} disabled={code.length < 6 || password.length < 8} />
          <Button title="Resend code" variant="ghost" full style={{ marginTop: 10 }} onPress={send} />
        </>
      )}
    </AuthShell>
  );
};

const styles = StyleSheet.create({
  banner: { borderRadius: 14, padding: 12, marginBottom: 14 },
});

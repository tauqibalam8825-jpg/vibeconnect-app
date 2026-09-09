import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../lib/store';
import { spacing } from '../../lib/theme';
import { Routes } from '../../lib/routes';
import * as db from '../../lib/db';
import { validateDisplayName, validateEmail, validatePassword, validateUsername } from '../../lib/validation';
import { Banner, Button, Field } from '../../components/UI';
import { LogoMark } from '../../components/Logo';

export function SignupScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const errors = useMemo(() => {
    const nameCheck = validateDisplayName(displayName);
    const userCheck = validateUsername(username);
    const emailCheck = validateEmail(email);
    const passCheck = validatePassword(password);
    const taken = db.userByUsername(username) ? { ok: false, message: 'That handle is taken' } : { ok: true };
    return {
      displayName: nameCheck.ok ? undefined : nameCheck.message,
      username: userCheck.ok ? (taken.ok ? undefined : taken.message) : userCheck.message,
      email: emailCheck.ok ? undefined : emailCheck.message,
      password: passCheck.ok ? undefined : passCheck.message,
    };
  }, [displayName, username, email, password]);

  const submit = async () => {
    setTouched(true);
    if (Object.values(errors).some(Boolean) || !agreed) return;
    setBusy(true);
    setFormError('');
    const result = await db.signUp({ username, displayName, email, password });
    setBusy(false);
    if (!result.ok) {
      setFormError(result.error ?? 'Could not create your account');
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: Routes.ProfileSetup, params: { fresh: true } }] });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </Pressable>

          <View style={{ alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl }}>
            <LogoMark size={54} />
            <Text style={[styles.title, { color: theme.text }]}>Claim your handle</Text>
            <Text style={{ color: theme.textMuted, fontSize: 14, marginTop: 4 }}>Your username is how people find you. It can change later.</Text>
          </View>

          {formError ? <Banner text={formError} tone="danger" icon="alert-circle-outline" /> : null}

          <Field label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="How should people see you?" icon="person-outline" autoCapitalize="words" error={touched ? errors.displayName : undefined} maxLength={40} />
          <Field
            label="Username"
            value={username}
            onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="lowercase_letters_and_numbers"
            icon="at-outline"
            error={touched ? errors.username : undefined}
            hint={username.length >= 3 && !errors.username ? `vibeconnect.app/@${username} is available` : '3\u201320 characters, no spaces'}
            maxLength={20}
          />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" icon="mail-outline" keyboardType="email-address" error={touched ? errors.email : undefined} />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" icon="lock-closed-outline" secureTextEntry error={touched ? errors.password : undefined} />

          <Pressable onPress={() => setAgreed((a) => !a)} style={styles.agreeRow}>
            <View style={[styles.checkbox, { backgroundColor: agreed ? theme.brand : 'transparent', borderColor: agreed ? theme.brand : theme.border }]}>
              {agreed ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 13, flex: 1, lineHeight: 19 }}>
              I agree to the Community Guidelines and Privacy Policy, and I am old enough to use VibeConnect.
            </Text>
          </Pressable>

          <Button label="Create account" size="lg" loading={busy} onPress={submit} disabled={!agreed} />
          <Pressable onPress={() => navigation.replace(Routes.Login)} style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>
              Already have an account? <Text style={{ color: theme.brand, fontWeight: '800' }}>Log in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingTop: spacing.lg, maxWidth: 520, width: '100%', alignSelf: 'center' },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginTop: 14 },
  agreeRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: spacing.xl },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});

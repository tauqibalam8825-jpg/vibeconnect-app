import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../lib/store';
import { gradients, radii, shadow, spacing } from '../../lib/theme';
import { Routes } from '../../lib/routes';
import { LogoMark, Wordmark } from '../../components/Logo';
import { Button } from '../../components/UI';
import { DEMO_PASSWORD } from '../../lib/seed';

const HIGHLIGHTS: Array<{ icon: keyof typeof Ionicons.glyphMap; title: string; body: string }> = [
  { icon: 'flash', title: 'Vibe Shorts', body: 'A full-screen vertical feed built for the ten-second idea.' },
  { icon: 'play-circle', title: 'Watch', body: 'Long-form video with resume, chapters of your attention intact.' },
  { icon: 'mic', title: 'Real conversation', body: 'Chats with photos, clips and voice notes that feel human.' },
  { icon: 'trending-up', title: 'Creator studio', body: 'Understand your audience, then get paid for the work.' },
];

export function WelcomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width, 520) - spacing.xl * 2;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <LinearGradient colors={[gradients.brand[0], gradients.brand[1], theme.bg]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xxl * 1.4 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(60).springify()} style={{ alignItems: 'center' }}>
            <View style={[styles.logoTile, shadow(14, theme)]}>
              <LogoMark size={76} radius={24} />
            </View>
            <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
              <Wordmark size={32} color="#fff" />
            </View>
            <Text style={styles.tagline}>Share the signal, skip the noise.</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(180).springify()} style={{ marginTop: spacing.xxl }}>
            {HIGHLIGHTS.map((item, i) => (
              <Animated.View key={item.title} entering={FadeInUp.delay(240 + i * 70)} style={[styles.highlight, { backgroundColor: 'rgba(255,255,255,0.09)', borderColor: 'rgba(255,255,255,0.14)' }]}>
                <View style={[styles.highlightIcon, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                  <Ionicons name={item.icon} size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.highlightTitle}>{item.title}</Text>
                  <Text style={styles.highlightBody}>{item.body}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(520).springify()} style={{ marginTop: spacing.xxl, width: cardWidth, alignSelf: 'center' }}>
            <Button label="Create your account" size="lg" onPress={() => navigation.navigate(Routes.Signup)} style={{ shadowColor: '#6C4CF1' }} />
            <View style={{ height: spacing.md }} />
            <Pressable onPress={() => navigation.navigate(Routes.Login)} style={styles.loginLink}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                Already here? <Text style={{ fontWeight: '800', textDecorationLine: 'underline' }}>Log in</Text>
              </Text>
            </Pressable>

            <View style={[styles.demoCard, { borderColor: 'rgba(255,255,255,0.16)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="key-outline" size={14} color="#2BE0C8" />
                <Text style={styles.demoTitle}>Explore with a demo account</Text>
              </View>
              <Text style={styles.demoBody}>Everything works with your own account too \u2014 these are seeded with content so nothing looks empty.</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { handle: 'aurora.wav', label: 'Verified creator \u00b7 studio + wallet' },
                  { handle: 'kaya.trails', label: 'Pending monetization applicant' },
                  { handle: 'admin', label: 'Moderator \u00b7 admin panel' },
                ].map((row) => (
                  <Pressable
                    key={row.handle}
                    onPress={() => navigation.navigate(Routes.Login, { identifier: row.handle, password: DEMO_PASSWORD })}
                    style={({ pressed }) => [styles.demoRow, { backgroundColor: pressed ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)' }]}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13.5, flex: 1 }}>@{row.handle}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12 }}>{row.label}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                  </Pressable>
                ))}
              </View>
            </View>
            <Text style={styles.legal}>By continuing you agree to the VibeConnect Community Guidelines and acknowledge the Privacy Policy.</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  logoTile: { borderRadius: 26, overflow: 'hidden' },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '500', marginTop: 6, letterSpacing: -0.2 },
  highlight: { flexDirection: 'row', gap: 14, alignItems: 'center', padding: 14, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
  highlightIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  highlightTitle: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  highlightBody: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2, lineHeight: 18 },
  loginLink: { alignItems: 'center', paddingVertical: 12 },
  demoCard: { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg, backgroundColor: 'rgba(11,9,18,0.35)', marginTop: spacing.md },
  demoTitle: { color: '#fff', fontSize: 12.5, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' as const },
  demoBody: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 18 },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  legal: { color: 'rgba(255,255,255,0.6)', fontSize: 11.5, textAlign: 'center', marginTop: spacing.lg, lineHeight: 17 },
});

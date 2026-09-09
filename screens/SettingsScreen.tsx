/**
 * Settings — theme, layout, WP URL, cache, about.
 * Runtime WP URL override is stored in AsyncStorage so buyers can demo multiple sites.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import config, { LayoutStyle, ThemePreference } from '../config/config';
import { LAYOUT_LABELS, MODE_LABELS } from '../config/theme';
import { useApp } from '../context/AppContext';
import { pingWordPress } from '../api/wordpress';
import type { RootStackParamList } from '../navigation/types';

export default function SettingsScreen() {
  const {
    theme,
    themePref,
    setThemePref,
    layout,
    setLayout,
    wpUrl,
    setWpUrl,
    clearCache,
    favorites,
    readingList,
  } = useApp();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [urlDraft, setUrlDraft] = useState(wpUrl);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const themes: { key: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
    { key: 'light', label: 'Light', icon: 'sunny-outline' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' },
  ];

  const layouts: LayoutStyle[] = ['list', 'grid', 'masonry'];

  const onTest = async () => {
    setTesting(true);
    setTestMsg(null);
    const res = await pingWordPress(urlDraft);
    setTesting(false);
    setTestMsg(res.ok ? `Connected: ${res.name}` : res.error || 'Connection failed');
  };

  const onSaveUrl = async () => {
    const cleaned = urlDraft.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(cleaned)) {
      Alert.alert('Invalid URL', 'Please enter a full URL starting with https://');
      return;
    }
    setSaving(true);
    const res = await pingWordPress(cleaned);
    if (!res.ok) {
      setSaving(false);
      Alert.alert(
        'Cannot reach site',
        `${res.error}\n\nSave anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: async () => {
              await setWpUrl(cleaned);
              setTestMsg('Saved (unreachable for now)');
            },
          },
        ]
      );
      return;
    }
    await setWpUrl(cleaned);
    setSaving(false);
    setTestMsg(`Saved · ${res.name}`);
    Alert.alert('WordPress connected', `Now pulling content from ${res.name}`);
  };

  const onClearCache = () => {
    Alert.alert('Clear cache', 'Remove cached API responses?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearCache();
          Alert.alert('Done', 'Cache cleared.');
        },
      },
    ]);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>{title}</Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderRadius: theme.cardRadius,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );

  const Row = ({
    icon,
    label,
    value,
    onPress,
    danger,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? theme.colors.danger : theme.colors.primary}
      />
      <Text style={[styles.rowLabel, { color: danger ? theme.colors.danger : theme.colors.text }]}>
        {label}
      </Text>
      {!!value && (
        <Text style={[styles.rowValue, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {value}
        </Text>
      )}
      {!!onPress && <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
        <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
          Brand · theme · WordPress connection
        </Text>
      </View>

      {/* Profile-ish header card */}
      <View
        style={[
          styles.profile,
          { backgroundColor: theme.colors.primary, borderRadius: theme.cardRadius },
        ]}
      >
        <View style={styles.profileIcon}>
          <Ionicons name="pulse" size={28} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{config.appName}</Text>
          <Text style={styles.profileMode}>{MODE_LABELS[config.contentMode]} mode · v{config.appVersion}</Text>
        </View>
      </View>

      <Section title="Appearance">
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Theme</Text>
        <View style={styles.segment}>
          {themes.map((t) => {
            const active = themePref === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setThemePref(t.key)}
                style={[
                  styles.segmentBtn,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.inputBg,
                  },
                ]}
              >
                <Ionicons name={t.icon} size={16} color={active ? '#fff' : theme.colors.textSecondary} />
                <Text style={{ color: active ? '#fff' : theme.colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          Home layout
        </Text>
        <View style={styles.segment}>
          {layouts.map((l) => {
            const active = layout === l;
            return (
              <TouchableOpacity
                key={l}
                onPress={() => setLayout(l)}
                style={[
                  styles.segmentBtn,
                  { backgroundColor: active ? theme.colors.primary : theme.colors.inputBg },
                ]}
              >
                <Text style={{ color: active ? '#fff' : theme.colors.textSecondary, fontWeight: '600', fontSize: 12 }}>
                  {LAYOUT_LABELS[l]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Section>

      <Section title="WordPress site">
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          Paste your site origin only (no /wp-json). Example: https://myblog.com
        </Text>
        <TextInput
          style={[
            styles.urlInput,
            {
              backgroundColor: theme.colors.inputBg,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          value={urlDraft}
          onChangeText={setUrlDraft}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://your-site.com"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="done"
        />
        <View style={styles.urlActions}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
            onPress={onTest}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Test</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={onSaveUrl}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700' }}>Save URL</Text>
            )}
          </TouchableOpacity>
        </View>
        {!!testMsg && (
          <Text
            style={[
              styles.testMsg,
              { color: testMsg.startsWith('Connected') || testMsg.startsWith('Saved') ? theme.colors.success : theme.colors.danger },
            ]}
          >
            {testMsg}
          </Text>
        )}
      </Section>

      <Section title="Library">
        <Row icon="heart" label="Bookmarks" value={String(favorites.length)} />
        {config.enableReadingList && (
          <Row
            icon="book"
            label="Quick Read list"
            value={String(readingList.length)}
            onPress={() => navigation.navigate('ReadingList')}
          />
        )}
        <Row icon="trash-outline" label="Clear API cache" onPress={onClearCache} danger />
      </Section>

      <Section title="About">
        <Row icon="information-circle-outline" label="Version" value={config.appVersion} />
        <Row
          icon="mail-outline"
          label="Support"
          value={config.supportEmail}
          onPress={() => Linking.openURL(`mailto:${config.supportEmail}`)}
        />
        <Row
          icon="shield-checkmark-outline"
          label="Privacy policy"
          onPress={() => Linking.openURL(config.privacyPolicyUrl)}
        />
        <Row
          icon="code-slash-outline"
          label="Config mode"
          value={MODE_LABELS[config.contentMode]}
        />
      </Section>

      <Text style={[styles.footerNote, { color: theme.colors.textMuted }]}>
        WPPulse template · Edit config/config.ts to lock branding for production builds.
        Runtime URL changes above are for testing only.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: 4,
    fontSize: 14,
  },
  profile: {
    marginHorizontal: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  profileIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  profileMode: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontSize: 13,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    overflow: 'hidden',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  urlInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  urlActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  testMsg: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 13,
    maxWidth: 140,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 28,
    paddingHorizontal: 32,
  },
});

import React from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../lib/store';
import { spacing } from '../lib/theme';
import { LogoMark } from './Logo';

export function Screen({ children, scroll = false, padded = false, style, edges = ['top'] }: { children: React.ReactNode; scroll?: boolean; padded?: boolean; style?: StyleProp<ViewStyle>; edges?: ('top' | 'bottom')[] }) {
  const theme = useTheme();
  if (scroll) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: theme.bg }, style]} edges={edges}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[{ paddingBottom: 40 }, padded && { paddingHorizontal: spacing.lg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: theme.bg }, style]} edges={edges}>
      <View style={[{ flex: 1 }, padded && { paddingHorizontal: spacing.lg }]}>{children}</View>
    </SafeAreaView>
  );
}

export function AppHeader({
  title,
  subtitle,
  back = true,
  right,
  logo,
  transparent,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  logo?: boolean;
  transparent?: boolean;
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: transparent ? 'transparent' : theme.dark ? 'rgba(11,9,18,0.92)' : 'rgba(246,245,251,0.94)',
          borderBottomColor: transparent ? 'transparent' : theme.divider,
        },
      ]}
    >
      <View style={styles.headerSide}>
        {back ? (
          <Pressable
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : null)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="chevron-back" size={21} color={theme.text} />
          </Pressable>
        ) : logo ? (
          <LogoMark size={32} />
        ) : (
          <View style={{ width: 8 }} />
        )}
      </View>
      <View style={styles.headerCenter}>
        {title ? (
          <Text numberOfLines={1} style={{ color: theme.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text numberOfLines={1} style={{ color: theme.textFaint, fontSize: 12, fontWeight: '600', marginTop: 1 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

export function TabHeader({ left, right }: { left?: React.ReactNode; right?: React.ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: spacing.lg, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider }}>
      <LogoMark size={32} />
      <View style={{ flex: 1 }}>{left}</View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  headerSide: { minWidth: 78, justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
});

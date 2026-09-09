import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useCategories } from '../hooks/useCategories';
import EmptyState from '../components/EmptyState';
import { CategorySkeleton } from '../components/SkeletonLoader';
import type { RootStackParamList } from '../navigation/types';
import type { WPCategory } from '../api/types';
import { decodeHtml } from '../utils/html';

const ACCENT_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'bookmark',
  'flame',
  'planet',
  'color-palette',
  'cafe',
  'camera',
  'musical-notes',
  'fitness',
  'leaf',
  'rocket',
];

export default function CategoriesScreen() {
  const { theme } = useApp();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { categories, loading, error, refreshing, refresh } = useCategories();

  const openCategory = (category: WPCategory) => {
    navigation.navigate('CategoryPosts', { category });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Categories</Text>
        <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
          Browse topics from your WordPress site
        </Text>
      </View>

      {loading && !refreshing ? (
        <CategorySkeleton />
      ) : error && categories.length === 0 ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Categories unavailable"
          message={error}
          actionLabel="Retry"
          onAction={refresh}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon="folder-open-outline"
          title="No categories"
          message="Create categories in WordPress and assign posts to them."
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          renderItem={({ item, index }) => {
            const icon = ACCENT_ICONS[index % ACCENT_ICONS.length];
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openCategory(item)}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderRadius: theme.cardRadius,
                    shadowColor: '#000',
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.colors.chipBg }]}>
                  <Ionicons name={icon} size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.body}>
                  <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
                    {decodeHtml(item.name)}
                  </Text>
                  {!!item.description && (
                    <Text style={[styles.desc, { color: theme.colors.textMuted }]} numberOfLines={1}>
                      {decodeHtml(item.description)}
                    </Text>
                  )}
                </View>
                <View style={styles.right}>
                  <View style={[styles.badge, { backgroundColor: theme.colors.chipBg }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                      {item.count}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 2,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    marginHorizontal: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  desc: {
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

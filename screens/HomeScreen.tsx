/**
 * Home feed — latest posts from WordPress with layout toggle,
 * category chips, pull-to-refresh, and infinite scroll.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import config from '../config/config';
import { useApp } from '../context/AppContext';
import { usePosts } from '../hooks/usePosts';
import { useCategories } from '../hooks/useCategories';
import PostCard from '../components/PostCard';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';
import { FeedSkeleton } from '../components/SkeletonLoader';
import type { RootStackParamList } from '../navigation/types';
import type { AppPost } from '../api/types';
import type { LayoutStyle } from '../config/config';

export default function HomeScreen() {
  const { theme, layout, setLayout } = useApp();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const [selectedCat, setSelectedCat] = useState<number | null>(
    config.featuredCategoryIds[0] ?? null
  );

  const categoriesFilter = useMemo(() => {
    if (selectedCat) return [selectedCat];
    if (config.featuredCategoryIds.length) return config.featuredCategoryIds;
    return undefined;
  }, [selectedCat]);

  // Force masonry when browsing a photo category
  const effectiveLayout: LayoutStyle = useMemo(() => {
    if (selectedCat && config.photoCategoryIds.includes(selectedCat)) return 'masonry';
    return layout;
  }, [layout, selectedCat]);

  const { posts, loading, refreshing, loadingMore, error, refresh, loadMore, hasMore } =
    usePosts({ categories: categoriesFilter });

  const { categories } = useCategories();

  const cycleLayout = () => {
    const order: LayoutStyle[] = ['list', 'grid', 'masonry'];
    const idx = order.indexOf(layout);
    setLayout(order[(idx + 1) % order.length]);
  };

  const layoutIcon =
    effectiveLayout === 'list'
      ? 'list'
      : effectiveLayout === 'grid'
        ? 'grid'
        : 'apps';

  const isGrid = effectiveLayout === 'grid' || effectiveLayout === 'masonry';
  const numColumns = isGrid ? 2 : 1;

  const renderItem = useCallback(
    ({ item, index }: { item: AppPost; index: number }) => {
      if (isGrid) {
        return (
          <View style={{ width: (width - 24) / 2, paddingLeft: index % 2 === 0 ? 12 : 6, paddingRight: index % 2 === 0 ? 6 : 12 }}>
            <PostCard post={item} variant={effectiveLayout} />
          </View>
        );
      }
      return <PostCard post={item} variant="list" />;
    },
    [isGrid, width, effectiveLayout]
  );

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.background }]}>
      <View style={styles.headerTop}>
        <View>
          <Text style={[styles.kicker, { color: theme.colors.primary }]}>
            {config.contentMode === 'food'
              ? 'Today\'s kitchen'
              : config.contentMode === 'magazine'
                ? 'Editor\'s pick'
                : 'Latest stories'}
          </Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>{config.appName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={cycleLayout}
            style={[styles.iconBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            accessibilityLabel="Toggle layout"
          >
            <Ionicons name={layoutIcon} size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Search')}
            style={[styles.iconBtn, { backgroundColor: theme.colors.primary }]}
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {categories.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: -1, name: 'All', count: 0 } as never, ...categories.slice(0, 12)]}
          keyExtractor={(item: { id: number }) => String(item.id)}
          contentContainerStyle={styles.chips}
          renderItem={({ item }: { item: { id: number; name: string; count?: number } }) => (
            <CategoryChip
              label={item.name}
              count={item.id === -1 ? undefined : item.count}
              active={item.id === -1 ? selectedCat === null : selectedCat === item.id}
              onPress={() => setSelectedCat(item.id === -1 ? null : item.id)}
            />
          )}
        />
      )}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {header}

      {loading && !refreshing ? (
        <FeedSkeleton layout={effectiveLayout} />
      ) : error && posts.length === 0 ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn’t load posts"
          message={error}
          actionLabel="Try again"
          onAction={refresh}
        />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="newspaper-outline"
          title="No posts yet"
          message="Check your WordPress URL in Settings, or publish a post on your site."
          actionLabel="Refresh"
          onAction={refresh}
        />
      ) : (
        <FlatList
          key={`home-${numColumns}-${effectiveLayout}`}
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={numColumns}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore || hasMore ? (
              <View style={styles.footerLoader}>
                {loadingMore && <ActivityIndicator color={theme.colors.primary} />}
              </View>
            ) : (
              <Text style={[styles.endText, { color: theme.colors.textMuted }]}>
                You’re all caught up
              </Text>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingBottom: 8,
  },
  headerTop: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chips: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 13,
  },
});

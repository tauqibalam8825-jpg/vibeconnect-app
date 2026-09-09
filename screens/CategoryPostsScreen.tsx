import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import config from '../config/config';
import { useApp } from '../context/AppContext';
import { usePosts } from '../hooks/usePosts';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import { FeedSkeleton } from '../components/SkeletonLoader';
import { decodeHtml } from '../utils/html';
import type { RootStackParamList } from '../navigation/types';
import type { AppPost } from '../api/types';
import type { LayoutStyle } from '../config/config';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryPosts'>;

export default function CategoryPostsScreen({ route }: Props) {
  const { category } = route.params;
  const { theme, layout } = useApp();
  const { width } = useWindowDimensions();

  const effectiveLayout: LayoutStyle = useMemo(() => {
    if (config.photoCategoryIds.includes(category.id)) return 'masonry';
    return layout;
  }, [layout, category.id]);

  const { posts, loading, refreshing, loadingMore, error, refresh, loadMore, hasMore } =
    usePosts({ categories: [category.id] });

  const isGrid = effectiveLayout === 'grid' || effectiveLayout === 'masonry';
  const numColumns = isGrid ? 2 : 1;

  const renderItem = useCallback(
    ({ item, index }: { item: AppPost; index: number }) => {
      if (isGrid) {
        return (
          <View
            style={{
              width: (width - 24) / 2,
              paddingLeft: index % 2 === 0 ? 12 : 6,
              paddingRight: index % 2 === 0 ? 6 : 12,
            }}
          >
            <PostCard post={item} variant={effectiveLayout} />
          </View>
        );
      }
      return <PostCard post={item} variant="list" />;
    },
    [isGrid, width, effectiveLayout]
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {loading && !refreshing ? (
        <FeedSkeleton layout={effectiveLayout} />
      ) : error && posts.length === 0 ? (
        <EmptyState icon="cloud-offline-outline" title="Failed to load" message={error} actionLabel="Retry" onAction={refresh} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="folder-open-outline"
          title={`No posts in “${decodeHtml(category.name)}”`}
          message="Publish posts in this category on WordPress to see them here."
        />
      ) : (
        <FlatList
          key={`cat-${numColumns}-${effectiveLayout}`}
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={numColumns}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <Text style={[styles.count, { color: theme.colors.textMuted }]}>
              {category.count} post{category.count === 1 ? '' : 's'}
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={theme.colors.primary} />
            ) : !hasMore ? (
              <Text style={[styles.end, { color: theme.colors.textMuted }]}>End of category</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  count: {
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  end: {
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: 13,
  },
});

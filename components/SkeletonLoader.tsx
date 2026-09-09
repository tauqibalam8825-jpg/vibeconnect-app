/** Shimmer-style skeleton placeholders while WordPress data loads. */

import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useApp } from '../context/AppContext';

function Bone({ style }: { style?: ViewStyle }) {
  const { theme } = useApp();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
  }, [t]);

  const anim = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.45, 1]),
    backgroundColor: theme.colors.skeleton,
  }));

  return <Animated.View style={[styles.bone, style, anim]} />;
}

export function PostCardSkeleton({ variant = 'list' }: { variant?: 'list' | 'grid' }) {
  const { theme } = useApp();

  if (variant === 'grid') {
    return (
      <View style={[styles.gridCard, { backgroundColor: theme.colors.card, borderRadius: theme.cardRadius }]}>
        <Bone style={{ height: 120, borderRadius: theme.cardRadius }} />
        <View style={{ padding: 12, gap: 8 }}>
          <Bone style={{ height: 14, width: '90%' }} />
          <Bone style={{ height: 12, width: '60%' }} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.listCard,
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.cardRadius,
          shadowColor: '#000',
        },
      ]}
    >
      <Bone style={{ height: 180, borderTopLeftRadius: theme.cardRadius, borderTopRightRadius: theme.cardRadius }} />
      <View style={{ padding: 16, gap: 10 }}>
        <Bone style={{ height: 12, width: 80 }} />
        <Bone style={{ height: 18, width: '95%' }} />
        <Bone style={{ height: 18, width: '70%' }} />
        <Bone style={{ height: 12, width: '100%' }} />
        <Bone style={{ height: 12, width: '40%' }} />
      </View>
    </View>
  );
}

export function FeedSkeleton({ layout }: { layout: 'list' | 'grid' | 'masonry' }) {
  const isGrid = layout === 'grid' || layout === 'masonry';

  if (isGrid) {
    return (
      <View style={styles.gridWrap}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.gridItem}>
            <PostCardSkeleton variant="grid" />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ padding: 16, gap: 16 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <PostCardSkeleton key={i} variant="list" />
      ))}
    </View>
  );
}

export function CategorySkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Bone key={i} style={{ height: 64, borderRadius: 16 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bone: {
    borderRadius: 8,
  },
  listCard: {
    overflow: 'hidden',
    elevation: 2,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  gridCard: {
    overflow: 'hidden',
    marginBottom: 12,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  gridItem: {
    width: '50%',
    padding: 6,
  },
});

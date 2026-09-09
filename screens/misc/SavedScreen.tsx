import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { spacing } from '../../lib/theme';
import { Routes } from '../../lib/routes';
import { AppHeader } from '../../components/Screen';
import { EmptyState } from '../../components/UI';
import { PostCard } from '../../components/PostCard';

export function SavedScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { me, db: store, version } = useApp();
  const saved = useMemo(() => (me ? db.savedPosts(me) : []), [me, version]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="Saved" subtitle={`${saved.length} item${saved.length === 1 ? '' : 's'} \u00b7 only you can see this`} />
      <FlatList
        data={saved}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title="Nothing saved yet"
            subtitle="Tap the bookmark on any post, short or video and it lands here for later."
            actionLabel="Explore the feed"
            onAction={() => navigation.navigate(Routes.Explore)}
          />
        }
        renderItem={({ item }) => (
          <View style={{ width: '100%', maxWidth: 620, alignSelf: 'center' }}>
            <PostCard post={item} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

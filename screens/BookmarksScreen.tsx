import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import config from '../config/config';
import type { RootStackParamList } from '../navigation/types';

export default function BookmarksScreen() {
  const { theme, favorites } = useApp();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Bookmarks</Text>
        <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
          {favorites.length} saved · stored on this device
        </Text>
      </View>

      {favorites.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No bookmarks yet"
          message="Tap the heart on any post to save it offline for later."
          actionLabel="Browse home"
          onAction={() => navigation.navigate('MainTabs')}
        />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PostCard post={item} variant="list" />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
          ListFooterComponent={
            config.enableReadingList ? (
              <Text
                onPress={() => navigation.navigate('ReadingList')}
                style={[styles.link, { color: theme.colors.primary }]}
              >
                Open Quick Read list →
              </Text>
            ) : null
          }
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
  link: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
    paddingVertical: 20,
  },
});

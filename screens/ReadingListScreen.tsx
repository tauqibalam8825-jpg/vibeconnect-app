/**
 * Quick Read — a separate local collection for “read later” posts.
 * Distinct from heart-bookmarks so buyers can offer both UX patterns.
 */

import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import type { RootStackParamList } from '../navigation/types';

export default function ReadingListScreen() {
  const { theme, readingList, toggleReadingList } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {readingList.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="Reading list is empty"
          message="Open any post and tap the book icon to add it to Quick Read."
          actionLabel="Discover posts"
          onAction={() => navigation.navigate('MainTabs')}
        />
      ) : (
        <FlatList
          data={readingList}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Text style={[styles.intro, { color: theme.colors.textSecondary }]}>
                {readingList.length} article{readingList.length === 1 ? '' : 's'} queued for offline reading.
                Data stays on-device via AsyncStorage.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View>
              <PostCard post={item} variant="list" />
              <TouchableOpacity
                style={styles.remove}
                onPress={() => toggleReadingList(item)}
              >
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={[styles.removeText, { color: theme.colors.success }]}>Mark as read / remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerBlock: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
  },
  remove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 16,
  },
  removeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

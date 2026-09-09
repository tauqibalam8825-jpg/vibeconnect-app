import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { fetchPosts } from '../api/wordpress';
import { AppPost } from '../api/types';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export default function SearchScreen({}: Props) {
  const { theme } = useApp();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [posts, setPosts] = useState<AppPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setPosts([]);
      setSearched(false);
      setError(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchPosts({ search: debounced, perPage: 20, orderby: 'relevance' });
        if (!alive) return;
        setPosts(result.posts);
        setSearched(true);
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Search failed');
        setPosts([]);
        setSearched(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [debounced]);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.searchBar, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border }]}>
        <Ionicons name="search" size={20} color={theme.colors.textMuted} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Search posts…"
          placeholderTextColor={theme.colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>Searching WordPress…</Text>
        </View>
      ) : error ? (
        <EmptyState icon="alert-circle-outline" title="Search error" message={error} />
      ) : !searched ? (
        <EmptyState
          icon="search-outline"
          title="Find anything"
          message="Type a keyword to search titles and content on your WordPress site."
        />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="sad-outline"
          title="No matches"
          message={`Nothing found for “${debounced}”. Try another keyword.`}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PostCard post={item} variant="list" />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: theme.colors.textMuted }]}>
              {posts.length} result{posts.length === 1 ? '' : 's'} for “{debounced}”
            </Text>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  hint: { fontSize: 14 },
  resultCount: {
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
});

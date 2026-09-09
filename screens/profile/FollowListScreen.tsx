import React, { useMemo, useState } from 'react';
import { FlatList, TextInput, View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { radii, spacing } from '../../lib/theme';
import { AppHeader } from '../../components/Screen';
import { UserRow } from '../../components/Actions';
import { EmptyState } from '../../components/UI';

export function FollowListScreen() {
  const theme = useTheme();
  const route = useRoute<any>();
  const { me, db: store, version } = useApp();
  const userId = route.params?.userId as string;
  const mode: 'followers' | 'following' = route.params?.mode === 'following' ? 'following' : 'followers';
  const [query, setQuery] = useState('');

  const user = db.userById(userId);
  const list = useMemo(() => {
    if (!user || !store) return [];
    const ids = mode === 'followers' ? user.followers : user.following;
    return ids
      .map((id) => db.userById(id))
      .filter((u): u is NonNullable<typeof u> => !!u)
      .filter((u) => !query || u.username.includes(query.toLowerCase()) || u.displayName.toLowerCase().includes(query.toLowerCase()));
  }, [user, store, mode, query, version]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title={mode === 'followers' ? 'Followers' : 'Following'} subtitle={user ? `@${user.username}` : undefined} />
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <View style={[styles.search, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="search" size={17} color={theme.textFaint} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search" placeholderTextColor={theme.textFaint} style={{ flex: 1, color: theme.text, paddingVertical: 10, outlineStyle: 'none' } as any} />
        </View>
      </View>
      <FlatList
        data={list}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40, flexGrow: 1 }}
        ListEmptyComponent={<EmptyState icon="people-outline" title="Nobody here yet" subtitle="When people follow this account they appear in this list." />}
        renderItem={({ item }) => <UserRow user={item} right={me && item.id !== me.id ? <Text style={{ color: me.following.includes(item.id) ? theme.textFaint : theme.brand, fontWeight: '800', fontSize: 12.5 }}>{me.following.includes(item.id) ? 'Following' : 'Follow'}</Text> : null} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth },
});

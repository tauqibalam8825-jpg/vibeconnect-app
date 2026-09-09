import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { spacing } from '../../lib/theme';
import { AppHeader } from '../../components/Screen';
import { UserRow } from '../../components/Actions';
import { Button, EmptyState } from '../../components/UI';

export function BlockedScreen() {
  const theme = useTheme();
  const { me, db: store, toast, version } = useApp();
  const blocked = useMemo(() => (me ? me.blocked.map((id) => db.userById(id)).filter((u): u is NonNullable<typeof u> => !!u) : []), [me, version]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="Blocked accounts" subtitle={`${blocked.length} blocked`} />
      <FlatList
        data={blocked}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1, paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState
            icon="ban-outline"
            title="No blocked accounts"
            subtitle="Blocking someone hides your profile and posts from them and stops their messages. You can undo it any time."
          />
        }
        renderItem={({ item }) => (
          <UserRow
            user={item}
            right={
              <Button
                label="Unblock"
                variant="secondary"
                size="sm"
                full={false}
                onPress={() => {
                  db.unblockUser(item.id);
                  toast(`@${item.username} unblocked`);
                }}
                style={{ width: 110 }}
              />
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});

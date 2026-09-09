import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { radii, spacing } from '../../lib/theme';
import { formatDayLabel, timeAgo, truncate } from '../../lib/format';
import { Routes } from '../../lib/routes';
import { Avatar } from '../../components/Avatar';
import { EmptyState, IconButton, Segmented } from '../../components/UI';
import { UserRow } from '../../components/Actions';
import { Sheet } from '../../components/UI';

function preview(message?: import('../../lib/types').Message): string {
  if (!message) return 'Say hello \u2014 your first message is always free.';
  switch (message.type) {
    case 'image':
      return 'Sent a photo';
    case 'video':
      return 'Sent a video';
    case 'voice':
      return 'Sent a voice note';
    case 'system':
      return message.text ?? '';
    default:
      return message.text ?? '';
  }
}

export function MessagesScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { me, db: store, version } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const conversations = useMemo(() => (me ? db.conversationsFor(me.id) : []), [me, version]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations
      .filter((c) => (filter === 'unread' ? c.unread > 0 : true))
      .filter((c) => !q || c.other.username.includes(q) || c.other.displayName.toLowerCase().includes(q));
  }, [conversations, query, filter]);
  const suggestions = useMemo(() => (me ? db.suggestedUsers(me, 12) : []), [me, version]);

  if (!me || !store) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={{ color: theme.text, fontSize: 21, fontWeight: '900', letterSpacing: -0.6 }}>Messages</Text>
          <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 2 }}>
            {conversations.length} conversation{conversations.length === 1 ? '' : 's'} \u00b7 private and encrypted in transit
          </Text>
        </View>
        <IconButton icon="create-outline" variant="gradient" onPress={() => setNewChatOpen(true)} />
      </View>

      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <View style={[styles.search, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="search" size={17} color={theme.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search conversations\u2026"
            placeholderTextColor={theme.textFaint}
            style={{ flex: 1, color: theme.text, fontSize: 14.5, paddingVertical: 10, outlineStyle: 'none' } as any}
          />
        </View>
        <View style={{ marginTop: spacing.md }}>
          <Segmented<'all' | 'unread'>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread', icon: 'circle' },
            ]}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.conversation.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 110, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 500); }} tintColor={theme.brand} colors={[theme.brand]} />}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title={filter === 'unread' ? 'No unread messages' : query ? 'No matching conversations' : 'No conversations yet'}
            subtitle={filter === 'unread' ? 'You are all caught up.' : query ? 'Try a different name.' : 'Start a conversation \u2014 send a photo, a clip or a voice note.'}
            actionLabel="Start a chat"
            onAction={() => setNewChatOpen(true)}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate(Routes.Chat, { userId: item.other.id })}
            style={({ pressed }) => [styles.row, { backgroundColor: pressed ? theme.surfaceAlt : 'transparent', borderBottomColor: theme.divider }]}
          >
            <Avatar uri={item.other.avatar} name={item.other.displayName} size={54} showOnline={item.other.settings.showActivityStatus && item.other.id === 'usr_aurora.wav'} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>{item.other.displayName}</Text>
                {item.other.verified ? <Ionicons name="checkmark-circle" size={13} color={theme.brand} /> : null}
                {item.conversation.pinnedFor.includes(me.id) ? <Ionicons name="pin" size={12} color={theme.textFaint} /> : null}
                <View style={{ flex: 1 }} />
                <Text style={{ color: item.unread ? theme.brand : theme.textFaint, fontSize: 12, fontWeight: item.unread ? '800' : '600' }}>
                  {item.last ? formatDayLabel(item.last.createdAt) : ''}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <Text numberOfLines={1} style={{ color: item.unread ? theme.text : theme.textMuted, fontSize: 13.5, flex: 1, fontWeight: item.unread ? '700' : '400' }}>
                  {item.last && item.last.senderId === me.id ? 'You: ' : ''}
                  {truncate(preview(item.last), 60)}
                </Text>
                {item.unread > 0 ? (
                  <View style={[styles.badge, { backgroundColor: theme.brand }]}>
                    <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>{item.unread}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
      />

      <Sheet visible={newChatOpen} onClose={() => setNewChatOpen(false)} title="New conversation">
        {suggestions.map((user) => {
          const allowed = db.canMessage(me, user);
          return (
            <UserRow
              key={user.id}
              user={user}
              onPress={() => {
                if (!allowed.ok) return;
                setNewChatOpen(false);
                db.findOrCreateConversation(me.id, user.id);
                navigation.navigate(Routes.Chat, { userId: user.id });
              }}
              right={
                <Ionicons name={allowed.ok ? 'chevron-forward' : 'lock-closed'} size={16} color={allowed.ok ? theme.textFaint : theme.textFaint} />
              }
            />
          );
        })}
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});

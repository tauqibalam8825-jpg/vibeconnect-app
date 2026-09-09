import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { inboxFor } from '../store/selectors';
import { Avatar, EmptyState, IconBtn } from '../components/ui';
import { clockTime, timeAgo } from '../lib/format';
import type { Nav } from '../navigation/types';

/** Private one-to-one inbox. */
export const MessagesScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, me } = useStore();
  const [query, setQuery] = useState('');

  const inbox = useMemo(() => (me ? inboxFor(state, me.id) : []), [state, me?.id]);
  const filtered = inbox.filter(
    (c) =>
      !query.trim() ||
      c.other.username.toLowerCase().includes(query.trim().toLowerCase()) ||
      c.other.displayName.toLowerCase().includes(query.trim().toLowerCase())
  );

  const startNew = () => {
    const suggestions = state.users.filter(
      (u) => u.id !== me?.id && !u.suspended && !inbox.some((c) => c.other.id === u.id)
    );
    const target = suggestions[0];
    if (target) nav.navigate('Chat', { userId: target.id });
    else nav.navigate('Tabs', { screen: 'Explore' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.8 }}>Messages</Text>
        <IconBtn name="create-outline" accessibilityLabel="Start a new message" onPress={startNew} />
      </View>

      <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search" size={16} color={theme.textFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search conversations"
          placeholderTextColor={theme.textFaint}
          style={{ flex: 1, color: theme.text, paddingVertical: 9, fontSize: 14 }}
          accessibilityLabel="Search conversations"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.convoId}
        contentContainerStyle={{ padding: 14, gap: 8, paddingBottom: 110, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          query ? (
            <EmptyState icon="search-outline" title="No matching conversations" />
          ) : (
            <EmptyState
              icon="chatbubbles-outline"
              title="Your inbox is empty"
              subtitle="Start a private conversation from any profile."
              action={
                <Pressable onPress={startNew} style={[styles.cta, { backgroundColor: theme.primary }]} accessibilityRole="button">
                  <Ionicons name="person-add-outline" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13.5 }}>Find people</Text>
                </Pressable>
              }
            />
          )
        }
        renderItem={({ item, index }) => {
          const last = item.last;
          const preview = last?.deleted
            ? 'Message deleted'
            : last?.kind === 'image'
              ? '📷 Photo'
              : last?.kind === 'video'
                ? '🎬 Video'
                : last?.kind === 'voice'
                  ? '🎙 Voice message'
                  : last?.text ?? 'Say hi!';
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 35).duration(230)}>
              <Pressable
                onPress={() => nav.navigate('Chat', { convoId: item.convoId })}
                style={[styles.row, { backgroundColor: item.unread ? theme.primarySoft : theme.surface, borderColor: theme.border }]}
                accessibilityRole="button"
                accessibilityLabel={`Open chat with ${item.other.username}`}
              >
                <Avatar uri={item.other.avatar} name={item.other.displayName} size={52} online={item.other.online && state.settings.showOnline} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14.5, flexShrink: 1 }} numberOfLines={1}>
                      {item.other.displayName}
                    </Text>
                    {item.other.verified && <Ionicons name="checkmark-circle" size={13} color={theme.primary} />}
                    <View style={{ flex: 1 }} />
                    <Text style={{ color: theme.textFaint, fontSize: 11.5 }}>
                      {last ? (Date.now() - last.at < 86400000 ? clockTime(last.at) : timeAgo(last.at)) : ''}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: item.unread ? theme.text : theme.textFaint,
                        fontSize: 13,
                        flex: 1,
                        fontWeight: item.unread ? '700' : '400',
                      }}
                    >
                      {last && last.senderId === me?.id && !last.deleted ? 'You: ' : ''}
                      {preview}
                    </Text>
                    {item.unread > 0 && (
                      <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                        <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>{item.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 15, paddingHorizontal: 14, borderWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, borderWidth: 1 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 999 },
});

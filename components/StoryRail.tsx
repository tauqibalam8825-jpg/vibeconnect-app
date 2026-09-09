import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as db from '../lib/db';
import { useApp, useTheme } from '../lib/store';
import { gradients, radii, spacing } from '../lib/theme';
import { Routes } from '../lib/routes';
import { Avatar } from './Avatar';

export function StoryRail({ onAddStory }: { onAddStory: () => void }) {
  const theme = useTheme();
  const { me } = useApp();
  const navigation = useNavigation<any>();
  if (!me) return null;
  const groups = db.storyGroups(me);
  const myStories = db.activeStories(me).filter((s) => s.authorId === me.id);

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Pressable onPress={onAddStory} style={styles.item}>
          <View style={[styles.addRing, { borderColor: theme.border }]}>
            {myStories.length > 0 ? (
              <>
                <Avatar uri={me.avatar} name={me.displayName} size={62} />
                <View style={[styles.plus, { backgroundColor: theme.brand, borderColor: theme.surface }]}>
                  <Ionicons name="add" size={13} color="#fff" />
                </View>
              </>
            ) : (
              <>
                <Avatar uri={me.avatar} name={me.displayName} size={62} />
                <View style={[styles.plus, { backgroundColor: theme.brand, borderColor: theme.surface }]}>
                  <Ionicons name="add" size={13} color="#fff" />
                </View>
              </>
            )}
          </View>
          <Text numberOfLines={1} style={[styles.label, { color: theme.textMuted }]}>
            {myStories.length > 0 ? 'Your vibe' : 'Add story'}
          </Text>
        </Pressable>

        {groups.map((group) => (
          <Pressable key={group.author.id} onPress={() => navigation.navigate(Routes.StoryViewer, { authorId: group.author.id })} style={styles.item}>
            <View style={{ opacity: group.seen ? 0.55 : 1 }}>
              {group.seen ? (
                <View style={[styles.seenRing, { borderColor: theme.border }]}>
                  <Avatar uri={group.author.avatar} name={group.author.displayName} size={62} />
                </View>
              ) : (
                <Avatar uri={group.author.avatar} name={group.author.displayName} size={62} ring ringColor={gradients.brand[1]} />
              )}
            </View>
            <Text numberOfLines={1} style={[styles.label, { color: group.seen ? theme.textFaint : theme.text }]}>
              {group.author.username.split('.')[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.md },
  row: { paddingHorizontal: spacing.lg, gap: 14 },
  item: { alignItems: 'center', width: 72 },
  addRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  seenRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  plus: { position: 'absolute', right: 0, bottom: 0, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  label: { fontSize: 11.5, fontWeight: '700', marginTop: 6, maxWidth: 70, textAlign: 'center' },
});

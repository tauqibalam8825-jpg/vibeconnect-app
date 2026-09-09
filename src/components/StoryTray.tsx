import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { activeStories } from '../store/selectors';
import { Avatar } from './ui';
import type { Nav } from '../navigation/types';

/** Horizontal tray of 24h stories. The first tile creates a new one. */
export const StoryTray: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const { state, me } = useStore();
  const groups = useMemo(() => activeStories(state), [state]);

  const myItems = groups.find((g) => g.author.id === me?.id);
  const others = groups.filter((g) => g.author.id !== me?.id);
  const order = [...(myItems ? [myItems] : []), ...others];

  return (
    <View style={[styles.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 14, paddingVertical: 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add to your story"
          onPress={() => nav.navigate('Create', { mode: 'story' })}
          style={{ alignItems: 'center', width: 68 }}
        >
          <View>
            <Avatar uri={me?.avatar} name={me?.displayName} size={58} />
            <LinearGradient
              colors={[theme.primary, '#22D3EE']}
              style={styles.plus}
            >
              <Ionicons name="add" size={15} color="#fff" />
            </LinearGradient>
          </View>
          <Text numberOfLines={1} style={{ color: theme.textDim, fontSize: 11.5, marginTop: 6, maxWidth: 66 }}>
            {myItems ? 'Your story' : 'Add story'}
          </Text>
        </Pressable>

        {order
          .filter((g) => !(me && g.author.id === me.id && !g.items.length))
          .map((g) => {
            const isMine = g.author.id === me?.id;
            return (
              <Pressable
                key={g.author.id}
                accessibilityRole="button"
                accessibilityLabel={`Open stories of @${g.author.username}`}
                onPress={() => nav.navigate('Stories', { userId: g.author.id })}
                style={{ alignItems: 'center', width: 68 }}
              >
                <Avatar uri={g.author.avatar} name={g.author.displayName} size={58} ring={g.unseen || isMine ? 'story' : 'none'} />
                <Text numberOfLines={1} style={{ color: theme.textDim, fontSize: 11.5, marginTop: 6, maxWidth: 66 }}>
                  {isMine ? 'You' : g.author.username.split('.')[0]}
                </Text>
              </Pressable>
            );
          })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { borderRadius: 20, marginHorizontal: 12, marginBottom: 14, borderWidth: 1 },
  plus: {
    position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
});

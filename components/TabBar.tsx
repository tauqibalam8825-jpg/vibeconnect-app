import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, useTheme } from '../lib/store';
import { gradients, shadow } from '../lib/theme';
import { Routes } from '../lib/routes';
import * as db from '../lib/db';

type IconName = keyof typeof Ionicons.glyphMap;

const META: Record<string, { label: string; icon: IconName; activeIcon: IconName }> = {
  [Routes.Home]: { label: 'Home', icon: 'planet-outline', activeIcon: 'planet' },
  [Routes.Explore]: { label: 'Explore', icon: 'compass-outline', activeIcon: 'compass' },
  [Routes.Create]: { label: 'Create', icon: 'add', activeIcon: 'add' },
  [Routes.Watch]: { label: 'Watch', icon: 'play-circle-outline', activeIcon: 'play-circle' },
  [Routes.Messages]: { label: 'Inbox', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses' },
  [Routes.Profile]: { label: 'You', icon: 'person-circle-outline', activeIcon: 'person-circle' },
};

function TabItem({ focused, onPress, children }: { focused: boolean; onPress: () => void; children: React.ReactNode }) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      style={styles.item}
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.9, { damping: 14 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 12 }))}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
    >
      <Animated.View style={animated}>{children}</Animated.View>
    </Pressable>
  );
}

/**
 * VibeConnect tab bar \u2014 six destinations with a gradient Create tile.
 * Original layout, not derived from any existing platform.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const { me } = useApp();
  const insets = useSafeAreaInsets();
  const unread = me ? db.unreadMessageCount(me.id) : 0;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.tabBar, borderTopColor: theme.divider, paddingBottom: Math.max(insets.bottom, 8) }, shadow(8, theme)]}>
      {state.routes.map((route, index) => {
        const meta = META[route.name];
        if (!meta) return null;
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        if (route.name === Routes.Create) {
          return (
            <TabItem key={route.key} focused={focused} onPress={() => navigation.navigate(route.name)}>
              <LinearGradient colors={gradients.brand as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.createTile, shadow(6, theme)]}>
                <Ionicons name="add" size={26} color="#fff" />
              </LinearGradient>
            </TabItem>
          );
        }

        return (
          <TabItem key={route.key} focused={focused} onPress={onPress}>
            <View style={styles.itemInner}>
              <View>
                <Ionicons name={focused ? meta.activeIcon : meta.icon} size={23} color={focused ? theme.brand : theme.textFaint} />
                {route.name === Routes.Messages && unread > 0 ? (
                  <View style={[styles.badge, { backgroundColor: theme.danger, borderColor: theme.tabBar }]}>
                    <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ color: focused ? theme.brand : theme.textFaint, fontSize: 10.5, fontWeight: focused ? '800' : '600', marginTop: 3 }}>{meta.label}</Text>
              {focused ? <View style={[styles.underline, { backgroundColor: theme.brand }]} /> : null}
            </View>
          </TabItem>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 4 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  itemInner: { alignItems: 'center', justifyContent: 'center' },
  createTile: { width: 46, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: -2 },
  underline: { width: 18, height: 3, borderRadius: 2, marginTop: 4 },
  badge: { position: 'absolute', top: -5, right: -9, minWidth: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2 },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '800' },
});

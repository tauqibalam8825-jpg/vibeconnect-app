/**
 * Navigation tree
 *  Stack: Splash → MainTabs (tabs) + modal/push screens
 *  Tabs:  Home | Categories | Bookmarks | Settings
 */

import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import type { MainTabParamList, RootStackParamList } from './types';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import CategoryPostsScreen from '../screens/CategoryPostsScreen';
import SearchScreen from '../screens/SearchScreen';
import ReadingListScreen from '../screens/ReadingListScreen';
import { decodeHtml } from '../utils/html';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { theme } = useApp();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? 'home' : 'home-outline',
            Categories: focused ? 'grid' : 'grid-outline',
            Bookmarks: focused ? 'heart' : 'heart-outline',
            Settings: focused ? 'person-circle' : 'person-circle-outline',
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} options={{ title: 'Saved' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { theme } = useApp();

  const navTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerTintColor: theme.colors.primary,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTitleStyle: { fontWeight: '700', color: theme.colors.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="PostDetail"
          component={PostDetailScreen}
          options={{ title: 'Article', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="CategoryPosts"
          component={CategoryPostsScreen}
          options={({ route }) => ({
            title: decodeHtml(route.params.category.name),
            headerBackTitle: 'Back',
          })}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: 'Search', presentation: 'modal' }}
        />
        <Stack.Screen
          name="ReadingList"
          component={ReadingListScreen}
          options={{ title: 'Quick Read', headerBackTitle: 'Back' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import React, { createRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useStore } from '../store/AppStore';
import { ThemeProvider } from '../components/ThemeProvider';
import { Logo, ToastHost } from '../components/ui';
import { useTheme } from '../theme';
import { screenOptions, type Nav } from './types';

import { ForgotPasswordScreen, LoginScreen, SignupScreen } from '../screens/auth/AuthScreens';
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { CreateScreen } from '../screens/CreateScreen';
import { VideoDetailScreen, WatchScreen } from '../screens/WatchScreen';
import { ShortsScreen } from '../screens/ShortsScreen';
import { StoryViewerScreen } from '../screens/StoryViewerScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ListScreen, NotificationsScreen, ProfileScreen, UserProfileScreen } from '../screens/ProfileScreens';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { StudioScreen } from '../screens/StudioScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { AdminScreen } from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export const navRef = createRef<Nav>();

/** Cross-navigator helper so any component can deep-link without a nav prop. */
export const navigateTo = (name: string, params?: Record<string, unknown>) => {
  navRef.current?.navigate(name, params);
};

/* ------------------------------------------------------------------- tabs */

const MainTabs: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const { state, me } = useStore();
  const unreadMessages = state.messages.filter(
    (m) =>
      m.senderId !== me?.id &&
      !m.read &&
      state.convos.find((c) => c.id === m.convoId)?.members.includes(me?.id ?? '')
  ).length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textFaint,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 68,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
          position: 'absolute',
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
        tabBarIcon: ({ color, focused }) => {
          if (route.name === 'Create') {
            return (
              <LinearGradient
                colors={['#7C5CFF', '#22D3EE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createFab}
                accessibilityLabel="Create"
              >
                <Ionicons name="add" size={26} color="#fff" />
              </LinearGradient>
            );
          }
          const map: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
            Home: ['home-outline', 'home'],
            Explore: ['compass-outline', 'compass'],
            Watch: ['play-circle-outline', 'play-circle'],
            Messages: ['chatbubbles-outline', 'chatbubbles'],
            Profile: ['person-circle-outline', 'person-circle'],
          };
          const pair = map[route.name];
          return <Ionicons name={focused ? pair[1] : pair[0]} size={24} color={color} />;
        },
        tabBarBadge:
          route.name === 'Messages' && unreadMessages > 0 ? (unreadMessages > 9 ? '9+' : unreadMessages) : undefined,
        tabBarBadgeStyle: { backgroundColor: theme.danger, fontSize: 10, fontWeight: '800' },
      })}
    >
      <Tab.Screen name="Home">{() => <HomeScreen nav={nav} />}</Tab.Screen>
      <Tab.Screen name="Explore">{() => <ExploreScreen nav={nav} />}</Tab.Screen>
      <Tab.Screen
        name="Create"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            nav.navigate('Create');
          },
        }}
      >
        {() => <CreateScreen nav={nav} />}
      </Tab.Screen>
      <Tab.Screen name="Watch">{() => <WatchScreen nav={nav} />}</Tab.Screen>
      <Tab.Screen name="Messages">{() => <MessagesScreen nav={nav} />}</Tab.Screen>
      <Tab.Screen name="Profile">{() => <ProfileScreen nav={nav} />}</Tab.Screen>
    </Tab.Navigator>
  );
};

/* ----------------------------------------------------------------- stacks */

type P = { nav: Nav };

const AuthStack: React.FC<P> = ({ nav }) => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="Login">{() => <LoginScreen nav={nav} />}</Stack.Screen>
    <Stack.Screen name="Signup">{() => <SignupScreen nav={nav} />}</Stack.Screen>
    <Stack.Screen name="Forgot">{() => <ForgotPasswordScreen nav={nav} />}</Stack.Screen>
  </Stack.Navigator>
);

const AppStack: React.FC<P> = ({ nav }) => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="Tabs" options={{ headerShown: false }}>
      {() => <MainTabs nav={nav} />}
    </Stack.Screen>
    <Stack.Screen name="Create" options={{ animation: 'slide_from_bottom' }}>
      {({ route }) => (
        <CreateScreen
          nav={nav}
          initialMode={(route.params as { mode?: 'photo' | 'video' | 'short' | 'story' | 'long' } | undefined)?.mode}
        />
      )}
    </Stack.Screen>
    <Stack.Screen name="Shorts" options={{ animation: 'fade_from_bottom' }}>
      {() => <ShortsScreen nav={nav} />}
    </Stack.Screen>
    <Stack.Screen name="Stories">
      {({ route }) => (
        <StoryViewerScreen
          nav={nav}
          userId={(route.params as { userId?: string } | undefined)?.userId}
          storyId={(route.params as { storyId?: string } | undefined)?.storyId}
        />
      )}
    </Stack.Screen>
    <Stack.Screen name="PostDetail">
      {({ route }) => <PostDetailScreen nav={nav} postId={(route.params as { postId: string }).postId} />}
    </Stack.Screen>
    <Stack.Screen name="VideoDetail">
      {({ route }) => <VideoDetailScreen nav={nav} videoId={(route.params as { videoId: string }).videoId} />}
    </Stack.Screen>
    <Stack.Screen name="UserProfile">
      {({ route }) => <UserProfileScreen nav={nav} userId={(route.params as { userId: string }).userId} />}
    </Stack.Screen>
    <Stack.Screen name="List">
      {({ route }) => (
        <ListScreen
          nav={nav}
          userId={(route.params as { userId: string }).userId}
          type={(route.params as { type: 'followers' | 'following' }).type}
        />
      )}
    </Stack.Screen>
    <Stack.Screen name="Chat">
      {({ route }) => (
        <ChatScreen
          nav={nav}
          convoId={(route.params as { convoId?: string } | undefined)?.convoId}
          userId={(route.params as { userId?: string } | undefined)?.userId}
        />
      )}
    </Stack.Screen>
    <Stack.Screen name="Notifications">{() => <NotificationsScreen nav={nav} />}</Stack.Screen>
    <Stack.Screen name="Studio">{() => <StudioScreen nav={nav} />}</Stack.Screen>
    <Stack.Screen name="Wallet">{() => <WalletScreen nav={nav} />}</Stack.Screen>
    <Stack.Screen name="Settings">{() => <SettingsScreen nav={nav} />}</Stack.Screen>
    <Stack.Screen name="EditProfile">{() => <EditProfileScreen nav={nav} />}</Stack.Screen>
    <Stack.Screen name="Admin">{() => <AdminScreen nav={nav} />}</Stack.Screen>
    <Stack.Screen name="Legal">
      {({ route }) => (
        <LegalScreen nav={nav} doc={(route.params as { doc: 'terms' | 'privacy' | 'guidelines' | 'monetization' }).doc} />
      )}
    </Stack.Screen>
  </Stack.Navigator>
);

/* ------------------------------------------------------------------- shell */

const Shell: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { hydrated, me } = useStore();

  const reactNavTheme: NavTheme = {
    dark: isDark,
    colors: {
      primary: theme.primary,
      background: theme.bg,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      notification: theme.danger,
    },
    fonts: {
      regular: { fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }), fontWeight: '400' },
      medium: { fontFamily: Platform.select({ ios: 'System', default: 'sans-serif-medium' }), fontWeight: '500' },
      bold: { fontFamily: Platform.select({ ios: 'System', default: 'sans-serif-medium' }), fontWeight: '700' },
      heavy: { fontFamily: Platform.select({ ios: 'System', default: 'sans-serif-medium' }), fontWeight: '800' },
    },
  };

  // Any component may deep-link through this object.
  const nav: Nav = {
    navigate: (name, params) => navRef.current?.navigate(name, params),
    goBack: () => navRef.current?.goBack(),
    setOptions: () => {},
    addListener: () => () => {},
  };

  if (!hydrated) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.bg }]}>
        <Logo size={54} />
        <Text style={{ color: theme.textFaint, marginTop: 16, fontSize: 13, fontWeight: '600' }}>
          Tuning into your circle…
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={reactNavTheme} ref={navRef as never}>
      {!me ? <AuthStack nav={nav} /> : <AppStack nav={nav} />}
    </NavigationContainer>
  );
};

const Themed: React.FC = () => {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Shell />
    </>
  );
};

export const App = () => {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <ThemeProvider>
            <ToastHost>
              <Themed />
            </ToastHost>
          </ThemeProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  createFab: {
    width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
    marginTop: -18, shadowColor: '#7C5CFF', shadowOpacity: 0.45, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
});

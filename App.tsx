import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppProvider, useApp, useTheme } from './lib/store';
import { Routes } from './lib/routes';
import { gradients } from './lib/theme';
import { LogoMark, Wordmark } from './components/Logo';
import { TabBar } from './components/TabBar';

// Auth
import { WelcomeScreen } from './screens/auth/WelcomeScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { SignupScreen } from './screens/auth/SignupScreen';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen';
import { ProfileSetupScreen } from './screens/auth/ProfileSetupScreen';
// Core
import { HomeScreen } from './screens/feed/HomeScreen';
import { PostDetailScreen } from './screens/feed/PostDetailScreen';
import { ExploreScreen } from './screens/explore/ExploreScreen';
import { CreateScreen } from './screens/create/CreateScreen';
import { WatchScreen } from './screens/watch/WatchScreen';
import { VideoDetailScreen } from './screens/watch/VideoDetailScreen';
import { ShortsScreen } from './screens/watch/ShortsScreen';
import { MessagesScreen } from './screens/messages/MessagesScreen';
import { ChatScreen } from './screens/messages/ChatScreen';
import { CallScreen } from './screens/messages/CallScreen';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { PublicProfileScreen } from './screens/profile/PublicProfileScreen';
import { FollowListScreen } from './screens/profile/FollowListScreen';
import { NotificationsScreen } from './screens/misc/NotificationsScreen';
import { StoryViewerScreen } from './screens/misc/StoryViewerScreen';
// Settings & tools
import { SettingsScreen } from './screens/misc/SettingsScreen';
import { PrivacyScreen } from './screens/misc/PrivacyScreen';
import { SecurityScreen } from './screens/misc/SecurityScreen';
import { BlockedScreen } from './screens/misc/BlockedScreen';
import { SavedScreen } from './screens/misc/SavedScreen';
import { ArchitectureScreen } from './screens/misc/ArchitectureScreen';
import { CreatorStudioScreen } from './screens/studio/CreatorStudioScreen';
import { WalletScreen } from './screens/studio/WalletScreen';
import { AdminScreen } from './screens/admin/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name={Routes.Home} component={HomeScreen} />
      <Tab.Screen name={Routes.Explore} component={ExploreScreen} />
      <Tab.Screen name={Routes.Create} component={CreateScreen} />
      <Tab.Screen name={Routes.Watch} component={WatchScreen} />
      <Tab.Screen name={Routes.Messages} component={MessagesScreen} />
      <Tab.Screen name={Routes.Profile} component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function Splash() {
  return (
    <View style={styles.splash}>
      <LinearGradient colors={[gradients.brand[0], gradients.brand[1], gradients.brand[2]]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <LogoMark size={84} radius={26} />
      <View style={{ marginTop: 18 }}>
        <Wordmark size={28} color="#fff" />
      </View>
      <Text style={styles.splashTag}>Share the signal, skip the noise.</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: 34 }} />
    </View>
  );
}

function RootNavigator() {
  const { me, ready, theme } = useApp();
  if (!ready) return <Splash />;

  const navTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme : DefaultTheme).colors,
      background: theme.bg,
      card: theme.surface,
      text: theme.text,
      primary: theme.brand,
      border: theme.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        key={me ? 'app' : 'auth'}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        {!me ? (
          <>
            <Stack.Screen name={Routes.Welcome} component={WelcomeScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name={Routes.Login} component={LoginScreen} />
            <Stack.Screen name={Routes.Signup} component={SignupScreen} />
            <Stack.Screen name={Routes.ForgotPassword} component={ForgotPasswordScreen} />
            <Stack.Screen name={Routes.ProfileSetup} component={ProfileSetupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={MainTabs} options={{ animation: 'fade' }} />
            <Stack.Screen name={Routes.PostDetail} component={PostDetailScreen} />
            <Stack.Screen name={Routes.UserProfile} component={PublicProfileScreen} />
            <Stack.Screen name={Routes.FollowList} component={FollowListScreen} />
            <Stack.Screen name={Routes.Chat} component={ChatScreen} />
            <Stack.Screen name={Routes.Call} component={CallScreen} options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name={Routes.Shorts} component={ShortsScreen} options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name={Routes.VideoDetail} component={VideoDetailScreen} />
            <Stack.Screen name={Routes.Notifications} component={NotificationsScreen} />
            <Stack.Screen name={Routes.StoryViewer} component={StoryViewerScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name={Routes.EditProfile} component={ProfileSetupScreen} />
            <Stack.Screen name={Routes.Settings} component={SettingsScreen} />
            <Stack.Screen name={Routes.Privacy} component={PrivacyScreen} />
            <Stack.Screen name={Routes.Security} component={SecurityScreen} />
            <Stack.Screen name={Routes.Blocked} component={BlockedScreen} />
            <Stack.Screen name={Routes.Saved} component={SavedScreen} />
            <Stack.Screen name={Routes.Architecture} component={ArchitectureScreen} />
            <Stack.Screen name={Routes.Studio} component={CreatorStudioScreen} />
            <Stack.Screen name={Routes.Wallet} component={WalletScreen} />
            <Stack.Screen name={Routes.Admin} component={AdminScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  if (!fontsLoaded) return <Splash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <RootNavigator />
          <StatusBarWrapper />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function StatusBarWrapper() {
  const theme = useTheme();
  return <StatusBar style={theme.dark ? 'light' : 'dark'} />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0912' },
  splashTag: { color: 'rgba(255,255,255,0.85)', fontSize: 14.5, marginTop: 8, fontWeight: '500' },
});

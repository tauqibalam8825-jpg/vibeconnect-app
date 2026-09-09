import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/** Minimal navigation contract used across screens. */
export type Nav = {
  navigate: (name: string, params?: Record<string, unknown>) => void;
  goBack: () => void;
  setOptions: (options: Partial<NativeStackNavigationOptions>) => void;
  addListener: (event: string, cb: (e: unknown) => void) => () => void;
  getParent?: () => unknown;
  getId?: () => string | undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  Login: undefined;
  Signup: undefined;
  Forgot: undefined;
  UserProfile: { userId: string };
  PostDetail: { postId: string };
  VideoDetail: { videoId: string };
  Shorts: undefined;
  Stories: { userId?: string; storyId?: string };
  Chat: { convoId?: string; userId?: string };
  Notifications: undefined;
  Studio: undefined;
  Wallet: undefined;
  Settings: undefined;
  Legal: { doc: 'terms' | 'privacy' | 'guidelines' | 'monetization' };
  Admin: undefined;
  Create: { mode?: 'photo' | 'video' | 'short' | 'story' | 'long' } | undefined;
  List: { userId: string; type: 'followers' | 'following' };
};

export const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: 'transparent' },
};

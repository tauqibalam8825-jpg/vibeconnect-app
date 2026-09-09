/** Central route registry — keeps every navigation call site in sync. */
export const Routes = {
  // auth stack
  Welcome: 'Welcome',
  Login: 'Login',
  Signup: 'Signup',
  ForgotPassword: 'ForgotPassword',
  ProfileSetup: 'ProfileSetup',
  // tabs
  Home: 'Home',
  Explore: 'Explore',
  Create: 'Create',
  Watch: 'Watch',
  Messages: 'Messages',
  Profile: 'Profile',
  // stack
  PostDetail: 'PostDetail',
  UserProfile: 'UserProfile',
  FollowList: 'FollowList',
  Chat: 'Chat',
  Call: 'Call',
  Shorts: 'Shorts',
  VideoDetail: 'VideoDetail',
  Notifications: 'Notifications',
  EditProfile: 'EditProfile',
  Settings: 'Settings',
  Privacy: 'Privacy',
  Security: 'Security',
  Blocked: 'Blocked',
  Saved: 'Saved',
  Studio: 'Studio',
  Wallet: 'Wallet',
  Admin: 'Admin',
  Architecture: 'Architecture',
  StoryViewer: 'StoryViewer',
} as const;

export type RouteName = (typeof Routes)[keyof typeof Routes];

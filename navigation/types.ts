import type { AppPost } from '../api/types';
import type { WPCategory } from '../api/types';

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  PostDetail: { postId: number; preview?: AppPost };
  CategoryPosts: { category: WPCategory };
  Search: undefined;
  ReadingList: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  Bookmarks: undefined;
  Settings: undefined;
};

import type { AppState } from '../types';

/**
 * Cold-start placeholder state, replaced immediately by either the cached
 * AsyncStorage snapshot or the demo seed. Keeps the reducer type-safe.
 */
export const initialState: AppState = {
  hydrated: false,
  seeded: false,
  sessionId: null,
  users: [],
  follows: [],
  posts: [],
  comments: [],
  shorts: [],
  stories: [],
  storyReplies: [],
  videos: [],
  convos: [],
  messages: [],
  notifications: [],
  reports: [],
  wallet: [],
  withdrawals: [],
  subscriptions: [],
  resetCodes: [],
  settings: {
    themeMode: 'system',
    autoplay: true,
    dataSaver: false,
    showOnline: true,
    allowStoryReplies: true,
    allowMentions: true,
  },
};

import type { AppState } from '../types';
import { demoFollows, demoUsers } from './demoUsers';
import {
  demoComments,
  demoConvos,
  demoMessages,
  demoNotifications,
  demoPosts,
  demoReports,
  demoShorts,
  demoStories,
  demoStoryReplies,
  demoSubscriptions,
  demoVideos,
  demoWallet,
  demoWithdrawals,
} from './demoContent';

/**
 * Builds the initial application state.
 *
 * PRODUCTION NOTE: everything returned here is DEMO data — every record is
 * flagged `isDemo: true` so the UI can badge it and so it can be filtered out
 * of analytics. A live deployment hydrates from the API instead and this
 * module is never imported by a production build.
 */
export function buildDemoState(): Omit<AppState, 'hydrated'> {
  return {
    seeded: true,
    sessionId: null,
    users: demoUsers,
    follows: demoFollows,
    posts: demoPosts,
    comments: demoComments,
    shorts: demoShorts,
    stories: demoStories,
    storyReplies: demoStoryReplies,
    videos: demoVideos,
    convos: demoConvos,
    messages: demoMessages,
    notifications: demoNotifications,
    reports: demoReports,
    wallet: demoWallet,
    withdrawals: demoWithdrawals,
    subscriptions: demoSubscriptions,
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
}

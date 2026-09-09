export type ID = string;
export type MediaKind = 'photo' | 'video';
export type ContentKind = 'post' | 'short' | 'video' | 'story' | 'user' | 'message';

export interface User {
  id: ID;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  bio: string;
  avatar: string;
  banner: string;
  private: boolean;
  role: 'user' | 'admin';
  suspended: boolean;
  verified: boolean;
  creator: boolean;
  online: boolean;
  lastSeen: number;
  joinedAt: number;
  location?: string;
  blocked: ID[];
  muted: ID[];
  isDemo?: boolean;
}

export interface Follow {
  id: ID;
  followerId: ID;
  followeeId: ID;
  at: number;
}

export interface Post {
  id: ID;
  authorId: ID;
  kind: MediaKind;
  uri: string;
  thumb?: string;
  caption: string;
  at: number;
  likes: ID[];
  saves: ID[];
  shares: number;
  views: number;
  hidden?: boolean;
  removed?: boolean;
  location?: string;
  isDemo?: boolean;
}

export interface Comment {
  id: ID;
  postId: ID;
  postKind: 'post' | 'short' | 'video';
  authorId: ID;
  text: string;
  at: number;
  likes: ID[];
  removed?: boolean;
  isDemo?: boolean;
}

export interface Short {
  id: ID;
  authorId: ID;
  uri: string;
  poster: string;
  caption: string;
  hashtags: string[];
  at: number;
  likes: ID[];
  saves: ID[];
  shares: number;
  views: number;
  removed?: boolean;
  isDemo?: boolean;
}

export interface StoryItem {
  id: ID;
  authorId: ID;
  kind: MediaKind;
  uri: string;
  at: number;
  viewers: ID[];
  removed?: boolean;
  isDemo?: boolean;
}

export interface StoryReply {
  id: ID;
  storyId: ID;
  fromId: ID;
  toId: ID;
  text: string;
  at: number;
  read: boolean;
  isDemo?: boolean;
}

export interface Video {
  id: ID;
  authorId: ID;
  title: string;
  description: string;
  uri: string;
  thumb: string;
  durationSec: number;
  category: string;
  at: number;
  likes: ID[];
  saves: ID[];
  shares: number;
  views: number;
  removed?: boolean;
  isDemo?: boolean;
}

export interface Convo {
  id: ID;
  members: ID[];
  at: number;
  blockedBy: ID | null;
}

export interface Message {
  id: ID;
  convoId: ID;
  senderId: ID;
  kind: 'text' | 'image' | 'video' | 'voice';
  text?: string;
  uri?: string;
  durationSec?: number;
  at: number;
  read: boolean;
  deleted?: boolean;
  isDemo?: boolean;
}

export interface AppNotification {
  id: ID;
  userId: ID;
  actorId?: ID;
  type: 'follow' | 'like' | 'comment' | 'share' | 'message' | 'story_reply' | 'system' | 'gift' | 'wallet';
  text: string;
  targetKind?: 'post' | 'short' | 'video' | 'profile' | 'chat' | 'story';
  targetId?: ID;
  at: number;
  read: boolean;
  isDemo?: boolean;
}

export interface Report {
  id: ID;
  reporterId: ID;
  targetType: ContentKind;
  targetId: ID;
  targetLabel: string;
  reason: string;
  details: string;
  at: number;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  isDemo?: boolean;
}

export type TxKind = 'ad_share' | 'reward' | 'gift' | 'subscription' | 'sponsor' | 'withdrawal';
export interface WalletTx {
  id: ID;
  userId: ID;
  kind: TxKind;
  title: string;
  note?: string;
  amount: number; // positive = credit, negative = debit
  at: number;
  status: 'completed' | 'pending' | 'processing' | 'failed';
  ref?: string;
  isDemo?: boolean;
}

export interface Withdrawal {
  id: ID;
  userId: ID;
  amount: number;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  at: number;
  note?: string;
}

export interface Subscription {
  id: ID;
  subscriberId: ID;
  creatorId: ID;
  tier: 'supporter' | 'insider';
  price: number;
  at: number;
  active: boolean;
}

export interface Settings {
  themeMode: 'light' | 'dark' | 'system';
  autoplay: boolean;
  dataSaver: boolean;
  showOnline: boolean;
  allowStoryReplies: boolean;
  allowMentions: boolean;
}

export interface AppState {
  hydrated: boolean;
  seeded: boolean;
  sessionId: ID | null;
  users: User[];
  follows: Follow[];
  posts: Post[];
  comments: Comment[];
  shorts: Short[];
  stories: StoryItem[];
  storyReplies: StoryReply[];
  videos: Video[];
  convos: Convo[];
  messages: Message[];
  notifications: AppNotification[];
  reports: Report[];
  wallet: WalletTx[];
  withdrawals: Withdrawal[];
  subscriptions: Subscription[];
  resetCodes: { email: string; code: string; at: number }[];
  settings: Settings;
}

export const DAY = 24 * 60 * 60 * 1000;
export const STORY_TTL = DAY; // stories expire after 24 hours

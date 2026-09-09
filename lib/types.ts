/**
 * VibeConnect — shared data contracts.
 * These interfaces mirror the server-side collections documented in docs/ARCHITECTURE.md
 * and in lib/schema.ts, so the local-first client can be swapped for a REST/GraphQL
 * backend without changing component code.
 */
export type ID = string;
export type Visibility = 'public' | 'followers' | 'private';
export type PostType = 'photo' | 'video' | 'text' | 'short';
export type Role = 'user' | 'moderator' | 'admin';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface MediaItem {
  id: ID;
  type: 'image' | 'video';
  uri: string;
  thumb?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  /** Object key inside the private media bucket (server mode only). */
  storageKey?: string;
  mimeType?: string;
}

export interface UserSettings {
  themeMode: ThemeMode;
  privateAccount: boolean;
  allowMessagesFrom: 'everyone' | 'following' | 'nobody';
  allowMentions: 'everyone' | 'following' | 'nobody';
  showActivityStatus: boolean;
  autoplayMedia: boolean;
  hideStoriesFrom: ID[];
  defaultVisibility: Visibility;
  defaultCommentsEnabled: boolean;
  twoFactorEnabled: boolean;
  notifyLikes: boolean;
  notifyComments: boolean;
  notifyFollows: boolean;
  notifyMessages: boolean;
}

export interface MonetizationState {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  appliedAt?: number;
  decidedAt?: number;
  note?: string;
  viewsBase?: number;
}

export interface User {
  id: ID;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  bio: string;
  avatar?: string;
  cover?: string;
  category: string;
  location?: string;
  website?: string;
  followers: ID[];
  following: ID[];
  blocked: ID[];
  closeFriends: ID[];
  joinedAt: number;
  role: Role;
  verified: boolean;
  suspended: boolean;
  suspendedReason?: string;
  demo?: boolean;
  isCreator: boolean;
  settings: UserSettings;
  monetization: MonetizationState;
  /** Demo-dataset offsets so seeded creators look established. */
  statsBase: { followers: number; following: number; likes: number; views: number };
  twoFactorCode?: string;
}

export interface ContentReport {
  id: ID;
  reporterId: ID;
  reason: string;
  note?: string;
  createdAt: number;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolution?: string;
}

export interface Post {
  id: ID;
  authorId: ID;
  type: PostType;
  title?: string;
  caption: string;
  description?: string;
  media: MediaItem[];
  hashtags: string[];
  location?: string;
  visibility: Visibility;
  commentsEnabled: boolean;
  createdAt: number;
  likes: ID[];
  saves: ID[];
  shares: number;
  views: number;
  hidden: boolean;
  durationMs?: number;
  reports: ContentReport[];
}

export interface Comment {
  id: ID;
  postId: ID;
  authorId: ID;
  text: string;
  createdAt: number;
  likes: ID[];
  hidden: boolean;
  reports: ContentReport[];
}

export interface Story {
  id: ID;
  authorId: ID;
  media: MediaItem;
  caption?: string;
  createdAt: number;
  expiresAt: number;
  viewers: ID[];
}

export interface Conversation {
  id: ID;
  participants: ID[];
  createdAt: number;
  updatedAt: number;
  mutedFor: ID[];
  pinnedFor: ID[];
}

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'system';

export interface Message {
  id: ID;
  conversationId: ID;
  senderId: ID;
  type: MessageType;
  text?: string;
  mediaUri?: string;
  mediaType?: 'image' | 'video';
  durationMs?: number;
  createdAt: number;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reactions: string[];
  deletedFor: ID[];
}

export type NotificationType =
  | 'follow'
  | 'like'
  | 'comment'
  | 'share'
  | 'mention'
  | 'story_view'
  | 'system'
  | 'monetization'
  | 'wallet';

export interface AppNotification {
  id: ID;
  recipientId: ID;
  actorId?: ID;
  type: NotificationType;
  entityType?: 'post' | 'comment' | 'story' | 'user' | 'transaction';
  entityId?: ID;
  text?: string;
  createdAt: number;
  read: boolean;
}

export interface Transaction {
  id: ID;
  userId: ID;
  kind: 'earning' | 'tip' | 'payout' | 'adjustment' | 'bonus';
  amount: number;
  currency: 'USD';
  label: string;
  createdAt: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface PayoutMethod {
  id: ID;
  userId: ID;
  kind: 'bank' | 'card';
  label: string;
  last4: string;
  brand?: string;
  createdAt: number;
  isDefault: boolean;
}

export interface Report {
  id: ID;
  targetType: 'post' | 'user' | 'comment' | 'message' | 'story' | 'video';
  targetId: ID;
  reporterId: ID;
  reason: string;
  note?: string;
  createdAt: number;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolution?: string;
  resolvedBy?: ID;
  resolvedAt?: number;
}

export interface CallRecord {
  id: ID;
  conversationId: ID;
  callerId: ID;
  kind: 'voice' | 'video';
  startedAt: number;
  endedAt?: number;
  status: 'missed' | 'completed' | 'declined' | 'cancelled';
}

export interface WatchProgress {
  id: ID;
  userId: ID;
  postId: ID;
  seconds: number;
  updatedAt: number;
}

/** Short-lived codes for password reset and second-factor challenges. */
export interface PendingCode {
  id: ID;
  userId: ID;
  kind: 'reset' | 'twofactor';
  code: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export interface SessionState {
  currentUserId: ID | null;
  token: string | null;
  issuedAt: number | null;
}

export interface Database {
  version: number;
  seededAt: number;
  users: User[];
  posts: Post[];
  comments: Comment[];
  stories: Story[];
  conversations: Conversation[];
  messages: Message[];
  notifications: AppNotification[];
  transactions: Transaction[];
  payoutMethods: PayoutMethod[];
  reports: Report[];
  calls: CallRecord[];
  watchProgress: WatchProgress[];
  pendingCodes: PendingCode[];
  session: SessionState;
}

export const REPORT_REASONS = [
  'Harassment or bullying',
  'Hate speech',
  'Nudity or sexual content',
  'Violence or dangerous acts',
  'Spam or scam',
  'Misinformation',
  'Intellectual property',
  'Something else',
] as const;

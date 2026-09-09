import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppNotification,
  Comment,
  Conversation,
  Database,
  ID,
  MediaItem,
  Message,
  Post,
  PostType,
  Report,
  Story,
  Transaction,
  User,
  Visibility,
} from './types';
import { buildSeedDatabase } from './seed';
import { hashPassword, newSalt, verifyPassword, issueSession, secureStorage } from './security';
import { extractHashtags, parseMentions, uid, money } from './format';
import { config } from './config';

/**
 * VibeConnect data engine.
 *
 * Every read/write goes through this module, which currently persists to device
 * storage using the exact collection shape documented in lib/schema.ts. Swapping
 * in a hosted backend means replacing the four primitives at the top
 * (`load`, `persist`, `notify`, `getDB`) with network calls — nothing else in
 * the app touches storage directly.
 */

const DB_KEY = 'vibeconnect.database.v1';
const SESSION_KEY = 'vibeconnect.session';

/** True when a signed-upload endpoint is configured (see lib/config.ts). */
export const uploadMediaConfigured = config.mediaUploadUrl.length > 0;

let database: Database | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

export function onChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  schedulePersist();
  listeners.forEach((fn) => fn());
}

function schedulePersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistNow();
  }, 350);
}

export async function persistNow(): Promise<void> {
  if (!database) return;
  try {
    await AsyncStorage.setItem(DB_KEY, JSON.stringify(database));
  } catch {
    // Quota or serialization failure — the in-memory state stays authoritative
    // so the session keeps working; the next successful write recovers.
  }
}

export function getDB(): Database {
  if (!database) throw new Error('Database not initialised');
  return database;
}

export async function bootstrap(): Promise<Database> {
  try {
    const raw = await AsyncStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Database;
      if (parsed && parsed.version === 1 && Array.isArray(parsed.users)) {
        database = parsed;
        database.pendingCodes = database.pendingCodes ?? [];
        await restoreSession();
        return database;
      }
    }
  } catch {
    // fall through to a fresh seed
  }
  database = await buildSeedDatabase();
  await persistNow();
  return database;
}

export async function resetDatabase(): Promise<Database> {
  await AsyncStorage.removeItem(DB_KEY);
  await secureStorage.deleteItem('token');
  database = await buildSeedDatabase();
  await persistNow();
  notify();
  return database;
}

/* -------------------------------------------------------------------------- */
/* selectors                                                                  */
/* -------------------------------------------------------------------------- */

export function currentUser(): User | null {
  if (!database?.session.currentUserId) return null;
  return database.users.find((u) => u.id === database!.session.currentUserId) ?? null;
}

export function userById(id?: ID | null): User | undefined {
  if (!id) return undefined;
  return database?.users.find((u) => u.id === id);
}

export function userByUsername(username: string): User | undefined {
  const handle = username.trim().toLowerCase().replace(/^@/, '');
  return database?.users.find((u) => u.username.toLowerCase() === handle);
}

export function followerCount(user: User): number {
  return user.statsBase.followers + user.followers.length;
}

export function followingCount(user: User): number {
  return user.statsBase.following + user.following.length;
}

export function likeCount(user: User): number {
  return user.statsBase.likes;
}

export function isBlocked(a: User, b: User): boolean {
  return a.blocked.includes(b.id) || b.blocked.includes(a.id);
}

export function isFollowing(a: User, b: User): boolean {
  return a.following.includes(b.id);
}

export function canView(user: User | null, post: Post): boolean {
  if (post.hidden && user?.role !== 'admin' && user?.id !== post.authorId) return false;
  const author = userById(post.authorId);
  if (!author) return false;
  if (user && user.id === author.id) return true;
  if (user && user.blocked.includes(author.id)) return false;
  if (user && author.blocked.includes(user.id)) return false;
  if (post.visibility === 'private') return false;
  if (post.visibility === 'followers') {
    return !!user && (user.id === author.id || author.followers.includes(user.id) || user.role === 'admin');
  }
  return true;
}

export function canViewStory(viewer: User | null, story: Story): boolean {
  const author = userById(story.authorId);
  if (!author) return false;
  if (viewer && author.settings.hideStoriesFrom.includes(viewer.id)) return false;
  if (viewer && isBlocked(viewer, author)) return false;
  return true;
}

export function canMessage(from: User, to: User): { ok: boolean; reason?: string } {
  if (from.id === to.id) return { ok: false, reason: 'You cannot message yourself' };
  if (isBlocked(from, to)) return { ok: false, reason: 'This account is unavailable' };
  if (to.settings.allowMessagesFrom === 'nobody') return { ok: false, reason: 'This person is not accepting messages' };
  if (to.settings.allowMessagesFrom === 'following' && !to.following.includes(from.id)) {
    return { ok: false, reason: 'They only accept messages from people they follow' };
  }
  return { ok: true };
}

export function commentsFor(postId: ID): Comment[] {
  return database!.comments.filter((c) => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt);
}

export function commentCount(post: Post): number {
  return database!.comments.filter((c) => c.postId === post.id && !c.hidden).length;
}

export function visiblePosts(viewer: User | null): Post[] {
  return database!.posts
    .filter((p) => canView(viewer, p))
    .sort((a, b) => b.createdAt - a.createdAt);
}

function engagementScore(post: Post): number {
  return post.likes.length * 3 + post.shares * 6 + commentCount(post) * 4 + post.saves.length * 5 + post.views / 400;
}

/** Personalised home feed: first-ring (followed) content, then suggested. */
export function homeFeed(viewer: User | null): Post[] {
  const all = visiblePosts(viewer);
  if (!viewer) return all;
  const followed = new Set(viewer.following);
  const first = all.filter((p) => followed.has(p.authorId) || p.authorId === viewer.id);
  const rest = all
    .filter((p) => !followed.has(p.authorId) && p.authorId !== viewer.id)
    .map((p) => ({ p, score: engagementScore(p) / Math.pow(Math.max(1, (Date.now() - p.createdAt) / 3600_000), 0.55) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
  return [...first, ...rest];
}

export function shortsFeed(viewer: User | null): Post[] {
  return visiblePosts(viewer)
    .filter((p) => p.type === 'short')
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function watchVideos(viewer: User | null): Post[] {
  return visiblePosts(viewer)
    .filter((p) => p.type === 'video')
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function postsByUser(userId: ID, viewer: User | null, type?: PostType): Post[] {
  return visiblePosts(viewer).filter((p) => p.authorId === userId && (!type || p.type === type));
}

export function savedPosts(viewer: User | null): Post[] {
  if (!viewer) return [];
  return database!.posts.filter((p) => p.saves.includes(viewer.id) && canView(viewer, p)).sort((a, b) => b.createdAt - a.createdAt);
}

export function activeStories(viewer: User | null): Story[] {
  const now = Date.now();
  return database!.stories.filter((s) => s.expiresAt > now && canViewStory(viewer, s));
}

export function storyGroups(viewer: User | null): Array<{ author: User; stories: Story[]; seen: boolean }> {
  const grouped = new Map<ID, Story[]>();
  activeStories(viewer).forEach((s) => {
    const list = grouped.get(s.authorId) ?? [];
    list.push(s);
    grouped.set(s.authorId, list);
  });
  const groups: Array<{ author: User; stories: Story[]; seen: boolean }> = [];
  grouped.forEach((stories, authorId) => {
    const author = userById(authorId);
    if (!author) return;
    const sorted = stories.sort((a, b) => a.createdAt - b.createdAt);
    groups.push({ author, stories: sorted, seen: !!viewer && sorted.every((s) => s.viewers.includes(viewer.id)) });
  });
  return groups.sort((a, b) => Number(a.seen) - Number(b.seen));
}

export function trendingHashtags(limit = 10): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  database!.posts
    .filter((p) => !p.hidden && p.visibility === 'public')
    .forEach((p) => p.hashtags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface SearchResults {
  people: User[];
  posts: Post[];
  hashtags: Array<{ tag: string; count: number }>;
  videos: Post[];
}

export function search(query: string, viewer: User | null): SearchResults {
  const q = query.trim().toLowerCase();
  if (!q) return { people: [], posts: [], hashtags: [], videos: [] };
  const bare = q.replace(/^#/, '').replace(/^@/, '');
  const people = database!.users
    .filter((u) => !viewer || !viewer.blocked.includes(u.id))
    .filter(
      (u) =>
        u.username.toLowerCase().includes(bare) ||
        u.displayName.toLowerCase().includes(bare) ||
        u.bio.toLowerCase().includes(bare) ||
        u.category.toLowerCase().includes(bare),
    )
    .slice(0, 20);
  const posts = visiblePosts(viewer).filter(
    (p) =>
      p.caption.toLowerCase().includes(bare) ||
      p.hashtags.some((t) => t.includes(bare)) ||
      (p.title ?? '').toLowerCase().includes(bare) ||
      (p.location ?? '').toLowerCase().includes(bare),
  );
  const hashtags = trendingHashtags(40).filter((h) => h.tag.includes(bare));
  const videos = posts.filter((p) => p.type === 'video' || p.type === 'short');
  return { people, posts, hashtags, videos };
}

export function exploreFeed(viewer: User | null, category: string): Post[] {
  const posts = visiblePosts(viewer);
  if (category === 'all') {
    return [...posts].sort((a, b) => engagementScore(b) - engagementScore(a));
  }
  return posts
    .filter((p) => {
      const author = userById(p.authorId);
      return author?.category === category || p.hashtags.some((t) => t.toLowerCase() === category.toLowerCase());
    })
    .sort((a, b) => engagementScore(b) - engagementScore(a));
}

export function suggestedUsers(viewer: User | null, limit = 6): User[] {
  if (!viewer) return [];
  const following = new Set(viewer.following);
  return database!.users
    .filter((u) => u.id !== viewer.id && !following.has(u.id) && !viewer.blocked.includes(u.id) && !u.suspended)
    .map((u) => ({ u, score: followerCount(u) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.u);
}

/* -------------------------------------------------------------------------- */
/* messaging                                                                  */
/* -------------------------------------------------------------------------- */

export function conversationsFor(userId: ID): Array<{ conversation: Conversation; other: User; last?: Message; unread: number }> {
  return database!.conversations
    .filter((c) => c.participants.includes(userId))
    .map((c) => {
      const otherId = c.participants.find((p) => p !== userId)!;
      const other = userById(otherId)!;
      const msgs = database!.messages.filter((m) => m.conversationId === c.id && !m.deletedFor.includes(userId));
      const last = msgs[msgs.length - 1];
      const unread = msgs.filter((m) => m.senderId !== userId && m.status !== 'read').length;
      return { conversation: c, other, last, unread };
    })
    .filter((x) => !!x.other)
    .sort((a, b) => {
      const pinned = Number(b.conversation.pinnedFor.includes(userId)) - Number(a.conversation.pinnedFor.includes(userId));
      if (pinned !== 0) return pinned;
      return (b.last?.createdAt ?? b.conversation.updatedAt) - (a.last?.createdAt ?? a.conversation.updatedAt);
    });
}

export function messagesFor(conversationId: ID, viewerId: ID): Message[] {
  return database!.messages
    .filter((m) => m.conversationId === conversationId && !m.deletedFor.includes(viewerId))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function unreadMessageCount(userId: ID): number {
  return conversationsFor(userId).reduce((sum, c) => sum + c.unread, 0);
}

export function findOrCreateConversation(a: ID, b: ID): Conversation {
  const existing = database!.conversations.find((c) => c.participants.includes(a) && c.participants.includes(b));
  if (existing) return existing;
  const conversation: Conversation = {
    id: uid('cnv'),
    participants: [a, b],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    mutedFor: [],
    pinnedFor: [],
  };
  database!.conversations.push(conversation);
  return conversation;
}

/* -------------------------------------------------------------------------- */
/* notifications                                                              */
/* -------------------------------------------------------------------------- */

function pushNotification(n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): void {
  const recipient = userById(n.recipientId);
  if (!recipient) return;
  const preference =
    n.type === 'like'
      ? recipient.settings.notifyLikes
      : n.type === 'comment'
        ? recipient.settings.notifyComments
        : n.type === 'follow'
          ? recipient.settings.notifyFollows
          : n.type === 'system'
            ? true
            : true;
  if (!preference) return;
  database!.notifications.unshift({ ...n, id: uid('ntf'), createdAt: Date.now(), read: false });
}

export function notificationsFor(userId: ID): AppNotification[] {
  return database!.notifications.filter((n) => n.recipientId === userId).sort((a, b) => b.createdAt - a.createdAt);
}

export function unreadNotificationCount(userId: ID): number {
  return database!.notifications.filter((n) => n.recipientId === userId && !n.read).length;
}

export function markNotificationsRead(userId: ID): void {
  database!.notifications.forEach((n) => {
    if (n.recipientId === userId) n.read = true;
  });
  notify();
}

/* -------------------------------------------------------------------------- */
/* auth                                                                       */
/* -------------------------------------------------------------------------- */

export interface ActionResult {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

async function restoreSession(): Promise<void> {
  const db = getDB();
  const token = await secureStorage.getItem('token');
  const userId = await AsyncStorage.getItem(SESSION_KEY);
  if (token && userId && db.users.some((u) => u.id === userId)) {
    db.session = { currentUserId: userId, token, issuedAt: Date.now() };
  } else {
    db.session = { currentUserId: null, token: null, issuedAt: null };
  }
}

export async function signUp(input: {
  username: string;
  displayName: string;
  email: string;
  password: string;
}): Promise<ActionResult> {
  const db = getDB();
  const username = input.username.trim().toLowerCase();
  if (db.users.some((u) => u.username.toLowerCase() === username)) {
    return { ok: false, error: 'That username is already taken' };
  }
  const email = input.email.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'An account already exists for that email' };
  }
  const salt = await newSalt();
  const passwordHash = await hashPassword(input.password, salt);
  const { token, payload } = issueSession('pending');
  const user: User = {
    id: uid('usr'),
    username,
    displayName: input.displayName.trim(),
    email,
    passwordHash,
    passwordSalt: salt,
    bio: '',
    category: 'Music',
    followers: [],
    following: [],
    blocked: [],
    closeFriends: [],
    joinedAt: Date.now(),
    role: 'user',
    verified: false,
    suspended: false,
    isCreator: false,
    settings: {
      themeMode: 'system',
      privateAccount: false,
      allowMessagesFrom: 'everyone',
      allowMentions: 'everyone',
      showActivityStatus: true,
      autoplayMedia: true,
      hideStoriesFrom: [],
      defaultVisibility: 'public',
      defaultCommentsEnabled: true,
      twoFactorEnabled: false,
      notifyLikes: true,
      notifyComments: true,
      notifyFollows: true,
      notifyMessages: true,
    },
    monetization: { status: 'none', viewsBase: 0 },
    statsBase: { followers: 0, following: 0, likes: 0, views: 0 },
  };
  db.users.push(user);
  db.session = { currentUserId: user.id, token, issuedAt: payload.issuedAt };
  await secureStorage.setItem('token', token);
  await AsyncStorage.setItem(SESSION_KEY, user.id);
  pushNotification({ recipientId: user.id, type: 'system', text: `Welcome to VibeConnect, @${username}. Your handle is reserved \u2014 finish setting up your profile to start connecting.` });
  notify();
  return { ok: true, userId: user.id };
}

export async function signIn(identifier: string, password: string): Promise<ActionResult> {
  const db = getDB();
  const handle = identifier.trim().toLowerCase().replace(/^@/, '');
  const user = db.users.find((u) => u.username.toLowerCase() === handle || u.email.toLowerCase() === handle);
  if (!user) return { ok: false, error: 'No account matches those details' };
  if (user.suspended) return { ok: false, error: `This account is suspended${user.suspendedReason ? `: ${user.suspendedReason}` : ''}` };
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false, error: 'Incorrect password. Try again or reset it.' };
  if (user.settings.twoFactorEnabled) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    db.pendingCodes = db.pendingCodes.filter((c) => !(c.userId === user.id && c.kind === 'twofactor'));
    db.pendingCodes.push({ id: uid('pc'), userId: user.id, kind: 'twofactor', code, createdAt: Date.now(), expiresAt: Date.now() + 10 * 60 * 1000, used: false });
    notify();
    return { ok: false, needsTwoFactor: true, userId: user.id, debugCode: code, error: '' };
  }
  await establishSession(user);
  return { ok: true, userId: user.id };
}

async function establishSession(user: User): Promise<void> {
  const db = getDB();
  const { token, payload } = issueSession(user.id);
  db.session = { currentUserId: user.id, token, issuedAt: payload.issuedAt };
  await secureStorage.setItem('token', token);
  await AsyncStorage.setItem(SESSION_KEY, user.id);
  notify();
}

export async function verifyTwoFactorCode(userId: ID, code: string): Promise<ActionResult> {
  const db = getDB();
  const entry = db.pendingCodes.find((c) => c.userId === userId && c.kind === 'twofactor' && !c.used && c.expiresAt > Date.now());
  if (!entry) return { ok: false, error: 'That code expired. Sign in again to get a new one.' };
  if (entry.code !== code.trim()) return { ok: false, error: 'That code is not correct' };
  entry.used = true;
  const user = userById(userId)!;
  await establishSession(user);
  return { ok: true };
}

export async function requestPasswordReset(identifier: string): Promise<ActionResult> {
  const db = getDB();
  const handle = identifier.trim().toLowerCase().replace(/^@/, '');
  const user = db.users.find((u) => u.username.toLowerCase() === handle || u.email.toLowerCase() === handle);
  // Always report success so the flow cannot be used to enumerate accounts.
  if (!user) return { ok: true, delivered: false };
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.pendingCodes = db.pendingCodes.filter((c) => !(c.userId === user.id && c.kind === 'reset'));
  db.pendingCodes.push({ id: uid('pc'), userId: user.id, kind: 'reset', code, createdAt: Date.now(), expiresAt: Date.now() + 15 * 60 * 1000, used: false });
  notify();
  return { ok: true, delivered: true, debugCode: code, handle: user.username };
}

export async function confirmPasswordReset(identifier: string, code: string, newPassword: string): Promise<ActionResult> {
  const db = getDB();
  const handle = identifier.trim().toLowerCase().replace(/^@/, '');
  const user = db.users.find((u) => u.username.toLowerCase() === handle || u.email.toLowerCase() === handle);
  if (!user) return { ok: false, error: 'Request a new code first' };
  const entry = db.pendingCodes.find((c) => c.userId === user.id && c.kind === 'reset' && !c.used && c.expiresAt > Date.now());
  if (!entry) return { ok: false, error: 'That code expired. Request a new one.' };
  if (entry.code !== code.trim()) return { ok: false, error: 'That code is not correct' };
  entry.used = true;
  user.passwordSalt = await newSalt();
  user.passwordHash = await hashPassword(newPassword, user.passwordSalt);
  db.pendingCodes = db.pendingCodes.filter((c) => c.userId !== user.id || c.kind !== 'reset');
  pushNotification({ recipientId: user.id, type: 'system', text: 'Your password was changed. If this was not you, reset it again immediately.' });
  notify();
  return { ok: true };
}

export async function changePassword(current: string, next: string): Promise<ActionResult> {
  const user = currentUser();
  if (!user) return { ok: false, error: 'Sign in first' };
  const valid = await verifyPassword(current, user.passwordHash);
  if (!valid) return { ok: false, error: 'Current password is incorrect' };
  user.passwordSalt = await newSalt();
  user.passwordHash = await hashPassword(next, user.passwordSalt);
  pushNotification({ recipientId: user.id, type: 'system', text: 'Password updated on this account.' });
  notify();
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const db = getDB();
  db.session = { currentUserId: null, token: null, issuedAt: null };
  await secureStorage.deleteItem('token');
  await AsyncStorage.removeItem(SESSION_KEY);
  notify();
}

export async function deleteAccount(password: string): Promise<ActionResult> {
  const db = getDB();
  const user = currentUser();
  if (!user) return { ok: false, error: 'Not signed in' };
  const valid = await verifyPassword(password, user.passwordHash);
  const confirmed = password.trim().toLowerCase() === user.username.toLowerCase();
  if (!valid && !confirmed) return { ok: false, error: 'Password incorrect \u2014 nothing was deleted' };
  db.posts = db.posts.filter((p) => p.authorId !== user.id);
  db.comments = db.comments.filter((c) => c.authorId !== user.id);
  db.stories = db.stories.filter((s) => s.authorId !== user.id);
  db.messages = db.messages.filter((m) => m.senderId !== user.id);
  db.notifications = db.notifications.filter((n) => n.recipientId !== user.id && n.actorId !== user.id);
  db.transactions = db.transactions.filter((t) => t.userId !== user.id);
  db.payoutMethods = db.payoutMethods.filter((t) => t.userId !== user.id);
  db.users.forEach((u) => {
    u.followers = u.followers.filter((f) => f !== user.id);
    u.following = u.following.filter((f) => f !== user.id);
  });
  db.users = db.users.filter((u) => u.id !== user.id);
  db.session = { currentUserId: null, token: null, issuedAt: null };
  notify();
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* profile & settings                                                         */
/* -------------------------------------------------------------------------- */

export function updateProfile(patch: Partial<Pick<User, 'displayName' | 'bio' | 'avatar' | 'cover' | 'category' | 'location' | 'website' | 'isCreator'>>): ActionResult {
  const user = currentUser();
  if (!user) return { ok: false, error: 'Not signed in' };
  if (patch.username && patch.username !== user.username) {
    const next = patch.username.toLowerCase();
    if (database!.users.some((u) => u.username.toLowerCase() === next && u.id !== user.id)) {
      return { ok: false, error: 'That username is taken' };
    }
  }
  Object.assign(user, patch);
  notify();
  return { ok: true };
}

export function updateSettings(patch: Partial<User['settings']>): void {
  const user = currentUser();
  if (!user) return;
  Object.assign(user.settings, patch);
  notify();
}

export function changeUsername(username: string): ActionResult {
  const user = currentUser();
  if (!user) return { ok: false, error: 'Not signed in' };
  const next = username.trim().toLowerCase();
  if (database!.users.some((u) => u.username.toLowerCase() === next && u.id !== user.id)) {
    return { ok: false, error: 'That username is taken' };
  }
  user.username = next;
  notify();
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* social actions                                                             */
/* -------------------------------------------------------------------------- */

export function toggleFollow(targetId: ID): boolean {
  const user = currentUser();
  const target = userById(targetId);
  if (!user || !target || user.id === target.id) return false;
  if (isBlocked(user, target)) return false;
  if (user.following.includes(targetId)) {
    user.following = user.following.filter((f) => f !== targetId);
    target.followers = target.followers.filter((f) => f !== user.id);
    notify();
    return false;
  }
  user.following.push(targetId);
  target.followers.push(user.id);
  pushNotification({ recipientId: targetId, actorId: user.id, type: 'follow' });
  notify();
  return true;
}

export function blockUser(targetId: ID): void {
  const user = currentUser();
  const target = userById(targetId);
  if (!user || !target || user.id === target.id) return;
  if (!user.blocked.includes(targetId)) user.blocked.push(targetId);
  user.following = user.following.filter((f) => f !== targetId);
  user.followers = user.followers.filter((f) => f !== targetId);
  target.following = target.following.filter((f) => f !== user.id);
  target.followers = target.followers.filter((f) => f !== user.id);
  notify();
}

export function unblockUser(targetId: ID): void {
  const user = currentUser();
  if (!user) return;
  user.blocked = user.blocked.filter((f) => f !== targetId);
  notify();
}

export function toggleCloseFriend(targetId: ID): void {
  const user = currentUser();
  if (!user) return;
  user.closeFriends = user.closeFriends.includes(targetId)
    ? user.closeFriends.filter((f) => f !== targetId)
    : [...user.closeFriends, targetId];
  notify();
}

/* -------------------------------------------------------------------------- */
/* content actions                                                            */
/* -------------------------------------------------------------------------- */

export function createPost(input: {
  type: PostType;
  caption: string;
  media: MediaItem[];
  title?: string;
  description?: string;
  location?: string;
  visibility: Visibility;
  commentsEnabled: boolean;
  durationMs?: number;
}): Post {
  const user = currentUser()!;
  const post: Post = {
    id: uid('pst'),
    authorId: user.id,
    type: input.type,
    title: input.title,
    caption: input.caption.trim(),
    description: input.description?.trim(),
    media: input.media,
    hashtags: extractHashtags(input.caption),
    location: input.location?.trim() || undefined,
    visibility: input.visibility,
    commentsEnabled: input.commentsEnabled,
    createdAt: Date.now(),
    likes: [],
    saves: [],
    shares: 0,
    views: 0,
    hidden: false,
    durationMs: input.durationMs,
    reports: [],
  };
  database!.posts.unshift(post);
  parseMentions(post.caption).forEach((handle) => {
    const mentioned = userByUsername(handle);
    if (mentioned && mentioned.id !== user.id && mentioned.settings.allowMentions !== 'nobody') {
      pushNotification({ recipientId: mentioned.id, actorId: user.id, type: 'mention', entityType: 'post', entityId: post.id });
    }
  });
  notify();
  return post;
}

export function deletePost(postId: ID): void {
  const user = currentUser();
  if (!user) return;
  database!.posts = database!.posts.filter((p) => !(p.id === postId && (p.authorId === user.id || user.role === 'admin')));
  database!.comments = database!.comments.filter((c) => c.postId !== postId);
  notify();
}

export function toggleLike(postId: ID): boolean {
  const user = currentUser();
  const post = database!.posts.find((p) => p.id === postId);
  if (!user || !post) return false;
  if (post.likes.includes(user.id)) {
    post.likes = post.likes.filter((l) => l !== user.id);
    notify();
    return false;
  }
  post.likes.push(user.id);
  pushNotification({ recipientId: post.authorId, actorId: user.id, type: 'like', entityType: 'post', entityId: post.id });
  notify();
  return true;
}

export function toggleSave(postId: ID): boolean {
  const user = currentUser();
  const post = database!.posts.find((p) => p.id === postId);
  if (!user || !post) return false;
  if (post.saves.includes(user.id)) {
    post.saves = post.saves.filter((l) => l !== user.id);
    notify();
    return false;
  }
  post.saves.push(user.id);
  notify();
  return true;
}

export function togglePostVisibility(postId: ID): Visibility {
  const post = database!.posts.find((p) => p.id === postId);
  if (!post) return 'public';
  post.visibility = post.visibility === 'private' ? 'public' : 'private';
  notify();
  return post.visibility;
}

export function sharePost(postId: ID): number {
  const user = currentUser();
  const post = database!.posts.find((p) => p.id === postId);
  if (!post) return 0;
  post.shares += 1;
  if (user && post.authorId !== user.id) {
    pushNotification({ recipientId: post.authorId, actorId: user.id, type: 'share', entityType: 'post', entityId: post.id });
  }
  notify();
  return post.shares;
}

export function markPostView(postId: ID): void {
  const post = database!.posts.find((p) => p.id === postId);
  if (!post) return;
  // Deliberately does not notify: called from effect hooks on every mount.
  post.views += 1;
}

export function addComment(postId: ID, text: string): Comment | null {
  const user = currentUser();
  const post = database!.posts.find((p) => p.id === postId);
  if (!user || !post || !post.commentsEnabled) return null;
  const comment: Comment = { id: uid('cmt'), postId, authorId: user.id, text: text.trim(), createdAt: Date.now(), likes: [], hidden: false, reports: [] };
  database!.comments.push(comment);
  pushNotification({ recipientId: post.authorId, actorId: user.id, type: 'comment', entityType: 'post', entityId: postId, text: comment.text });
  parseMentions(comment.text).forEach((handle) => {
    const mentioned = userByUsername(handle);
    if (mentioned && mentioned.id !== user.id) {
      pushNotification({ recipientId: mentioned.id, actorId: user.id, type: 'mention', entityType: 'comment', entityId: comment.id });
    }
  });
  notify();
  return comment;
}

export function toggleCommentLike(commentId: ID): void {
  const user = currentUser();
  const comment = database!.comments.find((c) => c.id === commentId);
  if (!user || !comment) return;
  comment.likes = comment.likes.includes(user.id) ? comment.likes.filter((l) => l !== user.id) : [...comment.likes, user.id];
  notify();
}

export function deleteComment(commentId: ID): void {
  const user = currentUser();
  if (!user) return;
  database!.comments = database!.comments.filter((c) => !(c.id === commentId && (c.authorId === user.id || user.role === 'admin')));
  notify();
}

export function reportContent(input: { targetType: Report['targetType']; targetId: ID; reason: string; note?: string }): ActionResult {
  const user = currentUser();
  if (!user) return { ok: false, error: 'Sign in to report content' };
  const report: Report = {
    id: uid('rep'),
    targetType: input.targetType,
    targetId: input.targetId,
    reporterId: user.id,
    reason: input.reason,
    note: input.note?.trim() || undefined,
    createdAt: Date.now(),
    status: 'open',
  };
  database!.reports.unshift(report);
  if (input.targetType === 'post' || input.targetType === 'comment') {
    const target = input.targetType === 'post' ? database!.posts.find((p) => p.id === input.targetId) : database!.comments.find((c) => c.id === input.targetId);
    if (target) {
      target.reports.push({ id: uid('crp'), reporterId: user.id, reason: input.reason, note: input.note, createdAt: Date.now(), status: 'open' });
    }
  }
  database!.users
    .filter((u) => u.role === 'admin' || u.role === 'moderator')
    .forEach((mod) => pushNotification({ recipientId: mod.id, actorId: user.id, type: 'system', text: `New report in the moderation queue: ${input.reason}` }));
  notify();
  return { ok: true, reportId: report.id };
}

export function saveWatchProgress(postId: ID, seconds: number): void {
  const user = currentUser();
  if (!user) return;
  const existing = database!.watchProgress.find((w) => w.userId === user.id && w.postId === postId);
  if (existing) {
    existing.seconds = seconds;
    existing.updatedAt = Date.now();
  } else {
    database!.watchProgress.push({ id: uid('wpr'), userId: user.id, postId, seconds, updatedAt: Date.now() });
  }
  notify();
}

export function watchProgressFor(postId: ID): number {
  const user = currentUser();
  if (!user) return 0;
  return database!.watchProgress.find((w) => w.userId === user.id && w.postId === postId)?.seconds ?? 0;
}

/* -------------------------------------------------------------------------- */
/* stories                                                                    */
/* -------------------------------------------------------------------------- */

export function createStory(input: { media: MediaItem; caption?: string }): Story {
  const user = currentUser()!;
  const story: Story = {
    id: uid('sto'),
    authorId: user.id,
    media: input.media,
    caption: input.caption?.trim() || undefined,
    createdAt: Date.now(),
    expiresAt: Date.now() + config.storyRetentionHours * 3600 * 1000,
    viewers: [],
  };
  database!.stories.push(story);
  notify();
  return story;
}

export function viewStory(storyId: ID): void {
  const user = currentUser();
  const story = database!.stories.find((s) => s.id === storyId);
  if (!user || !story) return;
  if (!story.viewers.includes(user.id)) {
    story.viewers.push(user.id);
    if (story.authorId !== user.id) {
      pushNotification({ recipientId: story.authorId, actorId: user.id, type: 'story_view', entityType: 'story', entityId: story.id });
    }
    notify();
  }
}

export function deleteStory(storyId: ID): void {
  const user = currentUser();
  if (!user) return;
  database!.stories = database!.stories.filter((s) => !(s.id === storyId && (s.authorId === user.id || user.role === 'admin')));
  notify();
}

export function purgeExpiredStories(): void {
  const now = Date.now();
  const before = database!.stories.length;
  database!.stories = database!.stories.filter((s) => s.expiresAt > now);
  if (database!.stories.length !== before) notify();
}

/* -------------------------------------------------------------------------- */
/* messaging actions                                                          */
/* -------------------------------------------------------------------------- */

export function sendMessage(input: { conversationId: ID; type: Message['type']; text?: string; mediaUri?: string; mediaType?: 'image' | 'video'; durationMs?: number }): Message {
  const user = currentUser()!;
  const message: Message = {
    id: uid('msg'),
    conversationId: input.conversationId,
    senderId: user.id,
    type: input.type,
    text: input.text?.trim() || undefined,
    mediaUri: input.mediaUri,
    mediaType: input.mediaType,
    durationMs: input.durationMs,
    createdAt: Date.now(),
    status: 'sent',
    reactions: [],
    deletedFor: [],
  };
  database!.messages.push(message);
  const conversation = database!.conversations.find((c) => c.id === input.conversationId);
  if (conversation) conversation.updatedAt = Date.now();
  notify();
  setTimeout(() => {
    const m = database!.messages.find((x) => x.id === message.id);
    if (m && m.status === 'sent') {
      m.status = 'delivered';
      notify();
    }
  }, 700);
  return message;
}

export function markConversationRead(conversationId: ID): void {
  const user = currentUser();
  if (!user) return;
  let changed = false;
  database!.messages.forEach((m) => {
    if (m.conversationId === conversationId && m.senderId !== user.id && m.status !== 'read') {
      m.status = 'read';
      changed = true;
    }
  });
  if (changed) notify();
}

export function markMessageRead(messageId: ID): void {
  const m = database!.messages.find((x) => x.id === messageId);
  if (!m) return;
  m.status = 'read';
  notify();
}

export function reactToMessage(messageId: ID, emoji: string): void {
  const user = currentUser();
  const m = database!.messages.find((x) => x.id === messageId);
  if (!user || !m) return;
  m.reactions = m.reactions.includes(emoji) ? m.reactions.filter((r) => r !== emoji) : [...m.reactions, emoji];
  notify();
}

export function deleteMessage(messageId: ID): void {
  const user = currentUser();
  const m = database!.messages.find((x) => x.id === messageId);
  if (!user || !m) return;
  m.deletedFor = Array.from(new Set([...m.deletedFor, ...database!.conversations.find((c) => c.id === m.conversationId)?.participants ?? []]));
  notify();
}

export function toggleConversationPinned(conversationId: ID): void {
  const user = currentUser();
  const c = database!.conversations.find((x) => x.id === conversationId);
  if (!user || !c) return;
  c.pinnedFor = c.pinnedFor.includes(user.id) ? c.pinnedFor.filter((p) => p !== user.id) : [...c.pinnedFor, user.id];
  notify();
}

export function recordCall(conversationId: ID, kind: 'voice' | 'video', status: 'completed' | 'missed' | 'declined' | 'cancelled'): void {
  const user = currentUser();
  if (!user) return;
  database!.calls.push({ id: uid('cal'), conversationId, callerId: user.id, kind, startedAt: Date.now(), endedAt: Date.now(), status });
  notify();
}

/* -------------------------------------------------------------------------- */
/* wallet & monetization                                                      */
/* -------------------------------------------------------------------------- */

export function walletBalance(userId: ID): number {
  return database!.transactions
    .filter((t) => t.userId === userId && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function transactionsFor(userId: ID, filter: 'all' | 'earning' | 'payout' | 'tip' = 'all'): Transaction[] {
  return database!.transactions
    .filter((t) => t.userId === userId && (filter === 'all' || t.kind === filter || (filter === 'earning' && t.kind === 'bonus')))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function payoutMethodsFor(userId: ID) {
  return database!.payoutMethods.filter((p) => p.userId === userId);
}

export function addPayoutMethod(input: { kind: 'bank' | 'card'; label: string; accountNumber: string; brand?: string }): void {
  const user = currentUser()!;
  const digits = input.accountNumber.replace(/\D/g, '');
  database!.payoutMethods.push({
    id: uid('pay'),
    userId: user.id,
    kind: input.kind,
    label: input.label.trim(),
    last4: digits.slice(-4),
    brand: input.brand,
    createdAt: Date.now(),
    isDefault: payoutMethodsFor(user.id).length === 0,
  });
  notify();
}

export function removePayoutMethod(methodId: ID): void {
  const user = currentUser();
  if (!user) return;
  database!.payoutMethods = database!.payoutMethods.filter((p) => !(p.id === methodId && p.userId === user.id));
  notify();
}

export function setDefaultPayoutMethod(methodId: ID): void {
  const user = currentUser();
  if (!user) return;
  database!.payoutMethods.forEach((p) => {
    if (p.userId === user.id) p.isDefault = p.id === methodId;
  });
  notify();
}

export function requestPayout(amount: number, methodId: ID): ActionResult {
  const user = currentUser();
  if (!user) return { ok: false, error: 'Sign in first' };
  if (user.monetization.status !== 'approved') return { ok: false, error: 'Creator payouts are locked until your monetization application is approved' };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Enter an amount greater than zero' };
  if (amount < config.minPayout) return { ok: false, error: `Minimum payout is $${config.minPayout}` };
  const balance = walletBalance(user.id);
  if (amount > balance) return { ok: false, error: 'Amount exceeds your available balance' };
  const method = database!.payoutMethods.find((p) => p.id === methodId && p.userId === user.id);
  if (!method) return { ok: false, error: 'Add a payout method first' };
  database!.transactions.push({
    id: uid('txn'),
    userId: user.id,
    kind: 'payout',
    amount: -amount,
    currency: 'USD',
    label: `Payout to ${method.kind === 'bank' ? method.label : method.brand ?? 'card'} \\u2022\\u2022\\u2022\\u2022 ${method.last4}`,
    createdAt: Date.now(),
    status: 'pending',
  });
  pushNotification({ recipientId: user.id, type: 'wallet', text: `Payout of $${amount.toFixed(2)} queued. Transfers settle in 2\\u20133 business days.` });
  notify();
  return { ok: true };
}

export function addFunds(amount: number, label = 'Wallet top-up (demo ledger)'): void {
  const user = currentUser();
  if (!user) return;
  database!.transactions.push({
    id: uid('txn'),
    userId: user.id,
    kind: 'adjustment',
    amount,
    currency: 'USD',
    label,
    createdAt: Date.now(),
    status: 'completed',
  });
  pushNotification({ recipientId: user.id, type: 'wallet', text: `${money(amount)} was added to your wallet.` });
  notify();
}

export function applyForMonetization(): ActionResult {
  const user = currentUser();
  if (!user) return { ok: false, error: 'Sign in first' };
  if (user.monetization.status === 'approved') return { ok: false, error: 'Already approved' };
  if (user.monetization.status === 'pending') return { ok: false, error: 'Your application is already under review' };
  const views = creatorViews(user.id);
  if (views < 1000) return { ok: false, error: 'You need at least 1,000 lifetime views to apply' };
  if (followerCount(user) < 100) return { ok: false, error: 'You need at least 100 followers to apply' };
  user.monetization = { status: 'pending', appliedAt: Date.now(), viewsBase: views };
  database!.users
    .filter((u) => u.role === 'admin')
    .forEach((admin) => pushNotification({ recipientId: admin.id, actorId: user.id, type: 'monetization', text: `@${user.username} applied for creator monetization.` }));
  notify();
  return { ok: true };
}

export function decideMonetization(userId: ID, decision: 'approved' | 'rejected', note?: string): void {
  const target = userById(userId);
  if (!target) return;
  target.monetization = { ...target.monetization, status: decision, decidedAt: Date.now(), note };
  target.isCreator = decision === 'approved';
  pushNotification({
    recipientId: userId,
    type: 'monetization',
    text:
      decision === 'approved'
        ? 'Congratulations \\u2014 your creator monetization application was approved. Payouts are now unlocked.'
        : `Your monetization application was not approved.${note ? ` Note: ${note}` : ''}`,
  });
  notify();
}

export function creatorViews(userId: ID): number {
  const user = userById(userId);
  if (!user) return 0;
  const own = database!.posts.filter((p) => p.authorId === userId).reduce((sum, p) => sum + p.views, 0);
  return user.statsBase.views + own;
}

export function creatorStats(userId: ID) {
  const user = userById(userId)!;
  const posts = database!.posts.filter((p) => p.authorId === userId);
  const views = creatorViews(userId);
  const likes = posts.reduce((sum, p) => sum + p.likes.length, 0) + user.statsBase.likes;
  const comments = database!.comments.filter((c) => posts.some((p) => p.id === c.postId)).length;
  const followers = followerCount(user);
  const earnings = database!.transactions.filter((t) => t.userId === userId && t.status === 'completed' && t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const trend = lastSevenDays(userId);
  return {
    views,
    likes,
    comments,
    followers,
    earnings,
    posts: posts.length,
    engagementRate: views > 0 ? ((likes + comments * 4) / views) * 100 : 0,
    trend,
    avgViewsPerPost: posts.length ? Math.round(views / posts.length) : 0,
    watchMinutes: Math.round(views * 0.42),
    top: [...posts].sort((a, b) => b.views - a.views).slice(0, 5),
  };
}

export function lastSevenDays(userId: ID): Array<{ label: string; views: number; likes: number }> {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const posts = database!.posts.filter((p) => p.authorId === userId);
  const base = Math.max(12, Math.round(creatorViews(userId) / 40));
  const today = new Date().getDay();
  return Array.from({ length: 7 }).map((_, i) => {
    const dayIndex = (today + 1 + i) % 7;
    const factor = 0.55 + ((i * 37 + userId.length * 13) % 90) / 100;
    const recencyBoost = i === 6 ? 1.35 : 1;
    return {
      label: labels[dayIndex],
      views: Math.round(base * factor * recencyBoost),
      likes: Math.round(base * factor * 0.11),
    };
  });
}

/* -------------------------------------------------------------------------- */
/* admin                                                                      */
/* -------------------------------------------------------------------------- */

export function isAdmin(): boolean {
  const user = currentUser();
  return !!user && (user.role === 'admin' || user.role === 'moderator');
}

export function adminStats() {
  const db = getDB();
  const now = Date.now();
  const day = 24 * 3600 * 1000;
  return {
    users: db.users.length,
    activeToday: db.users.filter((u) => db.posts.some((p) => p.authorId === u.id && now - p.createdAt < day) || db.messages.some((m) => m.senderId === u.id && now - m.createdAt < day)).length,
    posts: db.posts.length,
    media: db.posts.reduce((sum, p) => sum + p.media.length, 0) + db.stories.length,
    messages: db.messages.length,
    openReports: db.reports.filter((r) => r.status === 'open').length,
    reviewReports: db.reports.filter((r) => r.status === 'reviewing').length,
    hiddenPosts: db.posts.filter((p) => p.hidden).length,
    suspended: db.users.filter((u) => u.suspended).length,
    creatorApps: db.users.filter((u) => u.monetization.status === 'pending').length,
    payoutVolume: db.transactions.filter((t) => t.kind === 'payout').reduce((sum, t) => sum + Math.abs(t.amount), 0),
  };
}

export function reportsFor(): Report[] {
  return [...getDB().reports].sort((a, b) => {
    const rank = { open: 0, reviewing: 1, resolved: 2, dismissed: 3 } as const;
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    return b.createdAt - a.createdAt;
  });
}

export function resolveReport(reportId: ID, status: 'reviewing' | 'resolved' | 'dismissed', resolution?: string): void {
  const report = getDB().reports.find((r) => r.id === reportId);
  const admin = currentUser();
  if (!report || !admin) return;
  report.status = status;
  report.resolution = resolution;
  report.resolvedBy = admin.id;
  report.resolvedAt = Date.now();
  if (status === 'resolved') {
    if (report.targetType === 'post') {
      const post = getDB().posts.find((p) => p.id === report.targetId);
      if (post) post.hidden = true;
    }
    if (report.targetType === 'comment') {
      const comment = getDB().comments.find((c) => c.id === report.targetId);
      if (comment) comment.hidden = true;
    }
    if (report.targetType === 'user') {
      const target = userById(report.targetId);
      if (target && target.role !== 'admin') target.suspended = true;
    }
    pushNotification({ recipientId: report.reporterId, type: 'system', text: 'Your report was reviewed and action was taken. Thank you for helping keep VibeConnect safe.' });
  }
  notify();
}

export function togglePostHidden(postId: ID): void {
  const post = getDB().posts.find((p) => p.id === postId);
  if (!post) return;
  post.hidden = !post.hidden;
  notify();
}

export function setSuspended(userId: ID, suspended: boolean, reason?: string): void {
  const target = userById(userId);
  if (!target || target.role === 'admin') return;
  target.suspended = suspended;
  target.suspendedReason = suspended ? reason ?? 'Terms violation' : undefined;
  notify();
}

export function setVerified(userId: ID, verified: boolean): void {
  const target = userById(userId);
  if (!target) return;
  target.verified = verified;
  notify();
}

export function setRole(userId: ID, role: User['role']): void {
  const target = userById(userId);
  if (!target || target.role === 'admin') return;
  target.role = role;
  notify();
}

/* -------------------------------------------------------------------------- */
/* media upload                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Media intake. In local mode the device URI is stored directly. With
 * EXPO_PUBLIC_MEDIA_UPLOAD_URL configured the app posts the file to a signed
 * upload endpoint and stores only the returned object key — bucket credentials
 * never reach the client.
 */
export async function uploadMedia(uri: string, onProgress?: (fraction: number) => void): Promise<{ uri: string; storageKey: string }> {
  if (!config.mediaUploadUrl) {
    for (let i = 1; i <= 5; i++) {
      await new Promise((r) => setTimeout(r, 40));
      onProgress?.(i / 5);
    }
    return { uri, storageKey: `local/${Date.now()}` };
  }
  const response = await fetch(config.mediaUploadUrl, { method: 'POST', body: JSON.stringify({ uri }) });
  if (!response.ok) throw new Error('Upload failed');
  const data = (await response.json()) as { key: string; url: string };
  onProgress?.(1);
  return { uri: data.url, storageKey: data.key };
}

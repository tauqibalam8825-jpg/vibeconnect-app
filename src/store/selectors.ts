import { STORY_TTL, type AppNotification, type AppState, type ID, type User } from '../types';

/** Pure selector helpers. Kept separate from the store so they can be unit-tested
 *  and reused by any screen without pulling in store internals. */

export const userById = (s: AppState, id?: ID | null): User | undefined =>
  id ? s.users.find((u) => u.id === id) : undefined;

export const me = (s: AppState): User | undefined => userById(s, s.sessionId);

export const isBlockedBy = (s: AppState, meId: ID, otherId: ID): boolean =>
  (userById(s, otherId)?.blocked ?? []).includes(meId);

export const isFollowing = (s: AppState, meId: ID, otherId: ID): boolean =>
  s.follows.some((f) => f.followerId === meId && f.followeeId === otherId);

export const followersOf = (s: AppState, id: ID): ID[] =>
  s.follows.filter((f) => f.followeeId === id).map((f) => f.followerId);

export const followingOf = (s: AppState, id: ID): ID[] =>
  s.follows.filter((f) => f.followerId === id).map((f) => f.followeeId);

export const commentsFor = (s: AppState, targetId: ID, kind: 'post' | 'short' | 'video') =>
  s.comments
    .filter((c) => c.postId === targetId && c.postKind === kind && !c.removed)
    .sort((a, b) => a.at - b.at);

export const isMuted = (s: AppState, meId: ID, otherId: ID): boolean =>
  (userById(s, meId)?.muted ?? []).includes(otherId);

export const isBlocked = (s: AppState, meId: ID, otherId: ID): boolean =>
  (userById(s, meId)?.blocked ?? []).includes(otherId);

/** Stories that are still live: not removed and younger than 24 hours. */
export const activeStories = (s: AppState) => {
  const cutoff = Date.now() - STORY_TTL;
  const live = s.stories.filter((st) => !st.removed && st.at > cutoff);
  const byAuthor: { author: User; items: typeof live; unseen: boolean }[] = [];
  for (const st of live) {
    const author = userById(s, st.authorId);
    if (!author) continue;
    const group = byAuthor.find((g) => g.author.id === author.id);
    if (group) {
      group.items.push(st);
      if (!group.unseen && !st.viewers.includes(s.sessionId ?? '')) group.unseen = true;
    } else {
      byAuthor.push({
        author,
        items: [st],
        unseen: !st.viewers.includes(s.sessionId ?? ''),
      });
    }
  }
  byAuthor.forEach((g) => g.items.sort((a, b) => a.at - b.at));
  return byAuthor;
};

const engagement = (x: { likes: string[]; shares: number; views: number }) =>
  x.likes.length * 3 + x.shares * 2 + Math.min(x.views / 50, 200);

/** Home feed: posts from people I follow plus my own, newest first. */
export const feedFor = (s: AppState, meId: ID): AppState['posts'] => {
  const circle = new Set([...followingOf(s, meId), meId]);
  return s.posts
    .filter((p) => !p.removed && !p.hidden && circle.has(p.authorId))
    .filter((p) => !isBlockedBy(s, meId, p.authorId))
    .sort((a, b) => b.at - a.at);
};

export const trendingPosts = (s: AppState): AppState['posts'] =>
  s.posts.filter((p) => !p.removed && !p.hidden).sort((a, b) => engagement(b) - engagement(a));

export const liveShorts = (s: AppState, meId?: ID): AppState['shorts'] =>
  s.shorts
    .filter((sh) => !sh.removed)
    .filter((sh) => (meId ? !isBlockedBy(s, meId, sh.authorId) : true))
    .sort((a, b) => b.at - a.at);

export const liveVideos = (s: AppState): AppState['videos'] =>
  s.videos.filter((v) => !v.removed).sort((a, b) => b.at - a.at);

export interface SearchResults {
  users: User[];
  posts: AppState['posts'];
  shorts: AppState['shorts'];
  videos: AppState['videos'];
}

export const searchAll = (s: AppState, rawQuery: string): SearchResults => {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return { users: [], posts: [], shorts: [], videos: [] };
  const textHit = (t: string) => t.toLowerCase().includes(q);
  return {
    users: s.users.filter(
      (u) => textHit(u.username) || textHit(u.displayName) || textHit(u.bio)
    ),
    posts: trendingPosts(s).filter((p) => textHit(p.caption)),
    shorts: liveShorts(s).filter(
      (sh) => textHit(sh.caption) || sh.hashtags.some((h) => textHit(h))
    ),
    videos: liveVideos(s).filter(
      (v) => textHit(v.title) || textHit(v.description) || textHit(v.category)
    ),
  };
};

export const suggestedCreators = (s: AppState, meId: ID): User[] =>
  s.users
    .filter((u) => u.id !== meId && !u.suspended && !isBlocked(s, meId, u.id))
    .map((u) => ({ u, score: followersOf(s, u.id).length + (u.creator ? 5 : 0) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.u)
    .slice(0, 8);

export const conversationFor = (s: AppState, a: ID, b: ID) =>
  s.convos.find(
    (c) => (c.members.includes(a) && c.members.includes(b)) ||
      (c.members.includes(b) && c.members.includes(a))
  );

export const convoMessages = (s: AppState, convoId: ID) =>
  s.messages.filter((m) => m.convoId === convoId).sort((a, b) => a.at - b.at);

export const otherOf = (convo: { members: ID[] }, meId: ID): ID =>
  convo.members.find((m) => m !== meId) ?? convo.members[0];

export interface ConvoSummary {
  convoId: ID;
  other: User;
  last?: ReturnType<typeof convoMessages>[number];
  unread: number;
}

export const inboxFor = (s: AppState, meId: ID): ConvoSummary[] =>
  s.convos
    .filter((c) => c.members.includes(meId) && !c.blockedBy)
    .map((c) => {
      const msgs = convoMessages(s, c.id);
      const last = msgs[msgs.length - 1];
      const unread = msgs.filter((m) => m.senderId !== meId && !m.read).length;
      const other = userById(s, otherOf(c, meId));
      return { convoId: c.id, other: other!, last, unread };
    })
    .filter((x) => !!x.other)
    .sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));

export const notificationsFor = (s: AppState, meId: ID): AppNotification[] =>
  s.notifications
    .filter((n) => n.userId === meId)
    .sort((a, b) => b.at - a.at);

export const unreadNotificationCount = (s: AppState, meId: ID) =>
  s.notifications.filter((n) => n.userId === meId && !n.read).length;

export const unreadMessageCount = (s: AppState, meId: ID) =>
  inboxFor(s, meId).reduce((sum, c) => sum + c.unread, 0);

export const walletBalance = (s: AppState, userId: ID): number =>
  s.wallet.filter((w) => w.userId === userId && w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

export const walletPending = (s: AppState, userId: ID): number =>
  s.wallet.filter((w) => w.userId === userId && w.status !== 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

export interface CreatorStats {
  posts: number;
  shorts: number;
  videos: number;
  followers: number;
  following: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  estCpm: number;
  estEarned: number;
}

/** Aggregated creator numbers. Estimated earnings are indicative only. */
export const statsFor = (s: AppState, userId: ID): CreatorStats => {
  const posts = s.posts.filter((p) => p.authorId === userId && !p.removed);
  const shorts = s.shorts.filter((x) => x.authorId === userId && !x.removed);
  const videos = s.videos.filter((x) => x.authorId === userId && !x.removed);
  const mine = [...posts, ...shorts, ...videos];
  const likes = mine.reduce((n, m) => n + m.likes.length, 0);
  const views = mine.reduce((n, m) => n + m.views, 0);
  const shares = mine.reduce((n, m) => n + m.shares, 0);
  const saves = mine.reduce((n, m) => n + m.saves.length, 0);
  const comments = s.comments.filter(
    (c) => mine.some((m) => m.id === c.postId) && !c.removed
  ).length;
  const earned = s.wallet
    .filter((w) => w.userId === userId && w.status === 'completed')
    .reduce((n, w) => n + w.amount, 0);
  return {
    posts: posts.length,
    shorts: shorts.length,
    videos: videos.length,
    followers: followersOf(s, userId).length,
    following: followingOf(s, userId).length,
    views,
    likes,
    comments,
    shares,
    saves,
    estCpm: 2.4,
    estEarned: earned,
  };
};

export const contentStats = (s: AppState, userId: ID) => {
  const items = [
    ...s.posts.filter((p) => p.authorId === userId && !p.removed).map((p) => ({
      id: p.id, kind: 'post' as const, label: p.caption.slice(0, 42) || 'Photo post',
      thumb: p.thumb ?? p.uri, at: p.at, views: p.views, likes: p.likes.length,
      shares: p.shares, saves: p.saves.length,
      comments: s.comments.filter((c) => c.postId === p.id && !c.removed).length,
    })),
    ...s.shorts.filter((p) => p.authorId === userId && !p.removed).map((p) => ({
      id: p.id, kind: 'short' as const, label: p.caption.slice(0, 42) || 'Short video',
      thumb: p.poster, at: p.at, views: p.views, likes: p.likes.length,
      shares: p.shares, saves: p.saves.length,
      comments: s.comments.filter((c) => c.postId === p.id && !c.removed).length,
    })),
    ...s.videos.filter((p) => p.authorId === userId && !p.removed).map((p) => ({
      id: p.id, kind: 'video' as const, label: p.title, thumb: p.thumb,
      at: p.at, views: p.views, likes: p.likes.length, shares: p.shares,
      saves: p.saves.length,
      comments: s.comments.filter((c) => c.postId === p.id && !c.removed).length,
    })),
  ];
  return items.sort((a, b) => b.views - a.views);
};

export const openReports = (s: AppState) =>
  s.reports.filter((r) => r.status === 'open' || r.status === 'reviewing').length;

export const moderatorSummary = (s: AppState) => ({
  users: s.users.length,
  activeUsers: s.users.filter((u) => !u.suspended).length,
  suspended: s.users.filter((u) => u.suspended).length,
  posts: s.posts.length + s.shorts.length + s.videos.length,
  reports: s.reports.length,
  open: s.reports.filter((r) => r.status === 'open').length,
  resolved: s.reports.filter((r) => r.status === 'resolved' || r.status === 'dismissed').length,
});

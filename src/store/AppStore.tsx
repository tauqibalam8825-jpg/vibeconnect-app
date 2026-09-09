import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { initialState } from './seed';
import { buildDemoState } from '../data/demoState';
import {
  clearSessionToken,
  loadSessionToken,
  loadState,
  saveSessionToken,
  saveState,
  wipeAll,
} from './storage';
import { hashPassword, uid } from '../lib/format';
import type { FieldError, Result } from '../lib/validate';
import type {
  AppNotification,
  AppState,
  ContentKind,
  ID,
  MediaKind,
  Settings,
  User,
} from '../types';
import {
  conversationFor,
  convoMessages,
  isBlockedBy,
  me as selectMe,
  otherOf,
} from './selectors';

const DAY = 24 * 60 * 60 * 1000;

const CANNED_REPLIES = [
  'Ha! Sending you the details now.',
  'That works for me.',
  'Give me ten minutes and I am in.',
  'Just saw it - looks amazing.',
  'Let me check and get back to you.',
  'Yes! Do it.',
];

export interface SignUpInput {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export interface StoreCtx {
  state: AppState;
  me: User | undefined;
  hydrated: boolean;
  authError: string | null;
  signUp: (input: SignUpInput) => Promise<Result<ID>>;
  signIn: (identifier: string, password: string) => Promise<Result<ID>>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<Result<string>>;
  resetPassword: (email: string, code: string, password: string) => Promise<Result<ID>>;
  updateProfile: (patch: Partial<Pick<User, 'displayName' | 'bio' | 'avatar' | 'private' | 'location' | 'creator'>>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  toggleFollow: (userId: ID) => void;
  toggleLike: (kind: 'post' | 'short' | 'video', id: ID) => void;
  toggleSave: (kind: 'post' | 'short' | 'video', id: ID) => void;
  shareItem: (kind: ContentKind, id: ID, message: string) => Promise<void>;
  addComment: (kind: 'post' | 'short' | 'video', id: ID, text: string) => void;
  deleteComment: (id: ID) => void;
  createPost: (input: { kind: MediaKind; uri: string; caption: string; location?: string }) => void;
  createShort: (input: { uri: string; poster: string; caption: string; hashtags: string[] }) => void;
  createStory: (input: { kind: MediaKind; uri: string }) => void;
  createVideo: (input: {
    title: string; description: string; uri: string; thumb: string;
    durationSec: number; category: string;
  }) => void;
  deleteContent: (kind: 'post' | 'short' | 'video' | 'story', id: ID) => void;
  recordView: (kind: 'post' | 'short' | 'video', id: ID) => void;
  markStoryViewed: (storyId: ID) => void;
  replyToStory: (storyId: ID, text: string) => void;
  ensureConvo: (otherId: ID) => ID;
  sendMessage: (convoId: ID, payload: {
    kind: 'text' | 'image' | 'video' | 'voice';
    text?: string; uri?: string; durationSec?: number;
  }) => void;
  deleteMessage: (id: ID) => void;
  markConvoRead: (convoId: ID) => void;
  markNotificationsRead: () => void;
  submitReport: (input: {
    targetType: ContentKind; targetId: ID; targetLabel: string;
    reason: string; details: string;
  }) => ID;
  blockUser: (userId: ID) => void;
  unblockUser: (userId: ID) => void;
  muteUser: (userId: ID) => void;
  unmuteUser: (userId: ID) => void;
  requestWithdrawal: (amount: number, method: string) => Result<ID>;
  sendGift: (creatorId: ID, amount: number, note: string) => Result<ID>;
  subscribeCreator: (creatorId: ID, tier: 'supporter' | 'insider') => Result<number>;
  adminSetSuspended: (userId: ID, suspended: boolean) => void;
  adminSetReport: (reportId: ID, status: 'open' | 'reviewing' | 'resolved' | 'dismissed') => void;
  adminRemoveContent: (kind: 'post' | 'short' | 'video', id: ID, removed: boolean) => void;
  resetDemoData: () => Promise<void>;
  seedDemoData: () => void;
}

const StoreContext = createContext<StoreCtx | null>(null);

export const useStore = (): StoreCtx => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <AppProvider>');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const viewLog = useRef<Set<string>>(new Set());
  const replyTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ---- boot: restore session + cached state --------------------------------
  useEffect(() => {
    let alive = true;
    (async () => {
      const cached = await loadState();
      const token = await loadSessionToken();
      if (!alive) return;
      if (cached) {
        const sessionOk = token && cached.users.some((u) => u.id === token && !u.suspended);
        setState({ ...cached, sessionId: sessionOk ? token : null, hydrated: true });
      } else {
        setState({ ...buildDemoState(), hydrated: true });
      }
      setHydrated(true);
    })();
    return () => {
      alive = false;
      replyTimers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const patch = useCallback((fn: (prev: AppState) => AppState) => {
    setState((prev) => fn(prev));
  }, []);

  const me = selectMe(state);

  const notify = (
    prev: AppState,
    n: Omit<AppNotification, 'id' | 'at' | 'read'>
  ): AppNotification[] => [{ ...n, id: uid('ntf'), at: Date.now(), read: false }, ...prev.notifications];

  // ---- auth ---------------------------------------------------------------
  const signUp = useCallback(async (input: SignUpInput): Promise<Result<ID>> => {
    setAuthError(null);
    const username = input.username.trim().toLowerCase();
    const email = input.email.trim().toLowerCase();
    if (state.users.some((u) => u.username === username)) {
      const err: FieldError = { field: 'username', message: 'That username is already taken.' };
      setAuthError(err.message);
      return { ok: false, error: err };
    }
    if (state.users.some((u) => u.email === email)) {
      const err: FieldError = { field: 'email', message: 'An account with that email exists.' };
      setAuthError(err.message);
      return { ok: false, error: err };
    }
    const id = uid('usr');
    const newUser: User = {
      id,
      username,
      email,
      passwordHash: hashPassword(input.password),
      displayName: input.displayName.trim(),
      bio: '',
      avatar: `https://api.dicebear.com/9.x/shapes/png?seed=${encodeURIComponent(username)}`,
      banner: `https://picsum.photos/seed/${encodeURIComponent(username)}-banner/1200/500`,
      private: false,
      role: 'user',
      suspended: false,
      verified: false,
      creator: false,
      online: true,
      lastSeen: Date.now(),
      joinedAt: Date.now(),
      blocked: [],
      muted: [],
    };
    patch((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      sessionId: id,
      notifications: notify(prev, {
        userId: id,
        type: 'system',
        text: 'Welcome to VibeConnect! Your account is ready.',
      }),
    }));
    await saveSessionToken(id);
    return { ok: true, value: id };
  }, [patch, state.users]);

  const signIn = useCallback(async (identifier: string, password: string): Promise<Result<ID>> => {
    setAuthError(null);
    const id = identifier.trim().toLowerCase();
    const user = state.users.find((u) => u.email === id || u.username === id);
    if (!user || user.passwordHash !== hashPassword(password)) {
      const err: FieldError = { field: 'form', message: 'Wrong email/username or password.' };
      setAuthError(err.message);
      return { ok: false, error: err };
    }
    if (user.suspended) {
      const err: FieldError = { field: 'form', message: 'This account is suspended. Contact support.' };
      setAuthError(err.message);
      return { ok: false, error: err };
    }
    patch((prev) => ({
      ...prev,
      sessionId: user.id,
      users: prev.users.map((u) => (u.id === user.id ? { ...u, online: true, lastSeen: Date.now() } : u)),
    }));
    await saveSessionToken(user.id);
    return { ok: true, value: user.id };
  }, [patch, state.users]);

  const signOut = useCallback(async () => {
    const id = state.sessionId;
    patch((prev) => ({
      ...prev,
      sessionId: null,
      users: prev.users.map((u) => (u.id === id ? { ...u, online: false, lastSeen: Date.now() } : u)),
    }));
    await clearSessionToken();
  }, [patch, state.sessionId]);

  const requestPasswordReset = useCallback(
    async (email: string): Promise<Result<string>> => {
      const target = state.users.find((u) => u.email === email.trim().toLowerCase());
      if (!target) {
        return { ok: false, error: { field: 'email', message: 'No account with that email.' } };
      }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      patch((prev) => ({
        ...prev,
        resetCodes: [{ email: target.email, code, at: Date.now() }, ...prev.resetCodes].slice(0, 5),
      }));
      return { ok: true, value: code };
    },
    [patch, state.users]
  );

  const resetPassword = useCallback(
    async (email: string, code: string, password: string): Promise<Result<ID>> => {
      const clean = email.trim().toLowerCase();
      const entry = state.resetCodes.find((r) => r.email === clean && r.code === code.trim());
      if (!entry || Date.now() - entry.at > 30 * 60 * 1000) {
        return { ok: false, error: { field: 'code', message: 'Invalid or expired code.' } };
      }
      const target = state.users.find((u) => u.email === clean);
      if (!target) return { ok: false, error: { field: 'email', message: 'Account not found.' } };
      patch((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === target.id ? { ...u, passwordHash: hashPassword(password) } : u
        ),
        resetCodes: prev.resetCodes.filter((r) => r !== entry),
      }));
      return { ok: true, value: target.id };
    },
    [patch, state.resetCodes]
  );

  // ---- profile ------------------------------------------------------------
  const updateProfile: StoreCtx['updateProfile'] = useCallback(
    (p) => {
      const id = state.sessionId;
      if (!id) return;
      patch((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === id ? { ...u, ...p } : u)),
      }));
    },
    [patch, state.sessionId]
  );

  const updateSettings: StoreCtx['updateSettings'] = useCallback(
    (p) => patch((prev) => ({ ...prev, settings: { ...prev.settings, ...p } })),
    [patch]
  );

  const toggleFollow = useCallback(
    (userId: ID) => {
      const meId = state.sessionId;
      if (!meId || meId === userId) return;
      patch((prev) => {
        const existing = prev.follows.find((f) => f.followerId === meId && f.followeeId === userId);
        if (existing) {
          return { ...prev, follows: prev.follows.filter((f) => f !== existing) };
        }
        return {
          ...prev,
          follows: [...prev.follows, { id: uid('flw'), followerId: meId, followeeId: userId, at: Date.now() }],
          notifications: notify(prev, {
            userId,
            actorId: meId,
            type: 'follow',
            text: 'started following you.',
            targetKind: 'profile',
            targetId: meId,
          }),
        };
      });
    },
    [patch, state.sessionId]
  );

  // ---- engagement ---------------------------------------------------------
  const toggleLike = useCallback(
    (kind: 'post' | 'short' | 'video', id: ID) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => {
        const flip = (arr: ID[]) => (arr.includes(meId) ? arr.filter((x) => x !== meId) : [...arr, meId]);
        const key = kind === 'post' ? 'posts' : kind === 'short' ? 'shorts' : 'videos';
        const list = prev[key] as Array<{ id: ID; authorId: ID; likes: ID[]; caption?: string; title?: string }>;
        const target = list.find((x) => x.id === id);
        const nowLiked = target ? !target.likes.includes(meId) : false;
        return {
          ...prev,
          [key]: list.map((x) => (x.id === id ? { ...x, likes: flip(x.likes) } : x)),
          notifications:
            nowLiked && target && target.authorId !== meId
              ? notify(prev, {
                  userId: target.authorId,
                  actorId: meId,
                  type: 'like',
                  text: kind === 'video' ? 'liked your video.' : kind === 'short' ? 'liked your short.' : 'liked your post.',
                  targetKind: kind,
                  targetId: id,
                })
              : prev.notifications,
        } as AppState;
      });
    },
    [patch, state.sessionId]
  );

  const toggleSave = useCallback(
    (kind: 'post' | 'short' | 'video', id: ID) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => {
        const flip = (arr: ID[]) => (arr.includes(meId) ? arr.filter((x) => x !== meId) : [...arr, meId]);
        const key = kind === 'post' ? 'posts' : kind === 'short' ? 'shorts' : 'videos';
        const list = prev[key] as Array<{ id: ID; saves: ID[] }>;
        return { ...prev, [key]: list.map((x) => (x.id === id ? { ...x, saves: flip(x.saves) } : x)) } as AppState;
      });
    },
    [patch, state.sessionId]
  );

  const shareItem = useCallback(
    async (kind: ContentKind, id: ID, message: string) => {
      patch((prev) => {
        const key = kind === 'post' ? 'posts' : kind === 'short' ? 'shorts' : 'videos';
        if (key === 'posts' || key === 'shorts' || key === 'videos') {
          return { ...prev, [key]: (prev[key] as Array<{ id: ID; shares: number }>).map((x) => (x.id === id ? { ...x, shares: x.shares + 1 } : x)) };
        }
        return prev;
      });
      const link = `https://vibeconnect.app/${kind}/${id}`;
      try {
        const { Share } = await import('react-native');
        await Share.share({ message: `${message}\n${link}`, url: link, title: 'VibeConnect' });
      } catch {
        /* user dismissed the share sheet */
      }
    },
    [patch]
  );

  const addComment = useCallback(
    (kind: 'post' | 'short' | 'video', id: ID, text: string) => {
      const meId = state.sessionId;
      if (!meId || !text.trim()) return;
      patch((prev) => {
        const list = (kind === 'post' ? prev.posts : kind === 'short' ? prev.shorts : prev.videos) as Array<{
          id: ID; authorId: ID; caption?: string; title?: string;
        }>;
        const target = list.find((x) => x.id === id);
        return {
          ...prev,
          comments: [
            ...prev.comments,
            { id: uid('cmt'), postId: id, postKind: kind, authorId: meId, text: text.trim(), at: Date.now(), likes: [] },
          ],
          notifications:
            target && target.authorId !== meId
              ? notify(prev, {
                  userId: target.authorId,
                  actorId: meId,
                  type: 'comment',
                  text: `commented: "${text.trim().slice(0, 48)}${text.trim().length > 48 ? '…' : ''}"`,
                  targetKind: kind,
                  targetId: id,
                })
              : prev.notifications,
        };
      });
    },
    [patch, state.sessionId]
  );

  const deleteComment = useCallback(
    (id: ID) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => {
        const c = prev.comments.find((x) => x.id === id);
        if (!c) return prev;
        const isMine = c.authorId === meId;
        const ownsTarget =
          (prev.posts.find((p) => p.id === c.postId)?.authorId ?? '') === meId ||
          (prev.shorts.find((p) => p.id === c.postId)?.authorId ?? '') === meId ||
          (prev.videos.find((p) => p.id === c.postId)?.authorId ?? '') === meId;
        if (!isMine && !ownsTarget) return prev; // authorization: only author/owner may delete
        return { ...prev, comments: prev.comments.filter((x) => x.id !== id) };
      });
    },
    [patch, state.sessionId]
  );

  const recordView = useCallback(
    (kind: 'post' | 'short' | 'video', id: ID) => {
      const key = `v:${kind}:${id}`;
      if (viewLog.current.has(key)) return; // one counted view per session
      viewLog.current.add(key);
      patch((prev) => {
        const listKey = kind === 'post' ? 'posts' : kind === 'short' ? 'shorts' : 'videos';
        return {
          ...prev,
          [listKey]: (prev[listKey] as Array<{ id: ID; views: number }>).map((x) =>
            x.id === id ? { ...x, views: x.views + 1 } : x
          ),
        } as AppState;
      });
    },
    [patch]
  );

  // ---- content creation ---------------------------------------------------
  const createPost: StoreCtx['createPost'] = useCallback(
    (input) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => ({
        ...prev,
        posts: [
          {
            id: uid('post'),
            authorId: meId,
            kind: input.kind,
            uri: input.uri,
            thumb: input.kind === 'photo' ? input.uri : undefined,
            caption: input.caption,
            location: input.location,
            at: Date.now(),
            likes: [],
            saves: [],
            shares: 0,
            views: 0,
          },
          ...prev.posts,
        ],
      }));
    },
    [patch, state.sessionId]
  );

  const createShort: StoreCtx['createShort'] = useCallback(
    (input) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => ({
        ...prev,
        shorts: [
          {
            id: uid('short'),
            authorId: meId,
            uri: input.uri,
            poster: input.poster || input.uri,
            caption: input.caption,
            hashtags: input.hashtags,
            at: Date.now(),
            likes: [],
            saves: [],
            shares: 0,
            views: 0,
          },
          ...prev.shorts,
        ],
      }));
    },
    [patch, state.sessionId]
  );

  const createStory: StoreCtx['createStory'] = useCallback(
    (input) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => ({
        ...prev,
        stories: [
          ...prev.stories,
          { id: uid('story'), authorId: meId, kind: input.kind, uri: input.uri, at: Date.now(), viewers: [] },
        ],
      }));
    },
    [patch, state.sessionId]
  );

  const createVideo: StoreCtx['createVideo'] = useCallback(
    (input) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => ({
        ...prev,
        videos: [
          {
            id: uid('video'),
            authorId: meId,
            title: input.title,
            description: input.description,
            uri: input.uri,
            thumb: input.thumb,
            durationSec: input.durationSec,
            category: input.category,
            at: Date.now(),
            likes: [],
            saves: [],
            shares: 0,
            views: 0,
          },
          ...prev.videos,
        ],
        notifications: notify(prev, {
          userId: meId,
          type: 'system',
          text: 'Your long video finished processing and is live on Watch.',
        }),
      }));
    },
    [patch, state.sessionId]
  );

  const deleteContent: StoreCtx['deleteContent'] = useCallback(
    (kind, id) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => {
        const owned =
          (prev.posts.find((p) => p.id === id)?.authorId === meId) ||
          (prev.shorts.find((p) => p.id === id)?.authorId === meId) ||
          (prev.videos.find((p) => p.id === id)?.authorId === meId) ||
          (prev.stories.find((p) => p.id === id)?.authorId === meId);
        if (!owned) return prev; // users can only delete their own content
        if (kind === 'story') return { ...prev, stories: prev.stories.filter((s) => s.id !== id) };
        const key = kind === 'post' ? 'posts' : kind === 'short' ? 'shorts' : 'videos';
        return { ...prev, [key]: (prev[key] as Array<{ id: ID }>).filter((x) => x.id !== id) } as AppState;
      });
    },
    [patch, state.sessionId]
  );

  // ---- stories ------------------------------------------------------------
  const markStoryViewed = useCallback(
    (storyId: ID) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => ({
        ...prev,
        stories: prev.stories.map((s) =>
          s.id === storyId && !s.viewers.includes(meId) ? { ...s, viewers: [...s.viewers, meId] } : s
        ),
      }));
    },
    [patch, state.sessionId]
  );

  const replyToStory = useCallback(
    (storyId: ID, text: string) => {
      const meId = state.sessionId;
      if (!meId || !text.trim()) return;
      patch((prev) => {
        const story = prev.stories.find((s) => s.id === storyId);
        if (!story) return prev;
        return {
          ...prev,
          storyReplies: [
            ...prev.storyReplies,
            { id: uid('sr'), storyId, fromId: meId, toId: story.authorId, text: text.trim(), at: Date.now(), read: false },
          ],
          notifications: notify(prev, {
            userId: story.authorId,
            actorId: meId,
            type: 'story_reply',
            text: `replied to your story: "${text.trim().slice(0, 40)}"`,
            targetKind: 'story',
            targetId: storyId,
          }),
        };
      });
    },
    [patch, state.sessionId]
  );

  // ---- messaging ----------------------------------------------------------
  const ensureConvo = useCallback(
    (otherId: ID): ID => {
      const meId = state.sessionId!;
      const existing = conversationFor(state, meId, otherId);
      if (existing) return existing.id;
      const id = uid('convo');
      patch((prev) => ({
        ...prev,
        convos: [...prev.convos, { id, members: [meId, otherId], at: Date.now(), blockedBy: null }],
      }));
      return id;
    },
    [patch, state]
  );

  const sendMessage: StoreCtx['sendMessage'] = useCallback(
    (convoId, payload) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: uid('msg'),
            convoId,
            senderId: meId,
            kind: payload.kind,
            text: payload.text,
            uri: payload.uri,
            durationSec: payload.durationSec,
            at: Date.now(),
            read: false,
          },
        ],
        convos: prev.convos.map((c) => (c.id === convoId ? { ...c, at: Date.now() } : c)),
      }));

      // Simulated realtime: the other side "reads" then replies. Replace this
      // block with the socket layer (socket.io / Supabase realtime / Firebase).
      const convo = state.convos.find((c) => c.id === convoId);
      const otherId = convo ? otherOf(convo, meId) : null;
      const other = otherId ? state.users.find((u) => u.id === otherId) : null;
      if (!other || other.suspended || isBlockedBy(state, meId, other.id)) return;

      const t1 = setTimeout(() => {
        patch((prev) => ({
          ...prev,
          messages: prev.messages.map((m) => (m.convoId === convoId && m.senderId === meId ? { ...m, read: true } : m)),
        }));
      }, 900);
      const t2 = setTimeout(() => {
        patch((prev) => {
          const reply = CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];
          return {
            ...prev,
            messages: [
              ...prev.messages,
              { id: uid('msg'), convoId, senderId: other.id, kind: 'text', text: reply, at: Date.now(), read: true },
            ],
            notifications: notify(prev, {
              userId: meId,
              actorId: other.id,
              type: 'message',
              text: 'sent you a message.',
              targetKind: 'chat',
              targetId: convoId,
            }),
          };
        });
      }, 2600);
      replyTimers.current.push(t1, t2);
    },
    [patch, state]
  );

  const deleteMessage = useCallback(
    (id: ID) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => (m.id === id && m.senderId === meId ? { ...m, deleted: true, text: undefined, uri: undefined } : m)),
      }));
    },
    [patch, state.sessionId]
  );

  const markConvoRead = useCallback(
    (convoId: ID) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => (m.convoId === convoId && m.senderId !== meId ? { ...m, read: true } : m)),
      }));
    },
    [patch, state.sessionId]
  );

  const markNotificationsRead = useCallback(() => {
    const meId = state.sessionId;
    if (!meId) return;
    patch((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.userId === meId ? { ...n, read: true } : n)),
    }));
  }, [patch, state.sessionId]);

  // ---- safety -------------------------------------------------------------
  const submitReport: StoreCtx['submitReport'] = useCallback(
    (input) => {
      const meId = state.sessionId!;
      const id = uid('rpt');
      patch((prev) => ({
        ...prev,
        reports: [
          {
            id,
            reporterId: meId,
            targetType: input.targetType,
            targetId: input.targetId,
            targetLabel: input.targetLabel,
            reason: input.reason,
            details: input.details,
            at: Date.now(),
            status: 'open',
          },
          ...prev.reports,
        ],
      }));
      return id;
    },
    [patch, state.sessionId]
  );

  const setUserList = (prev: AppState, userId: ID, field: 'blocked' | 'muted', add: boolean, target: ID): AppState => ({
    ...prev,
    users: prev.users.map((u) => {
      if (u.id !== userId) return u;
      const list = u[field] ?? [];
      const next = add ? Array.from(new Set([...list, target])) : list.filter((x) => x !== target);
      return { ...u, [field]: next };
    }),
  });

  const blockUser = useCallback(
    (userId: ID) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => {
        let next = setUserList(prev, meId, 'blocked', true, userId);
        next = {
          ...next,
          follows: next.follows.filter(
            (f) => !((f.followerId === meId && f.followeeId === userId) || (f.followerId === userId && f.followeeId === meId))
          ),
        };
        return next;
      });
    },
    [patch, state.sessionId]
  );

  const unblockUser = useCallback(
    (userId: ID) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => setUserList(prev, meId, 'blocked', false, userId));
    },
    [patch, state.sessionId]
  );

  const muteUser = useCallback(
    (userId: ID) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => setUserList(prev, meId, 'muted', true, userId));
    },
    [patch, state.sessionId]
  );

  const unmuteUser = useCallback(
    (userId: ID) => {
      const meId = state.sessionId;
      if (!meId) return;
      patch((prev) => setUserList(prev, meId, 'muted', false, userId));
    },
    [patch, state.sessionId]
  );

  // ---- monetization (eligibility + provider gated) ------------------------
  const isEligible = (users: User[], userId: ID): boolean => {
    const u = users.find((x) => x.id === userId);
    const followers = state.follows.filter((f) => f.followeeId === userId).length;
    return !!u && !u.suspended && u.creator && followers >= 0;
  };

  const requestWithdrawal: StoreCtx['requestWithdrawal'] = useCallback(
    (amount, method) => {
      const meId = state.sessionId;
      if (!meId) return { ok: false, error: { field: 'amount', message: 'Sign in required.' } };
      const balance = state.wallet
        .filter((w) => w.userId === meId && w.status === 'completed')
        .reduce((n, w) => n + w.amount, 0);
      if (!isEligible(state.users, meId))
        return { ok: false, error: { field: 'form', message: 'Not eligible for payouts yet.' } };
      if (amount < 50)
        return { ok: false, error: { field: 'amount', message: 'Minimum withdrawal is $50.00.' } };
      if (amount > balance)
        return { ok: false, error: { field: 'amount', message: 'Amount exceeds available balance.' } };
      const id = uid('wd');
      patch((prev) => ({
        ...prev,
        withdrawals: [
          { id, userId: meId, amount, method, status: 'pending', at: Date.now(), note: 'Queued for the payment provider.' },
          ...prev.withdrawals,
        ],
        wallet: [
          {
            id: uid('tx'),
            userId: meId,
            kind: 'withdrawal',
            title: `Withdrawal request - ${method}`,
            note: 'Held until the payment provider confirms.',
            amount: -amount,
            at: Date.now(),
            status: 'pending',
            ref: id.toUpperCase(),
          },
          ...prev.wallet,
        ],
        notifications: notify(prev, {
          userId: meId,
          type: 'wallet',
          text: `Withdrawal of $${amount.toFixed(2)} requested. Status: pending review.`,
        }),
      }));
      return { ok: true, value: id };
    },
    [patch, state]
  );

  const sendGift: StoreCtx['sendGift'] = useCallback(
    (creatorId, amount, note) => {
      const meId = state.sessionId;
      if (!meId) return { ok: false, error: { field: 'amount', message: 'Sign in required.' } };
      if (meId === creatorId)
        return { ok: false, error: { field: 'amount', message: 'You cannot gift yourself.' } };
      if (amount < 1 || amount > 100)
        return { ok: false, error: { field: 'amount', message: 'Gifts must be between $1 and $100.' } };
      const meUser = state.users.find((u) => u.id === meId)!;
      patch((prev) => ({
        ...prev,
        wallet: [
          {
            id: uid('tx'), userId: creatorId, kind: 'gift',
            title: `Gift from @${meUser.username}`, note: note || 'Supporter gift',
            amount, at: Date.now(), status: 'completed', ref: uid('gft').toUpperCase(),
          },
          {
            id: uid('tx'), userId: meId, kind: 'gift',
            title: `Gift to @${meUser.username === '' ? '' : prev.users.find((u) => u.id === creatorId)?.username ?? ''}`,
            note: 'Gift sent', amount: -amount, at: Date.now(), status: 'completed',
          },
          ...prev.wallet,
        ],
        notifications: notify(prev, {
          userId: creatorId, actorId: meId, type: 'gift',
          text: `sent you a $${amount.toFixed(2)} gift.`,
        }),
      }));
      return { ok: true, value: 'gifted' };
    },
    [patch, state]
  );

  const subscribeCreator: StoreCtx['subscribeCreator'] = useCallback(
    (creatorId, tier) => {
      const meId = state.sessionId;
      if (!meId) return { ok: false, error: { field: 'tier', message: 'Sign in required.' } };
      if (state.subscriptions.some((s) => s.subscriberId === meId && s.creatorId === creatorId && s.active))
        return { ok: false, error: { field: 'tier', message: 'You are already subscribed.' } };
      const price = tier === 'insider' ? 4.99 : 1.99;
      const creator = state.users.find((u) => u.id === creatorId);
      patch((prev) => ({
        ...prev,
        subscriptions: [
          ...prev.subscriptions,
          { id: uid('sub'), subscriberId: meId, creatorId, tier, price, at: Date.now(), active: true },
        ],
        wallet: [
          {
            id: uid('tx'), userId: creatorId, kind: 'subscription',
            title: `Channel subscription - @${creator?.username ?? 'creator'}`,
            note: `${tier === 'insider' ? 'Insider' : 'Supporter'} tier share`,
            amount: price * 0.8, at: Date.now(), status: 'completed', ref: uid('sub').toUpperCase(),
          },
          ...prev.wallet,
        ],
        notifications: notify(prev, {
          userId: creatorId, actorId: meId, type: 'follow',
          text: `joined your ${tier === 'insider' ? 'Insider' : 'Supporter'} channel.`,
          targetKind: 'profile', targetId: meId,
        }),
      }));
      return { ok: true, value: price };
    },
    [patch, state]
  );

  // ---- admin --------------------------------------------------------------
  const adminSetSuspended = useCallback(
    (userId: ID, suspended: boolean) => {
      const adminId = state.sessionId;
      const admin = state.users.find((u) => u.id === adminId);
      if (!admin || admin.role !== 'admin') return; // authorization guard
      patch((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === userId && u.role !== 'admin' ? { ...u, suspended } : u)),
      }));
    },
    [patch, state.sessionId, state.users]
  );

  const adminSetReport = useCallback(
    (reportId: ID, status: 'open' | 'reviewing' | 'resolved' | 'dismissed') => {
      const admin = state.users.find((u) => u.id === state.sessionId);
      if (!admin || admin.role !== 'admin') return;
      patch((prev) => ({ ...prev, reports: prev.reports.map((r) => (r.id === reportId ? { ...r, status } : r)) }));
    },
    [patch, state.sessionId, state.users]
  );

  const adminRemoveContent = useCallback(
    (kind: 'post' | 'short' | 'video', id: ID, removed: boolean) => {
      const admin = state.users.find((u) => u.id === state.sessionId);
      if (!admin || admin.role !== 'admin') return;
      patch((prev) => {
        const key = kind === 'post' ? 'posts' : kind === 'short' ? 'shorts' : 'videos';
        return { ...prev, [key]: (prev[key] as Array<{ id: ID; removed?: boolean }>).map((x) => (x.id === id ? { ...x, removed } : x)) } as AppState;
      });
    },
    [patch, state.sessionId, state.users]
  );

  const resetDemoData = useCallback(async () => {
    await wipeAll();
    viewLog.current.clear();
    setState({ ...buildDemoState(), hydrated: true });
  }, []);

  const seedDemoData = useCallback(() => {
    patch((prev) => {
      const known = new Set(prev.users.map((u) => u.id));
      const seed = buildDemoState();
      return {
        ...prev,
        users: [...prev.users, ...seed.users.filter((u) => !known.has(u.id))],
        posts: [...seed.posts, ...prev.posts],
        shorts: [...seed.shorts, ...prev.shorts],
        videos: [...seed.videos, ...prev.videos],
        stories: [...seed.stories, ...prev.stories],
        comments: [...seed.comments, ...prev.comments],
      };
    });
  }, [patch]);

  const value = useMemo<StoreCtx>(
    () => ({
      state,
      me,
      hydrated,
      authError,
      signUp, signIn, signOut, requestPasswordReset, resetPassword,
      updateProfile, updateSettings, toggleFollow, toggleLike, toggleSave, shareItem,
      addComment, deleteComment,
      createPost, createShort, createStory, createVideo, deleteContent, recordView,
      markStoryViewed, replyToStory,
      ensureConvo, sendMessage, deleteMessage, markConvoRead, markNotificationsRead,
      submitReport, blockUser, unblockUser, muteUser, unmuteUser,
      requestWithdrawal, sendGift, subscribeCreator,
      adminSetSuspended, adminSetReport, adminRemoveContent,
      resetDemoData, seedDemoData,
    }),
    [
      state, me, hydrated, authError,
      signUp, signIn, signOut, requestPasswordReset, resetPassword,
      updateProfile, updateSettings, toggleFollow, toggleLike, toggleSave, shareItem,
      addComment, deleteComment, createPost, createShort, createStory, createVideo,
      deleteContent, recordView, markStoryViewed, replyToStory, ensureConvo, sendMessage,
      deleteMessage, markConvoRead, markNotificationsRead, submitReport, blockUser,
      unblockUser, muteUser, unmuteUser, requestWithdrawal, sendGift, subscribeCreator,
      adminSetSuspended, adminSetReport, adminRemoveContent, resetDemoData, seedDemoData,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export { DAY };
export type { Result };

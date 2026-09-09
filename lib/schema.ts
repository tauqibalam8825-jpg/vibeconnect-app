/**
 * VibeConnect database schema.
 *
 * The client keeps this exact shape in device storage today. When a server is
 * attached, each entry below maps 1:1 to a collection/table with the listed
 * indexes. Nothing else in the app has to change.
 */
export interface CollectionSpec {
  name: string;
  fields: string[];
  indexes: string[];
  notes: string;
}

export const COLLECTIONS: CollectionSpec[] = [
  {
    name: 'users',
    fields: ['id', 'username', 'displayName', 'email', 'passwordHash', 'passwordSalt', 'bio', 'avatar', 'category', 'followers[]', 'following[]', 'blocked[]', 'role', 'settings{}', 'monetization{}', 'joinedAt'],
    indexes: ['username (unique)', 'email (unique)', 'followers.userId', 'following.userId'],
    notes: 'Credentials never leave the hashed form. Private fields are excluded from every public projection.',
  },
  {
    name: 'posts',
    fields: ['id', 'authorId', 'type', 'title', 'caption', 'description', 'media[]', 'hashtags[]', 'location', 'visibility', 'commentsEnabled', 'likes[]', 'saves[]', 'shares', 'views', 'hidden', 'createdAt'],
    indexes: ['authorId + createdAt desc', 'visibility + createdAt desc', 'hashtags (multikey)', 'type + createdAt desc'],
    notes: 'Feed queries fan out from the viewer graph: following ∪ self ∪ suggested, minus blocked.',
  },
  {
    name: 'comments',
    fields: ['id', 'postId', 'authorId', 'text', 'likes[]', 'hidden', 'createdAt'],
    indexes: ['postId + createdAt asc'],
    notes: 'Post.commentsCount is denormalised for feed speed.',
  },
  {
    name: 'stories',
    fields: ['id', 'authorId', 'media', 'caption', 'createdAt', 'expiresAt', 'viewers[]'],
    indexes: ['expiresAt TTL (24h)', 'authorId + createdAt desc'],
    notes: 'Server TTL index deletes expired stories automatically.',
  },
  {
    name: 'conversations',
    fields: ['id', 'participants[]', 'updatedAt', 'mutedFor[]', 'pinnedFor[]'],
    indexes: ['participants (multikey) + updatedAt desc'],
    notes: 'Exactly two participants in phase 1; the field is already an array so group threads arrive without a migration.',
  },
  {
    name: 'messages',
    fields: ['id', 'conversationId', 'senderId', 'type', 'text', 'mediaUri', 'durationMs', 'status', 'reactions[]', 'deletedFor[]', 'createdAt'],
    indexes: ['conversationId + createdAt asc'],
    notes: 'Voice notes store a signed media URI plus a duration for the waveform UI.',
  },
  {
    name: 'notifications',
    fields: ['id', 'recipientId', 'actorId', 'type', 'entityType', 'entityId', 'read', 'createdAt'],
    indexes: ['recipientId + createdAt desc', 'recipientId + read'],
  },
  {
    name: 'reports',
    fields: ['id', 'targetType', 'targetId', 'reporterId', 'reason', 'note', 'status', 'resolution', 'resolvedBy'],
    indexes: ['status + createdAt asc', 'targetId'],
    notes: 'Powers the moderation queue in the admin panel.',
  },
  {
    name: 'transactions',
    fields: ['id', 'userId', 'kind', 'amount', 'currency', 'label', 'status', 'createdAt'],
    indexes: ['userId + createdAt desc'],
    notes: 'Append-only ledger. Balances are always derived, never stored, so the books stay balanced.',
  },
  {
    name: 'payoutMethods',
    fields: ['id', 'userId', 'kind', 'label', 'last4', 'isDefault'],
    indexes: ['userId'],
    notes: 'Only a display token + last 4 digits ever reach the client.',
  },
  {
    name: 'watchProgress',
    fields: ['id', 'userId', 'postId', 'seconds', 'updatedAt'],
    indexes: ['userId + updatedAt desc', 'userId + postId (unique)'],
  },
  {
    name: 'calls',
    fields: ['id', 'conversationId', 'callerId', 'kind', 'startedAt', 'endedAt', 'status'],
    indexes: ['conversationId + startedAt desc'],
  },
];

export const PHASES = [
  {
    phase: 1,
    name: 'Core MVP',
    status: 'shipped',
    items: ['Auth + sessions + password reset', 'Profiles, follows, privacy', 'Home feed (photo, video, text, short)', 'Composer with captions, hashtags, locations', '1:1 messaging with media + voice notes', 'Search, explore, notifications', 'Blocking, reporting, account deletion'],
  },
  {
    phase: 2,
    name: 'Stories & video',
    status: 'shipped',
    items: ['24h stories with viewer list', 'Vertical short-video feed', 'Long-form Watch tab with resume progress', 'Comment threads + reactions', 'Creator Studio analytics'],
  },
  {
    phase: 3,
    name: 'Calls, money & scale',
    status: 'in-progress',
    items: ['Voice/video calling (CallEngine ready, needs signaling server)', 'Monetization eligibility + admin approval', 'Wallet ledger + payouts (needs payment processor)', 'Admin panel: users, moderation, analytics', 'Recommendations & ranking service'],
  },
] as const;

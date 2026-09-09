import { hashPassword } from '../lib/format';
import { DAY, type AppState, type User } from '../types';

const NOW = Date.now();
const ago = (ms: number) => NOW - ms;
const min = 60 * 1000;
const hr = 60 * min;

export const AV = (n: number) => `https://i.pravatar.cc/400?img=${n}`;
export const PIC = (seed: string, w = 900, h = 900) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const VIDEO_SOURCES = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
];
const V1 = VIDEO_SOURCES[0];
const V2 = VIDEO_SOURCES[1];
const V3 = VIDEO_SOURCES[2];
const V4 = VIDEO_SOURCES[3];
const V5 = VIDEO_SOURCES[4];
const V6 = VIDEO_SOURCES[5];

export const DEMO_PASSWORD = 'vibeconnect2026';
export const DEMO_ADMIN_EMAIL = 'admin@vibeconnect.app';
export const DEMO_CREATOR_EMAIL = 'nova@vibeconnect.app';
const H = hashPassword(DEMO_PASSWORD);

const rawUsers: Array<Omit<User, 'blocked' | 'muted'> & { blocked?: string[]; muted?: string[] }> = [
  {
    id: 'u_admin', username: 'admin', email: DEMO_ADMIN_EMAIL, passwordHash: H,
    displayName: 'VibeConnect Team',
    bio: 'Official platform account. Safety, updates and community guidelines.',
    avatar: AV(68), banner: PIC('vc-banner-admin', 1200, 500),
    private: false, role: 'admin', suspended: false, verified: true, creator: true,
    online: true, lastSeen: ago(min), joinedAt: ago(400 * DAY), isDemo: true,
  },
  {
    id: 'u_nova', username: 'nova.frames', email: DEMO_CREATOR_EMAIL, passwordHash: H,
    displayName: 'Nova Rivera',
    bio: 'Night photographer & short-film maker. Shooting the city after dark.',
    avatar: AV(47), banner: PIC('vc-banner-nova', 1200, 500),
    private: false, role: 'user', suspended: false, verified: true, creator: true,
    online: true, lastSeen: ago(min), joinedAt: ago(320 * DAY), location: 'Lisbon, PT', isDemo: true,
  },
  {
    id: 'u_kai', username: 'kai.roams', email: 'kai@vibeconnect.app', passwordHash: H,
    displayName: 'Kai Mensah', bio: 'Van life, drone shots, terrible coffee on mountains.',
    avatar: AV(12), banner: PIC('vc-banner-kai', 1200, 500),
    private: false, role: 'user', suspended: false, verified: false, creator: true,
    online: false, lastSeen: ago(42 * min), joinedAt: ago(260 * DAY), location: 'Tbilisi, GE', isDemo: true,
  },
  {
    id: 'u_mira', username: 'mira.sounds', email: 'mira@vibeconnect.app', passwordHash: H,
    displayName: 'Mira Osei', bio: 'Field recordings + modular synth. New loop every Friday.',
    avatar: AV(26), banner: PIC('vc-banner-mira', 1200, 500),
    private: false, role: 'user', suspended: false, verified: true, creator: true,
    online: true, lastSeen: ago(3 * min), joinedAt: ago(210 * DAY), location: 'Accra, GH', isDemo: true,
  },
  {
    id: 'u_juno', username: 'juno.kitchen', email: 'juno@vibeconnect.app', passwordHash: H,
    displayName: 'Juno Park', bio: 'Cooking one pot at a time. Recipes in long-form videos.',
    avatar: AV(31), banner: PIC('vc-banner-juno', 1200, 500),
    private: false, role: 'user', suspended: false, verified: false, creator: true,
    online: false, lastSeen: ago(6 * hr), joinedAt: ago(180 * DAY), location: 'Seoul, KR', isDemo: true,
  },
  {
    id: 'u_remy', username: 'remy.codes', email: 'remy@vibeconnect.app', passwordHash: H,
    displayName: 'Remy Alvarez', bio: 'Indie dev. Building tiny apps in public.',
    avatar: AV(59), banner: PIC('vc-banner-remy', 1200, 500),
    private: false, role: 'user', suspended: false, verified: false, creator: false,
    online: true, lastSeen: ago(min), joinedAt: ago(140 * DAY), location: 'Bogota, CO', isDemo: true,
  },
  {
    id: 'u_lux', username: 'lux.moves', email: 'lux@vibeconnect.app', passwordHash: H,
    displayName: 'Lux Ferreira', bio: 'Dance loops, street casting, loud colours.',
    avatar: AV(20), banner: PIC('vc-banner-lux', 1200, 500),
    private: false, role: 'user', suspended: false, verified: true, creator: true,
    online: false, lastSeen: ago(2 * hr), joinedAt: ago(120 * DAY), location: 'Sao Paulo, BR', isDemo: true,
  },
  {
    id: 'u_ari', username: 'ari.clay', email: 'ari@vibeconnect.app', passwordHash: H,
    displayName: 'Ari Tanaka', bio: 'Ceramics studio diary. Slow mornings, warm clay.',
    avatar: AV(45), banner: PIC('vc-banner-ari', 1200, 500),
    private: true, role: 'user', suspended: false, verified: false, creator: false,
    online: false, lastSeen: ago(20 * hr), joinedAt: ago(90 * DAY), location: 'Kyoto, JP', isDemo: true,
  },
  {
    id: 'u_theo', username: 'theo.trail', email: 'theo@vibeconnect.app', passwordHash: H,
    displayName: 'Theo Novak', bio: 'Trail running + film photography.',
    avatar: AV(14), banner: PIC('vc-banner-theo', 1200, 500),
    private: false, role: 'user', suspended: false, verified: false, creator: false,
    online: false, lastSeen: ago(3 * hr), joinedAt: ago(70 * DAY), location: 'Prague, CZ', isDemo: true,
  },
  {
    id: 'u_bots', username: 'spam.deals.bot', email: 'spam@vibeconnect.app', passwordHash: H,
    displayName: 'DEALS MEGA STORE', bio: 'Click my link for free gift cards!!!',
    avatar: AV(60), banner: PIC('vc-banner-bots', 1200, 500),
    private: false, role: 'user', suspended: true, verified: false, creator: false,
    online: false, lastSeen: ago(5 * DAY), joinedAt: ago(12 * DAY), isDemo: true,
  },
];

export const demoUsers: User[] = rawUsers.map((u) => ({ ...u, blocked: u.blocked ?? [], muted: u.muted ?? [] }));

export const demoFollows: AppState['follows'] = [
  ['u_nova', 'u_kai'], ['u_nova', 'u_mira'], ['u_nova', 'u_juno'], ['u_nova', 'u_lux'],
  ['u_nova', 'u_ari'], ['u_nova', 'u_theo'], ['u_nova', 'u_remy'],
  ['u_kai', 'u_nova'], ['u_kai', 'u_theo'], ['u_kai', 'u_lux'],
  ['u_mira', 'u_nova'], ['u_mira', 'u_remy'],
  ['u_juno', 'u_nova'], ['u_juno', 'u_mira'],
  ['u_lux', 'u_nova'], ['u_lux', 'u_kai'],
  ['u_ari', 'u_nova'], ['u_ari', 'u_juno'],
  ['u_theo', 'u_nova'], ['u_theo', 'u_kai'],
  ['u_remy', 'u_nova'], ['u_remy', 'u_mira'],
  ['u_admin', 'u_nova'], ['u_admin', 'u_mira'], ['u_admin', 'u_lux'],
  ['u_bots', 'u_nova'], ['u_bots', 'u_kai'],
].map(([followerId, followeeId], i) => ({
  id: `fl_${followerId}_${followeeId}`,
  followerId,
  followeeId,
  at: ago((i + 1) * 90 * min),
}));

export { V1, V2, V3, V4, V5, V6, min, hr, ago, NOW };

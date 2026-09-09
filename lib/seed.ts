import type {
  AppNotification,
  CallRecord,
  Comment,
  Conversation,
  Database,
  Message,
  PayoutMethod,
  Post,
  Report,
  Story,
  Transaction,
  User,
  WatchProgress,
} from './types';
import { hashPassword, newSalt } from './security';
import { demoAvatar, demoImage, sampleVideo } from './media';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
export const DEMO_PASSWORD = 'Vibe1234!';

function defaultSettings(overrides: Partial<User['settings']> = {}): User['settings'] {
  return {
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
    ...overrides,
  };
}

interface SeedUserInput {
  username: string;
  displayName: string;
  bio: string;
  category: string;
  location?: string;
  website?: string;
  role?: User['role'];
  verified?: boolean;
  demo?: boolean;
  isCreator?: boolean;
  followersCount?: number;
  followingCount?: number;
  likesBase?: number;
  viewsBase?: number;
  monetization?: User['monetization'];
  settings?: Partial<User['settings']>;
}

const HOUR_STAMP = Date.now();

function buildUser(input: SeedUserInput, hash: string, salt: string, index: number): User {
  return {
    id: `usr_${input.username}`,
    username: input.username,
    displayName: input.displayName,
    email: `${input.username.replace(/[^a-z0-9_]/g, '.')}@vibeconnect.app`,
    passwordHash: hash,
    passwordSalt: salt,
    bio: input.bio,
    avatar: demoAvatar(input.username),
    cover: demoImage(`cover-${input.username}`, 1200, 700),
    category: input.category,
    location: input.location,
    website: input.website,
    followers: [],
    following: [],
    blocked: [],
    closeFriends: [],
    joinedAt: HOUR_STAMP - (400 - index * 11) * DAY,
    role: input.role ?? 'user',
    verified: input.verified ?? false,
    suspended: false,
    demo: true,
    isCreator: input.isCreator ?? false,
    settings: defaultSettings(input.settings),
    monetization: input.monetization ?? { status: 'none', viewsBase: 0 },
    statsBase: {
      followers: input.followersCount ?? 0,
      following: input.followingCount ?? 0,
      likes: input.likesBase ?? 0,
      views: input.viewsBase ?? 0,
    },
  };
}

const USER_INPUTS: SeedUserInput[] = [
  {
    username: 'admin',
    displayName: 'VibeConnect Team',
    bio: 'Official account. Building a calmer place to share what you make. Community guidelines v1.0.',
    category: 'Tech',
    role: 'admin',
    verified: true,
    followersCount: 12480,
    followingCount: 12,
    viewsBase: 98000,
  },
  {
    username: 'aurora.wav',
    displayName: 'Aurora Waverly',
    bio: 'Producer + sound designer. Making warm synth records in a tiny room with too many cables.',
    category: 'Music',
    location: 'Lisbon, PT',
    website: 'https://aurorawave.studio',
    verified: true,
    isCreator: true,
    followersCount: 184200,
    followingCount: 312,
    likesBase: 2140000,
    viewsBase: 8900000,
    monetization: { status: 'approved', appliedAt: HOUR_STAMP - 210 * DAY, decidedAt: HOUR_STAMP - 205 * DAY, viewsBase: 8900000 },
  },
  {
    username: 'marco.pasta',
    displayName: 'Marco Bianchi',
    bio: 'Nonna-approved pasta. One pan, no fuss, lots of garlic.',
    category: 'Food',
    location: 'Bologna, IT',
    verified: true,
    isCreator: true,
    followersCount: 96500,
    followingCount: 189,
    likesBase: 1120000,
    viewsBase: 4200000,
    monetization: { status: 'approved', appliedAt: HOUR_STAMP - 160 * DAY, decidedAt: HOUR_STAMP - 154 * DAY, viewsBase: 4200000 },
  },
  {
    username: 'kaya.trails',
    displayName: 'Kaya Ndlovu',
    bio: 'Slow travel, high altitude. Field notes and film photography from the trail.',
    category: 'Travel',
    location: 'Cape Town, ZA',
    isCreator: true,
    followersCount: 51200,
    followingCount: 402,
    likesBase: 640000,
    viewsBase: 2100000,
    monetization: { status: 'pending', appliedAt: HOUR_STAMP - 6 * DAY, viewsBase: 2100000 },
  },
  {
    username: 'pixel.juno',
    displayName: 'Juno Park',
    bio: 'Interface designer. I draw grids for fun. Type nerd.',
    category: 'Design',
    location: 'Seoul, KR',
    verified: true,
    followersCount: 43800,
    followingCount: 220,
    likesBase: 380000,
    viewsBase: 1500000,
    monetization: { status: 'none', viewsBase: 1500000 },
  },
  {
    username: 'iron.miles',
    displayName: 'Miles Ortega',
    bio: 'Strength coach. Progressive overload, boring consistency, good coffee.',
    category: 'Fitness',
    location: 'Austin, US',
    isCreator: true,
    followersCount: 78300,
    followingCount: 143,
    likesBase: 900000,
    viewsBase: 3300000,
    monetization: { status: 'rejected', appliedAt: HOUR_STAMP - 40 * DAY, decidedAt: HOUR_STAMP - 33 * DAY, note: 'Reapply after 30 days: 2 posts flagged for uncredited music in the last 60 days.', viewsBase: 3300000 },
  },
  {
    username: 'nova.rift',
    displayName: 'Nova Rift',
    bio: 'Indie game dev. Currently shipping a roguelike about a very tired astronaut.',
    category: 'Gaming',
    location: 'Montreal, CA',
    followersCount: 29400,
    followingCount: 511,
    likesBase: 260000,
    viewsBase: 990000,
    monetization: { status: 'none', viewsBase: 990000 },
  },
  {
    username: 'terra.green',
    displayName: 'Terra Lin',
    bio: 'Urban gardener. Balcony harvests, compost experiments, seed swaps.',
    category: 'Nature',
    location: 'Taipei, TW',
    followersCount: 18900,
    followingCount: 288,
    likesBase: 150000,
    viewsBase: 620000,
    monetization: { status: 'none', viewsBase: 620000 },
  },
  {
    username: 'lune.atelier',
    displayName: 'Lune Moreau',
    bio: 'Slow fashion atelier. Deadstock only. Repairs over replacements.',
    category: 'Fashion',
    location: 'Paris, FR',
    verified: true,
    isCreator: true,
    followersCount: 132000,
    followingCount: 97,
    likesBase: 1600000,
    viewsBase: 5100000,
    monetization: { status: 'approved', appliedAt: HOUR_STAMP - 300 * DAY, decidedAt: HOUR_STAMP - 292 * DAY, viewsBase: 5100000 },
  },
  {
    username: 'dev.kiran',
    displayName: 'Kiran Rao',
    bio: 'Mobile engineer. Writing about latency budgets and boring technology.',
    category: 'Tech',
    location: 'Bengaluru, IN',
    followersCount: 22100,
    followingCount: 340,
    likesBase: 180000,
    viewsBase: 740000,
    monetization: { status: 'none', viewsBase: 740000 },
  },
  {
    username: 'sol.bricks',
    displayName: 'Sol Vasquez',
    bio: 'Night photography. Neon, rain, and people waiting for buses.',
    category: 'Photography',
    location: 'Mexico City, MX',
    followersCount: 34700,
    followingCount: 176,
    likesBase: 410000,
    viewsBase: 1250000,
    monetization: { status: 'none', viewsBase: 1250000 },
  },
  {
    username: 'echo.eli',
    displayName: 'Eli Fernandes',
    bio: 'Voice notes turned into songs. Reply with a sound and I might sample it.',
    category: 'Music',
    location: 'S\\u00e3o Paulo, BR',
    followersCount: 15600,
    followingCount: 421,
    likesBase: 96000,
    viewsBase: 480000,
    monetization: { status: 'none', viewsBase: 480000 },
  },
  {
    username: 'nina.sous',
    displayName: 'Nina Kowalski',
    bio: 'Pastry. Laminated dough is my whole personality.',
    category: 'Food',
    location: 'Warsaw, PL',
    followersCount: 12300,
    followingCount: 205,
    likesBase: 88000,
    viewsBase: 310000,
    monetization: { status: 'none', viewsBase: 310000 },
  },
  {
    username: 'oz.theflat',
    displayName: 'Oz Delacroix',
    bio: 'Skate filming. Broken boards, good lines, better friends.',
    category: 'Photography',
    location: 'Marseille, FR',
    followersCount: 8700,
    followingCount: 330,
    likesBase: 54000,
    viewsBase: 210000,
    monetization: { status: 'none', viewsBase: 210000 },
  },
];

interface SeedPostInput {
  author: string;
  type: Post['type'];
  caption: string;
  title?: string;
  description?: string;
  imageSeed?: string;
  imageCount?: number;
  videoIndex?: number;
  durationMs?: number;
  hashtags?: string[];
  location?: string;
  ageMs: number;
  likes: number;
  saves?: number;
  shares?: number;
  views?: number;
  visibility?: Post['visibility'];
}

const POST_INPUTS: SeedPostInput[] = [
  {
    author: 'aurora.wav',
    type: 'photo',
    caption: 'Three days of cable spaghetti later \\u2014 the patch that made the whole record click. Headphones recommended.',
    imageSeed: 'vc-synth-patch',
    hashtags: ['synth', 'musicproducer', 'studylife'],
    location: 'Lisbon, PT',
    ageMs: 2 * HOUR,
    likes: 4820,
    saves: 610,
    shares: 122,
    views: 88200,
  },
  {
    author: 'marco.pasta',
    type: 'short',
    caption: 'The 90-second emulsion most people get wrong. Starchy water is not optional.',
    videoIndex: 1,
    durationMs: 58000,
    hashtags: ['pastalover', 'cookinghacks', 'italianfood'],
    location: 'Bologna, IT',
    ageMs: 4 * HOUR,
    likes: 12900,
    saves: 3100,
    shares: 940,
    views: 264000,
  },
  {
    author: 'pixel.juno',
    type: 'text',
    caption: 'Unpopular opinion: your onboarding flow does not need a carousel. It needs one clear action and an escape hatch.\n\nShipped a 3-step version this week. Activation went up 14%. Fewer screens, more signal.',
    hashtags: ['design', 'productdesign', 'ux'],
    ageMs: 6 * HOUR,
    likes: 2210,
    saves: 480,
    shares: 96,
    views: 31400,
  },
  {
    author: 'kaya.trails',
    type: 'photo',
    caption: 'Sunrise above the clouds on the third morning. We walked four hours in the dark for eleven minutes of this light.',
    imageSeed: 'vc-ridge-dawn',
    imageCount: 3,
    hashtags: ['hiking', 'filmphotography', 'slowtravel'],
    location: 'Drakensberg, ZA',
    ageMs: 9 * HOUR,
    likes: 8830,
    saves: 1900,
    shares: 310,
    views: 121000,
  },
  {
    author: 'iron.miles',
    type: 'video',
    title: 'The 20-minute lower body session that actually fits before work',
    description: 'No machine circuit, no 90 minutes in the gym. A warm-up, four compound sets and one finisher \\u2014 explained set by set with rest timing on screen.',
    caption: 'Consistency beats intensity. Save this one for the mornings you do not want to train.',
    videoIndex: 9,
    durationMs: 170000,
    hashtags: ['strengthtraining', 'mobility', 'morningroutine'],
    ageMs: 1 * DAY,
    likes: 6420,
    saves: 2200,
    shares: 410,
    views: 198000,
  },
  {
    author: 'lune.atelier',
    type: 'photo',
    caption: 'Repaired a 1974 wool coat this week. Invisible mending on the elbow, new buttons from the deadstock box. It will outlive all of us.',
    imageSeed: 'vc-wool-coat',
    hashtags: ['slowfashion', 'mending', 'atelier'],
    location: 'Paris, FR',
    ageMs: 1 * DAY + 5 * HOUR,
    likes: 15300,
    saves: 4400,
    shares: 820,
    views: 240000,
  },
  {
    author: 'terra.green',
    type: 'short',
    caption: 'Balcony harvest day. Four tomato varieties, one very dramatic squash.',
    videoIndex: 3,
    durationMs: 45000,
    hashtags: ['urbangarden', 'growyourown', 'balconygarden'],
    ageMs: 1 * DAY + 11 * HOUR,
    likes: 3980,
    saves: 890,
    shares: 140,
    views: 64000,
  },
  {
    author: 'nova.rift',
    type: 'text',
    caption: 'Six months into building my roguelike solo.\n\nThis month I deleted a mechanic I had spent four months on. The game is better. Grief is part of the process.',
    hashtags: ['gamedev', 'indiedev', 'screenshotsaturday'],
    ageMs: 1 * DAY + 18 * HOUR,
    likes: 5240,
    saves: 1120,
    shares: 260,
    views: 78000,
  },
  {
    author: 'sol.bricks',
    type: 'photo',
    caption: 'Tuesday rain, taxi light, 1/15th of a second. Everything I want from a frame.',
    imageSeed: 'vc-night-rain',
    imageCount: 2,
    hashtags: ['nightphotography', 'streetphoto', 'neon'],
    location: 'Mexico City, MX',
    ageMs: 2 * DAY,
    likes: 9120,
    saves: 2500,
    shares: 380,
    views: 143000,
  },
  {
    author: 'dev.kiran',
    type: 'video',
    title: 'Latency budgets for mobile apps: the 100ms rule',
    description: 'A practical walkthrough of how we measure frame time on mid-range Android, why p95 matters more than the average, and the three places we found the most wins.',
    caption: 'Numbers first, opinions second.',
    videoIndex: 11,
    durationMs: 120000,
    hashtags: ['mobiledev', 'performance', 'android'],
    ageMs: 2 * DAY + 6 * HOUR,
    likes: 2870,
    saves: 1450,
    shares: 220,
    views: 52000,
  },
  {
    author: 'nina.sous',
    type: 'photo',
    caption: 'Lamination day. 27 layers, 3 rests, zero regrets. The butter was colder than my apartment.',
    imageSeed: 'vc-croissant-layers',
    hashtags: ['pastry', 'baking', 'laminateddough'],
    location: 'Warsaw, PL',
    ageMs: 2 * DAY + 14 * HOUR,
    likes: 7640,
    saves: 3300,
    shares: 510,
    views: 104000,
  },
  {
    author: 'echo.eli',
    type: 'short',
    caption: 'Turned a fan voice note into a chorus. This is what community songwriting sounds like.',
    videoIndex: 2,
    durationMs: 60000,
    hashtags: ['songwriting', 'voicenote', 'newmusic'],
    location: 'S\\u00e3o Paulo, BR',
    ageMs: 3 * DAY,
    likes: 4410,
    saves: 970,
    shares: 610,
    views: 82000,
  },
  {
    author: 'aurora.wav',
    type: 'video',
    title: 'Full studio walkthrough: how a track goes from voice note to master',
    description: 'Every stage of a record in twelve minutes \\u2014 sketching, sound design, arrangement, comping, and the rough master I send to the label. Chapters in the description below.',
    caption: 'The messy middle, unedited.',
    videoIndex: 5,
    durationMs: 596000,
    hashtags: ['musicproduction', 'studiotour', 'behindthesong'],
    ageMs: 3 * DAY + 4 * HOUR,
    likes: 21400,
    saves: 8900,
    shares: 1800,
    views: 612000,
  },
  {
    author: 'oz.theflat',
    type: 'short',
    caption: 'Seventh try. The board did not survive, the line did.',
    videoIndex: 4,
    durationMs: 15000,
    hashtags: ['skate', 'skatefilming', 'commitment'],
    location: 'Marseille, FR',
    ageMs: 3 * DAY + 12 * HOUR,
    likes: 6120,
    saves: 740,
    shares: 390,
    views: 129000,
  },
  {
    author: 'pixel.juno',
    type: 'photo',
    caption: 'Redrawn the whole icon set at 16px. Turns out the details you agonise over are the ones nobody sees \\u2014 and the ones you skip are the ones everybody notices.',
    imageSeed: 'vc-icon-grid',
    imageCount: 2,
    hashtags: ['icondesign', 'craft', 'detail'],
    ageMs: 4 * DAY,
    likes: 5340,
    saves: 2100,
    shares: 340,
    views: 71000,
  },
  {
    author: 'kaya.trails',
    type: 'video',
    title: 'Four days on the trail: a field diary',
    description: 'Long-form cut of the Drakensberg traverse. Weather, food, mistakes, and the conversation at km 46 that I will remember for a long time.',
    caption: 'Shot on film and one very tired phone.',
    videoIndex: 7,
    durationMs: 888000,
    hashtags: ['hiking', 'traveldiary', 'longform'],
    ageMs: 5 * DAY,
    likes: 11200,
    saves: 5200,
    shares: 980,
    views: 305000,
  },
  {
    author: 'marco.pasta',
    type: 'photo',
    caption: 'Lunch for the crew. Four kilos of cacio e pepe and not a single leftover.',
    imageSeed: 'vc-cacio-pepe',
    hashtags: ['pasta', 'kitchenlife'],
    location: 'Bologna, IT',
    ageMs: 5 * DAY + 8 * HOUR,
    likes: 8910,
    saves: 1200,
    shares: 260,
    views: 132000,
  },
];

const STORY_INPUTS: Array<{ author: string; seed: string; caption?: string; ageMs: number; viewers: number }> = [
  { author: 'aurora.wav', seed: 'vc-story-studio', caption: 'Mix day. Coffee count: 4.', ageMs: 3 * HOUR, viewers: 4200 },
  { author: 'aurora.wav', seed: 'vc-story-console', caption: 'New tape saturation plugin is unreal', ageMs: 1 * HOUR, viewers: 3100 },
  { author: 'marco.pasta', seed: 'vc-story-market', caption: 'Market run before service', ageMs: 5 * HOUR, viewers: 2800 },
  { author: 'kaya.trails', seed: 'vc-story-tent', caption: 'Cold start, warm tea', ageMs: 7 * HOUR, viewers: 1900 },
  { author: 'pixel.juno', seed: 'vc-story-desk', caption: 'New keycap set arrived', ageMs: 10 * HOUR, viewers: 1400 },
  { author: 'terra.green', seed: 'vc-story-squash', caption: 'Day 60 of the squash saga', ageMs: 12 * HOUR, viewers: 820 },
  { author: 'lune.atelier', seed: 'vc-story-fabric', caption: 'Deadstock wool in for the winter run', ageMs: 14 * HOUR, viewers: 5100 },
  { author: 'nova.rift', seed: 'vc-story-build', caption: 'Build 0.9.2 finally boots', ageMs: 16 * HOUR, viewers: 640 },
  { author: 'sol.bricks', seed: 'vc-story-neon', caption: 'Waiting for the rain', ageMs: 19 * HOUR, viewers: 2100 },
  { author: 'echo.eli', seed: 'vc-story-mic', caption: 'Recording your voice notes tonight', ageMs: 22 * HOUR, viewers: 530 },
];

export async function buildSeedDatabase(): Promise<Database> {
  const salt = await newSalt();
  const hash = await hashPassword(DEMO_PASSWORD, salt);
  const now = Date.now();

  const users = USER_INPUTS.map((u, i) => buildUser(u, hash, salt, i));
  const byName = new Map(users.map((u) => [u.username, u]));
  const id = (username: string) => `usr_${username}`;

  // ---- social graph -------------------------------------------------------
  const creatorHandles = ['aurora.wav', 'marco.pasta', 'kaya.trails', 'pixel.juno', 'lune.atelier', 'iron.miles', 'nova.rift', 'terra.green', 'sol.bricks', 'dev.kiran', 'nina.sous', 'oz.theflat', 'echo.eli'];
  users.forEach((u) => {
    if (u.username === 'admin') return;
    creatorHandles
      .filter((h) => h !== u.username)
      .slice(0, 7 + Math.floor((u.username.length % 4)))
      .forEach((h) => {
        const target = byName.get(h);
        if (target && !u.following.includes(target.id)) {
          u.following.push(target.id);
          target.followers.push(u.id);
        }
      });
  });
  const admin = byName.get('admin')!;
  creatorHandles.slice(0, 9).forEach((h) => {
    const target = byName.get(h)!;
    if (!admin.following.includes(target.id)) {
      admin.following.push(target.id);
      target.followers.push(admin.id);
    }
  });

  // ---- posts --------------------------------------------------------------
  const posts: Post[] = POST_INPUTS.map((p, i) => {
    const author = byName.get(p.author)!;
    const imageCount = p.imageCount ?? (p.type === 'photo' ? 1 : 0);
    const media =
      p.type === 'photo'
        ? Array.from({ length: imageCount }).map((_, k) => ({
            id: `med_${i}_${k}`,
            type: 'image' as const,
            uri: demoImage(`${p.imageSeed}-${k}`, 1000, k % 2 === 0 ? 1250 : 1000),
            width: 1000,
            height: k % 2 === 0 ? 1250 : 1000,
            mimeType: 'image/jpeg',
            storageKey: `seed/${p.imageSeed}-${k}.jpg`,
          }))
        : p.videoIndex !== undefined
          ? [
              {
                id: `med_${i}_0`,
                type: 'video' as const,
                uri: sampleVideo(p.videoIndex),
                thumb: demoImage(`thumb-${i}`, 900, 600),
                durationMs: p.durationMs ?? 60000,
                mimeType: 'video/mp4',
                storageKey: `seed/video-${p.videoIndex}.mp4`,
              },
            ]
          : [];

    const likers = users.filter((_, k) => (k * 7 + i * 3) % 10 < 6).map((u) => u.id);
    const savers = users.filter((_, k) => (k * 5 + i) % 13 === 0).map((u) => u.id);

    return {
      id: `pst_${i.toString().padStart(3, '0')}`,
      authorId: author.id,
      type: p.type,
      title: p.title,
      caption: p.caption,
      description: p.description,
      media,
      hashtags: p.hashtags ?? [],
      location: p.location,
      visibility: p.visibility ?? 'public',
      commentsEnabled: true,
      createdAt: now - p.ageMs,
      likes: Array.from(new Set(likers)),
      saves: Array.from(new Set(savers)),
      shares: p.shares ?? 0,
      views: p.views ?? 1000,
      hidden: false,
      durationMs: p.durationMs,
      reports: [],
    };
  });

  // ---- comments -----------------------------------------------------------
  const comments: Comment[] = [];
  const commentTexts = [
    'This is exactly what I needed today.',
    'Saving this for the weekend.',
    'The attention to detail here is wild.',
    'Okay this changed how I think about the process.',
    'Please make a longer version of this.',
    'Watched it twice. Second time was better.',
    'The way you explained that finally made it click.',
    'Instant follow.',
    'Been trying this for weeks \\u2014 trying it your way tomorrow.',
    'The comments section is as good as the post.',
  ];
  posts.forEach((post, pi) => {
    const count = 2 + ((pi * 3) % 4);
    for (let c = 0; c < count; c++) {
      const author = users[(pi * 3 + c * 5 + 1) % users.length];
      if (author.id === post.authorId) continue;
      comments.push({
        id: `cmt_${pi}_${c}`,
        postId: post.id,
        authorId: author.id,
        text: commentTexts[(pi + c * 3) % commentTexts.length],
        createdAt: post.createdAt + (c + 1) * 21 * 60 * 1000,
        likes: users.filter((_, k) => (k + pi + c) % 9 === 0).map((u) => u.id),
        hidden: false,
        reports: [],
      });
    }
  });

  // ---- stories ------------------------------------------------------------
  const stories: Story[] = STORY_INPUTS.map((s, i) => {
    const author = byName.get(s.author)!;
    return {
      id: `sto_${i}`,
      authorId: author.id,
      media: {
        id: `med_story_${i}`,
        type: 'image',
        uri: demoImage(s.seed, 900, 1600),
        width: 900,
        height: 1600,
        mimeType: 'image/jpeg',
        storageKey: `seed/stories/${s.seed}.jpg`,
      },
      caption: s.caption,
      createdAt: now - s.ageMs,
      expiresAt: now - s.ageMs + 24 * HOUR,
      viewers: users.filter((_, k) => (k * 3 + i) % 7 === 0).map((u) => u.id),
    };
  });
  stories.push({
    id: 'sto_expired_demo',
    authorId: id('pixel.juno'),
    media: { id: 'med_story_exp', type: 'image', uri: demoImage('vc-story-old', 900, 1600) },
    caption: 'Expired example (over 24h)',
    createdAt: now - 30 * HOUR,
    expiresAt: now - 6 * HOUR,
    viewers: [],
  });

  // ---- conversations & messages ------------------------------------------
  const meSeed = id('aurora.wav');
  const conversations: Conversation[] = [];
  const messages: Message[] = [];

  function addThread(other: string, rows: Array<[string, Message['type'], string | undefined, number]>): void {
    const convId = `cnv_${other.replace(/[^a-z0-9]/gi, '')}`;
    const otherId = id(other);
    conversations.push({
      id: convId,
      participants: [meSeed, otherId],
      createdAt: now - 40 * DAY,
      updatedAt: now - rows[rows.length - 1][3],
      mutedFor: [],
      pinnedFor: other === 'echo.eli' ? [meSeed] : [],
    });
    rows.forEach((row, i) => {
      const [senderRaw, type, body, ageMs] = row;
      const sender = senderRaw === 'me' ? meSeed : otherId;
      messages.push({
        id: `msg_${convId}_${i}`,
        conversationId: convId,
        senderId: sender,
        type,
        text: type === 'text' ? body : undefined,
        mediaUri: type === 'image' ? demoImage('vc-chat-photo', 900, 1100) : type === 'video' ? sampleVideo(3) : type === 'voice' ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' : undefined,
        mediaType: type === 'image' ? 'image' : type === 'video' ? 'video' : undefined,
        durationMs: type === 'voice' ? 14000 : undefined,
        createdAt: now - ageMs,
        status: sender === meSeed ? (ageMs < 3 * HOUR ? 'delivered' : 'read') : 'read',
        reactions: [],
        deletedFor: [],
      });
    });
  }

  addThread('echo.eli', [
    ['them', 'text', 'That vocal stack you posted \\u2014 did you double it or was that one take?', 3 * DAY],
    ['me', 'text', 'Four takes, comped. The comp is doing a lot of heavy lifting.', 3 * DAY - 12 * MIN],
    ['them', 'voice', undefined, 2 * DAY],
    ['me', 'text', 'Just played this on the big monitors. The low end in the second half is filthy, in a good way.', 2 * DAY - 40 * MIN],
    ['them', 'text', 'Come by the studio Thursday? I want to try tracking it properly.', 5 * HOUR],
    ['me', 'text', 'Yes. Bringing the portable preamp.', 4 * HOUR],
  ]);

  addThread('marco.pasta', [
    ['them', 'image', undefined, 6 * HOUR],
    ['them', 'text', 'Emulsion test from service tonight. Ratio was 1:3 and it still broke.', 6 * HOUR - 1 * MIN],
    ['me', 'text', 'Off the heat. You are incorporating too fast \\u2014 pan on a damp towel, ten seconds at a time.', 5 * HOUR],
    ['them', 'text', 'Damp towel. Of course. Sending you a kilo of the good pecorino as payment.', 5 * HOUR - 20 * MIN],
  ]);

  addThread('dev.kiran', [
    ['me', 'text', 'Read your post on p95 frame times. We are measuring the wrong thing on our Android fleet.', 1 * DAY],
    ['them', 'text', 'Everyone is. Happy to share the harness \\u2014 it is just a systrace script and a histogram.', 1 * DAY - 30 * MIN],
    ['video', 'video', undefined, 22 * HOUR],
    ['me', 'text', 'This is the clearest explanation of jank I have seen. Sharing it with the team tomorrow.', 20 * HOUR],
  ]);

  // ---- notifications ------------------------------------------------------
  const notifications: AppNotification[] = [
    { id: 'ntf_0', recipientId: meSeed, actorId: id('echo.eli'), type: 'follow', createdAt: now - 25 * MIN, read: false },
    { id: 'ntf_1', recipientId: meSeed, actorId: id('marco.pasta'), type: 'like', entityType: 'post', entityId: posts[12].id, createdAt: now - 55 * MIN, read: false },
    { id: 'ntf_2', recipientId: meSeed, actorId: id('pixel.juno'), type: 'comment', entityType: 'post', entityId: posts[12].id, text: 'The comp is doing a lot of heavy lifting \\u2014 same energy as my whole career.', createdAt: now - 2 * HOUR, read: false },
    { id: 'ntf_3', recipientId: meSeed, actorId: id('kaya.trails'), type: 'follow', createdAt: now - 5 * HOUR, read: true },
    { id: 'ntf_4', recipientId: meSeed, actorId: id('terra.green'), type: 'like', entityType: 'post', entityId: posts[0].id, createdAt: now - 8 * HOUR, read: true },
    { id: 'ntf_5', recipientId: meSeed, type: 'monetization', text: 'Payout of $1,284.00 was processed to your default account.', createdAt: now - 1 * DAY, read: true },
    { id: 'ntf_6', recipientId: meSeed, actorId: id('sol.bricks'), type: 'share', entityType: 'post', entityId: posts[0].id, createdAt: now - 1 * DAY - 3 * HOUR, read: true },
    { id: 'ntf_7', recipientId: meSeed, actorId: id('nova.rift'), type: 'story_view', createdAt: now - 2 * DAY, read: true },
    { id: 'ntf_8', recipientId: meSeed, type: 'system', text: 'Your account is secured with an encrypted session on this device.', createdAt: now - 3 * DAY, read: true },
    { id: 'ntf_9', recipientId: meSeed, actorId: id('lune.atelier'), type: 'follow', createdAt: now - 4 * DAY, read: true },
  ];

  // ---- moderation queue ---------------------------------------------------
  const reports: Report[] = [
    { id: 'rep_0', targetType: 'post', targetId: posts[7].id, reporterId: id('nina.sous'), reason: 'Spam or scam', note: 'Same caption posted in four threads within an hour.', createdAt: now - 9 * HOUR, status: 'open' },
    { id: 'rep_1', targetType: 'user', targetId: id('oz.theflat'), reporterId: id('terra.green'), reason: 'Harassment or bullying', note: 'Replied aggressively under three unrelated posts.', createdAt: now - 20 * HOUR, status: 'open' },
    { id: 'rep_2', targetType: 'comment', targetId: comments[4]?.id ?? '', reporterId: id('pixel.juno'), reason: 'Hate speech', note: '', createdAt: now - 1 * DAY, status: 'open' },
    { id: 'rep_3', targetType: 'post', targetId: posts[9].id, reporterId: id('iron.miles'), reason: 'Misinformation', note: 'Latency numbers look padded for the headline.', createdAt: now - 2 * DAY, status: 'reviewing' },
    { id: 'rep_4', targetType: 'post', targetId: posts[3].id, reporterId: id('nova.rift'), reason: 'Intellectual property', note: '', createdAt: now - 5 * DAY, status: 'resolved', resolution: 'Reviewed and cleared \\u2014 original photography, credited correctly.', resolvedBy: id('admin'), resolvedAt: now - 4 * DAY },
  ];

  // ---- wallet -------------------------------------------------------------
  const transactions: Transaction[] = [
    { id: 'txn_0', userId: meSeed, kind: 'earning', amount: 312.44, currency: 'USD', label: 'Ad revenue share \\u00b7 August', createdAt: now - 2 * DAY, status: 'completed' },
    { id: 'txn_1', userId: meSeed, kind: 'tip', amount: 25, currency: 'USD', label: 'Tip from @nova.rift', createdAt: now - 4 * DAY, status: 'completed' },
    { id: 'txn_2', userId: meSeed, kind: 'payout', amount: -1284, currency: 'USD', label: 'Payout to \\u2022\\u2022\\u2022\\u2022 4821', createdAt: now - 1 * DAY, status: 'completed' },
    { id: 'txn_3', userId: meSeed, kind: 'earning', amount: 268.9, currency: 'USD', label: 'Ad revenue share \\u00b7 late August', createdAt: now - 9 * DAY, status: 'completed' },
    { id: 'txn_4', userId: meSeed, kind: 'bonus', amount: 150, currency: 'USD', label: 'Creator quality bonus', createdAt: now - 16 * DAY, status: 'completed' },
    { id: 'txn_5', userId: meSeed, kind: 'earning', amount: 191.05, currency: 'USD', label: 'Ad revenue share \\u00b7 early September', createdAt: now - 22 * HOUR, status: 'pending' },
    { id: 'txn_6', userId: meSeed, kind: 'payout', amount: -900, currency: 'USD', label: 'Payout to \\u2022\\u2022\\u2022\\u2022 4821', createdAt: now - 31 * DAY, status: 'completed' },
  ];

  const payoutMethods: PayoutMethod[] = [
    { id: 'pay_0', userId: meSeed, kind: 'bank', label: 'Meridian Credit Union', last4: '4821', createdAt: now - 200 * DAY, isDefault: true },
  ];

  // ---- watch history ------------------------------------------------------
  const watchProgress: WatchProgress[] = [
    { id: 'wpr_0', userId: meSeed, postId: posts[12].id, seconds: 214, updatedAt: now - 6 * HOUR },
    { id: 'wpr_1', userId: meSeed, postId: posts[4].id, seconds: 62, updatedAt: now - 2 * DAY },
  ];

  const calls: CallRecord[] = [
    { id: 'cal_0', conversationId: 'cnv_echoeli', callerId: meSeed, kind: 'voice', startedAt: now - 2 * DAY, endedAt: now - 2 * DAY + 214000, status: 'completed' },
  ];

  return {
    version: 1,
    seededAt: now,
    users,
    posts,
    comments,
    stories,
    conversations,
    messages,
    notifications,
    transactions,
    payoutMethods,
    reports,
    calls,
    watchProgress,
    pendingCodes: [],
    session: { currentUserId: null, token: null, issuedAt: null },
  };
}

export const SEED_HANDLES = USER_INPUTS.map((u) => u.username);

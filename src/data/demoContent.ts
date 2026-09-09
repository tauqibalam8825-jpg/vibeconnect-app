import { DAY, STORY_TTL, type AppState } from '../types';
import { V1, V2, V3, V4, V5, V6, PIC, ago, min, hr } from './demoUsers';

const ALL = ['u_nova', 'u_kai', 'u_mira', 'u_juno', 'u_lux', 'u_ari', 'u_theo', 'u_remy'];
const subset = (from: number, count: number) => ALL.slice(from, from + count);

const post = (
  id: string, authorId: string, kind: 'photo' | 'video', seed: string, uri: string,
  caption: string, hoursAgo: number, likes: string[], saves: string[],
  views: number, shares: number, location?: string
): AppState['posts'][number] => ({
  id, authorId, kind, uri, thumb: PIC(seed, 900, 900), caption,
  at: ago(hoursAgo * hr), likes, saves, views, shares, location, isDemo: true,
});

export const demoPosts: AppState['posts'] = [
  post('p1', 'u_nova', 'photo', 'vc-neon-1', PIC('vc-neon-1'), 'Rain makes the neon honest. Shot at 3am on Rua da Prata. #nightwalk #analog', 2, subset(0, 6), ['u_kai', 'u_mira'], 12840, 214, 'Lisbon'),
  post('p2', 'u_kai', 'video', 'vc-van-1', V1, 'Coffee above the clouds. Full cut in Watch.', 5, subset(1, 5), ['u_nova'], 20410, 388, 'Kazbegi'),
  post('p3', 'u_mira', 'photo', 'vc-studio-1', PIC('vc-studio-1'), 'Modular patch of the week. Everything recorded on a handheld recorder.', 8, subset(2, 4), ['u_remy'], 8120, 96, 'Accra'),
  post('p4', 'u_juno', 'photo', 'vc-food-1', PIC('vc-food-1'), 'One pot, 20 minutes, zero regrets. Recipe drops tomorrow.', 11, subset(0, 7), ['u_mira', 'u_ari'], 33120, 641),
  post('p5', 'u_lux', 'video', 'vc-dance-1', V2, 'Took 41 takes. This was take 39.', 14, subset(3, 5), ['u_kai'], 45230, 1204, 'Sao Paulo'),
  post('p6', 'u_nova', 'photo', 'vc-neon-2', PIC('vc-neon-2'), 'Blue hour has three minutes of patience. Worth it.', 20, subset(1, 6), ['u_theo'], 9960, 132),
  post('p7', 'u_ari', 'photo', 'vc-clay-1', PIC('vc-clay-1'), 'Kiln opened this morning. Ten survived, three did not. That is ceramics.', 26, subset(2, 5), ['u_juno'], 6410, 74, 'Kyoto'),
  post('p8', 'u_theo', 'photo', 'vc-trail-1', PIC('vc-trail-1'), '21km before sunrise. Legs complain, brain quiet.', 30, subset(0, 4), [], 5120, 61, 'Prague'),
  post('p9', 'u_remy', 'photo', 'vc-desk-1', PIC('vc-desk-1'), 'Shipping day. New build of the pocket tracker is live.', 38, subset(1, 3), ['u_nova'], 3310, 28),
  post('p10', 'u_mira', 'video', 'vc-studio-2', V3, 'Loop 142. Headphones recommended.', 44, subset(4, 4), ['u_lux'], 15020, 210),
  post('p11', 'u_juno', 'photo', 'vc-food-2', PIC('vc-food-2'), 'Market haul. Everything here cost less than a coffee downtown.', 52, subset(0, 6), [], 21400, 302, 'Seoul'),
  post('p12', 'u_nova', 'photo', 'vc-neon-3', PIC('vc-neon-3'), 'Last frame of the roll. Loaded with grain on purpose.', 60, subset(2, 5), ['u_ari'], 11230, 148),
  post('p13', 'u_lux', 'photo', 'vc-street-1', PIC('vc-street-1'), 'Casting call wrapped. 14 dancers, one street, zero permits.', 70, subset(1, 6), [], 28900, 512),
  post('p14', 'u_kai', 'photo', 'vc-mountain-1', PIC('vc-mountain-1'), 'Van still alive at 240,000km. Mostly.', 80, subset(3, 4), ['u_theo'], 14320, 190),
];

export const demoComments: AppState['comments'] = [
  { id: 'c1', postId: 'p1', postKind: 'post', authorId: 'u_kai', text: 'That reflection is unreal. What lens?', at: ago(1.6 * hr), likes: ['u_nova', 'u_theo'], isDemo: true },
  { id: 'c2', postId: 'p1', postKind: 'post', authorId: 'u_mira', text: 'This would sample so well.', at: ago(1.2 * hr), likes: ['u_nova'], isDemo: true },
  { id: 'c3', postId: 'p1', postKind: 'post', authorId: 'u_nova', text: '35mm, wide open, begging the focus to hold.', at: ago(1 * hr), likes: ['u_kai'], isDemo: true },
  { id: 'c4', postId: 'p2', postKind: 'post', authorId: 'u_nova', text: 'Adding this to the trip list immediately.', at: ago(4 * hr), likes: ['u_kai'], isDemo: true },
  { id: 'c5', postId: 'p5', postKind: 'post', authorId: 'u_juno', text: 'Take 39 is the one, no notes.', at: ago(12 * hr), likes: ['u_lux'], isDemo: true },
  { id: 'c6', postId: 'p4', postKind: 'post', authorId: 'u_ari', text: 'Made this last night - the leftovers were even better.', at: ago(9 * hr), likes: ['u_juno', 'u_mira'], isDemo: true },
  { id: 'c7', postId: 'p7', postKind: 'post', authorId: 'u_juno', text: 'The cracked one has character now!', at: ago(24 * hr), likes: ['u_ari'], isDemo: true },
  { id: 'c8', postId: 's2', postKind: 'short', authorId: 'u_mira', text: 'The timing of the drop with the rain is so good.', at: ago(5 * hr), likes: ['u_nova'], isDemo: true },
  { id: 'c9', postId: 's2', postKind: 'short', authorId: 'u_theo', text: 'Shot of the week honestly.', at: ago(4 * hr), likes: [], isDemo: true },
  { id: 'c10', postId: 'v1', postKind: 'video', authorId: 'u_nova', text: 'The storm sequence at 14:20 is cinema.', at: ago(DAY), likes: ['u_kai', 'u_lux'], isDemo: true },
];

export const demoShorts: AppState['shorts'] = [
  { id: 's1', authorId: 'u_lux', uri: V4, poster: PIC('vc-short-lux-1', 720, 1280), caption: '30 second choreo, 4 hours of rehearsal', hashtags: ['dance', 'loop'], at: ago(3 * hr), likes: subset(0, 7), saves: ['u_kai'], views: 128400, shares: 2410, isDemo: true },
  { id: 's2', authorId: 'u_nova', uri: V1, poster: PIC('vc-short-nova-1', 720, 1280), caption: 'POV: the rain finally hits the neon', hashtags: ['night', 'photography'], at: ago(7 * hr), likes: subset(1, 6), saves: ['u_mira', 'u_theo'], views: 88210, shares: 1120, isDemo: true },
  { id: 's3', authorId: 'u_mira', uri: V5, poster: PIC('vc-short-mira-1', 720, 1280), caption: 'Making a beat from a kettle boiling', hashtags: ['sounddesign', 'music'], at: ago(13 * hr), likes: subset(2, 5), saves: ['u_remy'], views: 64030, shares: 812, isDemo: true },
  { id: 's4', authorId: 'u_kai', uri: V2, poster: PIC('vc-short-kai-1', 720, 1280), caption: 'Drone follow-me gone slightly wrong', hashtags: ['drone', 'bloopers'], at: ago(22 * hr), likes: subset(3, 5), saves: [], views: 41220, shares: 640, isDemo: true },
  { id: 's5', authorId: 'u_juno', uri: V3, poster: PIC('vc-short-juno-1', 720, 1280), caption: '60 second dumpling fold, 4 styles', hashtags: ['cooking', 'asmr'], at: ago(30 * hr), likes: subset(0, 6), saves: ['u_ari', 'u_mira'], views: 97650, shares: 1980, isDemo: true },
  { id: 's6', authorId: 'u_ari', uri: V6, poster: PIC('vc-short-ari-1', 720, 1280), caption: 'Trimming a bowl on the wheel', hashtags: ['ceramics', 'satisfying'], at: ago(40 * hr), likes: subset(1, 4), saves: ['u_juno'], views: 22310, shares: 305, isDemo: true },
];

export const demoVideos: AppState['videos'] = [
  { id: 'v1', authorId: 'u_kai', title: '7 Days Van Life in the Caucasus Mountains', description: 'Full route, budget breakdown and the storm that nearly ended the trip. Filmed over seven days between Tbilisi and Kazbegi.', uri: V1, thumb: PIC('vc-video-kai-1', 1280, 720), durationSec: 1188, category: 'Travel', at: ago(2 * DAY), likes: subset(0, 7), saves: ['u_nova', 'u_theo'], views: 184300, shares: 3120, isDemo: true },
  { id: 'v2', authorId: 'u_juno', title: 'The 20-Minute One-Pot Dinner Blueprint', description: 'Three versions of the same base: tomato, coconut and miso. Full ingredient list pinned in comments.', uri: V2, thumb: PIC('vc-video-juno-1', 1280, 720), durationSec: 964, category: 'Food', at: ago(4 * DAY), likes: subset(1, 6), saves: ['u_ari'], views: 142800, shares: 2740, isDemo: true },
  { id: 'v3', authorId: 'u_nova', title: 'Night Photography: One Roll, One Street', description: 'I shot a single roll of film across four hours of rain. Here is every frame, including the misses.', uri: V3, thumb: PIC('vc-video-nova-1', 1280, 720), durationSec: 1472, category: 'Photography', at: ago(6 * DAY), likes: subset(2, 6), saves: ['u_kai', 'u_mira'], views: 98600, shares: 1580, isDemo: true },
  { id: 'v4', authorId: 'u_mira', title: 'Building a Track From Field Recordings', description: 'Market noise, a hand dryer and a bicycle bell become a full arrangement. Stems available on request.', uri: V4, thumb: PIC('vc-video-mira-1', 1280, 720), durationSec: 1620, category: 'Music', at: ago(9 * DAY), likes: subset(3, 5), saves: ['u_remy'], views: 76400, shares: 1210, isDemo: true },
  { id: 'v5', authorId: 'u_lux', title: 'How I Learn Choreography in 24 Hours', description: 'My exact practice loop: count, chunk, mirror, record, review. Includes the mistakes.', uri: V5, thumb: PIC('vc-video-lux-1', 1280, 720), durationSec: 848, category: 'Dance', at: ago(12 * DAY), likes: subset(0, 6), saves: ['u_theo'], views: 118900, shares: 2050, isDemo: true },
  { id: 'v6', authorId: 'u_ari', title: 'Studio Diary: Firing 40 Pieces in One Kiln', description: 'Loading, firing and unloading a full bisque kiln. What worked, what cracked, and why the schedule matters.', uri: V6, thumb: PIC('vc-video-ari-1', 1280, 720), durationSec: 1344, category: 'Craft', at: ago(15 * DAY), likes: subset(1, 5), saves: ['u_juno'], views: 54200, shares: 890, isDemo: true },
];

export const demoStories: AppState['stories'] = [
  { id: 'st1', authorId: 'u_nova', kind: 'photo', uri: PIC('vc-story-nova-1', 720, 1280), at: ago(3 * hr), viewers: ['u_kai', 'u_mira'], isDemo: true },
  { id: 'st2', authorId: 'u_nova', kind: 'photo', uri: PIC('vc-story-nova-2', 720, 1280), at: ago(5 * hr), viewers: ['u_mira'], isDemo: true },
  { id: 'st3', authorId: 'u_kai', kind: 'video', uri: V4, at: ago(6 * hr), viewers: ['u_nova'], isDemo: true },
  { id: 'st4', authorId: 'u_mira', kind: 'photo', uri: PIC('vc-story-mira-1', 720, 1280), at: ago(9 * hr), viewers: [], isDemo: true },
  { id: 'st5', authorId: 'u_juno', kind: 'photo', uri: PIC('vc-story-juno-1', 720, 1280), at: ago(14 * hr), viewers: ['u_nova', 'u_ari'], isDemo: true },
  // st6 is intentionally older than the 24h TTL to prove expiry works.
  { id: 'st6', authorId: 'u_lux', kind: 'photo', uri: PIC('vc-story-lux-1', 720, 1280), at: ago(2 * DAY), viewers: [], isDemo: true },
];

export const demoStoryReplies: AppState['storyReplies'] = [
  { id: 'sr1', storyId: 'st1', fromId: 'u_kai', toId: 'u_nova', text: 'Where is this?! Need to shoot there.', at: ago(2.4 * hr), read: false, isDemo: true },
  { id: 'sr2', storyId: 'st2', fromId: 'u_mira', toId: 'u_nova', text: 'The grain is perfect.', at: ago(4.1 * hr), read: false, isDemo: true },
];

export const demoConvos: AppState['convos'] = [
  { id: 'cv1', members: ['u_nova', 'u_kai'], at: ago(20 * min), blockedBy: null },
  { id: 'cv2', members: ['u_nova', 'u_mira'], at: ago(2 * hr), blockedBy: null },
  { id: 'cv3', members: ['u_nova', 'u_juno'], at: ago(2 * DAY), blockedBy: null },
];

export const demoMessages: AppState['messages'] = [
  { id: 'm1', convoId: 'cv1', senderId: 'u_kai', kind: 'text', text: 'Yo, are you around this weekend? Found a rooftop with a clean skyline.', at: ago(22 * hr), read: true, isDemo: true },
  { id: 'm2', convoId: 'cv1', senderId: 'u_nova', kind: 'text', text: 'Yes! Saturday after 8pm works. Bringing the tripod this time.', at: ago(21 * hr), read: true, isDemo: true },
  { id: 'm3', convoId: 'cv1', senderId: 'u_kai', kind: 'image', uri: PIC('vc-msg-kai-1', 800, 1000), text: 'Scouted this spot yesterday', at: ago(20.5 * hr), read: true, isDemo: true },
  { id: 'm4', convoId: 'cv1', senderId: 'u_nova', kind: 'voice', durationSec: 14, at: ago(40 * min), read: false, isDemo: true },
  { id: 'm5', convoId: 'cv2', senderId: 'u_mira', kind: 'text', text: 'Sending you the stems tonight. The kettle sample is in track 3.', at: ago(3 * hr), read: true, isDemo: true },
  { id: 'm6', convoId: 'cv2', senderId: 'u_nova', kind: 'text', text: 'Perfect, I will cut something to it.', at: ago(2.6 * hr), read: true, isDemo: true },
  { id: 'm7', convoId: 'cv2', senderId: 'u_mira', kind: 'video', uri: V5, text: 'Behind the scenes of the session', at: ago(2.2 * hr), read: false, isDemo: true },
  { id: 'm8', convoId: 'cv3', senderId: 'u_juno', kind: 'text', text: 'Recipe is live on the Watch tab - tell me how yours turns out!', at: ago(2 * DAY), read: true, isDemo: true },
];

export const demoNotifications: AppState['notifications'] = [
  { id: 'n1', userId: 'u_nova', actorId: 'u_kai', type: 'follow', text: 'started following you.', targetKind: 'profile', targetId: 'u_kai', at: ago(18 * min), read: false, isDemo: true },
  { id: 'n2', userId: 'u_nova', actorId: 'u_mira', type: 'like', text: 'liked your photo.', targetKind: 'post', targetId: 'p1', at: ago(52 * min), read: false, isDemo: true },
  { id: 'n3', userId: 'u_nova', actorId: 'u_kai', type: 'comment', text: 'commented: "That reflection is unreal."', targetKind: 'post', targetId: 'p1', at: ago(1.6 * hr), read: false, isDemo: true },
  { id: 'n4', userId: 'u_nova', actorId: 'u_theo', type: 'share', text: 'shared your photo with a friend.', targetKind: 'post', targetId: 'p12', at: ago(5 * hr), read: true, isDemo: true },
  { id: 'n5', userId: 'u_nova', actorId: 'u_kai', type: 'story_reply', text: 'replied to your story: "Where is this?!"', targetKind: 'story', targetId: 'st1', at: ago(2.4 * hr), read: false, isDemo: true },
  { id: 'n6', userId: 'u_nova', type: 'system', text: 'Your account is now eligible for the Creator Pilot programme.', at: ago(DAY), read: true, isDemo: true },
  { id: 'n7', userId: 'u_nova', actorId: 'u_mira', type: 'message', text: 'sent you a video message.', targetKind: 'chat', targetId: 'cv2', at: ago(2.2 * hr), read: false, isDemo: true },
  { id: 'n8', userId: 'u_nova', type: 'wallet', text: 'Ad-share reward was added to your wallet.', at: ago(3 * DAY), read: true, isDemo: true },
];

export const demoReports: AppState['reports'] = [
  { id: 'r1', reporterId: 'u_remy', targetType: 'user', targetId: 'u_bots', targetLabel: '@spam.deals.bot', reason: 'Spam or scams', details: 'Posting the same fake gift-card link on every photo.', at: ago(6 * hr), status: 'open', isDemo: true },
  { id: 'r2', reporterId: 'u_theo', targetType: 'post', targetId: 'p9', targetLabel: 'Post by @remy.codes', reason: 'Intellectual property', details: 'Not sure this photo is theirs, might be stock.', at: ago(2 * DAY), status: 'reviewing', isDemo: true },
  { id: 'r3', reporterId: 'u_ari', targetType: 'short', targetId: 's4', targetLabel: 'Short by @kai.roams', reason: 'Violence or dangerous acts', details: 'Drone follow shot near traffic.', at: ago(3 * DAY), status: 'resolved', isDemo: true },
];

export const demoWallet: AppState['wallet'] = [
  { id: 'w1', userId: 'u_nova', kind: 'ad_share', title: 'Ad-share reward - August', note: 'Estimated share of ad revenue from eligible views.', amount: 412.55, at: ago(3 * DAY), status: 'completed', ref: 'AD-88421', isDemo: true },
  { id: 'w2', userId: 'u_nova', kind: 'gift', title: 'Gift from @kai.roams', note: 'Supporter gift on "Night Photography".', amount: 12.0, at: ago(5 * DAY), status: 'completed', ref: 'GFT-20913', isDemo: true },
  { id: 'w3', userId: 'u_nova', kind: 'subscription', title: 'Channel subscription - m.okafor', note: 'Insider tier monthly share.', amount: 3.25, at: ago(9 * DAY), status: 'completed', ref: 'SUB-55110', isDemo: true },
  { id: 'w4', userId: 'u_nova', kind: 'sponsor', title: 'Sponsored integration - Aurora Optics', note: 'Brand deal milestone 1 of 2 approved.', amount: 750.0, at: ago(16 * DAY), status: 'completed', ref: 'SPN-10233', isDemo: true },
  { id: 'w5', userId: 'u_nova', kind: 'reward', title: 'Creator quality bonus', note: 'Original content bonus for July.', amount: 60.0, at: ago(24 * DAY), status: 'completed', ref: 'RWD-30012', isDemo: true },
  { id: 'w6', userId: 'u_nova', kind: 'withdrawal', title: 'Withdrawal to bank account', note: 'Processed by the payment provider.', amount: -500.0, at: ago(25 * DAY), status: 'completed', ref: 'WD-90021', isDemo: true },
];

export const demoWithdrawals: AppState['withdrawals'] = [
  { id: 'wd1', userId: 'u_nova', amount: 500, method: 'Bank transfer', status: 'completed', at: ago(25 * DAY), note: 'Paid out by the payment provider on request.' },
  { id: 'wd2', userId: 'u_nova', amount: 250, method: 'Bank transfer', status: 'processing', at: ago(2 * DAY), note: 'Verification pending with the payment provider.' },
];

export const demoSubscriptions: AppState['subscriptions'] = [
  { id: 'sb1', subscriberId: 'u_kai', creatorId: 'u_nova', tier: 'insider', price: 4.99, at: ago(30 * DAY), active: true },
];

export { STORY_TTL };

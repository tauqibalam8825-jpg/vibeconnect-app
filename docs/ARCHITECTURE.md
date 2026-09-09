# VibeConnect — Architecture & Build Plan

> An original mobile-first social platform: feed, shorts, watch, stories, chat,
> creator studio, wallet, moderation. Built with Expo (SDK 57) + TypeScript +
> React Navigation, mobile-first and identical on Android, iOS and desktop web.

---

## 1. What is fully functional today

| Area | State | Notes |
| --- | --- | --- |
| Sign up / login / logout | ✅ live | Unique handles, email validation, password strength meter |
| Password reset | ✅ live | One-time code flow, 15-minute expiry, invalidation on use |
| Two-step verification | ✅ live | Code challenge at sign-in, toggle in Security settings |
| Sessions | ✅ live | Random token in Keychain/Keystore (SecureStore), web partition fallback, 30-day expiry |
| Profiles | ✅ live | Photo, bio, category, location, link, followers/following lists |
| Home feed | ✅ live | Photos, videos, text vibes, shorts; like / comment / share / save / follow / report / block |
| Composer | ✅ live | Photo, video, short, text and story modes; captions, hashtags, location, audience, comments toggle, upload progress |
| Vibe Shorts | ✅ live | Full-screen vertical pager, tap-to-pause, mute, progress, rail actions |
| Watch | ✅ live | Long-form list, resume progress, player, up-next queue |
| Stories | ✅ live | 24-hour expiry, viewer list, per-story progress, hide-from list |
| Messaging | ✅ live | 1:1 chat, photos, clips, **voice notes recorded on device**, reactions, delete-for-everyone, read receipts, typing state |
| Calls | 🔌 ready | Full lobby + state machine; needs a WebRTC signaling server (see below) |
| Search & Explore | ✅ live | People, posts, videos, hashtags, categories, trending signals |
| Notifications | ✅ live | Grouped, unread badges, deep links to the target content |
| Creator Studio | ✅ live | Views, engagement, watch time, 7-day charts, top content, eligibility rules |
| Monetization | ✅ live | Application → admin review → approval/rejection with notes, notifications |
| Wallet | ✅ live | Derived balance from an append-only ledger, payout methods, minimum-payout validation |
| Admin panel | ✅ live | Moderation queue, user actions, content hiding, platform analytics (role-gated) |
| Safety | ✅ live | Report flows on posts, comments, shorts, videos, stories, accounts and messages; blocking; account deletion |
| Theme | ✅ live | Light / dark / follow-device, applied instantly |

### Needs an external service

1. **Voice & video calls** — the UI and `CallEngine` are complete. Provision
   LiveKit / Daily / Twilio (or self-hosted mediasoup), expose a signaling
   endpoint that mints room tokens, then set
   `EXPO_PUBLIC_CALL_SIGNALING_URL` (and optionally
   `EXPO_PUBLIC_CALL_PROVIDER`). The server keeps the provider secret.
2. **Media storage** — set `EXPO_PUBLIC_MEDIA_UPLOAD_URL` to a *signed upload*
   endpoint. The app posts the file, receives `{ key, url }` and stores the key
   on the post. Bucket credentials never reach the client.
3. **Payments** — the ledger, limits and approvals work. Wire a processor
   (Stripe Connect etc.) server-side and expose the public key via
   `EXPO_PUBLIC_PAYMENTS_PUBLIC_KEY`.
4. **Push notifications** — the in-app notification centre is complete; APNs/FCM
   keys belong to a notification service.

All of this is also visible in the app: **Settings → Architecture & roadmap**.

---

## 2. Project structure

```
App.tsx                  Navigation root (auth stack ⇄ tab stack), splash, font preload
lib/
  types.ts               Every data contract (User, Post, Message, Report, Transaction…)
  db.ts                  Data engine: storage, selectors, all mutations, upload pipeline
  store.tsx              React context: session, theme, toasts, confirmations
  seed.ts                Seeded content library (14 creators, 16 posts, stories, chats)
  schema.ts              Collection specs + indexes + phase roadmap (mirrors the server DB)
  security.ts            Password hashing, session tokens, secure storage
  config.ts              EXPO_PUBLIC_* endpoints + feature matrix + security rules
  calls.ts               CallEngine (state machine + integration point)
  media.ts               Media picker, sample library, explore categories
  validation.ts          Form validators
  format.ts / share.ts   Formatting helpers + cross-platform share sheet
  routes.ts              Route registry
components/               Logo, UI kit, PostCard, StoryRail, CommentsSheet, VoiceNote,
                          VideoSurface, Charts, TabBar, MediaPicker, PostGrid …
screens/                  auth/ feed/ explore/ create/ watch/ messages/ profile/ studio/ admin/ misc/
docs/ARCHITECTURE.md      This file
```

**Storage:** everything persists to device storage through `lib/db.ts` using the
exact collection shape in `lib/schema.ts`. Replacing `load` / `persist` / `notify`
in that one module with network calls moves the app to a hosted backend with no
screen changes.

---

## 3. Data model (server-ready)

`users`, `posts`, `comments`, `stories`, `conversations`, `messages`,
`notifications`, `reports`, `transactions`, `payoutMethods`, `watchProgress`,
`calls`, `pendingCodes`. Field lists, indexes and notes live in
`lib/schema.ts` and are rendered in the in-app Architecture screen.

Key decisions:

* Wallet balances are **derived** from an append-only transaction ledger — no
  stored balance to drift out of sync.
* Stories carry `expiresAt`; a server TTL index drops them automatically.
* Conversations already store `participants: ID[]`, so group threads arrive
  without a migration.
* Reports are first-class documents that feed the moderation queue.

---

## 4. Security posture

* Passwords: 600 rounds of salted SHA-256 via `expo-crypto` (native digest /
  WebCrypto). Server-side this becomes Argon2id or bcrypt.
* Sessions: random 24-byte token, 30-day expiry, stored in Keychain/Keystore.
  Browsers fall back to the app's own storage partition — never localStorage.
* Secrets: only `EXPO_PUBLIC_*` values reach the bundle. Media bucket keys,
  payment secrets and SMS credentials stay on the server.
* Authorization: role checks gate every admin mutation; visibility rules
  (`public` / `followers` / `private`) are enforced in one selector used by
  every feed, profile and search query.
* Account deletion removes posts, comments, messages, notifications, ledger and
  follow edges, and clears the session.

---

## 5. Development strategy

**Phase 1 — Core MVP ✅** Auth, sessions, password reset, profiles, follows,
privacy, home feed, composer, messaging with media and voice notes, search,
notifications, blocking/reporting/deletion.

**Phase 2 — Stories & video ✅** 24-hour stories with viewer lists, vertical
short-video feed, long-form Watch with resume progress, comment threads and
reactions, Creator Studio analytics.

**Phase 3 — Calls, money & scale 🔶** Voice/video calling (engine ready,
signaling server pending), monetization with admin approval, wallet payouts,
admin panel, recommendations/ranking service.

Each phase was verified by building for web + Android + iOS (`npx expo export
--platform all`) before the next began.

---

## 6. Running it

```bash
npm install
npx expo start          # dev server
npx expo export --platform all   # production bundles
```

Demo accounts (password `Vibe1234!`), all listed on the welcome screen:

* `@aurora.wav` — verified creator with an approved monetization application,
  studio analytics and a populated wallet.
* `@kaya.trails` — application pending moderator review.
* `@admin` — admin role, unlocks Settings → Admin panel.

Create a brand-new account at any time to see the real onboarding and empty
states.

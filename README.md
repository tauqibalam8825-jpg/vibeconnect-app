# WPPulse — WordPress Mobile App Template

> A production-ready **React Native (Expo)** template that connects to **any self-hosted WordPress site** via the official REST API (`wp/v2`). One codebase, three content modes (Blog/News, Magazine, Food/Recipe), zero hardcoded articles.

Designed for marketplace resale (Envato / CodeCanyon): clean architecture, a single buyer config file, and full documentation.

---

## Why Expo?

We ship this template on **Expo (managed workflow)** because it is the fastest path for buyers:

| Concern | Expo advantage |
|--------|----------------|
| Setup | `npm install` → `npx expo start` — no Android Studio/Xcode required to preview |
| Branding | Change `config/config.ts` + assets, rebuild |
| Store builds | EAS Build produces signed APK/AAB & IPA with one command |
| OTA updates | Expo Updates for JS-only patches after launch |
| Ejection | Run `npx expo prebuild` if you later need bare native modules |

Bare React Native is fully supported after prebuild, but Expo is the recommended default for Envato buyers.

---

## Features

- **Dynamic WordPress content** — posts, categories, tags, media, authors via REST API
- **Home feed** with list / grid / Pinterest-style masonry toggle
- **Category browser** + filtered category feeds
- **Post detail** with featured image, HTML body (`react-native-render-html`), share sheet
- **Full-text search** against your WP site
- **Bookmarks** (heart) stored locally in AsyncStorage
- **Quick Read** reading list (separate collection)
- **Settings** — light/dark/system theme, layout, live WP URL tester, cache clear
- **Multi-mode theming** — `blog` · `magazine` · `food` presets from one config flag
- **Skeleton loaders**, pull-to-refresh, infinite scroll pagination
- **Offline-friendly cache** for API responses

---

## Quick start

### 1. Install

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `w` for web.

### 2. Point at your WordPress site

Open **`config/config.ts`** and set:

```ts
wordpressUrl: 'https://your-site.com',  // no trailing slash, no /wp-json
appName: 'My Magazine',
contentMode: 'magazine',                // 'blog' | 'magazine' | 'food'
primaryColor: '#7C3AED',                // or '' to use mode default
```

Your site must expose the REST API (default since WP 4.7):

```
https://your-site.com/wp-json/wp/v2/posts
```

If that URL 404s, enable pretty permalinks in **WP Admin → Settings → Permalinks**.

### 3. Optional: feature categories

```ts
featuredCategoryIds: [3, 12],   // pin these on Home
photoCategoryIds: [8],          // force masonry grid (great for recipes / portfolio)
```

Find IDs at: `https://your-site.com/wp-json/wp/v2/categories`

### 4. Branding assets

Replace files in `/assets`:

| File | Use |
|------|-----|
| `icon.png` | App icon |
| `splash-icon.png` / adaptive icons | Splash & Android adaptive |
| `favicon.png` | Web |

Splash logo can also be swapped inside `screens/SplashScreen.tsx` (comment shows where).

---

## Project structure

```
├── App.tsx                 # Entry — providers + fonts
├── config/
│   ├── config.ts           # ★ BUYER EDIT THIS
│   └── theme.ts            # Mode presets & color engine
├── api/
│   ├── types.ts            # WP REST types
│   └── wordpress.ts        # Axios client, normalizePost, fetchers
├── components/             # PostCard, skeletons, chips, empty states
├── screens/                # Splash, Home, Categories, Detail, Search, …
├── navigation/             # Stack + bottom tabs
├── context/AppContext.tsx  # Theme, favorites, reading list, WP URL
├── hooks/                  # usePosts, useCategories
├── utils/                  # storage, html, dates
└── assets/
```

---

## Content modes

| Mode | Default layout | Default primary | Best for |
|------|----------------|-----------------|----------|
| `blog` | List | Blue `#2563EB` | News, personal blogs |
| `magazine` | Masonry | Violet `#7C3AED` | Editorial / lifestyle |
| `food` | Grid | Rose `#E11D48` | Recipes, restaurants |

Switch with `contentMode` in config. Override colors/layout individually anytime.

---

## Building for stores

### Prerequisites

1. Install EAS CLI: `npm i -g eas-cli`
2. Expo account: `eas login`
3. Configure `app.json` name, slug, bundle identifiers, icons

### Android (APK / Play Store AAB)

```bash
eas build -p android --profile preview   # APK for testing
eas build -p android --profile production  # AAB for Play Store
```

### iOS (TestFlight / App Store)

```bash
eas build -p ios --profile production
eas submit -p ios
```

Requires an Apple Developer account ($99/yr).

### Local export (web / static)

```bash
npx expo export --platform all
```

---

## WordPress requirements

- WordPress **4.7+** (REST API built-in)
- Pretty permalinks enabled
- Public read access to posts/categories (default)
- CORS: native apps are unaffected; for web builds ensure your host allows the origin or use a proxy
- Featured images recommended for polished cards
- Optional: install a plugin only if you need custom post types exposed to REST

### Authentication

This template reads **public** content (no login). To add membership / WooCommerce later, extend `api/wordpress.ts` with Application Passwords or JWT.

---

## Customization cheat sheet

| Goal | Where |
|------|-------|
| App name, colors, WP URL, mode | `config/config.ts` |
| New screen | `screens/` + register in `navigation/RootNavigator.tsx` |
| Card design | `components/PostCard.tsx` |
| HTML styling in articles | `tagsStyles` in `screens/PostDetailScreen.tsx` |
| Cache TTL / page size | `config/config.ts` → `cacheTtlSeconds`, `postsPerPage` |

---

## Demo source

Out of the box the template loads **https://wordpress.org/news** (public REST API) so you can evaluate UI immediately. Change `wordpressUrl` before shipping to clients.

You can also paste any site URL under **Profile → WordPress site** at runtime for demos; production branding should still be locked in `config.ts`.

---

## Support

For template buyers: update `supportEmail` and `privacyPolicyUrl` in config before release.

---

## License

See `LICENSE`. Ensure your Envato regular/extended license terms cover end-product distribution to your clients.

---

**WPPulse** — ship a branded WordPress app in an afternoon.

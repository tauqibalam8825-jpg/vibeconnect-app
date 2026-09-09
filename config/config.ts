/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  WPPulse — WordPress Mobile App Template                        ║
 * ║  BUYER CONFIGURATION FILE                                       ║
 * ║                                                                  ║
 * ║  Edit ONLY this file to brand the app for your WordPress site.  ║
 * ║  No other source files need changing for basic setup.           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * CONTENT MODES
 * ─────────────
 * Switch `contentMode` to restyle the entire app for different niches:
 *   • 'blog'     — clean list-first news / personal blog look
 *   • 'magazine' — bold editorial cards, larger imagery
 *   • 'food'     — warm recipe-style grid with soft accents
 *
 * Each mode ships with sensible default colors & layout, but you can
 * override any individual field below.
 */

export type ContentMode = 'blog' | 'magazine' | 'food';
export type LayoutStyle = 'list' | 'grid' | 'masonry';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppConfig {
  /** Display name shown on splash, headers, and about */
  appName: string;

  /** Short tagline under the splash logo */
  tagline: string;

  /**
   * Your self-hosted WordPress site origin (no trailing slash).
   * Example: 'https://myblog.com'  or  'https://myblog.com/subdirectory'
   * The app appends `/wp-json/wp/v2/...` automatically.
   */
  wordpressUrl: string;

  /**
   * Niche preset. Changes default primary color, layout, and copy tone.
   * Individual overrides below always win over the preset.
   */
  contentMode: ContentMode;

  /** Brand primary color (hex). Leave empty ('') to use mode default. */
  primaryColor: string;

  /** Optional secondary / accent color (hex). */
  accentColor: string;

  /**
   * Default home feed layout.
   * 'list' | 'grid' | 'masonry'  — leave '' to use mode default.
   */
  defaultLayout: LayoutStyle | '';

  /**
   * Category IDs to pin at the top of Home (comma-friendly array).
   * Find IDs via:  GET {wordpressUrl}/wp-json/wp/v2/categories
   * Empty array = show all categories / latest posts.
   */
  featuredCategoryIds: number[];

  /**
   * Category IDs treated as “photo / visual” — forced into masonry grid.
   * Useful for portfolio, food photography, travel galleries, etc.
   */
  photoCategoryIds: number[];

  /** Posts per page for infinite scroll (max 100 per WP REST API). */
  postsPerPage: number;

  /** Seconds to keep API responses in AsyncStorage cache. */
  cacheTtlSeconds: number;

  /** Default theme preference on first launch. */
  defaultTheme: ThemePreference;

  /** Show author name on cards & detail. */
  showAuthor: boolean;

  /** Show relative date on cards. */
  showDate: boolean;

  /** Enable the Reading List / Quick Read tab feature. */
  enableReadingList: boolean;

  /** Optional support / contact email shown in Settings. */
  supportEmail: string;

  /** Optional privacy policy URL shown in Settings. */
  privacyPolicyUrl: string;

  /** App version string for Settings “About”. */
  appVersion: string;
}

/* ────────────────────────────────────────────────────────────────────
 *  ▶  EDIT YOUR SETTINGS HERE
 * ──────────────────────────────────────────────────────────────────── */

const config: AppConfig = {
  // Branding
  appName: 'WPPulse',
  tagline: 'Your WordPress, in your pocket',

  /**
   * Demo source — WordPress.org News (public REST API).
   * Replace with YOUR site, e.g. 'https://your-site.com'
   */
  wordpressUrl: 'https://wordpress.org/news',

  // Niche preset: 'blog' | 'magazine' | 'food'
  contentMode: 'blog',

  // Leave blank to inherit from contentMode presets in theme.ts
  primaryColor: '',
  accentColor: '',
  defaultLayout: '',

  // Feature specific WP categories (IDs). [] = latest from all.
  featuredCategoryIds: [],

  // Categories that should always render as a Pinterest-style grid
  photoCategoryIds: [],

  postsPerPage: 10,
  cacheTtlSeconds: 300,

  defaultTheme: 'system',

  showAuthor: true,
  showDate: true,
  enableReadingList: true,

  supportEmail: 'support@example.com',
  privacyPolicyUrl: 'https://wordpress.org/about/privacy/',
  appVersion: '1.0.0',
};

export default config;

/**
 * AsyncStorage helpers — cache, favorites, reading list, user prefs.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppPost } from '../api/types';
import { LayoutStyle, ThemePreference } from '../config/config';

const KEYS = {
  favorites: '@wppulse/favorites',
  readingList: '@wppulse/reading_list',
  theme: '@wppulse/theme',
  layout: '@wppulse/layout',
  wpUrl: '@wppulse/wp_url',
  cachePrefix: '@wppulse/cache/',
  onboardingDone: '@wppulse/onboarding_done',
};

interface CacheEnvelope<T> {
  savedAt: number;
  ttlSeconds: number;
  data: T;
}

/* ── Generic cache ─────────────────────────────────────────────────── */

export async function setCache<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = {
      savedAt: Date.now(),
      ttlSeconds,
      data,
    };
    await AsyncStorage.setItem(KEYS.cachePrefix + key, JSON.stringify(envelope));
  } catch {
    // Storage full / unavailable — fail silently
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.cachePrefix + key);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    const age = (Date.now() - envelope.savedAt) / 1000;
    if (age > envelope.ttlSeconds) {
      // Expired — drop and miss
      await AsyncStorage.removeItem(KEYS.cachePrefix + key);
      return null;
    }
    return envelope.data;
  } catch {
    return null;
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(KEYS.cachePrefix));
    await Promise.all(cacheKeys.map((k) => AsyncStorage.removeItem(k)));
  } catch {
    // ignore
  }
}

/* ── Favorites ─────────────────────────────────────────────────────── */

export async function loadFavorites(): Promise<AppPost[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.favorites);
    return raw ? (JSON.parse(raw) as AppPost[]) : [];
  } catch {
    return [];
  }
}

export async function saveFavorites(posts: AppPost[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.favorites, JSON.stringify(posts));
}

/* ── Reading list (Quick Read) ─────────────────────────────────────── */

export async function loadReadingList(): Promise<AppPost[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.readingList);
    return raw ? (JSON.parse(raw) as AppPost[]) : [];
  } catch {
    return [];
  }
}

export async function saveReadingList(posts: AppPost[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.readingList, JSON.stringify(posts));
}

/* ── Preferences ───────────────────────────────────────────────────── */

export async function loadThemePref(): Promise<ThemePreference | null> {
  const v = await AsyncStorage.getItem(KEYS.theme);
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return null;
}

export async function saveThemePref(pref: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(KEYS.theme, pref);
}

export async function loadLayoutPref(): Promise<LayoutStyle | null> {
  const v = await AsyncStorage.getItem(KEYS.layout);
  if (v === 'list' || v === 'grid' || v === 'masonry') return v;
  return null;
}

export async function saveLayoutPref(layout: LayoutStyle): Promise<void> {
  await AsyncStorage.setItem(KEYS.layout, layout);
}

export async function loadCustomWpUrl(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.wpUrl);
}

export async function saveCustomWpUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.wpUrl, url);
}

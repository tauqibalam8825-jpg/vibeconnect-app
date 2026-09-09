/**
 * Global app state: theme, layout, favorites, reading list, runtime WP URL.
 * Buyers rarely need to touch this — customize via config/config.ts instead.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import config, { LayoutStyle, ThemePreference } from '../config/config';
import { AppTheme, buildTheme, resolveLayout } from '../config/theme';
import { AppPost } from '../api/types';
import { resetApiClient } from '../api/wordpress';
import {
  clearAllCache,
  loadCustomWpUrl,
  loadFavorites,
  loadLayoutPref,
  loadReadingList,
  loadThemePref,
  saveCustomWpUrl,
  saveFavorites,
  saveLayoutPref,
  saveReadingList,
  saveThemePref,
} from '../utils/storage';

interface AppContextValue {
  ready: boolean;
  theme: AppTheme;
  themePref: ThemePreference;
  setThemePref: (p: ThemePreference) => void;
  layout: LayoutStyle;
  setLayout: (l: LayoutStyle) => void;
  favorites: AppPost[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (post: AppPost) => void;
  readingList: AppPost[];
  isInReadingList: (id: number) => boolean;
  toggleReadingList: (post: AppPost) => void;
  wpUrl: string;
  setWpUrl: (url: string) => Promise<void>;
  clearCache: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const systemDark = systemScheme === 'dark';

  const [ready, setReady] = useState(false);
  const [themePref, setThemePrefState] = useState<ThemePreference>(config.defaultTheme);
  const [layout, setLayoutState] = useState<LayoutStyle>(resolveLayout());
  const [favorites, setFavorites] = useState<AppPost[]>([]);
  const [readingList, setReadingList] = useState<AppPost[]>([]);
  const [wpUrl, setWpUrlState] = useState(config.wordpressUrl);

  useEffect(() => {
    (async () => {
      try {
        const [pref, lay, favs, reads, customUrl] = await Promise.all([
          loadThemePref(),
          loadLayoutPref(),
          loadFavorites(),
          loadReadingList(),
          loadCustomWpUrl(),
        ]);
        if (pref) setThemePrefState(pref);
        if (lay) setLayoutState(lay);
        setFavorites(favs);
        setReadingList(reads);
        if (customUrl) {
          setWpUrlState(customUrl);
          // Mutate runtime config so API client picks it up
          (config as { wordpressUrl: string }).wordpressUrl = customUrl;
          resetApiClient();
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const theme = useMemo(
    () => buildTheme(themePref, systemDark),
    [themePref, systemDark]
  );

  const setThemePref = useCallback((p: ThemePreference) => {
    setThemePrefState(p);
    saveThemePref(p);
  }, []);

  const setLayout = useCallback((l: LayoutStyle) => {
    setLayoutState(l);
    saveLayoutPref(l);
  }, []);

  const isFavorite = useCallback(
    (id: number) => favorites.some((p) => p.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback((post: AppPost) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === post.id);
      const next = exists ? prev.filter((p) => p.id !== post.id) : [post, ...prev];
      saveFavorites(next);
      return next;
    });
  }, []);

  const isInReadingList = useCallback(
    (id: number) => readingList.some((p) => p.id === id),
    [readingList]
  );

  const toggleReadingList = useCallback((post: AppPost) => {
    setReadingList((prev) => {
      const exists = prev.some((p) => p.id === post.id);
      const next = exists ? prev.filter((p) => p.id !== post.id) : [post, ...prev];
      saveReadingList(next);
      return next;
    });
  }, []);

  const setWpUrl = useCallback(async (url: string) => {
    const cleaned = url.replace(/\/+$/, '');
    setWpUrlState(cleaned);
    (config as { wordpressUrl: string }).wordpressUrl = cleaned;
    resetApiClient();
    await saveCustomWpUrl(cleaned);
    await clearAllCache();
  }, []);

  const clearCache = useCallback(async () => {
    await clearAllCache();
  }, []);

  const value = useMemo(
    () => ({
      ready,
      theme,
      themePref,
      setThemePref,
      layout,
      setLayout,
      favorites,
      isFavorite,
      toggleFavorite,
      readingList,
      isInReadingList,
      toggleReadingList,
      wpUrl,
      setWpUrl,
      clearCache,
    }),
    [
      ready,
      theme,
      themePref,
      setThemePref,
      layout,
      setLayout,
      favorites,
      isFavorite,
      toggleFavorite,
      readingList,
      isInReadingList,
      toggleReadingList,
      wpUrl,
      setWpUrl,
      clearCache,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

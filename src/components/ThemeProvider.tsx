import React, { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeContext, darkTheme, lightTheme, type Theme, type ThemeCtx } from '../theme';
import { useStore } from '../store/AppStore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, updateSettings } = useStore();
  const system = useColorScheme();
  const mode = state.settings.themeMode;

  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';

  useEffect(() => {
    // Keeps the status bar readable in both modes.
  }, [isDark]);

  const value = useMemo<ThemeCtx>(
    () => ({
      theme: (isDark ? darkTheme : lightTheme) as Theme,
      mode,
      isDark,
      setMode: (m) => updateSettings({ themeMode: m }),
      toggle: () => updateSettings({ themeMode: isDark ? 'light' : 'dark' }),
    }),
    [isDark, mode, updateSettings]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

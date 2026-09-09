import { createContext, useContext } from 'react';

/**
 * VibeConnect design tokens.
 * Brand: "Vibe" gradient (violet -> cyan) with rose/amber accents.
 */
export const brand = {
  name: 'VibeConnect',
  tagline: 'Tune into your circle.',
  violet: '#7C5CFF',
  cyan: '#22D3EE',
  rose: '#FB5C7E',
  amber: '#FFB020',
  mint: '#25D0A4',
  blue: '#4C8DFF',
};

export const GRADIENT: readonly [string, string] = ['#7C5CFF', '#22D3EE'];
export const STORY_RING: string[] = ['#FB5C7E', '#FFB020', '#7C5CFF', '#22D3EE'];

export interface Theme {
  mode: 'light' | 'dark';
  bg: string;
  surface: string;
  surfaceAlt: string;
  elevated: string;
  border: string;
  text: string;
  textDim: string;
  textFaint: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  danger: string;
  success: string;
  warn: string;
  overlay: string;
  tabBar: string;
  skeleton: string;
  shadowColor: string;
}

export const lightTheme: Theme = {
  mode: 'light',
  bg: '#F4F3FB',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEAF7',
  elevated: '#FFFFFF',
  border: '#E2DFF1',
  text: '#140F2C',
  textDim: '#57517A',
  textFaint: '#8B86A6',
  primary: '#6A45FF',
  primarySoft: '#EEE9FF',
  onPrimary: '#FFFFFF',
  danger: '#E23D63',
  success: '#12A47C',
  warn: '#B97A0B',
  overlay: 'rgba(16,12,36,0.45)',
  tabBar: 'rgba(255,255,255,0.96)',
  skeleton: '#E6E3F3',
  shadowColor: '#2A1E63',
};

export const darkTheme: Theme = {
  mode: 'dark',
  bg: '#0B0916',
  surface: '#15122A',
  surfaceAlt: '#1E1A38',
  elevated: '#1B1733',
  border: '#2B2549',
  text: '#F4F2FF',
  textDim: '#ABA4CC',
  textFaint: '#7C769B',
  primary: '#8B6BFF',
  primarySoft: '#241C4A',
  onPrimary: '#FFFFFF',
  danger: '#FF5F7E',
  success: '#2FD3A6',
  warn: '#F5B544',
  overlay: 'rgba(4,3,10,0.6)',
  tabBar: 'rgba(13,10,26,0.96)',
  skeleton: '#221D3D',
  shadowColor: '#000000',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const font = {
  // System font keeps the bundle small and rendering fast on low-end Android.
  regular: undefined as string | undefined,
  medium: undefined as string | undefined,
};

export interface ThemeCtx {
  theme: Theme;
  mode: 'light' | 'dark' | 'system';
  isDark: boolean;
  setMode: (m: 'light' | 'dark' | 'system') => void;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeCtx>({
  theme: lightTheme,
  mode: 'system',
  isDark: false,
  setMode: () => {},
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const fontSizes = { xs: 11, sm: 13, md: 15, lg: 17, xl: 22, xxl: 30, hero: 38 };

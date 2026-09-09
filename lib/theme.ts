import { useColorScheme } from 'react-native';
import type { ThemeMode } from './types';

/**
 * VibeConnect visual identity — "Signal Bloom".
 * A deep ink canvas, a violet→orchid→coral brand gradient and a mint "signal"
 * accent used for live/verified/active states.
 */
export const brand = {
  violet: '#6C4CF1',
  orchid: '#A84CF1',
  coral: '#FF5C7A',
  mint: '#2BE0C8',
  ink: '#0B0912',
  sky: '#4C8CF1',
};

export const gradients = {
  brand: ['#6C4CF1', '#A84CF1', '#FF5C7A'] as const,
  brandSoft: ['#8E5CF5', '#C05CF5'] as const,
  mint: ['#2BE0C8', '#4CF1C0'] as const,
  sunset: ['#FF7A5C', '#FF5C9E'] as const,
  night: ['#151221', '#0B0912'] as const,
  gold: ['#FFC24C', '#FF8A4C'] as const,
};

export interface Theme {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  elevated: string;
  inputBg: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  divider: string;
  brand: string;
  brandAlt: string;
  brandSoft: string;
  accent: string;
  danger: string;
  success: string;
  warning: string;
  tabBar: string;
  overlay: string;
  shadow: string;
  gradient: readonly string[];
}

export const darkTheme: Theme = {
  dark: true,
  bg: '#0B0912',
  surface: '#15121F',
  surfaceAlt: '#1C1829',
  elevated: '#241E36',
  inputBg: '#1B1728',
  text: '#F4F2FF',
  textMuted: '#A49DC2',
  textFaint: '#6F688C',
  border: 'rgba(255,255,255,0.09)',
  divider: 'rgba(255,255,255,0.06)',
  brand: '#9B7BFF',
  brandAlt: '#C77DFF',
  brandSoft: 'rgba(155,123,255,0.16)',
  accent: '#2BE0C8',
  danger: '#FF5C7A',
  success: '#3DDC97',
  warning: '#FFC24C',
  tabBar: 'rgba(13,11,22,0.96)',
  overlay: 'rgba(6,5,12,0.72)',
  shadow: '#000000',
  gradient: gradients.brand,
};

export const lightTheme: Theme = {
  dark: false,
  bg: '#F6F5FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F1EFF9',
  elevated: '#FFFFFF',
  inputBg: '#F2F0FA',
  text: '#14121F',
  textMuted: '#5F5A7C',
  textFaint: '#9690AE',
  border: 'rgba(20,18,31,0.10)',
  divider: 'rgba(20,18,31,0.06)',
  brand: '#6C4CF1',
  brandAlt: '#A84CF1',
  brandSoft: 'rgba(108,76,241,0.10)',
  accent: '#0FB89C',
  danger: '#E23D5E',
  success: '#12A46B',
  warning: '#C9820B',
  tabBar: 'rgba(255,255,255,0.96)',
  overlay: 'rgba(15,12,28,0.45)',
  shadow: '#1B1430',
  gradient: gradients.brand,
};

export function resolveTheme(mode: ThemeMode, scheme: 'light' | 'dark' | null | undefined): Theme {
  if (mode === 'light') return lightTheme;
  if (mode === 'dark') return darkTheme;
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export function useSystemScheme() {
  return useColorScheme();
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radii = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const type = {
  h1: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.6 },
  h2: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
};

export function shadow(depth: number, theme: Theme) {
  if (theme.dark) {
    return {
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: depth * 4,
      shadowOffset: { width: 0, height: depth * 2 },
      elevation: depth,
    };
  }
  return {
    shadowColor: theme.shadow,
    shadowOpacity: 0.1,
    shadowRadius: depth * 3,
    shadowOffset: { width: 0, height: depth },
    elevation: depth,
  };
}

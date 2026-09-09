/**
 * Theme engine — derives colors & layout defaults from config.contentMode
 * and optional buyer color overrides.
 */

import config, { ContentMode, LayoutStyle, ThemePreference } from './config';

export interface ColorPalette {
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  danger: string;
  success: string;
  skeleton: string;
  skeletonHighlight: string;
  tabBar: string;
  tabInactive: string;
  overlay: string;
  inputBg: string;
  chipBg: string;
  chipActiveBg: string;
  chipActiveText: string;
}

export interface AppTheme {
  dark: boolean;
  colors: ColorPalette;
  layout: LayoutStyle;
  mode: ContentMode;
  borderRadius: number;
  cardRadius: number;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

/** Preset brand colors per content mode */
const MODE_PRESETS: Record<
  ContentMode,
  { primary: string; accent: string; layout: LayoutStyle; radius: number }
> = {
  blog: {
    primary: '#2563EB', // crisp blue
    accent: '#0EA5E9',
    layout: 'list',
    radius: 14,
  },
  magazine: {
    primary: '#7C3AED', // editorial violet
    accent: '#F59E0B',
    layout: 'masonry',
    radius: 16,
  },
  food: {
    primary: '#E11D48', // warm culinary rose
    accent: '#F97316',
    layout: 'grid',
    radius: 18,
  },
};

function shade(hex: string, percent: number): string {
  const raw = hex.replace('#', '');
  const num = parseInt(raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * (percent / 100))));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * (percent / 100))));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * (percent / 100))));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function resolveLayout(): LayoutStyle {
  if (config.defaultLayout === 'list' || config.defaultLayout === 'grid' || config.defaultLayout === 'masonry') {
    return config.defaultLayout;
  }
  return MODE_PRESETS[config.contentMode].layout;
}

export function buildTheme(preference: ThemePreference, systemDark: boolean): AppTheme {
  const mode = config.contentMode;
  const preset = MODE_PRESETS[mode];
  const primary = config.primaryColor || preset.primary;
  const accent = config.accentColor || preset.accent;
  const dark =
    preference === 'dark' ? true : preference === 'light' ? false : systemDark;

  const lightColors: ColorPalette = {
    primary,
    primaryDark: shade(primary, -18),
    accent,
    background: '#F4F6FB',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    danger: '#EF4444',
    success: '#10B981',
    skeleton: '#E8EDF5',
    skeletonHighlight: '#F8FAFC',
    tabBar: '#FFFFFF',
    tabInactive: '#94A3B8',
    overlay: 'rgba(15, 23, 42, 0.45)',
    inputBg: '#F1F5F9',
    chipBg: '#EEF2FF',
    chipActiveBg: primary,
    chipActiveText: '#FFFFFF',
  };

  const darkColors: ColorPalette = {
    primary,
    primaryDark: shade(primary, -10),
    accent,
    background: '#0B1220',
    surface: '#111827',
    card: '#1A2332',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    border: '#243044',
    danger: '#F87171',
    success: '#34D399',
    skeleton: '#1E293B',
    skeletonHighlight: '#334155',
    tabBar: '#0F172A',
    tabInactive: '#64748B',
    overlay: 'rgba(0, 0, 0, 0.55)',
    inputBg: '#1E293B',
    chipBg: '#1E293B',
    chipActiveBg: primary,
    chipActiveText: '#FFFFFF',
  };

  return {
    dark,
    colors: dark ? darkColors : lightColors,
    layout: resolveLayout(),
    mode,
    borderRadius: preset.radius,
    cardRadius: preset.radius + 2,
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  };
}

/** Human-readable labels for Settings UI */
export const MODE_LABELS: Record<ContentMode, string> = {
  blog: 'Blog / News',
  magazine: 'Magazine',
  food: 'Food / Recipe',
};

export const LAYOUT_LABELS: Record<LayoutStyle, string> = {
  list: 'List view',
  grid: 'Grid view',
  masonry: 'Masonry grid',
};

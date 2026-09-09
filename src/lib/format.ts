import type { ID } from '../types';

export const uid = (prefix = 'id'): ID =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const fmtCount = (n: number): string => {
  if (!isFinite(n) || n < 0) return '0';
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  if (n < 1000000) return `${Math.round(n / 1000)}K`;
  return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
};

export const fmtMoney = (n: number): string => {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const fmtDuration = (total: number): string => {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const mm = h > 0 ? String(m % 60).padStart(2, '0') : String(m);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export const timeAgo = (t: number): string => {
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(d / 365)}y`;
};

export const clockTime = (t: number): string => {
  const d = new Date(t);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
};

export const dateLabel = (t: number): string =>
  new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Demo-only non-cryptographic hash. Production auth must use server-side Argon2/bcrypt. */
export const hashPassword = (password: string): string => {
  let h = 5381;
  const salted = `vibeconnect.demo.salt::${password}`;
  for (let i = 0; i < salted.length; i++) h = ((h << 5) + h) ^ salted.charCodeAt(i);
  return `demo$${(h >>> 0).toString(36)}`;
};

export const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

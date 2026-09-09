export function formatCount(n: number): string {
  if (!isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs < 1000) return String(Math.round(n));
  if (abs < 1_000_000) {
    const v = n / 1000;
    return (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)) + 'K';
  }
  if (abs < 1_000_000_000) {
    const v = n / 1_000_000;
    return (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)) + 'M';
  }
  return (n / 1_000_000_000).toFixed(1) + 'B';
}

export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
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
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} \u00b7 ${time}`;
}

export function formatDayLabel(ts: number, now = Date.now()): string {
  const a = new Date(ts);
  const b = new Date(now);
  const sameDay = a.toDateString() === b.toDateString();
  if (sameDay) return a.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const diff = now - ts;
  if (diff < 1000 * 60 * 60 * 24 * 6) return timeAgo(ts, now);
  return a.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function money(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of matches) {
    const tag = m.slice(1).toLowerCase();
    if (!seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
  }
  return out.slice(0, 12);
}

export function parseMentions(text: string): string[] {
  const matches = text.match(/@[a-z0-9_.]+/gi) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

export function truncate(text: string, len: number): string {
  if (text.length <= len) return text;
  return text.slice(0, len - 1).trimEnd() + '\u2026';
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

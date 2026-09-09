/**
 * VibeConnect runtime configuration.
 *
 * SECURITY RULES
 * ---------------
 * 1. Only `EXPO_PUBLIC_*` variables reach the client bundle. They are public by
 *    definition (like an API key restricted by domain) — NEVER put storage
 *    secrets, payment secret keys or database credentials here.
 * 2. Private credentials live on the server (see docs/ARCHITECTURE.md →
 *    "Server-side secrets") and are consumed through short-lived signed URLs.
 * 3. In this local-first build every network call is routed through lib/db.ts,
 *    which currently reads/writes device storage. Swapping in a real backend is
 *    a single-file change.
 */

const env = (key: string): string | undefined => {
  const value = (process.env as Record<string, string | undefined>)[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
};

export const config = {
  appName: 'VibeConnect',
  apiBaseUrl: env('EXPO_PUBLIC_API_URL') ?? '',
  mediaUploadUrl: env('EXPO_PUBLIC_MEDIA_UPLOAD_URL') ?? '',
  callSignalingUrl: env('EXPO_PUBLIC_CALL_SIGNALING_URL') ?? '',
  callProvider: env('EXPO_PUBLIC_CALL_PROVIDER') ?? '',
  paymentsPublicKey: env('EXPO_PUBLIC_PAYMENTS_PUBLIC_KEY') ?? '',
  supportEmail: 'support@vibeconnect.app',
  communityGuidelinesVersion: '1.0',
  storyRetentionHours: 24,
  minPayout: 25,
  sessionDays: 30,
};

export interface FeatureStatus {
  key: string;
  label: string;
  status: 'live' | 'needs-service';
  detail: string;
  envVar?: string;
}

/**
 * Source of truth for what runs fully on-device and what needs an external
 * service. Mirrored in the in-app Architecture screen and docs/ARCHITECTURE.md.
 */
export const featureMatrix: FeatureStatus[] = [
  { key: 'auth', label: 'Auth \u00b7 sessions \u00b7 password reset', status: 'live', detail: 'Salted iterated hashing + encrypted session token stored in Keychain/Keystore (SecureStore) with web fallback.' },
  { key: 'feed', label: 'Home feed, posts, likes, comments, saves', status: 'live', detail: 'Local-first store with the same collection shape as the server API.' },
  { key: 'profile', label: 'Profiles, follows, privacy settings', status: 'live', detail: 'Fully on-device.' },
  { key: 'stories', label: 'Stories with 24h expiry', status: 'live', detail: 'Expiry enforced client-side; server TTL index documented.' },
  { key: 'shorts', label: 'Vertical short-video feed', status: 'live', detail: 'On-device pager + expo-video playback.' },
  { key: 'watch', label: 'Long-form video + resume progress', status: 'live', detail: 'Progress persisted per user.' },
  { key: 'messages', label: '1:1 chat, images, video, voice notes', status: 'live', detail: 'Voice capture uses the device mic (expo-audio). Needs HTTPS in production for mic access.' },
  { key: 'calls', label: 'Voice + video calling', status: 'needs-service', detail: 'UI + CallEngine ready. Point EXPO_PUBLIC_CALL_SIGNALING_URL at a LiveKit/Daily/Twilio signaling server to enable.', envVar: 'EXPO_PUBLIC_CALL_SIGNALING_URL' },
  { key: 'media', label: 'Media storage', status: 'needs-service', detail: 'Uploads stay local until EXPO_PUBLIC_MEDIA_UPLOAD_URL points at a signed-upload endpoint. Storage secrets stay server-side.', envVar: 'EXPO_PUBLIC_MEDIA_UPLOAD_URL' },
  { key: 'payments', label: 'Wallet payouts + creator earnings', status: 'needs-service', detail: 'Ledger, eligibility and approval flows are live. Money movement requires a payment processor (Stripe Connect etc.).', envVar: 'EXPO_PUBLIC_PAYMENTS_PUBLIC_KEY' },
  { key: 'push', label: 'Push notifications', status: 'needs-service', detail: 'In-app notification centre is live. APNs/FCM keys belong to the notification service.' },
];

export function isServiceConfigured(key: string): boolean {
  switch (key) {
    case 'calls':
      return config.callSignalingUrl.length > 0;
    case 'media':
      return config.mediaUploadUrl.length > 0;
    case 'payments':
      return config.paymentsPublicKey.length > 0;
    default:
      return true;
  }
}

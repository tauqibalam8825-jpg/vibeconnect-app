import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, validateMedia } from './validate';
import { VIDEO_SOURCES } from '../data/demoUsers';

export interface PickedMedia {
  uri: string;
  mime: string;
  size?: number;
  durationMs?: number;
  kind: 'photo' | 'video';
  /** true when the asset came from the built-in demo library */
  demo?: boolean;
}

export interface PickResult {
  ok: boolean;
  media?: PickedMedia;
  error?: string;
}

export const DEMO_PHOTOS = [
  'https://picsum.photos/seed/vc-upload-1/900/900',
  'https://picsum.photos/seed/vc-upload-2/900/900',
  'https://picsum.photos/seed/vc-upload-3/900/900',
  'https://picsum.photos/seed/vc-upload-4/720/1280',
  'https://picsum.photos/seed/vc-upload-5/1280/720',
];

/**
 * Opens the system library, validates MIME type and size, and returns a
 * normalized asset. Falls back to the demo library when the picker is
 * unavailable (web preview sandbox) or the user cancels.
 */
export async function pickMedia(kind: 'photo' | 'video'): Promise<PickResult> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return { ok: true, media: demoFallback(kind), error: 'permission' };
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'photo' ? ['images'] : ['videos'],
      quality: 0.85,
      videoMaxDuration: 180,
      allowsEditing: kind === 'photo',
      aspect: [4, 5],
    });
    if (res.canceled || !res.assets?.length) return { ok: true, media: undefined };
    const asset = res.assets[0];
    const mime = asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
    const check = validateMedia(mime, asset.fileSize);
    if (!check.ok) return { ok: false, error: check.error.message };
    return {
      ok: true,
      media: {
        uri: asset.uri,
        mime,
        size: asset.fileSize,
        durationMs: asset.duration ? asset.duration * 1000 : undefined,
        kind: asset.type === 'video' ? 'video' : 'photo',
      },
    };
  } catch {
    // Sandbox / unsupported environment — keep the flow usable with demo media.
    return { ok: true, media: demoFallback(kind), error: 'fallback' };
  }
}

export function demoFallback(kind: 'photo' | 'video'): PickedMedia {
  if (kind === 'photo') {
    const uri = DEMO_PHOTOS[Math.floor(Math.random() * DEMO_PHOTOS.length)];
    return { uri, mime: 'image/jpeg', size: MAX_IMAGE_BYTES / 4, kind: 'photo', demo: true };
  }
  const uri = VIDEO_SOURCES[Math.floor(Math.random() * VIDEO_SOURCES.length)];
  return { uri, mime: 'video/mp4', size: MAX_VIDEO_BYTES / 8, durationMs: 42000, kind: 'video', demo: true };
}

export const platformHint = Platform.select({ web: 'web', default: 'native' });

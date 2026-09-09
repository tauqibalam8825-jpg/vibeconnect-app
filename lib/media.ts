import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import type { MediaItem } from './types';
import { uid } from './format';

/**
 * Media pipeline.
 *
 * Local mode (default): files are picked from the device and referenced by URI.
 * Server mode: set EXPO_PUBLIC_MEDIA_UPLOAD_URL to a signed-upload endpoint; the
 * storage bucket credentials stay on the server and only the returned object key
 * is stored on the post. See lib/config.ts.
 */

export const IMAGE_EXT = 'jpg';

export function demoImage(seed: string, w = 900, h = 900): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

export function demoAvatar(username: string): string {
  return `https://i.pravatar.cc/320?u=${encodeURIComponent(username)}`;
}

export interface SampleMedia {
  id: string;
  label: string;
  uri: string;
  category: string;
}

/** Offline-safe fallback library used by the composer when the camera/library is unavailable. */
export const SAMPLE_IMAGES: SampleMedia[] = [
  { id: 'si1', label: 'Neon alley', uri: demoImage('vc-neon-alley', 1000, 1250), category: 'Photography' },
  { id: 'si2', label: 'Studio desk', uri: demoImage('vc-studio-desk', 1000, 1000), category: 'Design' },
  { id: 'si3', label: 'Citrus plate', uri: demoImage('vc-citrus-plate', 1000, 1250), category: 'Food' },
  { id: 'si4', label: 'Ridge line', uri: demoImage('vc-ridge-line', 1200, 800), category: 'Travel' },
  { id: 'si5', label: 'Vinyl set', uri: demoImage('vc-vinyl-set', 1000, 1000), category: 'Music' },
  { id: 'si6', label: 'Morning run', uri: demoImage('vc-morning-run', 1000, 1250), category: 'Fitness' },
  { id: 'si7', label: 'Arcade glow', uri: demoImage('vc-arcade-glow', 1200, 800), category: 'Gaming' },
  { id: 'si8', label: 'Forest fog', uri: demoImage('vc-forest-fog', 1000, 1250), category: 'Nature' },
  { id: 'si9', label: 'Rack detail', uri: demoImage('vc-rack-detail', 1000, 1250), category: 'Fashion' },
  { id: 'si10', label: 'Workbench', uri: demoImage('vc-workbench', 1200, 800), category: 'Tech' },
  { id: 'si11', label: 'Concrete lines', uri: demoImage('vc-concrete-lines', 1000, 1000), category: 'Photography' },
  { id: 'si12', label: 'Latte art', uri: demoImage('vc-latte-art', 1000, 1250), category: 'Food' },
];

export const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
];

export function sampleVideo(index: number): string {
  return SAMPLE_VIDEOS[index % SAMPLE_VIDEOS.length];
}

export const EXPLORE_CATEGORIES = [
  { key: 'all', label: 'All vibes', icon: 'sparkles' },
  { key: 'Music', label: 'Music', icon: 'musical-notes' },
  { key: 'Design', label: 'Design', icon: 'color-palette' },
  { key: 'Food', label: 'Food', icon: 'restaurant' },
  { key: 'Travel', label: 'Travel', icon: 'airplane' },
  { key: 'Fitness', label: 'Fitness', icon: 'barbell' },
  { key: 'Gaming', label: 'Gaming', icon: 'game-controller' },
  { key: 'Tech', label: 'Tech', icon: 'hardware-chip' },
  { key: 'Nature', label: 'Nature', icon: 'leaf' },
  { key: 'Fashion', label: 'Fashion', icon: 'shirt' },
  { key: 'Photography', label: 'Photo', icon: 'camera' },
] as const;

export interface PickedMedia {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  durationMs?: number;
}

function normalize(asset: ImagePicker.ImagePickerAsset): PickedMedia {
  return {
    uri: asset.uri,
    type: asset.type === 'video' ? 'video' : 'image',
    width: asset.width,
    height: asset.height,
    durationMs: asset.duration ? Math.round(asset.duration * 1000) : undefined,
  };
}

export async function pickFromLibrary(kind: 'image' | 'video' | 'any'): Promise<PickedMedia[] | null> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      if (Platform.OS !== 'web') {
        Alert.alert('Permission needed', 'Allow photo access to attach media, or pick from the sample library.');
      }
      return null;
    }
    const mediaTypes =
      kind === 'image'
        ? ImagePicker.MediaTypeOptions.Images
        : kind === 'video'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.All;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      quality: 0.85,
      videoMaxDuration: 180,
      allowsMultipleSelection: kind === 'image',
      selectionLimit: kind === 'image' ? 4 : 1,
    });
    if (result.canceled) return null;
    return result.assets.map(normalize);
  } catch {
    return null;
  }
}

export async function captureWithCamera(kind: 'image' | 'video'): Promise<PickedMedia | null> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      if (Platform.OS !== 'web') {
        Alert.alert('Permission needed', 'Allow camera access to capture media.');
      }
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: kind === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      quality: 0.85,
      videoMaxDuration: 180,
    });
    if (result.canceled || !result.assets[0]) return null;
    return normalize(result.assets[0]);
  } catch {
    return null;
  }
}

export function toMediaItem(picked: PickedMedia, index = 0): MediaItem {
  return {
    id: uid('med'),
    type: picked.type,
    uri: picked.uri,
    thumb: picked.uri,
    width: picked.width,
    height: picked.height,
    durationMs: picked.durationMs,
    mimeType: picked.type === 'video' ? 'video/mp4' : 'image/jpeg',
    storageKey: `local/${index}/${Date.now()}`,
  };
}

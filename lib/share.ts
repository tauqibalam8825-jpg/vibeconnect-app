import { Platform, Share } from 'react-native';

/**
 * Cross-platform share. Uses the OS share sheet on native and the Web Share API
 * (with a clipboard fallback) in the browser.
 */
export async function shareContent(title: string, message: string, url?: string): Promise<'shared' | 'copied' | 'dismissed' | 'failed'> {
  const payload = url ? `${message}\n\n${url}` : message;
  if (Platform.OS === 'web') {
    const nav = navigator as Navigator & { share?: (data: { title: string; text: string; url?: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title, text: message, url });
        return 'shared';
      } catch {
        return 'dismissed';
      }
    }
    try {
      await navigator.clipboard.writeText(payload);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
  try {
    const result = await Share.share({ title, message: payload, url });
    return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch {
    return 'failed';
  }
}

export function deepLinkForPost(postId: string): string {
  return `https://vibeconnect.app/p/${postId}`;
}

export function deepLinkForUser(username: string): string {
  return `https://vibeconnect.app/@${username}`;
}

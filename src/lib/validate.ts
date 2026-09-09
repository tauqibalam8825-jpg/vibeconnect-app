export interface FieldError {
  field: string;
  message: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: FieldError };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const USERNAME_RE = /^[a-z0-9](?!.*[._]{2})[a-z0-9._]{1,18}[a-z0-9]$/;

export const validateUsername = (raw: string): Result<string> => {
  const v = raw.trim().toLowerCase();
  if (!v) return { ok: false, error: { field: 'username', message: 'Username is required.' } };
  if (v.length < 3 || v.length > 20)
    return { ok: false, error: { field: 'username', message: 'Username must be 3-20 characters.' } };
  if (!USERNAME_RE.test(v))
    return {
      ok: false,
      error: { field: 'username', message: 'Use letters, numbers, dots or underscores.' },
    };
  return { ok: true, value: v };
};

export const validateEmail = (raw: string): Result<string> => {
  const v = raw.trim().toLowerCase();
  if (!v) return { ok: false, error: { field: 'email', message: 'Email is required.' } };
  if (!EMAIL_RE.test(v) || v.length > 254)
    return { ok: false, error: { field: 'email', message: 'Enter a valid email address.' } };
  return { ok: true, value: v };
};

export const validatePassword = (raw: string): Result<string> => {
  if (!raw) return { ok: false, error: { field: 'password', message: 'Password is required.' } };
  if (raw.length < 8)
    return { ok: false, error: { field: 'password', message: 'Use at least 8 characters.' } };
  if (!/[A-Za-z]/.test(raw) || !/[0-9]/.test(raw))
    return {
      ok: false,
      error: { field: 'password', message: 'Include at least one letter and one number.' },
    };
  return { ok: true, value: raw };
};

export const validateDisplayName = (raw: string): Result<string> => {
  const v = raw.trim().replace(/\s+/g, ' ');
  if (v.length < 2) return { ok: false, error: { field: 'displayName', message: 'Name is too short.' } };
  if (v.length > 40) return { ok: false, error: { field: 'displayName', message: 'Max 40 characters.' } };
  return { ok: true, value: v };
};

export const validateBio = (raw: string): Result<string> => {
  const v = raw.trim();
  if (v.length > 200) return { ok: false, error: { field: 'bio', message: 'Bio is limited to 200 characters.' } };
  return { ok: true, value: v };
};

export const validateCaption = (raw: string): Result<string> => {
  const v = raw.trim();
  if (v.length > 2200) return { ok: false, error: { field: 'caption', message: 'Caption is limited to 2200 characters.' } };
  return { ok: true, value: v };
};

export const validateTitle = (raw: string): Result<string> => {
  const v = raw.trim();
  if (v.length < 3) return { ok: false, error: { field: 'title', message: 'Title must be at least 3 characters.' } };
  if (v.length > 100) return { ok: false, error: { field: 'title', message: 'Max 100 characters.' } };
  return { ok: true, value: v };
};

export const validateMessage = (raw: string): Result<string> => {
  const v = raw.trim();
  if (!v) return { ok: false, error: { field: 'message', message: 'Message cannot be empty.' } };
  if (v.length > 2000) return { ok: false, error: { field: 'message', message: 'Max 2000 characters.' } };
  return { ok: true, value: v };
};

/**
 * Media validation. Production uploads must be re-verified server-side;
 * client checks are a UX guard only and private media needs signed URLs.
 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB
export const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm'];

export const validateMedia = (mime: string | undefined, size: number | undefined): Result<true> => {
  const type = (mime || '').toLowerCase();
  if (!type) return { ok: true, value: true };
  if (ALLOWED_IMAGE.includes(type)) {
    if (size != null && size > MAX_IMAGE_BYTES)
      return { ok: false, error: { field: 'media', message: 'Photos must be under 10 MB.' } };
    return { ok: true, value: true };
  }
  if (ALLOWED_VIDEO.includes(type)) {
    if (size != null && size > MAX_VIDEO_BYTES)
      return { ok: false, error: { field: 'media', message: 'Videos must be under 200 MB.' } };
    return { ok: true, value: true };
  }
  return { ok: false, error: { field: 'media', message: 'Unsupported file type. Use JPG, PNG, WEBP, GIF, MP4, MOV or WEBM.' } };
};

export const REPORT_REASONS = [
  'Harassment or bullying',
  'Hate speech',
  'Nudity or sexual content',
  'Violence or dangerous acts',
  'Spam or scams',
  'Misinformation',
  'Intellectual property',
  'Something else',
];

export const MODERATION_LABELS: Record<string, string> = {
  'Harassment or bullying': 'Harassment',
  'Hate speech': 'Hate speech',
  'Nudity or sexual content': 'Adult content',
  'Violence or dangerous acts': 'Violence',
  'Spam or scams': 'Spam',
  Misinformation: 'Misinformation',
  'Intellectual property': 'IP infringement',
  'Something else': 'Other',
};

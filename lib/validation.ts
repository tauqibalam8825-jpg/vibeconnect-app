export interface FieldResult {
  ok: boolean;
  message?: string;
}

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function validateUsername(value: string): FieldResult {
  const v = value.trim().toLowerCase();
  if (!v) return { ok: false, message: 'Pick a username' };
  if (v.length < 3) return { ok: false, message: 'Username needs at least 3 characters' };
  if (v.length > 20) return { ok: false, message: 'Username must be 20 characters or fewer' };
  if (!USERNAME_RE.test(v)) return { ok: false, message: 'Only letters, numbers and underscores' };
  if (/^\d/.test(v)) return { ok: false, message: 'Username cannot start with a number' };
  return { ok: true };
}

export function validateDisplayName(value: string): FieldResult {
  const v = value.trim();
  if (!v) return { ok: false, message: 'Add a display name' };
  if (v.length < 2) return { ok: false, message: 'Display name is too short' };
  if (v.length > 40) return { ok: false, message: 'Keep it under 40 characters' };
  return { ok: true };
}

export function validateEmail(value: string): FieldResult {
  const v = value.trim();
  if (!v) return { ok: false, message: 'Enter your email' };
  if (!EMAIL_RE.test(v)) return { ok: false, message: 'That email does not look right' };
  if (v.length > 120) return { ok: false, message: 'Email is too long' };
  return { ok: true };
}

export interface PasswordScore {
  score: number;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
}

export function passwordStrength(value: string): PasswordScore {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^\w\s]/.test(value)) score++;
  const clamped = Math.min(3, Math.max(0, score - 1)) as 0 | 1 | 2 | 3;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'] as const;
  return { score: clamped, label: labels[clamped] };
}

export function validatePassword(value: string): FieldResult {
  if (!value) return { ok: false, message: 'Choose a password' };
  if (value.length < 8) return { ok: false, message: 'Use at least 8 characters' };
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
    return { ok: false, message: 'Mix letters and numbers' };
  }
  if (/^(.)\1+$/.test(value)) return { ok: false, message: 'That password is too predictable' };
  return { ok: true };
}

export function validateBio(value: string): FieldResult {
  if (value.length > 160) return { ok: false, message: 'Bio is limited to 160 characters' };
  return { ok: true };
}

export function validateRequired(value: string, label: string): FieldResult {
  if (!value.trim()) return { ok: false, message: `${label} is required` };
  return { ok: true };
}

export function validateUrl(value: string): FieldResult {
  if (!value.trim()) return { ok: true };
  if (!/^https?:\/\//i.test(value.trim())) return { ok: false, message: 'Start links with https://' };
  return { ok: true };
}

/** US-style account number / card entry used by the Wallet payout form. */
export function validateAccountNumber(value: string): FieldResult {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return { ok: false, message: 'Enter at least 4 digits' };
  if (digits.length > 17) return { ok: false, message: 'That number is too long' };
  return { ok: true };
}

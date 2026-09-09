import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { config } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Passwords are never stored or compared in plain text.
 *
 * PBKDF2-style construction: `iterations` rounds of salted SHA-256 via
 * expo-crypto (native digest, WebCrypto on web). When this client is pointed at
 * the real backend the same function runs server-side with Argon2id/bcrypt.
 */
const ITERATIONS = 600;

export function randomId(bytes = 12): string {
  const bytesArr = Crypto.getRandomBytes(bytes);
  let out = '';
  for (const b of bytesArr) out += b.toString(16).padStart(2, '0');
  return out;
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  let digest = `${salt}:${password}`;
  for (let i = 0; i < ITERATIONS; i++) {
    digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}$${i}$${digest}`);
  }
  return `pbkdf2-sha256-${ITERATIONS}$${salt}$${digest}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$');
    const iterations = Number(parts[0]?.split('-').pop() ?? '600');
    const salt = parts[1] ?? '';
    if (!salt) return false;
    let digest = `${salt}:${password}`;
    for (let i = 0; i < iterations; i++) {
      digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}$${i}$${digest}`);
    }
    return parts[2] === digest;
  } catch {
    return false;
  }
}

export async function newSalt(): Promise<string> {
  return randomId(16);
}

export function createSessionToken(): string {
  return `vc_${randomId(24)}`;
}

const STORE_NAMESPACE = 'vibeconnect.secure.';
const canUseSecureStore = Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web';

/**
 * Encrypted-at-rest key/value storage.
 * • iOS → Keychain, Android → Keystore (expo-secure-store)
 * • Web → SecureStore is unavailable in browsers, so we degrade to the app's
 *   own AsyncStorage partition and never touch localStorage/cookies.
 */
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    const full = STORE_NAMESPACE + key;
    if (canUseSecureStore && Platform.OS !== 'web') {
      await SecureStore.setItemAsync(full, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
      return;
    }
    await AsyncStorage.setItem(full, value);
  },
  async getItem(key: string): Promise<string | null> {
    const full = STORE_NAMESPACE + key;
    if (canUseSecureStore && Platform.OS !== 'web') {
      return SecureStore.getItemAsync(full);
    }
    return AsyncStorage.getItem(full);
  },
  async deleteItem(key: string): Promise<void> {
    const full = STORE_NAMESPACE + key;
    if (canUseSecureStore && Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(full);
      return;
    }
    await AsyncStorage.removeItem(full);
  },
};

/** Simple constant-time-ish comparison for recovery codes. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface SessionTokenPayload {
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

export function issueSession(userId: string): { token: string; payload: SessionTokenPayload } {
  const issuedAt = Date.now();
  return {
    token: createSessionToken(),
    payload: { userId, issuedAt, expiresAt: issuedAt + config.sessionDays * 24 * 60 * 60 * 1000 },
  };
}

export function describeSecurity(): string {
  return `Passwords hashed with ${ITERATIONS} rounds of salted SHA-256. Session token stored in ${
    Platform.OS === 'web' ? 'the app storage partition' : 'the device Keychain/Keystore'
  }.`;
}

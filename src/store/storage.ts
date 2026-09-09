import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AppState } from '../types';

/**
 * Storage strategy
 * ----------------
 * - Auth session tokens live in expo-secure-store (Keychain / Keystore) on
 *   native. Browsers cannot expose a keystore, so web falls back to
 *   AsyncStorage with an httpOnly-cookie recommendation documented in
 *   `SECURITY.md` for the production API.
 * - Application data is cached in AsyncStorage for instant cold start.
 * - Everything written here from the demo seed is flagged `isDemo` and is
 *   replaced wholesale once the real API is connected.
 */

const STATE_KEY = 'vibeconnect.state.v3';
const SESSION_KEY = 'vibeconnect.session.v3';

export type PersistedState = Omit<AppState, 'hydrated'>;

export async function loadState(): Promise<PersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || !Array.isArray(parsed.users)) return null;
    return parsed;
  } catch {
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function saveState(state: PersistedState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(
      STATE_KEY,
      JSON.stringify({ ...state, resetCodes: [] }) // never persist recovery codes
    ).catch(() => {});
  }, 400);
}

export async function loadSessionToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return await AsyncStorage.getItem(SESSION_KEY);
    return await SecureStore.getItemAsync(SESSION_KEY);
  } catch {
    return null;
  }
}

export async function saveSessionToken(userId: string): Promise<void> {
  try {
    if (Platform.OS === 'web') await AsyncStorage.setItem(SESSION_KEY, userId);
    else await SecureStore.setItemAsync(SESSION_KEY, userId);
  } catch {
    /* storage unavailable (private mode) — session simply will not persist */
  }
}

export async function clearSessionToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') await AsyncStorage.removeItem(SESSION_KEY);
    else await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    /* noop */
  }
}

export async function wipeAll(): Promise<void> {
  try {
    await AsyncStorage.removeMany([STATE_KEY, SESSION_KEY]);
    if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    /* noop */
  }
}

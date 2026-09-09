import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as engine from './db';
import { gradients, radii, shadow, spacing, resolveTheme, Theme } from './theme';
import type { Database, User } from './types';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface AppState {
  ready: boolean;
  db: Database | null;
  me: User | null;
  theme: Theme;
  version: number;
  toast: (text: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AppContext = createContext<AppState | null>(null);

interface ToastState {
  id: number;
  text: string;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [version, forceRender] = useReducer((x: number) => x + 1, 0);
  const [db, setDb] = useState<Database | null>(null);
  const [ready, setReady] = useState(false);
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  useEffect(() => {
    let mounted = true;
    engine
      .bootstrap()
      .then((loaded) => {
        if (!mounted) return;
        setDb(loaded);
        setReady(true);
        engine.purgeExpiredStories();
      })
      .catch(() => setReady(true));
    const unsubscribe = engine.onChange(() => forceRender());
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!toastState) return;
    const timer = setTimeout(() => setToastState(null), 2600);
    return () => clearTimeout(timer);
  }, [toastState]);

  const toast = useCallback((text: string) => setToastState({ id: Date.now(), text }), []);
  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ ...options, resolve });
      }),
    [],
  );

  const me = db ? engine.currentUser() : null;
  const theme = useMemo(() => resolveTheme(me?.settings.themeMode ?? 'system', scheme), [me?.settings.themeMode, scheme]);

  const value = useMemo<AppState>(
    () => ({ ready, db, me, theme, version, toast, confirm }),
    [ready, db, me, theme, version, toast, confirm],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      {toastState ? <ToastHost key={toastState.id} text={toastState.text} /> : null}
      {confirmState ? (
        <ConfirmHost
          state={confirmState}
          onClose={(result) => {
            confirmState.resolve(result);
            setConfirmState(null);
          }}
        />
      ) : null}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function useTheme(): Theme {
  return useApp().theme;
}

/* The two hosts live here so every screen gets feedback + confirmation for free. */

function ToastHost({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View pointerEvents="none" style={[styles.toastWrap]}>
      <View style={[styles.toast, { backgroundColor: theme.dark ? '#2A2440' : '#1B1630', borderColor: theme.border }, shadow(6, theme)]}>
        <Ionicons name="checkmark-circle" size={18} color="#2BE0C8" />
        <Text style={styles.toastText} numberOfLines={2}>
          {text}
        </Text>
      </View>
    </View>
  );
}

function ConfirmHost({ state, onClose }: { state: ConfirmState; onClose: (result: boolean) => void }) {
  const theme = useTheme();
  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => onClose(false)}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={() => onClose(false)} />
      <View style={styles.center} pointerEvents="box-none">
        <View style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }, shadow(10, theme)]}>
          <Text style={[styles.dialogTitle, { color: theme.text }]}>{state.title}</Text>
          {state.message ? <Text style={[styles.dialogBody, { color: theme.textMuted }]}>{state.message}</Text> : null}
          <View style={styles.dialogRow}>
            <Pressable
              style={[styles.dialogBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              onPress={() => onClose(false)}
            >
              <Text style={[styles.dialogBtnText, { color: theme.text }]}>{state.cancelLabel ?? 'Cancel'}</Text>
            </Pressable>
            <Pressable
              style={[styles.dialogBtn, { overflow: 'hidden' }, shadow(3, theme)]}
              onPress={() => onClose(true)}
            >
              <LinearGradient
                colors={state.destructive ? [theme.danger, '#B1274A'] : (gradients.brand as unknown as string[])}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dialogBtnFill}
              >
                <Text style={[styles.dialogBtnText, { color: '#fff' }]}>{state.confirmLabel ?? 'Confirm'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  toastWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 110, paddingHorizontal: spacing.xl },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 420,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600', flexShrink: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  dialog: { width: '100%', maxWidth: 400, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.xl },
  dialogTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  dialogBody: { fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  dialogRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  dialogBtn: { flex: 1, height: 46, borderRadius: radii.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  dialogBtnFill: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  dialogBtnText: { fontSize: 15, fontWeight: '700' },
});

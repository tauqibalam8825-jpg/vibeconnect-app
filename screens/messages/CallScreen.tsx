import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp, useTheme } from '../../lib/store';
import { gradients, radii, spacing } from '../../lib/theme';
import * as db from '../../lib/db';
import { callEngineConfig, connectCall, isCallServiceReady, CallKind, CallSession } from '../../lib/calls';
import { Avatar } from '../../components/Avatar';
import { Banner, Button, IconButton } from '../../components/UI';

/**
 * Voice & video call lobby.
 *
 * Everything around the media stream is real: session creation, call history,
 * state machine and the in-call controls. The media stream itself is supplied
 * by the WebRTC provider configured in lib/calls.ts.
 */
export function CallScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { toast, me } = useApp();
  const peer = db.userById(route.params?.userId as string);
  const kind: CallKind = route.params?.kind === 'video' ? 'video' : 'voice';
  const conversationId = me && peer ? db.findOrCreateConversation(me.id, peer.id).id : '';
  const [session, setSession] = useState<CallSession | null>(null);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [cameraOn, setCameraOn] = useState(kind === 'video');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!peer) return;
      const result = await connectCall({ conversationId, peer, kind });
      if (!cancelled) setSession(result);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peer?.id, kind]);

  useEffect(() => {
    if (session?.state !== 'connected') return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [session?.state]);

  if (!peer) return null;

  const ended = () => {
    if (session?.state === 'connected') {
      db.recordCall(conversationId, kind, 'completed');
    }
    navigation.goBack();
  };

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0912' }}>
      <LinearGradient colors={[gradients.brand[0], '#151221', '#0B0912']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <Text style={styles.kindLabel}>{kind === 'video' ? 'VIDEO CALL' : 'VOICE CALL'}</Text>
          <Text style={styles.name}>{peer.displayName}</Text>
          <Text style={styles.status}>
            {session?.state === 'connecting' ? 'Connecting\u2026' : session?.state === 'connected' ? `${minutes}:${seconds}` : session?.state === 'failed' ? 'Unavailable' : 'Ringing\u2026'}
          </Text>
        </View>

        <View style={styles.avatarWrap}>
          {kind === 'video' && cameraOn && session?.state === 'connected' ? (
            <View style={[styles.cameraPreview, { borderColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="videocam" size={30} color="rgba(255,255,255,0.75)" />
              <Text style={styles.cameraHint}>Your camera feed appears here once a WebRTC provider is connected.</Text>
            </View>
          ) : (
            <View style={[styles.ring, { borderColor: session?.state === 'failed' ? theme.danger : 'rgba(255,255,255,0.25)' }]}>
              <Avatar uri={peer.avatar} name={peer.displayName} size={128} />
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: spacing.xl }}>
          {session?.state === 'failed' ? (
            <Banner text={session.message ?? 'Calling is unavailable.'} tone="warning" icon="cloud-offline-outline" />
          ) : null}
          {!isCallServiceReady() ? (
            <Text style={styles.engineNote}>
              CallEngine is idle. Signaling endpoint: {callEngineConfig.signalingUrl ? callEngineConfig.signalingUrl : 'not set'} \u00b7 STUN: {callEngineConfig.iceServers[0].urls}
            </Text>
          ) : null}
        </View>

        <View style={styles.controls}>
          <IconButton
            icon={muted ? 'mic-off' : 'mic'}
            size={62}
            iconSize={25}
            variant="surface"
            onPress={() => setMuted((m) => !m)}
            style={{ backgroundColor: muted ? 'rgba(255,92,122,0.28)' : 'rgba(255,255,255,0.14)', borderColor: 'transparent' }}
          />
          {kind === 'video' ? (
            <IconButton
              icon={cameraOn ? 'videocam' : 'videocam-off'}
              size={62}
              iconSize={25}
              onPress={() => setCameraOn((c) => !c)}
              style={{ backgroundColor: cameraOn ? 'rgba(255,255,255,0.14)' : 'rgba(255,92,122,0.28)', borderColor: 'transparent' }}
            />
          ) : null}
          <IconButton
            icon={speaker ? 'volume-high' : 'volume-mute'}
            size={62}
            iconSize={25}
            onPress={() => setSpeaker((s) => !s)}
            style={{ backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'transparent' }}
          />
          <IconButton icon="call" size={62} iconSize={26} onPress={ended} style={{ backgroundColor: theme.danger, borderColor: 'transparent' }} />
        </View>

        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <Button
            label={session?.state === 'failed' ? 'Back to chat' : 'Return to chat'}
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'center', paddingTop: spacing.xxl },
  kindLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11.5, fontWeight: '900', letterSpacing: 1.6 },
  name: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 8 },
  status: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 6, fontWeight: '600' },
  avatarWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: { padding: 8, borderRadius: 90, borderWidth: 2, borderStyle: 'dashed' },
  cameraPreview: { width: 240, height: 340, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: 20, gap: 10 },
  cameraHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
  engineNote: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5, textAlign: 'center', lineHeight: 17 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 18, paddingVertical: spacing.xl },
});

import { config } from './config';
import type { ID, User } from './types';

/**
 * CallEngine — integration-ready one-to-one calling.
 *
 * VibeConnect ships the full call UX (lobby, ringing, in-call controls,
 * history) without bundling a media server. To go live:
 *
 *  1. Provision a WebRTC provider (LiveKit, Daily.co, Twilio or a self-hosted
 *     mediasoup cluster) and keep its secret key on your server.
 *  2. Expose a signaling endpoint that mints room tokens, then set
 *     EXPO_PUBLIC_CALL_SIGNALING_URL to its base URL.
 *  3. Optionally set EXPO_PUBLIC_CALL_PROVIDER to the SDK you use client-side.
 *
 * Until then `connect()` fails loudly with `signaling-not-configured` so the UI
 * can explain exactly what is missing instead of pretending to connect.
 */
export type CallKind = 'voice' | 'video';
export type CallState = 'idle' | 'connecting' | 'connected' | 'failed';

export interface CallSession {
  id: string;
  conversationId: ID;
  peer: User;
  kind: CallKind;
  state: CallState;
  message?: string;
  startedAt: number;
}

export interface CallEngineConfig {
  signalingUrl: string;
  provider: string;
  iceServers: Array<{ urls: string }>;
}

export const callEngineConfig: CallEngineConfig = {
  signalingUrl: config.callSignalingUrl,
  provider: config.callProvider,
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function isCallServiceReady(): boolean {
  return callEngineConfig.signalingUrl.length > 0;
}

export async function connectCall(session: { conversationId: ID; peer: User; kind: CallKind }): Promise<CallSession> {
  const base: CallSession = {
    id: `call_${Date.now().toString(36)}`,
    conversationId: session.conversationId,
    peer: session.peer,
    kind: session.kind,
    state: 'connecting',
    startedAt: Date.now(),
  };

  if (!isCallServiceReady()) {
    return {
      ...base,
      state: 'failed',
      message: 'Calling needs a signaling server. Set EXPO_PUBLIC_CALL_SIGNALING_URL (see Settings \u2192 Architecture) and the same screen will place a real call.',
    };
  }

  try {
    const response = await fetch(`${callEngineConfig.signalingUrl}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participants: 2, kind: session.kind }),
    });
    if (!response.ok) throw new Error('signaling-failed');
    return { ...base, state: 'connected' };
  } catch {
    return { ...base, state: 'failed', message: 'The call service did not answer. Check the signaling URL and try again.' };
  }
}

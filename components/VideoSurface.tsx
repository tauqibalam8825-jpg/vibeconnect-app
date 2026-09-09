import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/store';
import { formatDuration } from '../lib/format';

/**
 * Thin wrapper around expo-video so every playback surface shares the same
 * lifecycle rules (create → play/pause → dispose).
 */
export function ShortVideoSurface({
  uri,
  active,
  startAt = 0,
  style,
  onProgress,
  onEnded,
}: {
  uri: string;
  active: boolean;
  startAt?: number;
  style?: StyleProp<ViewStyle>;
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
}) {
  const theme = useTheme();
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<string>('loading');
  const [showControls, setShowControls] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 0.4;
    if (startAt > 0) p.currentTime = startAt;
  });

  useEffect(() => {
    const statusSub = player.addListener('statusChange', ({ status: next }: { status: string }) => setStatus(next));
    const timeSub = player.addListener('timeUpdate', ({ currentTime }: { currentTime: number }) => {
      onProgress?.(currentTime, player.duration || 0);
    });
    const endSub = player.addListener('playToEnd', () => onEnded?.());
    return () => {
      statusSub?.remove();
      timeSub?.remove();
      endSub?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  useEffect(() => {
    try {
      if (active && !paused) player.play();
      else player.pause();
    } catch {
      // Some browsers refuse autoplay with sound — the tap overlay covers it.
    }
  }, [active, paused, player]);

  const flashControls = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2200);
  };

  return (
    <View style={[{ flex: 1, backgroundColor: '#000', overflow: 'hidden' }, style]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
        allowsPictureInPicture={false}
      />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => {
          setPaused((p) => !p);
          flashControls();
        }}
      />
      {status === 'loading' ? (
        <View pointerEvents="none" style={styles.centered}>
          <Ionicons name="radio-outline" size={30} color="rgba(255,255,255,0.7)" />
        </View>
      ) : null}
      {paused || showControls ? (
        <View pointerEvents="none" style={styles.controlLayer}>
          <View style={[styles.controlCircle, { backgroundColor: 'rgba(11,9,18,0.55)' }]}>
            <Ionicons name={paused ? 'play' : 'pause'} size={26} color="#fff" />
          </View>
        </View>
      ) : null}
      <Pressable
        onPress={() => {
          setMuted((m) => {
            player.muted = !m;
            return !m;
          });
          flashControls();
        }}
        style={[styles.muteBtn, { backgroundColor: 'rgba(11,9,18,0.55)', opacity: showControls || paused ? 1 : 0.45 }]}
        hitSlop={8}
      >
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={17} color="#fff" />
      </Pressable>
    </View>
  );
}

export function WatchPlayer({ uri, startAt = 0, onProgress, onEnded }: { uri: string; startAt?: number; onProgress?: (seconds: number) => void; onEnded?: () => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.timeUpdateEventInterval = 1;
    if (startAt > 0) p.currentTime = startAt;
    p.play();
  });

  useEffect(() => {
    const timeSub = player.addListener('timeUpdate', ({ currentTime }: { currentTime: number }) => onProgress?.(currentTime));
    const endSub = player.addListener('playToEnd', () => onEnded?.());
    return () => {
      timeSub?.remove();
      endSub?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls allowsFullscreen />;
}

export function ProgressBar3({ current, duration }: { current: number; duration: number }) {
  const theme = useTheme();
  const fraction = duration > 0 ? Math.min(1, current / duration) : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${fraction * 100}%`, backgroundColor: theme.brand }]} />
    </View>
  );
}

export function DurationBadge({ ms, dark = true }: { ms: number; dark?: boolean }) {
  return (
    <View style={[styles.duration, { backgroundColor: dark ? 'rgba(11,9,18,0.78)' : 'rgba(255,255,255,0.9)' }]}>
      <Text style={{ color: dark ? '#fff' : '#14121F', fontSize: 11.5, fontWeight: '700' }}>{formatDuration(ms)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  controlLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,9,18,0.18)' },
  controlCircle: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },
  muteBtn: { position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  duration: { position: 'absolute', bottom: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});

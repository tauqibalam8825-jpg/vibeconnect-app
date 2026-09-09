import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../theme';

/**
 * Video surface used by Feed, Watch, Shorts, Stories and Chat.
 * - Poster image renders instantly (lazy + cached) so low-end devices never
 *   show a black frame while the stream buffers.
 * - `active` lets pagers pause off-screen players to save battery/CPU.
 */
export const VibeVideo: React.FC<{
  uri: string;
  poster?: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'contain' | 'cover';
  active?: boolean;
  autoPlay?: boolean;
  showCenterControl?: boolean;
  onActive?: () => void;
}> = ({ uri, poster, style, contentFit = 'cover', active = true, autoPlay = true, showCenterControl = true, onActive }) => {
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState(false);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
    if (autoPlay) p.play();
  });

  useEffect(() => {
    try {
      const sub = player.addListener('statusChange', (evt: { status?: string }) => {
        if (evt?.status === 'readyToPlay') setReady(true);
        if (evt?.status === 'error') setError(true);
      });
      return () => {
        try {
          sub?.remove?.();
        } catch {
          /* subscription already released */
        }
      };
    } catch {
      return;
    }
  }, [player]);

  useEffect(() => {
    try {
      if (active && autoPlay && !paused) player.play();
      else player.pause();
    } catch {
      /* player unavailable in this environment */
    }
    if (active && onActive) onActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, autoPlay, paused, player]);

  const toggle = () => {
    try {
      if (paused) player.play();
      else player.pause();
      setPaused((p) => !p);
    } catch {
      setPaused((p) => !p);
    }
  };

  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#0C0A18' }, style]}>
      {poster ? (
        <ExpoImage
          source={{ uri: poster }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          transition={220}
          cachePolicy="memory-disk"
        />
      ) : null}
      {!error ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          nativeControls={false}
          pointerEvents="none"
        />
      ) : null}
      {showCenterControl && (paused || error) && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={error ? 'Video unavailable' : paused ? 'Play video' : 'Pause video'}
          onPress={toggle}
          style={styles.centerBtn}
        >
          <Ionicons name={error ? 'cloud-offline-outline' : 'play'} size={26} color="#fff" />
        </Pressable>
      )}
      {showCenterControl && !paused && ready && !error && (
        <Animated.View entering={FadeIn} pointerEvents="none" style={styles.playingPill}>
          <Ionicons name="volume-medium" size={12} color="#fff" />
        </Animated.View>
      )}
      {!ready && !error && (
        <View pointerEvents="none" style={styles.loadingDot}>
          <Ionicons name="sync" size={16} color="rgba(255,255,255,0.75)" />
        </View>
      )}
    </View>
  );
};

/** Cached, lazy image with a soft placeholder colour while loading. */
export const Media: React.FC<{
  uri?: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'contain' | 'cover';
  radius?: number;
}> = ({ uri, style, contentFit = 'cover', radius = 0 }) => {
  const { theme } = useTheme();
  return (
    <ExpoImage
      source={uri ? { uri } : undefined}
      style={[{ backgroundColor: theme.surfaceAlt, borderRadius: radius }, style as object]}
      contentFit={contentFit}
      transition={220}
      cachePolicy="memory-disk"
      placeholder={{ blurhash: 'L03[]tt700~q00xU00AI~q00IwM{' }}
    />
  );
};

const styles = StyleSheet.create({
  centerBtn: {
    position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -30,
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(10,8,22,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  playingPill: {
    position: 'absolute', top: 10, right: 10, flexDirection: 'row',
    backgroundColor: 'rgba(10,8,22,0.5)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4,
  },
  loadingDot: {
    position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -14,
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
});

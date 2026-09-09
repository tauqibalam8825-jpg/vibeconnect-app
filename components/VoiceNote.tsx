import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useTheme } from '../lib/store';
import { formatDuration } from '../lib/format';

/** Deterministic waveform so the same voice note always renders the same bars. */
function bars(seed: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    hash = (hash * 1103515245 + 12345) % 2147483648;
    out.push(0.25 + ((hash >> 8) % 100) / 140);
  }
  return out;
}

export function VoiceNote({ uri, durationMs, mine, seed }: { uri: string; durationMs?: number; mine: boolean; seed: string }) {
  const theme = useTheme();
  const player = useAudioPlayer(uri ? { uri } : undefined);
  const status = useAudioPlayerStatus(player);
  const wave = useMemo(() => bars(seed, 26), [seed]);
  const fraction = status.duration > 0 ? status.currentTime / status.duration : 0;
  const accent = mine ? '#fff' : theme.brand;

  return (
    <View style={[styles.wrap, mine ? styles.mineWrap : { backgroundColor: theme.surfaceAlt }]}>
      <Pressable
        onPress={() => {
          try {
            if (status.playing) player.pause();
            else {
              if (status.didJustFinish) player.seekTo(0);
              player.play();
            }
          } catch {
            // Audio hardware unavailable — the note stays visible.
          }
        }}
        style={[styles.playBtn, { backgroundColor: mine ? 'rgba(255,255,255,0.22)' : theme.brandSoft }]}
      >
        <Ionicons name={status.playing ? 'pause' : 'play'} size={17} color={accent} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={styles.wave}>
          {wave.map((height, i) => (
            <View
              key={i}
              style={{
                width: 2.5,
                borderRadius: 2,
                height: 6 + height * 20,
                backgroundColor: i / wave.length <= fraction ? accent : mine ? 'rgba(255,255,255,0.4)' : theme.textFaint,
                marginRight: 2,
              }}
            />
          ))}
        </View>
        <Text style={{ color: mine ? 'rgba(255,255,255,0.85)' : theme.textFaint, fontSize: 11.5, fontWeight: '700', marginTop: 4 }}>
          {formatDuration((durationMs ?? (status.duration || 0) * 1000))}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 18, minWidth: 190 },
  mineWrap: { backgroundColor: '#6C4CF1' },
  playBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  wave: { flexDirection: 'row', alignItems: 'center', height: 26 },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../lib/store';

/**
 * The VibeConnect mark: a "signal V" — two rising strokes meeting at a node,
 * drawn as one continuous gesture, with a mint signal dot at the peak.
 * Original artwork; not derived from any existing platform logo.
 */
export function LogoMark({ size = 40, radius }: { size?: number; radius?: number }) {
  const theme = useTheme();
  const r = radius ?? size * 0.3;
  const stroke = size * 0.13;
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52">
      <Defs>
        <SvgGradient id="vcTile" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6C4CF1" />
          <Stop offset="0.55" stopColor="#A84CF1" />
          <Stop offset="1" stopColor="#FF5C7A" />
        </SvgGradient>
      </Defs>
      <Rect x="0" y="0" width="52" height="52" rx={r * (52 / size)} fill="url(#vcTile)" />
      <Path
        d="M 13 15 L 24.5 37 L 36 15"
        stroke="#FFFFFF"
        strokeWidth={(stroke * 52) / size}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={39.5} cy={14} r={(stroke * 1.35 * 52) / size} fill="#2BE0C8" />
      <Circle cx={13} cy={15} r={(stroke * 0.75 * 52) / size} fill={theme.dark ? '#0B091233' : '#FFFFFFAA'} />
    </Svg>
  );
}

export function Wordmark({ size = 22, color }: { size?: number; color?: string }) {
  const theme = useTheme();
  return (
    <Text style={{ fontSize: size, letterSpacing: -0.8, fontWeight: '300', color: color ?? theme.text }}>
      <Text style={{ fontWeight: '800', color: theme.brand }}>Vibe</Text>
      <Text style={{ fontWeight: '300' }}>Connect</Text>
    </Text>
  );
}

export function Logo({ size = 40, showWord = true }: { size?: number; showWord?: boolean }) {
  return (
    <View style={styles.row}>
      <LogoMark size={size} />
      {showWord ? (
        <View>
          <Wordmark size={size * 0.55} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 10 } });

import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '../lib/store';

export interface SeriesPoint {
  label: string;
  value: number;
}

/** Area + line chart drawn with react-native-svg (no chart dependency). */
export function AreaChart({ data, height = 150, color, labels = true }: { data: SeriesPoint[]; height?: number; color?: string; labels?: boolean }) {
  const theme = useTheme();
  const stroke = color ?? theme.brand;
  const width = 320;
  const padX = 8;
  const padTop = 12;
  const padBottom = labels ? 22 : 8;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = padX + i * step;
    const y = padTop + (1 - d.value / max) * (height - padTop - padBottom);
    return { x, y, ...d };
  });
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area =
    points.length > 1
      ? `${line} L ${points[points.length - 1].x.toFixed(1)} ${height - padBottom} L ${points[0].x.toFixed(1)} ${height - padBottom} Z`
      : '';

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <SvgGradient id="vcAreaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stroke} stopOpacity={0.35} />
            <Stop offset="1" stopColor={stroke} stopOpacity={0.02} />
          </SvgGradient>
        </Defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <Path
            key={f}
            d={`M ${padX} ${padTop + f * (height - padTop - padBottom)} L ${width - padX} ${padTop + f * (height - padTop - padBottom)}`}
            stroke={theme.border}
            strokeWidth={1}
            strokeDasharray="3 5"
          />
        ))}
        {area ? <Path d={area} fill="url(#vcAreaFill)" /> : null}
        {points.length > 1 ? <Path d={line} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4.5 : 3} fill={i === points.length - 1 ? stroke : theme.surface} stroke={stroke} strokeWidth={2} />
        ))}
      </Svg>
      {labels ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2, marginTop: 4 }}>
          {data.map((d, i) => (
            <Text key={`${d.label}-${i}`} style={{ color: theme.textFaint, fontSize: 11, fontWeight: '700', flex: 1, textAlign: 'center' }}>
              {d.label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Horizontal comparison bars — no scroll container needed. */
export function BarList({ data, color, unit = '' }: { data: SeriesPoint[]; color?: string; unit?: string }) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((d) => d.value));
  const accent = color ?? theme.brand;
  return (
    <View style={{ gap: 12 }}>
      {data.map((d) => (
        <View key={d.label}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />
              <Text style={{ color: theme.textMuted, fontSize: 12.5, fontWeight: '600' }}>{d.label}</Text>
            </View>
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800' }}>
              {d.value}
              {unit}
            </Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.dark ? '#241E36' : '#E9E6F4', overflow: 'hidden' }}>
            <View style={{ width: `${Math.round((d.value / max) * 100)}%`, height: '100%', borderRadius: 4, backgroundColor: accent }} />
          </View>
        </View>
      ))}
    </View>
  );
}

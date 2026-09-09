import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as media from '../lib/media';
import { useTheme } from '../lib/store';
import { radii, spacing } from '../lib/theme';
import { Banner, Button, Sheet } from './UI';

type IconName = keyof typeof Ionicons.glyphMap;

export function MediaPicker({
  visible,
  onClose,
  onSelect,
  kind = 'any',
  title = 'Add media',
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (items: media.PickedMedia[]) => void;
  kind?: 'image' | 'video' | 'any';
  title?: string;
}) {
  const theme = useTheme();
  const [note, setNote] = useState<string | null>(null);

  const finish = (items: media.PickedMedia[] | null) => {
    if (!items || items.length === 0) {
      setNote('Nothing selected \u2014 your device may be blocking media access. You can pick from the sample library below.');
      return;
    }
    setNote(null);
    onClose();
    onSelect(items);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title} maxHeight="88%">
      {note ? <Banner text={note} tone="warning" icon="warning-outline" /> : null}
      <View style={styles.optionRow}>
        <Button label="Photo library" icon="images-outline" variant="secondary" size="sm" onPress={() => media.pickFromLibrary(kind === 'video' ? 'video' : kind === 'image' ? 'image' : 'any').then(finish)} style={{ flex: 1 }} />
        <Button label="Camera" icon="camera-outline" variant="secondary" size="sm" onPress={() => media.captureWithCamera(kind === 'video' ? 'video' : 'image').then((item) => finish(item ? [item] : null))} style={{ flex: 1 }} />
      </View>

      <Text style={[styles.sampleTitle, { color: theme.textMuted }]}>Or use the sample library</Text>
      <View style={styles.grid}>
        {(kind === 'video' ? [] : media.SAMPLE_IMAGES).map((sample) => (
          <Pressable
            key={sample.id}
            style={styles.gridItem}
            onPress={() => {
              onClose();
              onSelect([{ uri: sample.uri, type: 'image' }]);
            }}
          >
            <Image source={{ uri: sample.uri }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={150} />
            <View style={styles.gridScrim}>
              <Text style={styles.gridLabel} numberOfLines={1}>
                {sample.label}
              </Text>
            </View>
          </Pressable>
        ))}
        {kind !== 'image'
          ? media.SAMPLE_VIDEOS.slice(0, kind === 'video' ? 12 : 6).map((uri, i) => (
              <Pressable
                key={uri}
                style={styles.gridItem}
                onPress={() => {
                  onClose();
                  onSelect([{ uri, type: 'video', durationMs: 30000 }]);
                }}
              >
                <Image source={{ uri: `https://picsum.photos/seed/vclip${i}/300/300` }} style={StyleSheet.absoluteFill as any} contentFit="cover" transition={150} />
                <View style={styles.gridScrim}>
                  <Ionicons name="play-circle" size={22} color="#fff" />
                  <Text style={styles.gridLabel} numberOfLines={1}>
                    Clip {i + 1}
                  </Text>
                </View>
              </Pressable>
            ))
          : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  optionRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  sampleTitle: { fontSize: 13, fontWeight: '700', marginBottom: spacing.md, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '31%', aspectRatio: 1, borderRadius: radii.md, overflow: 'hidden', backgroundColor: '#241E36' },
  gridScrim: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', padding: 6, gap: 2 },
  gridLabel: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

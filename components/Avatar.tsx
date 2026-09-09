import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/store';
import { gradients } from '../lib/theme';
import { initials } from '../lib/format';

export function Avatar({
  uri,
  name,
  size = 44,
  ring,
  ringColor,
  onPress,
  showOnline,
}: {
  uri?: string | null;
  name: string;
  size?: number;
  ring?: boolean;
  ringColor?: string;
  onPress?: () => void;
  showOnline?: boolean;
}) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const radius = size / 2;
  const body = (
    <View style={{ width: size, height: size, borderRadius: radius }}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius, backgroundColor: theme.surfaceAlt }}
          contentFit="cover"
          transition={180}
          onError={() => setFailed(true)}
        />
      ) : (
        <LinearGradient colors={gradients.brandSoft as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.brand, fontWeight: '800', fontSize: size * 0.36, letterSpacing: -0.4 }}>{initials(name)}</Text>
        </LinearGradient>
      )}
      {showOnline ? <View style={[styles.online, { backgroundColor: theme.accent, borderColor: theme.surface, width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14 }]} /> : null}
    </View>
  );

  if (ring) {
    return (
      <View style={{ width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, padding: 2.5, backgroundColor: ringColor ?? theme.brand, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size + 1, height: size + 1, borderRadius: (size + 1) / 2, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }}>{body}</View>
      </View>
    );
  }
  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={6}>
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  online: { position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
});

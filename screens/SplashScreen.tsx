/**
 * Branded splash — shows logo + app name, then navigates to MainTabs.
 * Buyers: swap the Ionicons logo for your own Image require() asset.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import config from '../config/config';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { theme, ready } = useApp();
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const textY = useSharedValue(16);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withTiming(1, { duration: 500 });
    textY.value = withDelay(150, withSpring(0));
  }, [scale, opacity, textY]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      navigation.replace('MainTabs');
    }, 1600);
    return () => clearTimeout(t);
  }, [ready, navigation]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: textY.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <View style={styles.logoCircle}>
          {/* Replace with: <Image source={require('../assets/logo.png')} style={styles.logoImg} /> */}
          <Ionicons name="pulse" size={52} color={theme.colors.primary} />
        </View>
      </Animated.View>

      <Animated.View style={textStyle}>
        <Text style={styles.appName}>{config.appName}</Text>
        <Text style={styles.tagline}>{config.tagline}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by WordPress REST API</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoWrap: {
    marginBottom: 28,
  },
  logoCircle: {
    width: 108,
    height: 108,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
  },
  footerText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '500',
  },
});

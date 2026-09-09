import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { GRADIENT, brand, fontSizes, radius, spacing, useTheme } from '../theme';
import { fmtCount, initials } from '../lib/format';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/* ------------------------------------------------------------------ logo */

export const Logo: React.FC<{ size?: number; showWord?: boolean }> = ({ size = 34, showWord = true }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <LinearGradient
        colors={GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: size * 0.32, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="radio-outline" size={size * 0.58} color="#fff" />
      </LinearGradient>
      {showWord && (
        <Text style={{ color: theme.text, fontSize: size * 0.56, fontWeight: '800', letterSpacing: -0.6 }}>
          Vibe<Text style={{ color: theme.primary }}>Connect</Text>
        </Text>
      )}
    </View>
  );
};

/* ---------------------------------------------------------------- avatar */

export const Avatar: React.FC<{
  uri?: string;
  name?: string;
  size?: number;
  ring?: 'none' | 'story' | 'live';
  online?: boolean;
  onPress?: () => void;
}> = ({ uri, name = '', size = 44, ring = 'none', online, onPress }) => {
  const { theme } = useTheme();
  const inner = (
    <View style={{ width: size, height: size }}>
      <ExpoImage
        source={uri ? { uri } : undefined}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.surfaceAlt }}
        contentFit="cover"
        transition={180}
        cachePolicy="memory-disk"
      />
      {!uri && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: theme.textDim, fontWeight: '700', fontSize: size * 0.36 }}>{initials(name)}</Text>
        </View>
      )}
      {online != null && (
        <View
          style={{
            position: 'absolute',
            right: -1,
            bottom: -1,
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: size * 0.15,
            backgroundColor: online ? theme.success : theme.textFaint,
            borderWidth: 2,
            borderColor: theme.bg,
          }}
        />
      )}
    </View>
  );
  if (ring === 'none') {
    return onPress ? <Pressable onPress={onPress} hitSlop={6}>{inner}</Pressable> : inner;
  }
  return (
    <View style={{ padding: 2.5, borderRadius: size / 2 + 3 }}>
      <LinearGradient
        colors={ring === 'live' ? [brand.rose, brand.amber] : [brand.rose, brand.amber, brand.violet, brand.cyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 2.5, borderRadius: size / 2 + 1 }}
      >
        <View style={{ padding: 2, borderRadius: size / 2, backgroundColor: theme.bg }}>{inner}</View>
      </LinearGradient>
    </View>
  );
};

/* --------------------------------------------------------------- buttons */

export const Button: React.FC<{
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}> = ({ title, onPress, variant = 'primary', size = 'md', icon, loading, disabled, full, style, accessibilityLabel }) => {
  const { theme } = useTheme();
  const h = size === 'lg' ? 52 : size === 'sm' ? 36 : 44;
  const bg =
    variant === 'primary' ? theme.primary
    : variant === 'danger' ? theme.danger
    : variant === 'soft' ? theme.primarySoft
    : variant === 'secondary' ? theme.surfaceAlt
    : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger' ? theme.onPrimary
    : variant === 'soft' || variant === 'secondary' ? theme.text
    : theme.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: h, borderRadius: radius.pill, backgroundColor: bg,
          alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
          paddingHorizontal: size === 'sm' ? 14 : 20, opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
          alignSelf: full ? 'stretch' : 'flex-start',
          borderWidth: variant === 'ghost' ? 1.5 : 0,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 15 : 18} color={fg} />}
          <Text style={{ color: fg, fontWeight: '700', fontSize: size === 'sm' ? 13 : 15 }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

export const IconBtn: React.FC<{
  name: IconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  badge?: number;
  accessibilityLabel: string;
  active?: boolean;
}> = ({ name, onPress, size = 23, color, badge = 0, accessibilityLabel, active }) => {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 6, position: 'relative' })}
    >
      <Ionicons name={name} size={size} color={color ?? (active ? theme.primary : theme.text)} />
      {badge > 0 && (
        <View
          style={{
            position: 'absolute', top: 0, right: 0, minWidth: 17, height: 17, borderRadius: 9,
            backgroundColor: theme.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </Pressable>
  );
};

/* ---------------------------------------------------------------- fields */

export const Field: React.FC<
  TextInputProps & { label?: string; error?: string | null; icon?: IconName; helperText?: string }
> = ({ label, error, icon, helperText, style, ...rest }) => {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6, marginBottom: 14 }}>
      {label ? (
        <Text style={{ color: theme.textDim, fontSize: 12.5, fontWeight: '700', marginLeft: 4 }}>{label}</Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: theme.surface, borderRadius: radius.md,
          borderWidth: 1.5, borderColor: error ? theme.danger : focused ? theme.primary : theme.border,
          paddingHorizontal: 14, minHeight: 50,
        }}
      >
        {icon && <Ionicons name={icon} size={18} color={focused ? theme.primary : theme.textFaint} />}
        <TextInput
          {...rest}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          placeholderTextColor={theme.textFaint}
          style={[{ flex: 1, color: theme.text, fontSize: 15, paddingVertical: 12 }, style]}
        />
      </View>
      {error ? (
        <Animated.Text entering={FadeIn} exiting={FadeOut} style={{ color: theme.danger, fontSize: 12.5, marginLeft: 6 }}>
          {error}
        </Animated.Text>
      ) : helperText ? (
        <Text style={{ color: theme.textFaint, fontSize: 12, marginLeft: 6 }}>{helperText}</Text>
      ) : null}
    </View>
  );
};

export const Chip: React.FC<{
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
}> = ({ label, active, onPress, icon }) => {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
        backgroundColor: active ? theme.primary : theme.surface,
        borderWidth: 1, borderColor: active ? theme.primary : theme.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon && <Ionicons name={icon} size={14} color={active ? theme.onPrimary : theme.textDim} />}
      <Text style={{ color: active ? theme.onPrimary : theme.textDim, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
};

export const Segmented: React.FC<{
  options: { key: string; label: string; icon?: IconName }[];
  value: string;
  onChange: (k: string) => void;
  scroll?: boolean;
}> = ({ options, value, onChange, scroll }) => {
  const { theme } = useTheme();
  const body = options.map((o) => {
    const active = o.key === value;
    return (
      <Pressable
        key={o.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => onChange(o.key)}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14,
          borderRadius: radius.pill, backgroundColor: active ? theme.primarySoft : 'transparent',
          flex: scroll ? undefined : 1,
        }}
      >
        {o.icon && <Ionicons name={o.icon} size={15} color={active ? theme.primary : theme.textFaint} />}
        <Text style={{ color: active ? theme.primary : theme.textFaint, fontWeight: '700', fontSize: 13 }}>{o.label}</Text>
      </Pressable>
    );
  });
  if (scroll) return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>{body}</ScrollView>;
  return (
    <View style={{ flexDirection: 'row', backgroundColor: theme.surfaceAlt, borderRadius: radius.pill, padding: 4, gap: 4 }}>
      {body}
    </View>
  );
};

/* ---------------------------------------------------------------- layout */

export const Card: React.FC<{ children: React.ReactNode; style?: ViewStyle; padded?: boolean }> = ({
  children, style, padded = true,
}) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.surface, borderRadius: radius.lg, padding: padded ? spacing.lg : 0,
          borderWidth: 1, borderColor: theme.border,
          shadowColor: theme.shadowColor, shadowOpacity: theme.mode === 'dark' ? 0.35 : 0.08,
          shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const SectionTitle: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ color: theme.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>{title}</Text>
      {action}
    </View>
  );
};

export const Stat: React.FC<{ value: number | string; label: string; money?: boolean }> = ({ value, label, money }) => {
  const { theme } = useTheme();
  const text = typeof value === 'number' ? (money ? `$${value.toLocaleString()}` : fmtCount(value)) : value;
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>{text}</Text>
      <Text style={{ color: theme.textFaint, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
};

export const Divider: React.FC<{ spacing?: number }> = ({ spacing: s = 12 }) => {
  const { theme } = useTheme();
  return <View style={{ height: 1, backgroundColor: theme.border, marginVertical: s }} />;
};

export const DemoTag: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: theme.primarySoft }}>
      <Text style={{ color: theme.primary, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 }}>DEMO</Text>
    </View>
  );
};

export const Pill: React.FC<{ text: string; color?: string; icon?: IconName }> = ({ text, color, icon }) => {
  const { theme } = useTheme();
  const c = color ?? theme.textDim;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: theme.surfaceAlt }}>
      {icon && <Ionicons name={icon} size={12} color={c} />}
      <Text style={{ color: c, fontSize: 11.5, fontWeight: '700' }}>{text}</Text>
    </View>
  );
};

export const EmptyState: React.FC<{
  icon: IconName;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => {
  const { theme } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(260)} style={{ alignItems: 'center', paddingVertical: 46, paddingHorizontal: 30, gap: 8 }}>
      <View style={{ width: 74, height: 74, borderRadius: 37, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={32} color={theme.primary} />
      </View>
      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16.5, marginTop: 6, textAlign: 'center' }}>{title}</Text>
      {subtitle ? <Text style={{ color: theme.textFaint, fontSize: 13.5, textAlign: 'center', lineHeight: 19 }}>{subtitle}</Text> : null}
      {action ? <View style={{ marginTop: 10 }}>{action}</View> : null}
    </Animated.View>
  );
};

export const Skeleton: React.FC<{ height?: number; radius?: number; style?: ViewStyle }> = ({ height = 16, radius: r = 8, style }) => {
  const { theme } = useTheme();
  const [pulse, setPulse] = useState(0.55);
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => (p > 0.5 ? 0.3 : 0.62)), 620);
    return () => clearInterval(id);
  }, []);
  return <View style={[{ height, borderRadius: r, backgroundColor: theme.skeleton, opacity: pulse }, style]} />;
};

export const ProgressRing: React.FC<{ value: number; size?: number; thickness?: number }> = ({ value, size = 62, thickness = 6 }) => {
  const { theme } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: thickness, borderColor: theme.surfaceAlt } as ViewStyle} />
      <LinearGradient
        colors={GRADIENT}
        style={{
          position: 'absolute', width: size, height: size, borderRadius: size / 2,
          borderWidth: thickness, borderColor: 'transparent',
          borderTopColor: GRADIENT[0], transform: [{ rotate: `${pct * 360}deg` }],
        }}
      />
      <Text style={{ position: 'absolute', color: theme.text, fontWeight: '800', fontSize: size * 0.26 }}>
        {Math.round(pct * 100)}%
      </Text>
    </View>
  );
};

/* ----------------------------------------------------------------- toast */

interface ToastCtx { show: (msg: string, icon?: IconName) => void }
const ToastContext = createContext<ToastCtx>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

export const ToastHost: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const [toast, setToast] = useState<{ msg: string; icon: IconName; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string, icon: IconName = 'checkmark-circle') => {
    setToast({ msg, icon, id: Date.now() });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.springify().damping(18)}
          exiting={FadeOut}
          pointerEvents="none"
          style={{
            position: 'absolute', bottom: 96, left: 20, right: 20,
            backgroundColor: theme.mode === 'dark' ? '#241F42' : '#221C3F',
            borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16,
            flexDirection: 'row', alignItems: 'center', gap: 10,
            shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
          }}
        >
          <Ionicons name={toast.icon} size={18} color={brand.cyan} />
          <Text style={{ color: '#F5F3FF', flex: 1, fontSize: 13.5, fontWeight: '600' }}>{toast.msg}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export { fontSizes };
export const sp = spacing;
export const rad = radius;
export { Image, brand };

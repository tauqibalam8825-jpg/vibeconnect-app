import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardTypeOptions,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTheme } from '../lib/store';
import { gradients, radii, shadow, spacing } from '../lib/theme';
import { passwordStrength } from '../lib/validation';

type IconName = keyof typeof Ionicons.glyphMap;

export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[{ backgroundColor: theme.surface, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, padding: padded ? spacing.lg : 0 }, shadow(2, theme), style]}>
      {children}
    </View>
  );
}

export function Divider({ spaced = false }: { spaced?: boolean }) {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.divider, marginVertical: spaced ? spacing.md : 0 }} />;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 13 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({ label, active, onPress, icon, count }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName; count?: number }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? theme.brand : theme.surfaceAlt,
          borderColor: active ? 'transparent' : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? '#fff' : theme.textMuted} /> : null}
      <Text style={{ color: active ? '#fff' : theme.textMuted, fontWeight: '700', fontSize: 13 }}>{label}</Text>
      {typeof count === 'number' ? (
        <View style={[styles.chipCount, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : theme.brandSoft }]}>
          <Text style={{ color: active ? '#fff' : theme.brand, fontSize: 11, fontWeight: '800' }}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  size = 'md',
  full = true,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'mint';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const height = size === 'lg' ? 54 : size === 'sm' ? 36 : 48;
  const fontSize = size === 'lg' ? 16 : size === 'sm' ? 13 : 15;
  const isDisabled = disabled || loading;
  const color = variant === 'danger' || variant === 'mint' ? '#fff' : variant === 'primary' ? '#fff' : theme.text;
  const iconColor = variant === 'secondary' || variant === 'ghost' ? theme.text : color;

  const content = (
    <View style={styles.btnInner}>
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={fontSize + 2} color={iconColor} /> : null}
          <Text style={{ color, fontSize, fontWeight: '800', letterSpacing: -0.2 }}>{label}</Text>
        </>
      )}
    </View>
  );

  return (
    <Animated.View style={[{ width: full ? '100%' : undefined }, animated, style]}>
      <Pressable
        disabled={isDisabled}
        onPressIn={() => (scale.value = withTiming(0.97, { duration: 90 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 140 }))}
        onPress={onPress}
        style={({ pressed }) => [
          { height, borderRadius: radii.md, overflow: 'hidden', opacity: isDisabled ? 0.5 : pressed ? 0.92 : 1, width: '100%' },
          shadow(variant === 'ghost' ? 0 : 3, theme),
        ]}
      >
        {variant === 'primary' || variant === 'danger' || variant === 'mint' ? (
          <LinearGradient
            colors={
              variant === 'danger'
                ? [theme.danger, '#B1274A']
                : variant === 'mint'
                  ? (gradients.mint as unknown as string[])
                  : (gradients.brand as unknown as string[])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnFill}
          >
            {content}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.btnFill,
              {
                backgroundColor: variant === 'ghost' ? 'transparent' : theme.surfaceAlt,
                borderWidth: variant === 'ghost' ? 0 : StyleSheet.hairlineWidth,
                borderColor: theme.border,
              },
            ]}
          >
            {content}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function IconButton({
  icon,
  onPress,
  size = 40,
  iconSize = 21,
  variant = 'surface',
  color,
  label,
  badge,
  style,
}: {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  variant?: 'surface' | 'ghost' | 'gradient';
  color?: string;
  label?: string;
  badge?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          overflow: 'hidden' as const,
          opacity: pressed ? 0.75 : 1,
          backgroundColor: variant === 'surface' ? theme.surfaceAlt : 'transparent',
          borderWidth: variant === 'surface' ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {variant === 'gradient' ? (
        <LinearGradient colors={gradients.brand as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={iconSize} color="#fff" />
        </LinearGradient>
      ) : (
        <Ionicons name={icon} size={iconSize} color={color ?? theme.text} />
      )}
      {badge && badge > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.danger, borderColor: theme.surface }]}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  returnKeyType,
  onSubmitEditing,
  multiline,
  icon,
  rightIcon,
  onRightPress,
  maxLength,
  editable = true,
  autoFocus,
}: {
  label?: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  returnKeyType?: 'done' | 'go' | 'next' | 'send' | 'search';
  onSubmitEditing?: () => void;
  multiline?: boolean;
  icon?: IconName;
  rightIcon?: IconName;
  onRightPress?: () => void;
  maxLength?: number;
  editable?: boolean;
  autoFocus?: boolean;
}) {
  const theme = useTheme();
  const [focused, setFocused] = React.useState(false);
  const [hidden, setHidden] = React.useState(!!secureTextEntry);
  const strength = secureTextEntry && value ? passwordStrength(value) : null;
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label ? <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: theme.inputBg,
            borderColor: error ? theme.danger : focused ? theme.brand : theme.border,
            borderWidth: focused || error ? 1.5 : StyleSheet.hairlineWidth,
            opacity: editable ? 1 : 0.6,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={theme.textFaint} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textFaint}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          multiline={multiline}
          editable={editable}
          autoFocus={autoFocus}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { color: theme.text, textAlignVertical: multiline ? 'top' : 'center', minHeight: multiline ? 90 : undefined }]}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={theme.textFaint} />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onRightPress} hitSlop={10}>
            <Ionicons name={rightIcon} size={19} color={theme.textFaint} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={theme.danger} />
          <Text style={{ color: theme.danger, fontSize: 12.5, fontWeight: '600', flex: 1 }}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 6 }}>{hint}</Text>
      ) : null}
      {strength ? (
        <View style={styles.strengthRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                marginRight: 4,
                backgroundColor: i < strength.score ? (strength.score === 3 ? theme.success : strength.score === 2 ? theme.warning : theme.danger) : theme.border,
              }}
            />
          ))}
          <Text style={{ color: theme.textFaint, fontSize: 11.5, fontWeight: '700', marginLeft: 6 }}>{strength.label}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: Array<{ value: T; label: string; icon?: IconName }>; value: T; onChange: (v: T) => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable key={opt.value} onPress={() => onChange(opt.value)} style={[styles.segmentItem, active && { backgroundColor: theme.dark ? '#2C2545' : '#fff', ...shadow(2, theme) }]}>
            {opt.icon ? <Ionicons name={opt.icon} size={15} color={active ? theme.brand : theme.textFaint} /> : null}
            <Text style={{ color: active ? theme.text : theme.textFaint, fontWeight: active ? '800' : '600', fontSize: 13 }}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon = 'sparkles-outline', title, subtitle, actionLabel, onAction }: { icon?: IconName; title: string; subtitle?: string; actionLabel?: string; onAction?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <LinearGradient colors={gradients.brandSoft as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={theme.brand} />
      </LinearGradient>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.emptyBody, { color: theme.textMuted }]}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.lg, width: 200 }}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" />
        </View>
      ) : null}
    </View>
  );
}

export function Skeleton({ height = 16, width = '100%', radius = 8, style }: { height?: number; width?: number | `${number}%`; radius?: number; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const progress = useSharedValue(0.4);
  useEffect(() => {
    progress.value = withRepeat(withSequence(withTiming(0.85, { duration: 750 }), withTiming(0.4, { duration: 750 })), -1, false);
  }, [progress]);
  const animated = useAnimatedStyle(() => ({ opacity: progress.value }));
  return <Animated.View style={[{ height, width, borderRadius: radius, backgroundColor: theme.dark ? '#241E36' : '#E9E6F4' }, animated, style]} />;
}

export function Banner({ text, icon = 'information-circle', tone = 'info', onAction, actionLabel }: { text: string; icon?: IconName; tone?: 'info' | 'success' | 'warning' | 'danger'; onAction?: () => void; actionLabel?: string }) {
  const theme = useTheme();
  const color = tone === 'success' ? theme.success : tone === 'warning' ? theme.warning : tone === 'danger' ? theme.danger : theme.brand;
  return (
    <View style={[styles.banner, { backgroundColor: theme.dark ? `${color}1F` : `${color}14`, borderColor: `${color}44` }]}>
      <Ionicons name={icon} size={17} color={color} style={{ marginTop: 1 }} />
      <Text style={{ color: theme.text, fontSize: 13, lineHeight: 19, flex: 1 }}>{text}</Text>
      {onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color, fontWeight: '800', fontSize: 13 }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProgressBar({ fraction, height = 6, color }: { fraction: number; height?: number; color?: string }) {
  const theme = useTheme();
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: theme.dark ? '#2A2440' : '#E9E6F4', overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, fraction * 100))}%`, height: '100%', backgroundColor: color ?? theme.brand, borderRadius: height / 2 }} />
    </View>
  );
}

export function Pill({ icon, label, active, onPress, color }: { icon?: IconName; label: string; active?: boolean; onPress?: () => void; color?: string }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: radii.pill,
        backgroundColor: active ? theme.brandSoft : theme.surfaceAlt,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: active ? `${theme.brand}55` : theme.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={14} color={color ?? (active ? theme.brand : theme.textFaint)} /> : null}
      <Text style={{ color: active ? theme.brand : theme.textMuted, fontWeight: '700', fontSize: 12.5 }}>{label}</Text>
    </Pressable>
  );
}

export function Sheet({ visible, onClose, title, children, maxHeight = '82%' }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode; maxHeight?: number | `${number}%` }) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.surface, maxHeight }, shadow(12, theme)]}>
        <View style={[styles.grabber, { backgroundColor: theme.border }]} />
        {title ? (
          <View style={styles.sheetHeader}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', flex: 1 }}>{title}</Text>
            <IconButton icon="close" onPress={onClose} size={32} iconSize={18} />
          </View>
        ) : null}
        <ScrollView style={{ paddingHorizontal: spacing.lg }} contentContainerStyle={{ paddingBottom: spacing.xl }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function StatTile({ label, value, icon, tint }: { label: string; value: string; icon?: IconName; tint?: string }) {
  const theme = useTheme();
  const color = tint ?? theme.brand;
  return (
    <View style={[styles.statTile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {icon ? (
        <View style={[styles.statIcon, { backgroundColor: theme.dark ? `${color}22` : `${color}18` }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
      ) : null}
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ color: theme.textFaint, fontSize: 12, fontWeight: '600', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, flex: 1 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth },
  chipCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radii.pill, marginLeft: 2 },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, height: '100%' },
  btnFill: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  label: { fontSize: 12.5, fontWeight: '700', marginBottom: 7, letterSpacing: 0.2, textTransform: 'uppercase' as const },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radii.md, paddingHorizontal: 14, minHeight: 52, borderWidth: 1 },
  input: { flex: 1, fontSize: 15.5, paddingVertical: 14, outlineStyle: 'none' } as any,
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, gap: 4 },
  segmentItem: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 5, paddingVertical: 9, borderRadius: radii.sm },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyIcon: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 6, maxWidth: 300 },
  banner: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.lg },
  sheet: { position: 'absolute' as const, left: 0, right: 0, bottom: 0, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 8, paddingBottom: 12 },
  grabber: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: 12 },
  statTile: { flex: 1, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, padding: 14, minWidth: 100 },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
});

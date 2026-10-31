/**
 * Ports of shared Flutter widgets:
 *  - lib/widgets/empty_state_widget.dart      → EmptyState
 *  - lib/widgets/loading_skeleton_widget.dart → LoadingSkeleton
 *  - lib/widgets/status_badge_widget.dart     → StatusBadge
 * plus small primitives used across many screens (ElevatedButton, Switch, gradients).
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
  ActivityIndicator, DimensionValue, Platform, Pressable, StyleProp, Switch as RNSwitch, View, ViewStyle,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle as SvgCircle, Defs, G as SvgG, RadialGradient, Rect, Stop } from 'react-native-svg';
import { AppColors, argb, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';
import { AppIcon } from './AppIcon';
import { Text } from './Text';

/* ------------------------------------------------------------------ EmptyState */
export function EmptyState({
  iconName, title, subtitle, ctaLabel, onCtaTap, testID,
}: { iconName: string; title: string; subtitle: string; ctaLabel?: string; onCtaTap?: () => void; testID?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }} testID={testID}>
      <View
        style={{
          width: 88, height: 88, borderRadius: 44, backgroundColor: argb('0FC9A84C'),
          borderWidth: 1, borderColor: argb('33C9A84C'), alignItems: 'center', justifyContent: 'center',
        }}
      >
        <AppIcon name={iconName} color={AppColors.goldAccent} size={36} />
      </View>
      <Text style={{ marginTop: 20, color: AppColors.textPrimary, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ marginTop: 8, color: AppColors.textSecondary, fontSize: 14, textAlign: 'center' }}>{subtitle}</Text>
      {ctaLabel && onCtaTap ? (
        <ElevatedButton label={ctaLabel} onPress={onCtaTap} style={{ marginTop: 28 }} paddingH={32} paddingV={14} fontSize={14} />
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------- LoadingSkeleton */
export function LoadingSkeleton({ width, height, borderRadius = 12 }: { width: DimensionValue; height: DimensionValue; borderRadius?: number }) {
  const colors = useThemeColors();
  const t = useSharedValue(-1);
  const w = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(2, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, false);
  }, [t]);
  const shimmer = useAnimatedStyle(() => ({ transform: [{ translateX: (t.value / 2) * w.value }] }));
  const baseBg = colors.isLight ? '#E5E7EB' : '#1A2640';
  const shimmerColors = (colors.isLight
    ? ['#E5E7EB', '#F3F4F6', '#E5E7EB']
    : ['#1A2640', '#2A3650', '#1A2640']) as [string, string, ...string[]];

  return (
    <View
      style={{ width, height, borderRadius, overflow: 'hidden', backgroundColor: baseBg }}
      onLayout={(e) => { w.value = e.nativeEvent.layout.width; }}
    >
      <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '100%' }, shimmer]}>
        <LinearGradient colors={shimmerColors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}

/* ----------------------------------------------------------------- StatusBadge */
export type BadgeStatus = 'online' | 'busy' | 'offline' | 'verified' | 'premium' | 'active' | 'pending';
const BADGE: Record<BadgeStatus, { label: string; bg: string; border: string; text: string; dot: string }> = {
  online: { label: 'Online', bg: argb('1A3DCB7A'), border: argb('333DCB7A'), text: '#3DCB7A', dot: '#3DCB7A' },
  busy: { label: 'Busy', bg: argb('1AD4821A'), border: argb('33D4821A'), text: '#D4821A', dot: '#D4821A' },
  offline: { label: 'Offline', bg: argb('1A6B7A99'), border: argb('226B7A99'), text: '#6B7A99', dot: '#6B7A99' },
  verified: { label: 'Verified', bg: argb('1AC9A84C'), border: argb('33C9A84C'), text: '#C9A84C', dot: '#C9A84C' },
  premium: { label: 'Premium', bg: argb('1A713B32'), border: argb('33713B32'), text: '#8E4C41', dot: '#713B32' },
  active: { label: 'Active', bg: argb('1A2D9E6B'), border: argb('332D9E6B'), text: '#2D9E6B', dot: '#2D9E6B' },
  pending: { label: 'Pending', bg: argb('1AD4821A'), border: argb('33D4821A'), text: '#D4821A', dot: '#D4821A' },
};
export function StatusBadge({ status, customLabel, fontSize = 11 }: { status: BadgeStatus; customLabel?: string; fontSize?: number }) {
  const c = BADGE[status];
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
        backgroundColor: c.bg, borderRadius: 100, borderWidth: 1, borderColor: c.border,
      }}
    >
      {status === 'online' || status === 'busy' ? (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.dot, marginRight: 4 }} />
      ) : null}
      <Text style={{ color: c.text, fontSize, fontWeight: '600' }}>{customLabel ?? c.label}</Text>
    </View>
  );
}

/* -------------------------------------------------------------- ElevatedButton */
export function ElevatedButton({
  label, onPress, style, bg = AppColors.primary, fg = '#FFFFFF', radius = 100,
  paddingV = 16, paddingH = 32, fontSize = 15, fontWeight = '600', disabled, loading, icon, testID, letterSpacing,
  disabledBg,
}: {
  label: string; onPress?: () => void; style?: StyleProp<ViewStyle>; bg?: string; fg?: string; radius?: number;
  paddingV?: number; paddingH?: number; fontSize?: number; fontWeight?: '500' | '600' | '700' | '800';
  disabled?: boolean; loading?: boolean; icon?: string; testID?: string; letterSpacing?: number; disabledBg?: string;
}) {
  const isDisabled = disabled || !onPress;
  return (
    <Pressable
      testID={testID}
      onPress={isDisabled ? undefined : onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
      style={({ pressed }) => [
        {
          backgroundColor: isDisabled ? disabledBg ?? withAlpha(bg, 97) : bg,
          borderRadius: radius, paddingVertical: paddingV, paddingHorizontal: paddingH,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          opacity: pressed && Platform.OS === 'ios' ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon ? <AppIcon name={icon} size={fontSize + 3} color={fg} style={{ marginRight: 8 }} /> : null}
          <Text style={{ color: fg, fontSize, fontWeight, letterSpacing }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/* --------------------------------------------------------------------- Switch */
export function Switch({
  value, onValueChange, activeColor, testID,
}: { value: boolean; onValueChange: (v: boolean) => void; activeColor?: string; testID?: string }) {
  const colors = useThemeColors();
  const ac = activeColor ?? colors.goldAccent;
  const offColor = colors.isLight ? '#D0D5DD' : colors.surfaceVariant;
  return (
    <RNSwitch
      testID={testID}
      value={value}
      onValueChange={onValueChange}
      thumbColor={Platform.OS === 'android' ? (value ? ac : colors.textMuted) : undefined}
      trackColor={{ false: offColor, true: withAlpha(ac, 100) }}
      ios_backgroundColor={offColor}
    />
  );
}

/* ------------------------------------------------------- Radial gradient layer */
export function RadialGlow({
  colors, stops, cx = '50%', cy = '50%', r = '50%', style,
}: { colors: string[]; stops?: number[]; cx?: string; cy?: string; r?: string; style?: StyleProp<ViewStyle> }) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '') || 'radialGlow';

  const parseCoord = (v?: string | number, fallback = 0.5): number => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const num = parseFloat(v);
      if (!isNaN(num)) return v.endsWith('%') ? num / 100 : num;
    }
    return fallback;
  };

  const parsedCx = parseCoord(cx, 0.5);
  const parsedCy = parseCoord(cy, 0.5);
  const parsedR = parseCoord(r, 0.5);

  return (
    <View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient
            id={id}
            cx={parsedCx}
            cy={parsedCy}
            rx={parsedR}
            ry={parsedR}
            fx={parsedCx}
            fy={parsedCy}
            gradientUnits="objectBoundingBox"
          >
            {colors.map((c, i) => (
              <Stop key={i} offset={stops ? stops[i] : i / Math.max(1, colors.length - 1)} stopColor={c} />
            ))}
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export function Divider({ color = AppColors.divider, marginV = 0, indent = 0 }: { color?: string; marginV?: number; indent?: number }) {
  return <View style={{ height: 1, backgroundColor: color, marginVertical: marginV, marginLeft: indent }} />;
}

/* --------------------------------------------- CircularProgressIndicator (SVG) */
export function ProgressRing({
  value, size = 36, strokeWidth = 4, color, backgroundColor = 'transparent', children, rounded = false,
}: { value: number; size?: number; strokeWidth?: number; color: string; backgroundColor?: string; children?: React.ReactNode; rounded?: boolean }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <SvgCircle cx={size / 2} cy={size / 2} r={r} stroke={backgroundColor} strokeWidth={strokeWidth} fill="none" />
        <SvgG rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <SvgCircle
            cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - v)} strokeLinecap={rounded ? 'round' : 'butt'}
          />
        </SvgG>
      </Svg>
      {children}
    </View>
  );
}

/* ------------------------------------------------ LinearProgressIndicator */
export function LinearProgress({ value, height = 4, color, backgroundColor, radius = 100 }: { value: number; height?: number; color: string; backgroundColor: string; radius?: number }) {
  return (
    <View style={{ height, borderRadius: radius, backgroundColor, overflow: 'hidden' }}>
      <View style={{ height, width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color, borderRadius: radius }} />
    </View>
  );
}

/* ------------------------------------------------------------- OutlinedButton */
export function OutlinedButton({
  label, onPress, color = AppColors.textPrimary, borderColor = AppColors.goldBorder, radius = 14, paddingV = 14, paddingH = 16,
  fontSize = 14, fontWeight = '600', icon, testID, style, borderWidth = 1,
}: {
  label: string; onPress?: () => void; color?: string; borderColor?: string; radius?: number; paddingV?: number; paddingH?: number;
  fontSize?: number; fontWeight?: '500' | '600' | '700'; icon?: string; testID?: string; style?: StyleProp<ViewStyle>; borderWidth?: number;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      android_ripple={{ color: withAlpha(color.startsWith('#') ? color : '#FFFFFF', 30) }}
      style={[{ borderWidth, borderColor, borderRadius: radius, paddingVertical: paddingV, paddingHorizontal: paddingH, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}
    >
      {icon ? <AppIcon name={icon} size={fontSize + 4} color={color} style={{ marginRight: 8 }} /> : null}
      <Text style={{ color, fontSize, fontWeight }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Flutter AnimatedContainer / AnimatedOpacity / AnimatedDefaultTextStyle equivalents built on
 * Reanimated 4 CSS transitions: any style change (colour, border, size, radius, opacity, transform)
 * is tweened with the given duration + curve, like an implicit Flutter animation.
 */
import React from 'react';
import { Pressable, PressableProps, StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import Animated, { cubicBezier, Easing, FadeIn, FadeOut, Keyframe, LinearTransition } from 'react-native-reanimated';
import { ralewayFamily } from '@/theme/fonts';

// Native Reanimated only accepts predefined keyword strings or cubicBezier() objects;
// raw 'cubic-bezier(...)' strings throw on Android/iOS (they only work on web).
export const CSS_CURVES = {
  linear: 'linear',
  ease: 'ease',
  easeIn: cubicBezier(0.42, 0, 1, 1),
  easeOut: cubicBezier(0, 0, 0.58, 1),
  easeInOut: cubicBezier(0.42, 0, 0.58, 1),
  easeOutCubic: cubicBezier(0.215, 0.61, 0.355, 1),
  easeInOutCubic: cubicBezier(0.645, 0.045, 0.355, 1),
  easeOutBack: cubicBezier(0.175, 0.885, 0.32, 1.275),
} as const;
export type CurveName = keyof typeof CSS_CURVES;

type BoxProps = ViewProps & { duration?: number; curve?: CurveName; style?: StyleProp<ViewStyle> };

export function AnimatedBox({ duration = 200, curve = 'linear', style, ...rest }: BoxProps) {
  return (
    <Animated.View
      {...rest}
      style={[
        style,
        { transitionProperty: 'all', transitionDuration: duration, transitionTimingFunction: CSS_CURVES[curve] } as never,
      ]}
    />
  );
}

/** GestureDetector/InkWell + AnimatedContainer in one. */
export function AnimatedPressable({
  duration = 200, curve = 'linear', style, children, ...rest
}: Omit<PressableProps, 'style'> & { duration?: number; curve?: CurveName; style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  return (
    <Pressable {...rest}>
      <AnimatedBox duration={duration} curve={curve} style={style}>{children}</AnimatedBox>
    </Pressable>
  );
}

/** AnimatedDefaultTextStyle */
export function AnimatedText({
  duration = 200, curve = 'linear', style, children, numberOfLines,
}: { duration?: number; curve?: CurveName; style: TextStyle; children: React.ReactNode; numberOfLines?: number }) {
  const { fontWeight, ...rest } = style;
  return (
    <Animated.Text
      allowFontScaling={false}
      numberOfLines={numberOfLines}
      style={[
        { color: '#F0EAD6', ...rest, fontFamily: ralewayFamily(fontWeight as string | undefined) },
        { transitionProperty: ['color', 'fontSize', 'opacity'], transitionDuration: duration, transitionTimingFunction: CSS_CURVES[curve] } as never,
      ]}
    >
      {children}
    </Animated.Text>
  );
}

/**
 * AnimatedSwitcher with Slide(begin: Offset(dx,0)) + Fade transition.
 * Children must carry a distinct `key` to trigger the switch.
 */
export function switcherEntering(dxPx: number, duration: number) {
  return new Keyframe({
    0: { opacity: 0, transform: [{ translateX: dxPx }] },
    100: { opacity: 1, transform: [{ translateX: 0 }], easing: Easing.out(Easing.cubic) },
  }).duration(duration);
}
export const switcherExiting = (duration: number) => FadeOut.duration(duration);

/**
 * ExpansionTile / AnimatedSize body: children fade+grow in (200 ms, Material default), collapse fades out.
 * Wrap the parent card in <Animated.View layout={EXPAND_LAYOUT}> so siblings slide smoothly.
 */
export const EXPAND_LAYOUT = LinearTransition.duration(200);
export function Expandable({ expanded, children, style }: { expanded: boolean; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  if (!expanded) return null;
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={style}>
      {children}
    </Animated.View>
  );
}

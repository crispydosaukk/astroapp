/**
 * Text / TextInput wrappers.
 *  - Maps fontWeight → Raleway family (custom fonts ignore fontWeight on Android).
 *  - allowFontScaling=false (Flutter forced TextScaler.linear(1.0) in MaterialApp.builder).
 */
import React from 'react';
import {
  StyleSheet, Text as RNText, TextInput as RNTextInput, TextInputProps, TextProps, TextStyle,
} from 'react-native';
import { AppColors } from '@/theme/colors';
import { ralewayFamily } from '@/theme/fonts';

function resolve(style: TextProps['style']): TextStyle {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const { fontWeight, fontFamily, ...rest } = flat;
  return { ...rest, fontFamily: fontFamily ?? ralewayFamily(fontWeight as string | undefined) };
}

export function Text({ style, ...props }: TextProps) {
  return <RNText allowFontScaling={false} {...props} style={[{ color: AppColors.textPrimary }, resolve(style)]} />;
}

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(function TextInput({ style, ...props }, ref) {
  return (
    <RNTextInput
      ref={ref}
      allowFontScaling={false}
      placeholderTextColor={AppColors.textMuted}
      selectionColor={AppColors.goldAccent}
      cursorColor={AppColors.goldAccent}
      {...props}
      style={[{ color: AppColors.textPrimary, padding: 0 }, resolve(style)]}
    />
  );
});

/** Flutter TextStyle(fontSize, height) → RN { fontSize, lineHeight }. */
export const lh = (fontSize: number, height: number) => ({ fontSize, lineHeight: Math.round(fontSize * height) });

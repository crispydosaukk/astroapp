/**
 * Text / TextInput wrappers.
 *  - Maps fontWeight → Raleway family (custom fonts ignore fontWeight on Android).
 *  - allowFontScaling=false (Flutter forced TextScaler.linear(1.0) in MaterialApp.builder).
 *  - Automatically maps theme colors for Dark Cosmic and Light Vedic so all text is crystal clear!
 */
import React from 'react';
import {
  StyleSheet, Text as RNText, TextInput as RNTextInput, TextInputProps, TextProps, TextStyle,
} from 'react-native';
import { AppColors } from '@/theme/colors';
import { ralewayFamily } from '@/theme/fonts';
import { useLanguageStore } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

function resolve(style: TextProps['style']): TextStyle {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const { fontWeight, fontFamily, ...rest } = flat;
  return { ...rest, fontFamily: fontFamily ?? ralewayFamily(fontWeight as string | undefined) };
}

function translateNode(node: React.ReactNode, translate: (t: string) => string): React.ReactNode {
  if (typeof node === 'string') {
    return translate(node);
  }
  if (typeof node === 'number') {
    return node;
  }
  if (Array.isArray(node)) {
    const isAllPrimitives = node.every(
      (c) => typeof c === 'string' || typeof c === 'number' || c == null
    );
    if (isAllPrimitives) {
      const combined = node.map((c) => (c == null ? '' : String(c))).join('');
      const translatedCombined = translate(combined);
      if (translatedCombined !== combined) {
        return translatedCombined;
      }
    }
    return React.Children.map(node, (child) => translateNode(child, translate));
  }
  return node;
}

export function Text({ style, children, ...props }: TextProps) {
  const { textPrimary, textSecondary, textMuted } = useThemeColors();
  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);
  const translateText = useLanguageStore((s) => s.translateText);
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;

  let resolvedColor = flat.color;
  if (!resolvedColor || resolvedColor === AppColors.textPrimary || resolvedColor === '#F0EAD6') {
    resolvedColor = textPrimary;
  } else if (resolvedColor === AppColors.textSecondary || resolvedColor === '#A0A8C0') {
    resolvedColor = textSecondary;
  } else if (resolvedColor === AppColors.textMuted || resolvedColor === '#6B7A99') {
    resolvedColor = textMuted;
  }

  const content = selectedLanguage === 'English'
    ? children
    : translateNode(children, translateText);

  return <RNText allowFontScaling={false} {...props} style={[resolve(style), { color: resolvedColor }]}>{content}</RNText>;
}

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(function TextInput({ style, placeholderTextColor, placeholder, ...props }, ref) {
  const { textPrimary, textMuted, accent } = useThemeColors();
  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);
  const translateText = useLanguageStore((s) => s.translateText);
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const resolvedColor = (!flat.color || flat.color === AppColors.textPrimary || flat.color === '#F0EAD6') ? textPrimary : flat.color;

  const translatedPlaceholder = placeholder && selectedLanguage !== 'English'
    ? translateText(placeholder)
    : placeholder;

  return (
    <RNTextInput
      ref={ref}
      allowFontScaling={false}
      placeholder={translatedPlaceholder}
      placeholderTextColor={placeholderTextColor ?? textMuted}
      selectionColor={accent}
      cursorColor={accent}
      {...props}
      style={[resolve(style), { color: resolvedColor, padding: 0 }]}
    />
  );
});

/** Flutter TextStyle(fontSize, height) → RN { fontSize, lineHeight }. */
export const lh = (fontSize: number, height: number) => ({ fontSize, lineHeight: Math.round(fontSize * height) });


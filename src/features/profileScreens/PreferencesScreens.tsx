/**
 * Port of lib/presentation/profile_screens/preferences_screens.dart (LanguageScreen + ThemeScreen).
 * - Language: local selection; Save → SnackBar "Language set to X" + pop (not persisted, same as source)
 * - Theme: setTheme/setAccent apply instantly + persist (AsyncStorage) via useThemeStore
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AnimatedBox, AnimatedPressable } from '@/components/AnimatedBox';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { showSnackBar } from '@/components/overlays';
import { Text } from '@/components/Text';
import { pop } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { AccentName, ThemeName, useThemeColors, useThemeStore } from '@/theme/themeStore';

const LANGUAGES = [
  { name: 'English', native: 'English', flag: '🇬🇧' }, { name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' }, { name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { name: 'Marathi', native: 'मराठी', flag: '🇮🇳' }, { name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' }, { name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' }, { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' }, { name: 'Sanskrit', native: 'संस्कृतम्', flag: '🕉️' },
];

export function LanguageScreen() {
  const [selected, setSelected] = useState('English');
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="language.screen">
      <AppBar title="Language" onBack={pop} testIDPrefix="language" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
        <View style={{ padding: 14, borderRadius: 14, backgroundColor: withAlpha(AppColors.goldAccent, 15), borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>🌐</Text>
          <Text style={{ marginLeft: 10, flex: 1, color: AppColors.textSecondary, fontSize: 12 }}>Select your preferred language for the app interface and content</Text>
        </View>
        <View style={{ marginTop: 20, borderRadius: 18, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder }}>
          {LANGUAGES.map((l, i) => {
            const sel = selected === l.name;
            return (
              <View key={l.name}>
                <Pressable testID={`language.option.${l.name}`} onPress={() => setSelected(l.name)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text style={{ fontSize: 22 }}>{l.flag}</Text>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: sel ? AppColors.goldAccent : AppColors.textPrimary, fontSize: 14, fontWeight: '600' }}>{l.name}</Text>
                    <Text style={{ color: AppColors.textMuted, fontSize: 12 }}>{l.native}</Text>
                  </View>
                  {sel ? (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: AppColors.goldAccent, alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name="check_rounded" color={AppColors.backgroundDark} size={16} />
                    </View>
                  ) : (
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: AppColors.textMuted }} />
                  )}
                </Pressable>
                {i < LANGUAGES.length - 1 ? <View style={{ height: 1, marginLeft: 52, backgroundColor: '#1E2A40' }} /> : null}
              </View>
            );
          })}
        </View>
        <ElevatedButton
          testID="language.save"
          label="Save Language"
          onPress={() => { showSnackBar(`Language set to ${selected}`, AppColors.surfaceVariantDark); pop(); }}
          radius={14}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </View>
  );
}

const THEMES: Array<{ name: ThemeName; desc: string; emoji: string; preview: string; light: boolean }> = [
  { name: 'Dark Cosmic', desc: 'Deep space dark with cosmic depth', emoji: '🌌', preview: '#080D1A', light: false },
  { name: 'Midnight Blue', desc: 'Deep blue cosmic atmosphere', emoji: '🌊', preview: '#050A1E', light: false },
  { name: 'Sacred Dark', desc: 'Rich maroon and dark tones', emoji: '🕉️', preview: '#120508', light: false },
  { name: 'Light Vedic', desc: 'Warm cream and light tones', emoji: '☀️', preview: '#F8F4EE', light: true },
];
const ACCENTS: Array<{ name: AccentName; color: string }> = [
  { name: 'Sacred Gold', color: '#C9A84C' }, { name: 'Cosmic Purple', color: '#9370DB' }, { name: 'Divine Red', color: '#8B1A1A' },
  { name: 'Celestial Blue', color: '#4FC3F7' }, { name: 'Emerald', color: '#2D9E6B' }, { name: 'Saffron', color: '#FFB347' },
];

export function ThemeScreen() {
  const selectedTheme = useThemeStore((s) => s.selectedTheme);
  const selectedAccent = useThemeStore((s) => s.selectedAccent);
  const setTheme = useThemeStore((s) => s.setTheme);
  const setAccent = useThemeStore((s) => s.setAccent);
  const { background, textPrimary, textMuted } = useThemeColors();
  const [w, setW] = useState(0);
  const cell = w > 0 ? (w - 12) / 2 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: background }} testID="theme.screen">
      <AppBar title="Theme" onBack={pop} testIDPrefix="theme" backgroundColor={background} backColor={textPrimary} titleNode={<Text style={{ color: textPrimary, fontSize: 18, fontWeight: '700' }}>Theme</Text>} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
        <Text style={{ color: textPrimary, fontSize: 16, fontWeight: '700' }}>App Theme</Text>
        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          {cell > 0 && THEMES.map((t) => {
            const sel = selectedTheme === t.name;
            return (
              <AnimatedPressable
                key={t.name}
                testID={`theme.option.${t.name.replace(' ', '')}`}
                onPress={() => setTheme(t.name)}
                duration={200}
                style={{
                  width: cell, height: cell / 1.6, padding: 12, borderRadius: 16, backgroundColor: t.preview,
                  borderWidth: sel ? 2.5 : 1, borderColor: sel ? '#C9A84C' : 'rgba(201,168,76,0.2)',
                  shadowColor: '#C9A84C', shadowOpacity: sel ? 0.24 : 0, shadowRadius: 12, elevation: sel ? 6 : 0,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
                  <View style={{ flex: 1 }} />
                  {sel ? (
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name="check_rounded" color="#080D1A" size={14} />
                    </View>
                  ) : null}
                </View>
                <View style={{ flex: 1 }} />
                <Text style={{ color: t.light ? '#1A1A2E' : '#F0EAD6', fontSize: 12, fontWeight: '700' }}>{t.name}</Text>
                <Text numberOfLines={1} style={{ color: t.light ? '#555577' : '#6B7A99', fontSize: 9 }}>{t.desc}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <Text style={{ marginTop: 24, color: textPrimary, fontSize: 16, fontWeight: '700' }}>Accent Colour</Text>
        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {ACCENTS.map((a) => {
            const sel = selectedAccent === a.name;
            return (
              <Pressable key={a.name} testID={`theme.accent.${a.name.replace(' ', '')}`} onPress={() => setAccent(a.name)} style={{ alignItems: 'center' }}>
                <AnimatedBox
                  duration={200}
                  style={{
                    width: 52, height: 52, borderRadius: 26, backgroundColor: a.color, borderWidth: 3, borderColor: sel ? '#FFFFFF' : 'transparent',
                    alignItems: 'center', justifyContent: 'center', shadowColor: a.color, shadowOpacity: sel ? 0.47 : 0, shadowRadius: 12, elevation: sel ? 6 : 0,
                  }}
                >
                  {sel ? <AppIcon name="check_rounded" color="#FFFFFF" size={22} /> : null}
                </AnimatedBox>
                <Text style={{ marginTop: 6, color: sel ? a.color : textMuted, fontSize: 9, fontWeight: '600' }}>{a.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 24, padding: 14, borderRadius: 12, backgroundColor: 'rgba(45,158,107,0.1)', borderWidth: 1, borderColor: 'rgba(45,158,107,0.2)', flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16 }}>✅</Text>
          <Text style={{ marginLeft: 10, flex: 1, color: '#2D9E6B', fontSize: 12, fontWeight: '500' }}>Theme changes apply instantly across the entire app</Text>
        </View>
      </ScrollView>
    </View>
  );
}

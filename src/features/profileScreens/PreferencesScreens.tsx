/**
 * Preferences Screens: LanguageScreen & ThemeScreen.
 * - Language: Full global persistence via useLanguageStore; instant UI translation.
 * - Theme: Restricted STRICTLY to 'Dark Cosmic' and 'Light Vedic' as requested.
 *          Instant app-wide re-theming with crystal-clear contrast.
 */
import React, { useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBox, AnimatedPressable } from '@/components/AnimatedBox';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { showSnackBar } from '@/components/overlays';
import { Text } from '@/components/Text';
import { pop } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { AppLanguage, useLanguageStore, useTranslation } from '@/theme/languageStore';
import { AccentName, ThemeName, useThemeColors, useThemeStore } from '@/theme/themeStore';

const LANGUAGES: Array<{ name: AppLanguage; native: string; flag: string }> = [
  { name: 'English', native: 'English', flag: '🇬🇧' },
  { name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { name: 'Sanskrit', native: 'संस्कृतम्', flag: '🕉️' },
];

export function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const { selectedLanguage, setLanguage, t } = useTranslation();
  const [selected, setSelected] = useState<AppLanguage>(selectedLanguage);
  const colors = useThemeColors();

  const handleSaveLanguage = async () => {
    await setLanguage(selected);
    showSnackBar(`${t('profile.language', 'Language')} updated to ${selected}`, colors.surfaceVariant);
    pop();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="language.screen">
      <AppBar title={t('profile.language', 'Language')} onBack={pop} testIDPrefix="language" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}>
        <View
          style={{
            padding: 14,
            borderRadius: 14,
            backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 25 : 15),
            borderWidth: 1,
            borderColor: colors.cardBorder,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 20 }}>🌐</Text>
          <Text style={{ marginLeft: 10, flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
            Select your preferred language. All application navigation, profile, and astrology content will translate instantly.
          </Text>
        </View>

        <View
          style={{
            marginTop: 20,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            overflow: 'hidden',
          }}
        >
          {LANGUAGES.map((l, i) => {
            const isSel = selected === l.name;
            return (
              <View key={l.name}>
                <Pressable
                  testID={`language.option.${l.name}`}
                  onPress={() => setSelected(l.name)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: isSel ? withAlpha(colors.goldAccent, colors.isLight ? 15 : 20) : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{l.flag}</Text>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: isSel ? colors.goldAccent : colors.textPrimary, fontSize: 15, fontWeight: isSel ? '700' : '600' }}>
                      {l.name}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{l.native}</Text>
                  </View>
                  {isSel ? (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.goldAccent, alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name="check_rounded" color="#080D1A" size={16} />
                    </View>
                  ) : (
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.textMuted }} />
                  )}
                </Pressable>
                {i < LANGUAGES.length - 1 ? (
                  <View style={{ height: 1, marginLeft: 52, backgroundColor: colors.divider }} />
                ) : null}
              </View>
            );
          })}
        </View>

        <ElevatedButton
          testID="language.save"
          label={t('common.save', 'Save Language')}
          onPress={handleSaveLanguage}
          radius={14}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </View>
  );
}

// STRICTLY restricted to 'Dark Cosmic' and 'Light Vedic' ONLY as required
const THEMES: Array<{ name: ThemeName; desc: string; emoji: string; preview: string; light: boolean }> = [
  {
    name: 'Dark Cosmic',
    desc: 'Deep cosmic space with starry depth and luminous gold accents',
    emoji: '🌌',
    preview: '#080D1A',
    light: false,
  },
  {
    name: 'Light Vedic',
    desc: 'Luminous pearl white and sacred gold tones with crystal-clear readability',
    emoji: '☀️',
    preview: '#FAF9F6',
    light: true,
  },
];

const ACCENTS: Array<{ name: AccentName; color: string }> = [
  { name: 'Sacred Gold', color: '#C9A84C' },
  { name: 'Cosmic Purple', color: '#9370DB' },
  { name: 'Divine Red', color: '#8B1A1A' },
  { name: 'Celestial Blue', color: '#4FC3F7' },
  { name: 'Emerald', color: '#2D9E6B' },
  { name: 'Saffron', color: '#FFB347' },
];

export function ThemeScreen() {
  const insets = useSafeAreaInsets();
  const selectedTheme = useThemeStore((s) => s.selectedTheme);
  const selectedAccent = useThemeStore((s) => s.selectedAccent);
  const setTheme = useThemeStore((s) => s.setTheme);
  const setAccent = useThemeStore((s) => s.setAccent);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [w, setW] = useState(Dimensions.get('window').width - 40);
  const cell = w > 0 ? (w - 12) / 2 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="theme.screen">
      <AppBar
        title={t('profile.theme', 'Theme')}
        onBack={pop}
        testIDPrefix="theme"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}>
        <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700' }}>
          Select App Theme
        </Text>
        <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 12 }}>
          Choose between Dark Cosmic or Light Vedic. Both provide high-contrast text and optimal readability.
        </Text>

        <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          {cell > 0 && THEMES.map((th) => {
            const isSel = selectedTheme === th.name;
            return (
              <AnimatedPressable
                key={th.name}
                testID={`theme.option.${th.name.replace(' ', '')}`}
                onPress={() => setTheme(th.name)}
                duration={200}
                style={{
                  width: cell,
                  minHeight: 110,
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: th.preview,
                  borderWidth: isSel ? 2.5 : 1,
                  borderColor: isSel ? colors.goldAccent : colors.cardBorder,
                  shadowColor: colors.goldAccent,
                  shadowOpacity: isSel ? 0.35 : 0.05,
                  shadowRadius: 10,
                  elevation: isSel ? 6 : 2,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{th.emoji}</Text>
                  <View style={{ flex: 1 }} />
                  {isSel ? (
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.goldAccent, alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name="check_rounded" color="#080D1A" size={14} />
                    </View>
                  ) : null}
                </View>
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: th.light ? '#1A1A2E' : '#F0EAD6', fontSize: 14, fontWeight: '700' }}>
                    {th.name}
                  </Text>
                  <Text numberOfLines={2} style={{ marginTop: 2, color: th.light ? '#383852' : '#A0A8C0', fontSize: 10, lineHeight: 14 }}>
                    {th.desc}
                  </Text>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>

        <Text style={{ marginTop: 28, color: colors.textPrimary, fontSize: 17, fontWeight: '700' }}>
          Accent Colour
        </Text>
        <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 12 }}>
          Personalise highlight badges and interactive buttons
        </Text>

        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {ACCENTS.map((a) => {
            const isSel = selectedAccent === a.name;
            return (
              <Pressable
                key={a.name}
                testID={`theme.accent.${a.name.replace(' ', '')}`}
                onPress={() => setAccent(a.name)}
                style={{ alignItems: 'center', width: 54 }}
              >
                <AnimatedBox
                  duration={200}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: a.color,
                    borderWidth: 3,
                    borderColor: isSel ? (colors.isLight ? '#1A1A2E' : '#FFFFFF') : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: a.color,
                    shadowOpacity: isSel ? 0.45 : 0,
                    shadowRadius: 10,
                    elevation: isSel ? 6 : 0,
                  }}
                >
                  {isSel ? <AppIcon name="check_rounded" color="#FFFFFF" size={20} /> : null}
                </AnimatedBox>
                <Text style={{ marginTop: 6, color: isSel ? a.color : colors.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center' }}>
                  {a.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={{
            marginTop: 28,
            padding: 16,
            borderRadius: 14,
            backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 15),
            borderWidth: 1,
            borderColor: colors.cardBorder,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>✨</Text>
          <Text style={{ marginLeft: 10, flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '500' }}>
            Theme changes apply immediately across all screens and bottom navigation.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

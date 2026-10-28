/**
 * Root layout — port of lib/main.dart + top-level GoRouter routes.
 *  - portrait lock (SystemChrome.setPreferredOrientations)
 *  - theme/accent rehydration (ThemeProvider._loadPreferences)
 *  - global error boundary (ErrorWidget.builder → CustomErrorWidget)
 *  - text scaling disabled inside <Text/> (TextScaler.linear(1.0))
 *  - route transitions: splash fade 280 ms; onboarding/birth-profile fade 320 ms; push routes slide 300 ms
 */
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/components/ErrorBoundary';
import { SnackbarHost } from '@/components/overlays';
import { PickerHost } from '@/components/pickers';
import { fontAssets } from '@/theme/fonts';
import { useLanguageStore } from '@/theme/languageStore';
import { useThemeColors, useThemeStore } from '@/theme/themeStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

const PUSH = { animation: 'slide_from_right' as const, animationDuration: 300 };
const PUSH_ROUTES = [
  'my-kundli-screen', 'match-kundli-screen', 'panchang-screen', 'remedies-screen', 'remedy-detail-screen',
  'horoscope-screen', 'astrologer-detail-screen', 'birth-profiles-screen', 'kundli-reports-screen',
  'match-reports-screen', 'saved-astrologers-screen', 'consultation-history-screen', 'wallet-screen',
  'notifications-screen', 'notification-settings-screen', 'language-screen', 'theme-screen', 'privacy-screen',
  'security-screen', 'help-centre-screen', 'contact-support-screen', 'terms-screen', 'privacy-policy-screen',
  'consultation-screen', 'career-astrology-screen', 'marriage-astrology-screen', 'business-astrology-screen',
  'finance-astrology-screen', 'tarot-screen', 'numerology-screen', 'muhurat-screen', 'spiritual-guidance-screen',
  'astrology-reports-screen',
];

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);
  const hydrated = useThemeStore((s) => s.hydrated);
  const loadTheme = useThemeStore((s) => s.load);
  const loadLanguage = useLanguageStore((s) => s.load);
  const colors = useThemeColors();

  useEffect(() => {
    loadTheme();
    loadLanguage();
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
  }, [loadTheme, loadLanguage]);

  useEffect(() => {
    if (fontsLoaded && hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <StatusBar style={colors.isLight ? 'dark' : 'light'} />
        <AppErrorBoundary>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, ...PUSH }}>
            <Stack.Screen name="index" options={{ animation: 'fade', animationDuration: 280, contentStyle: { backgroundColor: colors.background } }} />
            <Stack.Screen name="splash-screen" options={{ animation: 'fade', animationDuration: 280, contentStyle: { backgroundColor: colors.background } }} />
            <Stack.Screen name="sign-in-screen" options={{ animation: 'fade', animationDuration: 280, contentStyle: { backgroundColor: colors.background } }} />
            <Stack.Screen name="onboarding-screen" options={{ animation: 'fade', animationDuration: 320, contentStyle: { backgroundColor: colors.background } }} />
            <Stack.Screen name="birth-profile-setup-screen" options={{ animation: 'fade', animationDuration: 320, contentStyle: { backgroundColor: colors.background } }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade', contentStyle: { backgroundColor: colors.background } }} />
            {PUSH_ROUTES.map((r) => (
              <Stack.Screen key={r} name={r} options={PUSH} />
            ))}
          </Stack>
        </AppErrorBoundary>
        <SnackbarHost />
        <PickerHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

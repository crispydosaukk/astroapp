/**
 * Root layout — port of lib/main.dart + top-level GoRouter routes.
 *  - portrait lock (SystemChrome.setPreferredOrientations)
 *  - theme/accent rehydration (ThemeProvider._loadPreferences)
 *  - global error boundary (ErrorWidget.builder → CustomErrorWidget)
 *  - text scaling disabled inside <Text/> (TextScaler.linear(1.0))
 *  - route transitions: splash fade 280 ms; onboarding/birth-profile fade 320 ms; push routes slide 300 ms
 */
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/components/ErrorBoundary';
import { OverlayHost, SnackbarHost } from '@/components/overlays';
import { PickerHost } from '@/components/pickers';
import { useAuthStore } from '@/features/auth/authStore';
import { push } from '@/navigation/routes';
import {
  configureForegroundNotificationHandler,
  useNotificationStore,
} from '@/services/notificationStore';
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
  'astrology-reports-screen', 'astrologer-login-screen', 'astrologer-apply-screen', 'astrologer-dashboard-screen',
];

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);
  const hydrated = useThemeStore((s) => s.hydrated);
  const loadTheme = useThemeStore((s) => s.load);
  const loadLanguage = useLanguageStore((s) => s.load);
  const authUid = useAuthStore((s) => s.user?.uid);
  const authPhone = useAuthStore((s) => s.user?.phone);
  const colors = useThemeColors();

  useEffect(() => {
    loadTheme();
    loadLanguage();
    configureForegroundNotificationHandler();
    useNotificationStore.getState().hydrate();
    useNotificationStore.getState().fetchNotifications();
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
  }, [loadTheme, loadLanguage]);

  // Register push token & refresh inbox on login and when app returns to foreground
  useEffect(() => {
    const store = useNotificationStore.getState();
    store.fetchNotifications();
    if (Platform.OS !== 'web') {
      // Request permission when logged in; silently refresh token when already granted
      store.requestAndRegisterPushToken(Boolean(authUid || authPhone));
    }
  }, [authUid, authPhone]);

  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        useNotificationStore.getState().fetchNotifications();
      }
    });

    if (Platform.OS === 'web') {
      return () => appStateSub.remove();
    }

    const handleResponse = (response: Notifications.NotificationResponse | null | undefined) => {
      const data = response?.notification?.request?.content?.data as Record<string, any> | undefined;
      const notifId = typeof data?.notificationId === 'string' ? data.notificationId : '';
      const actionRoute = typeof data?.actionRoute === 'string' ? data.actionRoute : '';
      if (notifId) {
        useNotificationStore.getState().markAsRead(notifId);
      }
      if (actionRoute && actionRoute.startsWith('/')) {
        setTimeout(() => push(actionRoute), 180);
      }
    };

    // Handle cold-start launch when user taps a lock-screen push notification
    Notifications.getLastNotificationResponseAsync()
      .then((last) => {
        if (last) handleResponse(last);
      })
      .catch(() => {});

    const recvSub = Notifications.addNotificationReceivedListener(() => {
      useNotificationStore.getState().fetchNotifications();
    });

    const respSub = Notifications.addNotificationResponseReceivedListener(handleResponse);

    return () => {
      appStateSub.remove();
      recvSub.remove();
      respSub.remove();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

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
        <OverlayHost />
        <PickerHost />
        <SnackbarHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

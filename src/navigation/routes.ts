/**
 * Port of lib/routes/app_routes.dart (AppRoutes) + navigation helpers.
 * Every path matches the Flutter GoRouter path 1:1 (expo-router file names under /app).
 */
import { Href, router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

export const AppRoutes = {
  initial: '/',
  splashScreen: '/splash-screen',
  signInScreen: '/sign-in-screen',
  onboardingScreen: '/onboarding-screen',
  birthProfileSetupScreen: '/birth-profile-setup-screen',
  homeDashboardScreen: '/home-dashboard-screen',
  aiChatScreen: '/ai-chat-screen',
  liveAstrologersScreen: '/live-astrologers-screen',
  myKundliScreen: '/my-kundli-screen',
  matchKundliScreen: '/match-kundli-screen',
  panchangScreen: '/panchang-screen',
  remediesScreen: '/remedies-screen',
  servicesScreen: '/services-screen',
  profileScreen: '/profile-screen',
  horoscopeScreen: '/horoscope-screen',
  astrologerDetailScreen: '/astrologer-detail-screen',
  birthProfilesScreen: '/birth-profiles-screen',
  kundliReportsScreen: '/kundli-reports-screen',
  matchReportsScreen: '/match-reports-screen',
  savedAstrologersScreen: '/saved-astrologers-screen',
  consultationHistoryScreen: '/consultation-history-screen',
  walletScreen: '/wallet-screen',
  notificationsScreen: '/notifications-screen',
  notificationSettingsScreen: '/notification-settings-screen',
  languageScreen: '/language-screen',
  themeScreen: '/theme-screen',
  privacyScreen: '/privacy-screen',
  securityScreen: '/security-screen',
  helpCentreScreen: '/help-centre-screen',
  contactSupportScreen: '/contact-support-screen',
  termsScreen: '/terms-screen',
  privacyPolicyScreen: '/privacy-policy-screen',
  consultationScreen: '/consultation-screen',
  careerAstrologyScreen: '/career-astrology-screen',
  marriageAstrologyScreen: '/marriage-astrology-screen',
  businessAstrologyScreen: '/business-astrology-screen',
  financeAstrologyScreen: '/finance-astrology-screen',
  tarotScreen: '/tarot-screen',
  numerologyScreen: '/numerology-screen',
  muhuratScreen: '/muhurat-screen',
  spiritualGuidanceScreen: '/spiritual-guidance-screen',
  astrologyReportsScreen: '/astrology-reports-screen',
  /**
   * NOT in Flutter AppRoutes — Flutter reached RemedyDetailScreen with
   * Navigator.of(context).push(MaterialPageRoute(...)). expo-router needs a file route,
   * so it gets a path here; it is only ever pushed imperatively with its payload.
   */
  remedyDetailScreen: '/remedy-detail-screen',
} as const;

export type AppRoute = (typeof AppRoutes)[keyof typeof AppRoutes];

/** Tab-shell routes (StatefulShellRoute branches). */
export const TAB_ROUTES: readonly string[] = [
  AppRoutes.homeDashboardScreen,
  AppRoutes.aiChatScreen,
  AppRoutes.liveAstrologersScreen,
  AppRoutes.servicesScreen,
  AppRoutes.profileScreen,
];

/** context.push(route, extra: payload) */
export function push(route: AppRoute | string, extra?: unknown) {
  if (extra === undefined) router.push(route as Href);
  else router.push({ pathname: route as never, params: { extra: JSON.stringify(extra) } } as Href);
}

/** context.go(route) — replaces the stack (GoRouter `go` discards the previous page stack). */
export function go(route: AppRoute | string) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(route as Href);
}

/** context.pop() */
export function pop() {
  if (router.canGoBack()) router.back();
}

/** state.extra equivalent: reads the JSON payload passed with push(route, extra). */
export function useExtra<T>(): T | undefined {
  const { extra } = useLocalSearchParams<{ extra?: string }>();
  return useMemo(() => {
    if (!extra) return undefined;
    try { return JSON.parse(extra) as T; } catch { return undefined; }
  }, [extra]);
}

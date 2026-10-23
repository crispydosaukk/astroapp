import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/Text';
import { AppRoutes, go } from '@/navigation/routes';
import { AppColors } from '@/theme/colors';

/**
 * Splash Screen — Minimalist, elegant Vedic theme.
 * Displays only the single warm cream background (#F8F4EE) with the
 * AstroParihar branding logo centered and clearly visible.
 */
import { useAuthStore } from '@/features/auth/authStore';
import { useThemeColors } from '@/theme/themeStore';

export default function SplashScreen() {
  const { width } = useWindowDimensions();
  const navigated = useRef(false);
  const colors = useThemeColors();

  const loadAuth = useAuthStore((s) => s.load);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);

  // Smooth entrance animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    loadAuth();

    // Gentle fade-in and subtle scale-up for a refined, professional entry
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to appropriate destination: Home (if logged in), Sign In (if onboarding completed), or Onboarding (first time)
    const timer = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;

      if (isAuthenticated) {
        go(AppRoutes.homeDashboardScreen);
      } else if (hasCompletedOnboarding) {
        go(AppRoutes.signInScreen);
      } else {
        go(AppRoutes.onboardingScreen);
      }
    }, 2600);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, isAuthenticated, hasCompletedOnboarding, loadAuth]);

  // Maintain precise 2:1 ratio matching the 707x353 app logo asset
  const logoWidth = Math.min(width * 0.82, 330);
  const logoHeight = logoWidth * 0.5;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background, // Exactly matches SignInScreen and app theme
        alignItems: 'center',
        justifyContent: 'center',
      }}
      testID="splash.screen"
    >
      <StatusBar style={colors.isLight ? 'dark' : 'light'} animated={true} />

      <Animated.View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <View style={{ width: logoWidth, height: logoHeight }}>
          <Image
            source={require('@/../assets/images/app_logo.png')}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            priority="high"
            accessibilityLabel="AstroParihar Logo"
          />
        </View>

        {/* Refined Vedic Tagline & Sacred Dots matching Login Screen theme */}
        <View style={{ marginTop: 24, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.goldAccent }} />
            <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '700', letterSpacing: 2 }}>
              ASTROPARIHAR
            </Text>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.goldAccent }} />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '500', letterSpacing: 0.5 }}>
            Ancient Vedic Wisdom • Luminous Guidance
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

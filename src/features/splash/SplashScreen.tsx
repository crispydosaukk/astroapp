import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, useWindowDimensions, View } from 'react-native';
import { AppRoutes, go } from '@/navigation/routes';
import { AppColors } from '@/theme/colors';

/**
 * Splash Screen — Minimalist, elegant Vedic theme.
 * Displays only the single warm cream background (#F8F4EE) with the
 * AstroParihar branding logo centered and clearly visible.
 */
export default function SplashScreen() {
  const { width } = useWindowDimensions();
  const navigated = useRef(false);

  // Smooth entrance animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
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

    // Smooth navigation transition to the onboarding screen
    const timer = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;
      go(AppRoutes.onboardingScreen);
    }, 2600);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim]);

  // Maintain precise 2:1 ratio matching the 707x353 app logo asset
  const logoWidth = Math.min(width * 0.82, 330);
  const logoHeight = logoWidth * 0.5;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: AppColors.backgroundLight, // #F8F4EE: Light Vedic warm cream
        alignItems: 'center',
        justifyContent: 'center',
      }}
      testID="splash.screen"
    >
      <StatusBar style="dark" animated={true} />

      <Animated.View
        style={{
          width: logoWidth,
          height: logoHeight,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={require('@/../assets/images/app_logo.png')}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          priority="high"
          accessibilityLabel="AstroParihar Logo"
        />
      </Animated.View>
    </View>
  );
}

import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, useWindowDimensions, View } from 'react-native';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, go } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

/**
 * Splash Screen — Features the rotating Ashta Parihar (AshtaDigbandhana) Wheel
 * from the home page with smooth continuous rotation, cosmic gold aura glow,
 * perfect spacing, and seamless dynamic theme color matching.
 */
export default function SplashScreen() {
  const { width, height } = useWindowDimensions();
  const navigated = useRef(false);
  const colors = useThemeColors();

  const loadAuth = useAuthStore((s) => s.load);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);

  // Entrance animations: Fade in & smooth subtle scale
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  // Continuous smooth 360-degree rotation for the sacred Ashta Parihar Wheel
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Gentle breathing pulse for the celestial gold ambient aura
  const pulseAnim = useRef(new Animated.Value(0.78)).current;

  useEffect(() => {
    loadAuth();

    // 1. Entrance fade & scale
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

    // 2. Infinite smooth rotation for the Ashta Wheel (28s loop for dignified sacred rotation)
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 28000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    // 3. Ambient aura pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.78,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 4. Destination navigation timer (allows user to see the animated rotating wheel)
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
    }, 3100);

    return () => {
      clearTimeout(timer);
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [fadeAnim, scaleAnim, spinAnim, pulseAnim, isAuthenticated, hasCompletedOnboarding, loadAuth]);

  // Interpolate continuous 360-degree rotation
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Calculate balanced proportions with comfortable margins on any screen size
  const wheelSize = Math.min(width * 0.78, height * 0.42, 300);
  const emblemSize = wheelSize * 0.334;
  const logoWidth = Math.min(width * 0.68, 260);
  const logoHeight = logoWidth * (231 / 423);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
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
          width: '100%',
        }}
      >
        {/* Top/Center: Animated Rotating Ashta Parihar Wheel with Constant Center Emblem */}
        <View
          style={{
            width: wheelSize,
            height: wheelSize,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Ambient Glowing Aura behind the wheel */}
          <Animated.View
            style={{
              position: 'absolute',
              width: wheelSize * 0.94,
              height: wheelSize * 0.94,
              borderRadius: (wheelSize * 0.94) / 2,
              backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 35 : 50),
              opacity: pulseAnim,
              transform: [{ scale: pulseAnim }],
            }}
          />

          {/* 1. The 8 Remedies Wheel — Continuously Rotates around the center */}
          <Animated.View
            style={{
              width: wheelSize,
              height: wheelSize,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: spin }],
              shadowColor: colors.goldAccent,
              shadowOpacity: colors.isLight ? 0.22 : 0.45,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
          >
            <Image
              source={require('@/../assets/images/ashta_parihar_wheel_outer.png')}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              priority="high"
              accessibilityLabel="Ashta Parihar 8 Remedies Wheel"
            />
          </Animated.View>

          {/* 2. Middle Logo / Sacred Emblem — Kept CONSTANT (Stationary, Does NOT Rotate) */}
          <View
            style={{
              position: 'absolute',
              width: emblemSize,
              height: emblemSize,
              borderRadius: emblemSize / 2,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              shadowColor: colors.goldAccent,
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 6,
            }}
          >
            <Image
              source={require('@/../assets/images/app_logo_emblem.png')}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              priority="high"
              accessibilityLabel="AstroParihar Center Sacred Emblem"
            />
          </View>
        </View>

        {/* Below the Wheel: AstroParihar Text-Only Logo (Hand emblem removed) */}
        <View style={{ width: logoWidth, height: logoHeight, marginTop: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={require('@/../assets/images/app_logo_text.png')}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            priority="high"
            accessibilityLabel="AstroParihar Text Logo"
          />
        </View>
      </Animated.View>
    </View>
  );
}

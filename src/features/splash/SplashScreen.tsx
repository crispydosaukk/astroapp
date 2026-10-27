import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/Text';
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
  const wheelSize = Math.min(width * 0.76, height * 0.38, 290);
  const logoWidth = Math.min(width * 0.54, 210);
  const logoHeight = logoWidth * 0.44;

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
        {/* Top: AstroParihar Branding Logo */}
        <View style={{ width: logoWidth, height: logoHeight, marginBottom: 16 }}>
          <Image
            source={require('@/../assets/images/app_logo.png')}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            priority="high"
            accessibilityLabel="AstroParihar Logo"
          />
        </View>

        {/* Center: Animated Rotating Ashta Parihar Wheel with Cosmic Aura */}
        <View
          style={{
            width: wheelSize,
            height: wheelSize,
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 14,
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

          {/* Continuously Rotating Ashta Wheel */}
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
              source={require('@/../assets/images/ashta_parihar_wheel.png')}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              priority="high"
              accessibilityLabel="Ashta Parihar Wheel"
            />
          </Animated.View>
        </View>

        {/* Bottom: Sacred Sanskrit Inscription & Vedic Tagline */}
        <View style={{ marginTop: 18, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.goldAccent }} />
            <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '800', letterSpacing: 2 }}>
              ASHTADIGBANDHANA
            </Text>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.goldAccent }} />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12.5, fontWeight: '600', letterSpacing: 0.5, textAlign: 'center' }}>
            ॥ आठों दिशाओं की रक्षा • सम्पूर्ण अष्टदिग्बन्धन ॥
          </Text>
          <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 11, fontWeight: '500', letterSpacing: 0.3 }}>
            Ancient Vedic Wisdom • Luminous Guidance
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

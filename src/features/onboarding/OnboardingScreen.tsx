/**
 * Dynamic Onboarding Screen.
 * Displays intro carousel slides dynamically configured via the Admin Dashboard.
 * Falls back seamlessly to offline Vedic defaults with persistent AsyncStorage cache.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppImage } from '@/components/AppImage';
import { ElevatedButton } from '@/components/common';
import { lh, Text } from '@/components/Text';
import { API_ENDPOINTS, resolveMediaUrl } from '@/config/api';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, go } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

const STORAGE_KEY = 'dynamic_app_onboarding_slides_cache';
const DYNAMIC_API_URL = API_ENDPOINTS.onboarding;

export type Slide = {
  imageUrl: string | number;
  semanticLabel: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  icon: string;
};

const LOCAL_ASTRO_IMG = require('@/../assets/images/onboarding_astrologer.jpg');

export const DEFAULT_ONBOARDING_SLIDES: Slide[] = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop',
    semanticLabel: 'Night sky with bright stars and Milky Way galaxy, deep cosmic blue tones',
    title: 'Discover Your\nCosmic Path',
    titleHighlight: 'Cosmic Path',
    subtitle: 'Personalised Vedic astrology based on your exact birth details. Understand your destiny through ancient wisdom.',
    icon: '✦',
  },
  {
    imageUrl: LOCAL_ASTRO_IMG,
    semanticLabel: 'Vedic astrologer reading celestial birth chart with glowing cosmic AI guidance',
    title: 'Talk to AI or\nReal Astrologers',
    titleHighlight: 'Real Astrologers',
    subtitle: 'Get instant AI guidance 24/7 or connect with verified Vedic masters for deeper consultations.',
    icon: '◉',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&auto=format&fit=crop',
    semanticLabel: 'Beautiful golden sunrise over mountains with soft warm light rays',
    title: 'Your Astrology.\nYour Journey.',
    titleHighlight: 'Your Journey.',
    subtitle: 'Kundli, predictions, remedies, reports and spiritual guidance — all personalised for your unique cosmic blueprint.',
    icon: '❋',
  },
];

function resolveSlideImage(uri: any) {
  if (typeof uri === 'number') return uri;
  if (typeof uri === 'string') {
    if (uri.includes('onboarding_astrologer') || uri.includes('/assets/images')) {
      return LOCAL_ASTRO_IMG;
    }
    if (uri.startsWith('http')) return uri;
  }
  return LOCAL_ASTRO_IMG;
}

function OnboardingSlide({ data, width, height }: { data: Slide; width: number; height: number }) {
  const colors = useThemeColors();
  const parts = data.title.split(data.titleHighlight);
  const resolvedImage = resolveSlideImage(data.imageUrl);

  return (
    <View style={{ width, height }}>
      <AppImage
        uri={resolvedImage}
        width={width}
        height={height * 0.58}
        fit="cover"
        semanticLabel={data.semanticLabel}
        style={{ position: 'absolute', top: 0 }}
      />
      <LinearGradient
        colors={['transparent', withAlpha(colors.background, colors.isLight ? 210 : 180), colors.background]}
        style={{ position: 'absolute', top: height * 0.3, left: 0, right: 0, height: height * 0.3 }}
      />
      <View style={{ position: 'absolute', top: height * 0.52, left: 0, right: 0, paddingHorizontal: 28 }}>
        <Text style={lh(30, 1.2)}>
          {parts.length > 0 ? <Text style={{ color: colors.textPrimary, fontWeight: '800', ...lh(30, 1.2) }}>{parts[0]}</Text> : null}
          <Text style={{ color: colors.goldAccent, fontWeight: '800', ...lh(30, 1.2) }}>{data.titleHighlight}</Text>
          {parts.length > 1 ? <Text style={{ color: colors.textPrimary, fontWeight: '400', ...lh(30, 1.2) }}>{parts[1]}</Text> : null}
        </Text>
        <Text style={{ marginTop: 14, color: colors.textSecondary, fontWeight: '400', ...lh(15, 1.6) }}>{data.subtitle}</Text>
      </View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const colors = useThemeColors();
  const w = useSharedValue(active ? 24 : 6);
  useEffect(() => {
    w.value = withTiming(active ? 24 : 6, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, [active, w]);
  const st = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[{ height: 6, marginHorizontal: 4, borderRadius: 100, backgroundColor: active ? colors.goldAccent : (colors.isLight ? '#CBD5E1' : '#2A3550') }, st]} />;
}

export default function OnboardingScreen() {
  const colors = useThemeColors();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_ONBOARDING_SLIDES);

  useEffect(() => {
    let isMounted = true;

    // Load cached slides first for instant display
    AsyncStorage.getItem(STORAGE_KEY)
      .then((cached) => {
        if (cached && isMounted) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSlides(parsed);
            }
          } catch {}
        }
      })
      .catch(() => {});

    // Fetch dynamic slides from Admin Dashboard API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    fetch(DYNAMIC_API_URL, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        clearTimeout(timeout);
        if (isMounted && json.success && Array.isArray(json.slides) && json.slides.length > 0) {
          const activeSlides = json.slides
            .filter((s: any) => s.active !== false)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            .map((s: any) => ({
              imageUrl: resolveMediaUrl(s.imageUrl),
              semanticLabel: s.semanticLabel || 'AstroParihar Onboarding Slide',
              title: (s.title || '').replace(/\\n/g, '\n'),
              titleHighlight: s.titleHighlight || '',
              subtitle: s.subtitle || '',
              icon: s.icon || '✦',
            }));

          if (activeSlides.length > 0) {
            setSlides(activeSlides);
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activeSlides)).catch(() => {});
          }
        }
      })
      .catch(() => {
        // Fallback silently kept intact
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);

  const nextPage = () => {
    if (currentPage < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: currentPage + 1, animated: true });
      setCurrentPage(currentPage + 1);
    } else {
      setOnboardingCompleted();
      go(AppRoutes.signInScreen);
    }
  };

  const handleSignIn = () => {
    setOnboardingCompleted();
    go(AppRoutes.signInScreen);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="onboarding.screen">
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => <OnboardingSlide data={item} width={width} height={height} />}
      />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <LinearGradient
          colors={['transparent', withAlpha(colors.background, 240), colors.background]}
          style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 32 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            {slides.map((_, i) => (
              <Dot key={i} active={currentPage === i} />
            ))}
          </View>
          <ElevatedButton
            testID="onboarding.next"
            label={currentPage < slides.length - 1 ? 'Continue' : 'Get Started'}
            onPress={nextPage}
            style={{ marginTop: 24, alignSelf: 'stretch' }}
            paddingV={18}
            fontSize={16}
            fontWeight="700"
            letterSpacing={0.5}
          />
          <Pressable
            testID="onboarding.signIn"
            onPress={handleSignIn}
            style={{ marginTop: 16, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 14, color: colors.textMuted }}>
              Already have an account?{' '}
              <Text style={{ color: colors.goldAccent, fontWeight: '700', textDecorationLine: 'underline', fontSize: 14 }}>
                Sign In
              </Text>
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

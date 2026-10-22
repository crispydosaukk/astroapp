/**
 * Port of lib/presentation/onboarding_screen/onboarding_screen.dart
 *       + widgets/onboarding_slide_widget.dart
 * PageView → paging FlatList. Dots: AnimatedContainer 250 ms easeOutCubic (6 → 24 px).
 * Continue → next page; last page "Get Started" → go(birth-profile-setup). "Sign In" → go(home).
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppImage } from '@/components/AppImage';
import { ElevatedButton } from '@/components/common';
import { lh, Text } from '@/components/Text';
import { AppRoutes, go } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';

type Slide = { imageUrl: string; semanticLabel: string; title: string; titleHighlight: string; subtitle: string; icon: string };

export const ONBOARDING_SLIDES: Slide[] = [
  {
    imageUrl: 'https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&w=800',
    semanticLabel: 'Night sky with bright stars and Milky Way galaxy, deep cosmic blue tones',
    title: 'Discover Your\nCosmic Path',
    titleHighlight: 'Cosmic Path',
    subtitle: 'Personalised Vedic astrology based on your exact birth details. Understand your destiny through ancient wisdom.',
    icon: '✦',
  },
  {
    imageUrl: 'https://images.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_1280.jpg',
    semanticLabel: 'Glowing cosmic nebula with purple and blue star formations in deep space',
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

function OnboardingSlide({ data, width, height }: { data: Slide; width: number; height: number }) {
  const parts = data.title.split(data.titleHighlight);
  return (
    <View style={{ width, height }}>
      <AppImage uri={data.imageUrl} width={width} height={height * 0.58} fit="cover" semanticLabel={data.semanticLabel} style={{ position: 'absolute', top: 0 }} />
      <LinearGradient
        colors={['rgba(8,13,26,0)', withAlpha('#080D1A', 179), '#080D1A']}
        style={{ position: 'absolute', top: height * 0.3, left: 0, right: 0, height: height * 0.3 }}
      />
      <View style={{ position: 'absolute', top: height * 0.52, left: 0, right: 0, paddingHorizontal: 28 }}>
        <Text style={lh(30, 1.2)}>
          {parts.length > 0 ? <Text style={{ color: '#F0EAD6', fontWeight: '800', ...lh(30, 1.2) }}>{parts[0]}</Text> : null}
          <Text style={{ color: '#C9A84C', fontWeight: '800', ...lh(30, 1.2) }}>{data.titleHighlight}</Text>
          {parts.length > 1 ? <Text style={{ color: '#F0EAD6', fontWeight: '400', ...lh(30, 1.2) }}>{parts[1]}</Text> : null}
        </Text>
        <Text style={{ marginTop: 14, color: '#A0A8C0', fontWeight: '400', ...lh(15, 1.6) }}>{data.subtitle}</Text>
      </View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const w = useSharedValue(active ? 24 : 6);
  useEffect(() => { w.value = withTiming(active ? 24 : 6, { duration: 250, easing: Easing.out(Easing.cubic) }); }, [active, w]);
  const st = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[{ height: 6, marginHorizontal: 4, borderRadius: 100, backgroundColor: active ? '#C9A84C' : '#2A3550' }, st]} />;
}

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const nextPage = () => {
    if (currentPage < ONBOARDING_SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentPage + 1, animated: true });
      setCurrentPage(currentPage + 1);
    } else {
      go(AppRoutes.birthProfileSetupScreen);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080D1A' }} testID="onboarding.screen">
      <FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
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
          colors={['rgba(8,13,26,0)', withAlpha('#080D1A', 242), '#080D1A']}
          style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 32 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            {ONBOARDING_SLIDES.map((_, i) => <Dot key={i} active={currentPage === i} />)}
          </View>
          <ElevatedButton
            testID="onboarding.next"
            label={currentPage < ONBOARDING_SLIDES.length - 1 ? 'Continue' : 'Get Started'}
            onPress={nextPage}
            style={{ marginTop: 24, alignSelf: 'stretch' }}
            paddingV={18}
            fontSize={16}
            fontWeight="700"
            letterSpacing={0.5}
          />
          <Pressable testID="onboarding.signIn" onPress={() => go(AppRoutes.homeDashboardScreen)} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#6B7A99' }}>
              Already have an account?{' '}
              <Text style={{ color: '#C9A84C', fontWeight: '700', textDecorationLine: 'underline', fontSize: 14 }}>Sign In</Text>
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

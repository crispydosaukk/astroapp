/**
 * Port of lib/presentation/remedies_screen/remedies_screen.dart
 * - 🕉️ pulse 0.95↔1.05, 1500 ms easeInOut, repeat(reverse)
 * - outer ring rotates value*2π*0.05 per 20 s cycle (i.e. 18° then snaps back, like the source)
 * - 8 direction nodes (r=110) + spoke lines (r=80); node/grid tap → RemedyDetailScreen with remedy payload
 * SOURCE_INERT: "Discover Your Remedies ✨".
 * Deviation: in Flutter the spoke CustomPaint sat on top of the nodes and swallowed taps; here spokes are
 * pointerEvents="none" so the "Tap any direction" instruction works.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated as RNAnimated, Dimensions, Easing as RNEasing, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { AppBar, BoxBackButton } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { lh, Text } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import { REMEDIES, Remedy } from '@/data/remedies';
import { AppRoutes, push } from '@/navigation/routes';
import { useAuthStore } from '@/features/auth/authStore';
import { AppColors, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';
import { fetchLiveRemedies } from '@/services/astrologyService';

const STORAGE_REMEDIES_CACHE = 'astroparihar_dynamic_remedies_cache';

/** Navigator.push(MaterialPageRoute(RemedyDetailScreen(remedy))) equivalent. */
export const openRemedy = (r: Remedy) => push(AppRoutes.remedyDetailScreen, r);

export default function RemediesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const authUser = useAuthStore((s) => s.user);
  const pulse = useSharedValue(0.95);
  const [w, setW] = useState(Dimensions.get('window').width - 40);
  const [remediesList, setRemediesList] = useState<Remedy[]>(REMEDIES);

  // Continuous smooth 360-degree rotation for the sacred Ashta Parihar Wheel (from SplashScreen)
  const spinAnim = useRef(new RNAnimated.Value(0)).current;
  const pulseAnim = useRef(new RNAnimated.Value(0.78)).current;

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);

    // 1. Infinite smooth rotation for the Ashta Wheel (28s loop for dignified sacred rotation)
    const spinLoop = RNAnimated.loop(
      RNAnimated.timing(spinAnim, {
        toValue: 1,
        duration: 28000,
        easing: RNEasing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    // 2. Ambient aura pulse
    const pulseLoop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: RNEasing.inOut(RNEasing.sin),
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 0.78,
          duration: 1800,
          easing: RNEasing.inOut(RNEasing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    fetchLiveRemedies().catch(() => { });

    let isMounted = true;
    AsyncStorage.getItem(STORAGE_REMEDIES_CACHE)
      .then((cached) => {
        if (cached && isMounted) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) setRemediesList(parsed);
          } catch { }
        }
      })
      .catch(() => { });

    async function loadDynamicRemedies() {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const [res, remRes] = await Promise.all([
          fetch(API_ENDPOINTS.services, { signal: controller.signal }).catch(() => null),
          fetch(API_ENDPOINTS.remedies, { signal: controller.signal }).catch(() => null),
        ]);
        clearTimeout(timer);

        let activeItems: any[] = [];
        let ashtaDirections: any[] = [];

        if (res && res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.categories)) {
            const remCat = data.categories.find(
              (c: any) => c.id === 'cat-remedies' || c.category === 'remedies'
            );
            if (remCat && Array.isArray(remCat.items) && remCat.items.length > 0) {
              activeItems = remCat.items.filter((it: any) => it.active !== false);
            }
          }
        }

        if (remRes && remRes.ok) {
          const rData = await remRes.json();
          if (rData && rData.success && Array.isArray(rData.ashtaDirections)) {
            ashtaDirections = rData.ashtaDirections;
          }
        }

        if (activeItems.length > 0 || ashtaDirections.length > 0) {
          const hydrated: Remedy[] = REMEDIES.map((base) => {
            const match = activeItems.find(
              (ai: any) =>
                ai.id?.toLowerCase().includes(base.name.toLowerCase().split(' ')[0]) ||
                ai.name?.toLowerCase().includes(base.name.toLowerCase().split(' ')[0]) ||
                ai.direction?.toLowerCase() === base.direction.toLowerCase()
            );

            const dirMatch = ashtaDirections.find(
              (ad: any) => ad.direction?.toLowerCase().includes(base.direction.toLowerCase())
            );

            return {
              ...base,
              name: match?.name || base.name,
              sanskrit: match?.sanskrit || base.sanskrit,
              desc: match?.desc || dirMatch?.purpose || base.desc,
              mantra: match?.mantra || base.mantra,
              directionHindi: match?.directionHindi || base.directionHindi,
              color: match?.color || base.color,
            };
          });

          if (isMounted) {
            setRemediesList(hydrated);
            AsyncStorage.setItem(STORAGE_REMEDIES_CACHE, JSON.stringify(hydrated)).catch(() => { });
          }
        }
      } catch { }
    }

    loadDynamicRemedies();
    return () => {
      isMounted = false;
    };
  }, [pulse, pulseAnim, spinAnim]);

  // Interpolate continuous 360-degree rotation for the Ashta Parihar Wheel
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const onDiscoverRemedies = async () => {
    try {
      const authUser = useAuthStore.getState().user;
      const userUid = authUser?.uid || (authUser?.phone ? authUser.phone.replace(/\D/g, '') : null);
      let profile: any = authUser;
      if (!profile?.dob) {
        const stored = await AsyncStorage.getItem(userUid ? `astroparihar_user_birth_details_${userUid}` : 'astroparihar_user_birth_details');
        if (stored) profile = JSON.parse(stored);
      }
      const name = profile?.name || authUser?.name || 'Seeker';
      const dobStr = (profile?.dob || authUser?.dob) ? ` (Born: ${profile?.dob || authUser?.dob})` : '';
      push(AppRoutes.aiChatScreen, {
        astrologerId: 'vedika',
        initialPrompt: `Namaste, please analyze my birth chart for ${name}${dobStr} and prescribe sacred Vedic remedies according to the Ashta-Digbandhana (8 sacred directions), including my Ishta Devata, planetary mantras, and homam rituals.`
      });
    } catch {
      push(AppRoutes.aiChatScreen, {
        astrologerId: 'vedika',
        initialPrompt: `Namaste, please prescribe sacred Vedic remedies for my planetary chart according to ancient Vedic traditions.`
      });
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const screenWidth = Dimensions.get('window').width;
  const wheelSize = Math.min(screenWidth - 48, 290);
  const emblemSize = wheelSize * 0.334;
  const cellW = Math.max(140, (w - 12) / 2);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="remedies.screen">
      <AppBar
        title="Sacred Vedic Remedies"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        leading={<BoxBackButton testID="remedies.back" onPress={() => router.back()} />}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 16) }}
      >
        {/* Compact, Sleek Top Header Card (Significantly reduced vertical space) */}
        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFFBF0', colors.surfaceVariant]
              : [withAlpha(colors.goldAccent, 22), colors.surfaceVariant]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            marginHorizontal: 16,
            marginTop: 6,
            marginBottom: 10,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 16,
            borderWidth: 1.2,
            borderColor: withAlpha(colors.goldAccent, colors.isLight ? 45 : 65),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Glowing Om Avatar */}
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 25 : 35),
              borderWidth: 1.5,
              borderColor: colors.goldAccent,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Animated.Text style={[{ fontSize: 20 }, pulseStyle]}>🕉️</Animated.Text>
          </View>

          {/* Center: Devotee & Vedic Remedies Info */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: colors.goldAccent, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {authUser?.name ? `Personalised for ${authUser.name}` : 'Sacred Remedies'}
              </Text>
              {authUser?.zodiac ? (
                <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '600', marginLeft: 4 }}>
                  • {authUser.zodiac}
                </Text>
              ) : null}
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '700', marginTop: 1 }}>
              Ashta-Digbandhana Remedies
            </Text>
          </View>

          {/* Right: Sleek Sacred Gold Action Button */}
          <Pressable
            testID="remedies.discover"
            onPress={onDiscoverRemedies}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 100,
              backgroundColor: colors.goldAccent,
              flexDirection: 'row',
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
              shadowColor: colors.goldAccent,
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            })}
          >
            <Text style={{ color: '#0A0E1A', fontSize: 11.5, fontWeight: '800', marginRight: 3 }}>
              Explore
            </Text>
            <AppIcon name="auto_awesome" size={13} color="#0A0E1A" />
          </Pressable>
        </LinearGradient>

        <View style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 8, alignItems: 'center' }}>
          <View style={{ width: '100%', marginBottom: 4 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
              Ashta-Digbandhana
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 1 }}>
              The 8 Sacred Directions of Vedic Remedies
            </Text>
          </View>

          {/* Animated Rotating Ashta Parihar Wheel with Stationary Center Sacred Emblem (from SplashScreen) */}
          <Pressable
            testID="remedies.wheel"
            onPress={onDiscoverRemedies}
            style={{
              width: wheelSize,
              height: wheelSize,
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: 12,
            }}
          >
            {/* Ambient Glowing Aura behind the wheel */}
            <RNAnimated.View
              style={{
                position: 'absolute',
                width: wheelSize * 0.94,
                height: wheelSize * 0.94,
                borderRadius: (wheelSize * 0.94) / 2,
                backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 35 : 55),
                opacity: pulseAnim,
                transform: [{ scale: pulseAnim }],
              }}
            />

            {/* 1. The 8 Remedies Wheel — Continuously Rotates around the center */}
            <RNAnimated.View
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
            </RNAnimated.View>

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
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <AppIcon name="touch_app" size={14} color={colors.goldAccent} style={{ marginRight: 5 }} />
            <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', fontWeight: '600' }}>
              Tap wheel to consult AI or explore each remedy below
            </Text>
          </View>
        </View>

        <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 8 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>All Remedies</Text>
          <View
            style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}
            onLayout={(e) => {
              const newW = e.nativeEvent.layout.width;
              if (newW > 0 && Math.abs(newW - w) > 2) setW(newW);
            }}
          >
            {remediesList.map((r) => (
              <Pressable
                key={r.name}
                testID={`remedies.card.${r.name.replace(/[^A-Za-z]/g, '')}`}
                onPress={() => openRemedy(r)}
                style={({ pressed }) => ({
                  width: cellW,
                  height: 148,
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  borderWidth: 1.2,
                  borderColor: colors.cardBorder,
                  justifyContent: 'space-between',
                  shadowColor: '#000',
                  shadowOpacity: colors.isLight ? 0.03 : 0.15,
                  shadowRadius: 6,
                  elevation: 2,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 16 : 24),
                      borderWidth: 1,
                      borderColor: withAlpha(colors.goldAccent, colors.isLight ? 35 : 55),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                  </View>
                  <AppIcon name="arrow_forward_ios_rounded" color={colors.textMuted} size={12} />
                </View>
                <View>
                  <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                    {r.name}
                  </Text>
                  <Text numberOfLines={1} style={{ color: colors.goldAccent, fontSize: 11.5, fontWeight: '700', marginTop: 1 }}>
                    {r.sanskrit}
                  </Text>
                  <Text numberOfLines={2} style={{ marginTop: 3, color: colors.textSecondary, fontSize: 11, lineHeight: 15 }}>
                    {r.desc}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Comprehensive Vedic Remedies Principles & Knowledge Section */}
        <View style={{ marginHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
            Sacred Ashta Parihar Principles
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
            Ancient Vedic sciences for mitigating planetary doshas & karmic debts
          </Text>

          {/* Principle 1: Ashta-Digbandhana */}
          <View
            style={{
              marginTop: 14,
              padding: 16,
              borderRadius: 18,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              shadowColor: '#000',
              shadowOpacity: colors.isLight ? 0.03 : 0.15,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 25 : 35),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Text style={{ fontSize: 16 }}>🛡️</Text>
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700', flex: 1 }}>
                The 8-Fold Shield (Ashta-Digbandhana)
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 18 }}>
              Each of the 8 directions is governed by an Ashta-Dikpala and corresponding planetary vibrations. By harmonizing Mantras (North), Yantras (North-East), Homa (East), Upasana (South-East), Ratna (South), Rudraksha (South-West), Vastu (West), and Dāna (North-West), a protective spiritual shield is established around your auric field.
            </Text>
          </View>

          {/* Principle 2: Sādhana & Timing Rules */}
          <View
            style={{
              marginTop: 12,
              padding: 16,
              borderRadius: 18,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              shadowColor: '#000',
              shadowOpacity: colors.isLight ? 0.03 : 0.15,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: withAlpha('#81C784', colors.isLight ? 25 : 35),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Text style={{ fontSize: 16 }}>🪔</Text>
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700', flex: 1 }}>
                Rules of Effective Remedy Practice
              </Text>
            </View>
            <View style={{ gap: 6, marginTop: 4 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                • <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Brahma Muhurta:</Text> Chanting & meditation between 4:00 AM – 6:00 AM yields 100x spiritual efficacy.
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                • <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Sattvic Mindset:</Text> Maintain dietary purity and observe non-violence during remedy cycles.
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                • <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Sankalpa:</Text> Clear, heartfelt intention dedicated to the divine ensures karmic dissipation.
              </Text>
            </View>
          </View>

          {/* Quick Consultation CTA */}
          <LinearGradient
            colors={
              colors.isLight
                ? ['#FFFDF9', '#F9F5EC']
                : [withAlpha(colors.goldAccent, 25), colors.surfaceVariant]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              marginTop: 14,
              padding: 16,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: colors.goldAccent,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '800' }}>
                Need Custom Prescription?
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11.5, marginTop: 2 }}>
                Get an astrologer to analyze your Mahadasha, Dasha Sandhi & doshas.
              </Text>
            </View>
            <Pressable
              onPress={() => push(AppRoutes.liveAstrologersScreen)}
              style={({ pressed }) => ({
                paddingHorizontal: 15,
                paddingVertical: 9,
                borderRadius: 100,
                backgroundColor: colors.goldAccent,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                shadowColor: colors.goldAccent,
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 2,
              })}
            >
              <Text style={{ color: '#0A0E1A', fontSize: 12, fontWeight: '800' }}>
                Consult Now
              </Text>
            </Pressable>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

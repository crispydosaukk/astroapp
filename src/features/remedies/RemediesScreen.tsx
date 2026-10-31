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
import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { AppBar, BoxBackButton } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton, RadialGlow } from '@/components/common';
import {
  ReportIntakeConfig,
  ServiceReportIntakeModal,
} from '@/components/ServiceReportIntakeModal';
import { lh, Text } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import { REMEDIES, Remedy } from '@/data/remedies';
import { AppRoutes, push } from '@/navigation/routes';
import { useAuthStore } from '@/features/auth/authStore';
import { useCurrencyStore } from '@/services/currencyStore';
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pulse = useSharedValue(0.95);
  const wheel = useSharedValue(0);
  const [w, setW] = useState(Dimensions.get('window').width - 40);
  const [remediesList, setRemediesList] = useState<Remedy[]>(REMEDIES);
  const [pariharaModalOpen, setPariharaModalOpen] = useState(false);

  const { formatPrice, pricingSettings, currencyCode } = useCurrencyStore();
  const pariharaPlanPriceINR = pricingSettings.pariharaPlanPrice || 499;
  const pariharaPlanPriceUSD = pricingSettings.pariharaPlanPriceUSD || 9.99;
  const planPriceDisplay = formatPrice(pariharaPlanPriceINR, pariharaPlanPriceUSD);

  const pariharaPlanConfig: ReportIntakeConfig = {
    mode: 'parihara_plan',
    title: 'Complete 8-Fold Personalized Parihara Plan',
    subtitle: 'All 8 directional remedies + 48-Day Sankalpa Protocol + 3 Sacred Temple Pariharams',
    price: pariharaPlanPriceINR,
    priceUSD: pariharaPlanPriceUSD,
    serviceId: 'svc-parihara-plan',
    category: 'remedies',
  };

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
    wheel.value = withRepeat(withTiming(1, { duration: 20000, easing: Easing.linear }), -1, false);

    fetchLiveRemedies().catch(() => {});

    let isMounted = true;
    AsyncStorage.getItem(STORAGE_REMEDIES_CACHE)
      .then((cached) => {
        if (cached && isMounted) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) setRemediesList(parsed);
          } catch {}
        }
      })
      .catch(() => {});

    async function loadDynamicRemedies() {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(API_ENDPOINTS.services, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.categories)) {
            const remCat = data.categories.find(
              (c: any) => c.id === 'cat-remedies' || c.category === 'remedies'
            );
            if (remCat && Array.isArray(remCat.items) && remCat.items.length > 0) {
              const activeItems = remCat.items.filter((it: any) => it.active !== false);
              const hydrated: Remedy[] = REMEDIES.map((base) => {
                const match = activeItems.find(
                  (ai: any) =>
                    ai.id?.toLowerCase().includes(base.name.toLowerCase().split(' ')[0]) ||
                    ai.name?.toLowerCase().includes(base.name.toLowerCase().split(' ')[0]) ||
                    ai.direction?.toLowerCase() === base.direction.toLowerCase()
                );
                if (match) {
                  return {
                    ...base,
                    name: match.name || base.name,
                    sanskrit: match.sanskrit || base.sanskrit,
                    desc: match.desc || base.desc,
                    mantra: match.mantra || base.mantra,
                    directionHindi: match.directionHindi || base.directionHindi,
                    color: match.color || base.color,
                  };
                }
                return base;
              });

              if (isMounted) {
                setRemediesList(hydrated);
                AsyncStorage.setItem(STORAGE_REMEDIES_CACHE, JSON.stringify(hydrated)).catch(() => {});
              }
            }
          }
        }
      } catch {}
    }

    loadDynamicRemedies();
    return () => {
      isMounted = false;
    };
  }, [pulse, wheel]);

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

  const handleGenerateAshtaReport = () => {
    setPariharaModalOpen(true);
  };

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wheel.value * 360 * 0.05}deg` }] }));
  const screenWidth = Dimensions.get('window').width;
  const wheelBoxSize = Math.min(screenWidth - 40, 300);
  const wheelCenter = wheelBoxSize / 2;
  const nodeRadius = wheelBoxSize * 0.36;
  const spokeRadius = wheelBoxSize * 0.27;
  const nodeSize = Math.max(54, Math.min(60, wheelBoxSize * 0.2));
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
        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFF9EE', colors.surfaceVariant, colors.surface]
              : [withAlpha(AppColors.primary, 80), colors.surfaceVariant, colors.background]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 16,
            padding: 24,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            alignItems: 'center',
          }}
        >
          <Animated.Text style={[{ fontSize: 48 }, pulseStyle]}>🕉️</Animated.Text>
          <Text style={{ marginTop: 16, color: colors.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
            Sacred Vedic Remedies
          </Text>
          {authUser?.name ? (
            <View style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, backgroundColor: withAlpha(colors.goldAccent, 25), borderWidth: 1, borderColor: withAlpha(colors.goldAccent, 80), flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 11 }}>🪷</Text>
              <Text style={{ marginLeft: 6, color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                {`Personalised for ${authUser.name}${authUser.zodiac ? ` • ${authUser.zodiac}` : ''}`}
              </Text>
            </View>
          ) : null}
          <Text style={{ marginTop: 8, color: colors.textSecondary, textAlign: 'center', ...lh(13, 1.5) }}>
            Personalised remedies aligned with your birth chart and planetary influences. Ancient wisdom for modern transformation.
          </Text>
          <ElevatedButton
            testID="remedies.discover"
            label="Discover Your Remedies ✨"
            onPress={onDiscoverRemedies}
            bg="#713B32"
            fg="#FFFFFF"
            radius={100}
            paddingV={14}
            fontSize={14}
            fontWeight="700"
            style={{ marginTop: 20, alignSelf: 'stretch' }}
          />
        </LinearGradient>

        <View style={{ marginHorizontal: 20, marginVertical: 8 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Ashta-Digbandhana</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>The 8 Sacred Directions of Vedic Remedies</Text>
          <View style={{ marginTop: 16, alignSelf: 'center', width: wheelBoxSize, height: wheelBoxSize, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{ position: 'absolute', width: wheelBoxSize, height: wheelBoxSize, borderRadius: wheelBoxSize / 2, borderWidth: 1, borderColor: colors.cardBorder }, wheelStyle]} />
            <View style={{ width: wheelBoxSize * 0.27, height: wheelBoxSize * 0.27, borderRadius: (wheelBoxSize * 0.27) / 2, borderWidth: 1.5, borderColor: colors.goldAccent, backgroundColor: colors.surface, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              <RadialGlow colors={[withAlpha(colors.goldAccent, colors.isLight ? 50 : 120), colors.surfaceVariant]} />
              <Text style={{ fontSize: 26 }}>🕉️</Text>
            </View>
            <Svg width={wheelBoxSize} height={wheelBoxSize} style={{ position: 'absolute' }} pointerEvents="none">
              {remediesList.map((r) => (
                <Line
                  key={r.name}
                  x1={wheelCenter}
                  y1={wheelCenter}
                  x2={wheelCenter + spokeRadius * Math.cos(r.angle)}
                  y2={wheelCenter + spokeRadius * Math.sin(r.angle)}
                  stroke={colors.cardBorder}
                  strokeWidth={1}
                />
              ))}
            </Svg>
            {remediesList.map((r) => {
              const x = nodeRadius * Math.cos(r.angle);
              const y = nodeRadius * Math.sin(r.angle);
              const halfNode = nodeSize / 2;
              return (
                <Pressable
                  key={r.name}
                  testID={`remedies.wheel.${r.name.replace(/[^A-Za-z]/g, '')}`}
                  onPress={() => openRemedy(r)}
                  style={{
                    position: 'absolute',
                    left: wheelCenter + x - halfNode,
                    top: wheelCenter + y - halfNode,
                    width: nodeSize,
                    height: nodeSize,
                    borderRadius: halfNode,
                    backgroundColor: colors.surface,
                    borderWidth: 1.2,
                    borderColor: withAlpha(colors.goldAccent, colors.isLight ? 50 : 75),
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOpacity: colors.isLight ? 0.05 : 0.2,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 3,
                  }}
                >
                  <Text style={{ fontSize: 17 }}>{r.emoji}</Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: colors.textPrimary,
                      fontSize: 8.5,
                      fontWeight: '700',
                      textAlign: 'center',
                      marginTop: 1,
                    }}
                  >
                    {r.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
            Tap any direction to explore that remedy
          </Text>
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

            {/* Flagship Complete 8-Fold Personalized Parihara Plan Banner (Website Parity) */}
            <LinearGradient
              colors={
                colors.isLight
                  ? ['#FFFDF8', '#F6EDD9']
                  : [withAlpha(colors.goldAccent, 30), withAlpha('#713B32', 45)]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                marginTop: 14,
                padding: 18,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: colors.goldAccent,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 100,
                    backgroundColor: withAlpha(colors.goldAccent, 30),
                    borderWidth: 1,
                    borderColor: colors.goldAccent,
                  }}
                >
                  <Text style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '800' }}>
                    ★ FLAGSHIP 8-DIRECTIONAL DOSSIER
                  </Text>
                </View>
                <Text style={{ color: colors.goldAccent, fontSize: 18, fontWeight: '900' }}>{planPriceDisplay}</Text>
              </View>
              <Text style={{ marginTop: 10, color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
                Complete 8-Fold Personalized Parihara Plan
              </Text>
              <Text style={{ marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
                Synthesizes all 8 directional remedies (Mantra, Yantra, Homa, Devata, Gemstone, Rudraksha, Vastu & Dāna), a 48-Day Mandala Sankalpa Protocol, and 3 Temple Pariharams tailored to your birth chart.
              </Text>
              <ElevatedButton
                testID="remedies.generateCompletePlan"
                label={
                  Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone))
                    ? `Generate My Complete Parihara Plan — ${planPriceDisplay}`
                    : `🔒 Sign In to Generate Complete Plan (${planPriceDisplay})`
                }
                onPress={handleGenerateAshtaReport}
                bg="#713B32"
                fg="#FFFFFF"
                radius={100}
                paddingV={13}
                fontSize={13}
                fontWeight="800"
                style={{ marginTop: 14 }}
              />
            </LinearGradient>

            {/* Quick Consultation CTA */}
            <LinearGradient
              colors={
                colors.isLight
                  ? ['#FFFDF9', '#F9F5EC']
                  : [withAlpha('#713B32', 40), colors.surfaceVariant]
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
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 100,
                  backgroundColor: '#713B32',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
                  Consult Now
                </Text>
              </Pressable>
            </LinearGradient>
          </View>
        </ScrollView>

        <ServiceReportIntakeModal
          visible={pariharaModalOpen}
          config={pariharaPlanConfig}
          onClose={() => setPariharaModalOpen(false)}
        />
      </View>
    );
  }

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
import { ElevatedButton, RadialGlow } from '@/components/common';
import { lh, Text } from '@/components/Text';
import { REMEDIES, Remedy } from '@/data/remedies';
import { AppRoutes, push } from '@/navigation/routes';
import { useAuthStore } from '@/features/auth/authStore';
import { AppColors, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';
import { fetchLiveRemedies } from '@/services/astrologyService';

/** Navigator.push(MaterialPageRoute(RemedyDetailScreen(remedy))) equivalent. */
export const openRemedy = (r: Remedy) => push(AppRoutes.remedyDetailScreen, r);

export default function RemediesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const pulse = useSharedValue(0.95);
  const wheel = useSharedValue(0);
  const [w, setW] = useState(Dimensions.get('window').width - 40);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
    wheel.value = withRepeat(withTiming(1, { duration: 20000, easing: Easing.linear }), -1, false);

    fetchLiveRemedies().catch(() => {});
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
        initialPrompt: `Namaste Vedika, please analyze my birth chart for ${name}${dobStr} and prescribe sacred Vedic remedies according to the Ashta-Digbandhana (8 sacred directions), including my Ishta Devata, planetary mantras, and homam rituals.`
      });
    } catch {
      push(AppRoutes.aiChatScreen, {
        astrologerId: 'vedika',
        initialPrompt: `Namaste Vedika, please prescribe sacred Vedic remedies for my planetary chart according to ancient Vedic traditions.`
      });
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wheel.value * 360 * 0.05}deg` }] }));
  const cellW = Math.max(140, (w - 12) / 2);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="remedies.screen">
      <AppBar
        title="Sacred Vedic Remedies"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        leading={<BoxBackButton testID="remedies.back" onPress={() => router.back()} />}
      />
      <ScrollView>
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
          <View style={{ marginTop: 16, alignSelf: 'center', width: 300, height: 300, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{ position: 'absolute', width: 300, height: 300, borderRadius: 150, borderWidth: 1, borderColor: colors.cardBorder }, wheelStyle]} />
            <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, borderColor: colors.goldAccent, backgroundColor: colors.surface, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              <RadialGlow colors={[withAlpha(colors.goldAccent, colors.isLight ? 50 : 120), colors.surfaceVariant]} />
              <Text style={{ fontSize: 28 }}>🕉️</Text>
            </View>
            <Svg width={300} height={300} style={{ position: 'absolute' }} pointerEvents="none">
              {REMEDIES.map((r) => (
                <Line key={r.name} x1={150} y1={150} x2={150 + 80 * Math.cos(r.angle)} y2={150 + 80 * Math.sin(r.angle)} stroke={colors.cardBorder} strokeWidth={1} />
              ))}
            </Svg>
            {REMEDIES.map((r) => {
              const x = 110 * Math.cos(r.angle), y = 110 * Math.sin(r.angle);
              return (
                <Pressable
                  key={r.name}
                  testID={`remedies.wheel.${r.name.replace(/[^A-Za-z]/g, '')}`}
                  onPress={() => openRemedy(r)}
                  style={{
                    position: 'absolute', left: 150 + x - 30, top: 150 + y - 30, width: 60, height: 60, borderRadius: 30,
                    backgroundColor: withAlpha(r.color, colors.isLight ? 25 : 30), borderWidth: 1.5, borderColor: withAlpha(r.color, colors.isLight ? 120 : 150), alignItems: 'center', justifyContent: 'center',
                    shadowColor: r.color, shadowOpacity: colors.isLight ? 0.12 : 0.24, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{r.emoji}</Text>
                  <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 8, fontWeight: '700', textAlign: 'center' }}>{r.name}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>Tap any direction to explore that remedy</Text>
        </View>

        <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 8 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>All Remedies</Text>
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
            {REMEDIES.map((r) => (
              <Pressable
                key={r.name}
                testID={`remedies.card.${r.name.replace(/[^A-Za-z]/g, '')}`}
                onPress={() => openRemedy(r)}
                style={{
                  width: cellW,
                  minHeight: 140,
                  padding: 16,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: withAlpha(r.color, colors.isLight ? 60 : 80),
                  justifyContent: 'space-between',
                  shadowColor: colors.isLight ? '#000000' : colors.goldAccent,
                  shadowOpacity: colors.isLight ? 0.04 : 0.15,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{r.emoji}</Text>
                  <AppIcon name="arrow_forward_ios_rounded" color={r.color} size={14} />
                </View>
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{r.name}</Text>
                  <Text style={{ color: r.color, fontSize: 12, fontWeight: '600' }}>{r.sanskrit}</Text>
                  <Text numberOfLines={2} style={{ marginTop: 4, color: colors.textMuted, ...lh(10, 1.3) }}>{r.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ height: Math.max(140, insets.bottom + 80) }} />
      </ScrollView>
    </View>
  );
}

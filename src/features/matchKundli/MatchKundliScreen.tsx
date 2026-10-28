/**
 * Port of lib/presentation/match_kundli_screen/match_kundli_screen.dart
 * - Calculate: disabled while calculating; 2 s delay; ⭐ rotates (3 s repeat); then results
 * - score count-up 0→total over 1500 ms easeOutCubic; ring colour by score
 * - back in results mode returns to the form and resets the score animation
 * SOURCE_INERT: "Get Detailed Compatibility Report — ₹399", "🤖 Ask AI About This Match".
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { AppBar, BoxBackButton } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, LinearProgress, OutlinedButton, ProgressRing } from '@/components/common';
import { OutlinedField } from '@/components/fields';
import { lh, Text } from '@/components/Text';
import { AppColors, withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';
import { Curves, useController } from '@/utils/anim';
import { calculateLiveKundliMatch, KundliMatchResult } from '@/services/astrologyService';
import { AppRoutes, push } from '@/navigation/routes';
import { useAuthStore } from '@/features/auth/authStore';

const GUNA_MILAN = [
  { name: 'Varna', score: 1, max: 1, status: 'Compatible', desc: 'Spiritual compatibility and ego levels are well matched.' },
  { name: 'Vashya', score: 2, max: 2, status: 'Excellent', desc: 'Mutual attraction and control between partners is strong.' },
  { name: 'Tara', score: 3, max: 3, status: 'Good', desc: 'Birth star compatibility indicates health and longevity.' },
  { name: 'Yoni', score: 3, max: 4, status: 'Good', desc: 'Physical and intimate compatibility is satisfactory.' },
  { name: 'Graha Maitri', score: 4, max: 5, status: 'Good', desc: 'Planetary friendship supports mental compatibility.' },
  { name: 'Gana', score: 5, max: 6, status: 'Excellent', desc: 'Temperament and nature compatibility is very good.' },
  { name: 'Bhakoot', score: 6, max: 7, status: 'Good', desc: 'Emotional and financial compatibility is positive.' },
  { name: 'Nadi', score: 8, max: 8, status: 'Perfect', desc: 'Health and progeny compatibility is excellent.' },
];
const AREAS = [
  { title: 'Emotional Compatibility', score: 85, icon: 'favorite_border', color: '#FF6B6B' },
  { title: 'Communication', score: 78, icon: 'chat_bubble_outline', color: '#4FC3F7' },
  { title: 'Marriage Compatibility', score: 88, icon: 'people_outline', color: '#FFD700' },
  { title: 'Financial Compatibility', score: 72, icon: 'account_balance_outlined', color: '#81C784' },
  { title: 'Family Compatibility', score: 90, icon: 'home_outlined', color: '#BA68C8' },
  { title: 'Long-Term Compatibility', score: 82, icon: 'timeline', color: '#FFB74D' },
];
const TOTAL = GUNA_MILAN.reduce((s, g) => s + g.score, 0);

function StaticField({ label, value, icon, style }: { label: string; value: string; icon: string; style?: object }) {
  const colors = useThemeColors();
  return (
    <View style={[{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center' }, style]}>
      <AppIcon name={icon} color={colors.textMuted} size={16} />
      <View style={{ marginLeft: 8, flex: 1 }}>
        <Text style={{ color: colors.textMuted, fontSize: 10 }}>{label}</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}

function PersonCard({
  title,
  name,
  setName,
  emoji,
  color,
  testID,
  dob = '15 Mar 1992',
  tob = '10:30 AM',
  pob = 'New Delhi, India',
  badge,
}: {
  title: string;
  name: string;
  setName: (s: string) => void;
  emoji: string;
  color: string;
  testID: string;
  dob?: string;
  tob?: string;
  pob?: string;
  badge?: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={{ marginHorizontal: 20, padding: 20, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: withAlpha(color, colors.isLight ? 70 : 80) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>{emoji}</Text>
          <Text style={{ marginLeft: 8, color, fontSize: 15, fontWeight: '700' }}>{title}</Text>
        </View>
        {badge ? (
          <View style={{ backgroundColor: withAlpha(color, 25), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: withAlpha(color, 80) }}>
            <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ height: 16 }} />
      <OutlinedField testID={testID} label="Full Name" icon="person_outline" value={name} onChangeText={setName} />
      <View style={{ marginTop: 12, flexDirection: 'row' }}>
        <StaticField label="Date of Birth" value={dob} icon="calendar_today_outlined" style={{ flex: 1 }} />
        <View style={{ width: 12 }} />
        <StaticField label="Time" value={tob} icon="access_time_outlined" style={{ flex: 1 }} />
      </View>
      <StaticField label="Birth Place" value={pob} icon="location_on_outlined" style={{ marginTop: 12 }} />
    </View>
  );
}

function MiniProfile({ emoji, name, color }: { emoji: string; name: string; color: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: withAlpha(color, colors.isLight ? 20 : 30), borderWidth: 1, borderColor: withAlpha(color, 100), alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>
      <Text style={{ marginTop: 4, color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{name.split(' ')[0]}</Text>
    </View>
  );
}

function RotatingStar() {
  const r = useSharedValue(0);
  useEffect(() => { r.value = withRepeat(withTiming(360, { duration: 3000, easing: Easing.linear }), -1, false); }, [r]);
  const st = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return <Animated.Text style={[{ fontSize: 18 }, st]}>⭐</Animated.Text>;
}

export default function MatchKundliScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [matchResult, setMatchResult] = useState<KundliMatchResult | null>(null);
  const authUser = useAuthStore((s) => s.user);
  const [p1, setP1] = useState(authUser?.name || 'Self');
  const [p2, setP2] = useState('Partner');
  const scoreCtl = useController({ duration: 1500 });

  useEffect(() => {
    if (authUser?.name) {
      setP1(authUser.name);
    }
  }, [authUser?.name]);

  const p1Dob = authUser?.dob || '15 Mar 1992';
  const p1Tob = authUser?.tob || '10:30 AM';
  const p1Pob = authUser?.pob || 'New Delhi, India';

  const calculate = async () => {
    setIsCalculating(true);
    try {
      const res = await calculateLiveKundliMatch(
        { name: p2, dob: '1994-05-12', tob: '10:30 AM', pob: 'New Delhi, India' },
        { name: p1, dob: p1Dob, tob: p1Tob, pob: p1Pob }
      );
      setMatchResult(res);
    } catch {
      // astrologyService has built-in fallback
    } finally {
      setIsCalculating(false);
      setShowResults(true);
      scoreCtl.forward();
    }
  };

  const onBack = () => {
    if (showResults) { setShowResults(false); scoreCtl.reset(); }
    else router.back();
  };

  const targetScore = matchResult?.totalScore ?? TOTAL;
  const scoreValue = targetScore * Curves.easeOutCubic(scoreCtl.value);
  const score = Math.round(scoreValue);
  const ringColor = score >= 28 ? AppColors.success : score >= 18 ? colors.goldAccent : AppColors.warning;
  const verdictTitle = score >= 28 ? 'Excellent Match ✨' : score >= 18 ? 'Good Match 👍' : 'Requires Remedies ⚠️';
  const verdictDesc = matchResult?.verdict || 'A score above 28 indicates an excellent match. This couple shares strong spiritual, emotional, and practical compatibility.';
  const gunas = matchResult?.ashtakoot && matchResult.ashtakoot.length > 0 ? matchResult.ashtakoot : GUNA_MILAN;
  const areas = matchResult?.areas && matchResult.areas.length > 0 ? matchResult.areas : AREAS;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="matchKundli.screen">
      <AppBar
        title={showResults ? 'Compatibility Results' : 'Match Kundli'}
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        leading={<BoxBackButton testID="matchKundli.back" onPress={onBack} />}
      />
      <ScrollView keyboardShouldPersistTaps="handled">
        {!showResults ? (
          <>
            <LinearGradient
              colors={
                colors.isLight
                  ? ['#FFF9F0', colors.surfaceVariant]
                  : [withAlpha(AppColors.primary, 60), colors.surfaceVariant]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ marginHorizontal: 20, marginTop: 8, marginBottom: 20, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 40 }}>❤️</Text>
              <Text style={{ marginTop: 12, color: colors.textPrimary, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>Match Your Kundli</Text>
              <Text style={{ marginTop: 8, color: colors.textSecondary, textAlign: 'center', ...lh(13, 1.5) }}>Discover compatibility using traditional Vedic astrology and the ancient science of Guna Milan.</Text>
            </LinearGradient>
            <PersonCard
              testID="matchKundli.p1Name"
              title={authUser?.name ? `${authUser.name} (You)` : 'Person 1 (Self)'}
              name={p1}
              setName={setP1}
              emoji="👰"
              color="#FF6B6B"
              dob={p1Dob}
              tob={p1Tob}
              pob={p1Pob}
              badge={authUser ? 'Auto-Fetched' : undefined}
            />
            <View style={{ alignSelf: 'center', marginVertical: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 30), borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>💞</Text>
            </View>
            <PersonCard
              testID="matchKundli.p2Name"
              title="Person 2 (Partner)"
              name={p2}
              setName={setP2}
              emoji="🤵"
              color="#4FC3F7"
              dob="12 May 1994"
              tob="10:30 AM"
              pob="New Delhi, India"
            />
            <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
              {isCalculating ? (
                <View testID="matchKundli.calculating" style={{ borderRadius: 16, paddingVertical: 16, backgroundColor: withAlpha(colors.textPrimary, 25), flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                  <RotatingStar />
                  <Text style={{ marginLeft: 12, color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>Calculating Compatibility...</Text>
                </View>
              ) : (
                <ElevatedButton
                  testID="matchKundli.calculate"
                  label="Calculate Compatibility ✨"
                  onPress={calculate}
                  radius={100}
                  bg="#713B32"
                  fg="#FFFFFF"
                />
              )}
            </View>
          </>
        ) : (
          <>
            <View style={{ marginHorizontal: 20, marginTop: 8, marginBottom: 16, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center' }}>
              <MiniProfile emoji="👰" name={p1} color="#FF6B6B" />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 24 }}>💞</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>Compatibility</Text>
              </View>
              <MiniProfile emoji="🤵" name={p2} color="#4FC3F7" />
            </View>

            <LinearGradient
              colors={
                colors.isLight
                  ? ['#FFF9F0', colors.surfaceVariant]
                  : [withAlpha(colors.goldAccent, 40), colors.surfaceVariant]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ marginHorizontal: 20, marginVertical: 8, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Your Compatibility Score</Text>
              <View style={{ marginTop: 20 }} testID="matchKundli.score">
                <ProgressRing value={scoreValue / 36} size={140} strokeWidth={10} color={ringColor} backgroundColor={colors.surfaceVariant}>
                  <Text style={{ color: colors.textPrimary, fontSize: 40, fontWeight: '800' }}>{String(score)}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 16 }}>/ 36</Text>
                </ProgressRing>
              </View>
              <View style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: withAlpha(ringColor, 30), borderWidth: 1, borderColor: withAlpha(ringColor, 80) }}>
                <Text style={{ color: ringColor, fontSize: 14, fontWeight: '700' }}>{verdictTitle}</Text>
              </View>
              <Text style={{ marginTop: 12, color: colors.textSecondary, textAlign: 'center', ...lh(13, 1.5) }}>{verdictDesc}</Text>
            </LinearGradient>

            <View style={{ marginHorizontal: 20, marginVertical: 8 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Guna Milan (36 Points)</Text>
              {gunas.map((g) => {
                const ratio = g.max > 0 ? g.score / g.max : 1;
                const sc = ratio >= 0.8 ? AppColors.success : ratio >= 0.6 ? colors.goldAccent : AppColors.warning;
                return (
                  <View key={g.name} style={{ marginBottom: 8, padding: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{g.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: withAlpha(sc, 30) }}>
                          <Text style={{ color: sc, fontSize: 11, fontWeight: '600' }}>{g.status}</Text>
                        </View>
                        <Text style={{ marginLeft: 8, color: colors.goldAccent, fontSize: 14, fontWeight: '700' }}>{`${g.score}/${g.max}`}</Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 8 }}><LinearProgress value={ratio} height={6} radius={4} color={sc} backgroundColor={colors.surfaceVariant} /></View>
                    <Text style={{ marginTop: 6, color: colors.textMuted, fontSize: 12 }}>{g.desc}</Text>
                  </View>
                );
              })}
            </View>

            <View style={{ marginHorizontal: 20, marginVertical: 8 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Compatibility Areas</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
                {areas.map((a) => (
                  <View key={a.title} style={{ width: '48%', aspectRatio: 1.4, padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: withAlpha(a.color, colors.isLight ? 50 : 60), justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <AppIcon name={a.icon} color={a.color} size={20} />
                      <Text style={{ color: a.color, fontSize: 16, fontWeight: '800' }}>{`${a.score}%`}</Text>
                    </View>
                    <Text numberOfLines={2} style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{a.title}</Text>
                    <LinearProgress value={a.score / 100} height={4} radius={3} color={a.color} backgroundColor={colors.surfaceVariant} />
                  </View>
                ))}
              </View>
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
              <ElevatedButton
                testID="matchKundli.detailedReport"
                label="Get Detailed Compatibility Report — ₹399"
                onPress={() => {
                  push(AppRoutes.aiChatScreen, {
                    astrologerId: 'vedika',
                    initialPrompt: `Namaste Vedika, I need the full detailed marriage compatibility report for ${p1} and ${p2} (Score: ${score}/36). Please analyze all 8 Kutas, dosha cancellations, and remedies.`
                  });
                }}
                bg="#713B32"
                fg="#FFFFFF"
                radius={100}
                paddingV={14}
                paddingH={12}
                fontSize={14}
                fontWeight="700"
              />
              <OutlinedButton
                testID="matchKundli.askAi"
                label="🤖 Ask AI About This Match"
                onPress={() => {
                  push(AppRoutes.aiChatScreen, {
                    astrologerId: 'vedika',
                    initialPrompt: `Namaste Vedika, we just matched ${p1} and ${p2} with a Guna Milan score of ${score}/36 (${verdictTitle}). What does this mean for our future harmony, careers, and family life?`
                  });
                }}
                color={colors.textPrimary}
                borderColor={colors.cardBorder}
                style={{ marginTop: 12 }}
              />
            </View>
          </>
        )}
        <View style={{ height: Math.max(140, insets.bottom + 80) }} />
      </ScrollView>
    </View>
  );
}

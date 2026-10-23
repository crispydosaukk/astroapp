/**
 * Port of lib/presentation/profile_screens/match_reports_screen.dart
 * Dynamic compatibility reports with 36 Guna Milan breakdown modal.
 * Adapts to Light Vedic & Dark Cosmic themes.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, LinearProgress, OutlinedButton } from '@/components/common';
import { BottomSheet } from '@/components/overlays';
import { Text } from '@/components/Text';
import { AppRoutes, pop, push } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const REPORTS = [
  { person1: 'Self', person2: 'Partner 1', score: 32, status: 'Excellent', date: '15 Jan 2026', emoji1: '🔮', emoji2: '💫', color: '#2D9E6B' },
  { person1: 'Self', person2: 'Partner 2', score: 24, status: 'Good', date: '10 Dec 2025', emoji1: '🔮', emoji2: '⭐', color: '#D4821A' },
  { person1: 'Self', person2: 'Partner 3', score: 18, status: 'Average', date: '05 Nov 2025', emoji1: '🔮', emoji2: '🌟', color: '#FFB347' },
];

const GUNA_MILAN_DETAILS = [
  { name: 'Varna (Work Compatibility)', score: 1, max: 1 },
  { name: 'Vashya (Dominance & Attraction)', score: 2, max: 2 },
  { name: 'Tara (Destiny & Health)', score: 3, max: 3 },
  { name: 'Yoni (Physical & Intimacy)', score: 4, max: 4 },
  { name: 'Graha Maitri (Mental Harmony)', score: 5, max: 5 },
  { name: 'Gana (Temperament & Behavior)', score: 5, max: 6 },
  { name: 'Bhakoot (Family & Financial Growth)', score: 7, max: 7 },
  { name: 'Nadi (Genetics & Progeny Health)', score: 8, max: 8 },
];

export default function MatchReportsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selectedMatch, setSelectedMatch] = useState<typeof REPORTS[0] | null>(null);

  const newMatch = (
    <Pressable
      key="new"
      testID="matchReports.newMatch"
      onPress={() => push(AppRoutes.matchKundliScreen)}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 40 }}
    >
      <AppIcon name="add_rounded" color={colors.goldAccent} size={20} />
      <Text style={{ marginLeft: 6, color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>New Match</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="matchReports.screen">
      <AppBar
        title={t('profile.matchReports', 'Match Reports')}
        onBack={pop}
        testIDPrefix="matchReports"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        actions={[newMatch]}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}>
        <LinearGradient
          colors={[withAlpha('#FF6B6B', colors.isLight ? 20 : 30), colors.surface]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: withAlpha('#FF6B6B', 80),
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 26 }}>❤️</Text>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>Ashtakoot Kundli Matching</Text>
            <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 11, lineHeight: 16 }}>
              Vedic 36 Guna Milan analysis for marital longevity, mental harmony, and progeny.
            </Text>
          </View>
        </LinearGradient>

        <View style={{ height: 18 }} />

        {REPORTS.map((r, i) => (
          <View
            key={r.person2}
            testID={`matchReports.card.${i}`}
            style={{
              marginBottom: 16,
              borderRadius: 22,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              shadowColor: '#000',
              shadowOpacity: colors.isLight ? 0.04 : 0.2,
              shadowRadius: 8,
            }}
          >
            <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 60, height: 44 }}>
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: withAlpha(colors.goldAccent, 25),
                    borderWidth: 2,
                    borderColor: colors.cardBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{r.emoji1}</Text>
                </View>
                <View
                  style={{
                    position: 'absolute',
                    left: 20,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surfaceVariant,
                    borderWidth: 2,
                    borderColor: colors.cardBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{r.emoji2}</Text>
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
                  {`${r.person1} & ${r.person2}`}
                </Text>
                <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 11 }}>{r.date}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: r.color, fontSize: 22, fontWeight: '800' }}>{`${r.score}/36`}</Text>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: withAlpha(r.color, 25) }}>
                  <Text style={{ color: r.color, fontSize: 10, fontWeight: '700' }}>{r.status}</Text>
                </View>
              </View>
            </View>

            <View style={{ paddingHorizontal: 16, paddingBottom: 6 }}>
              <LinearProgress value={r.score / 36} height={6} radius={4} color={r.color} backgroundColor={colors.surfaceVariant} />
            </View>

            <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, flexDirection: 'row' }}>
              <OutlinedButton
                testID={`matchReports.card.${i}.details`}
                label="View Guna Milan"
                onPress={() => setSelectedMatch(r)}
                color={colors.textSecondary}
                radius={12}
                paddingV={9}
                fontSize={12}
                fontWeight="600"
                style={{ flex: 1 }}
              />
              <View style={{ width: 10 }} />
              <ElevatedButton
                testID={`matchReports.card.${i}.fullReport`}
                label="Full Analysis"
                onPress={() => setSelectedMatch(r)}
                radius={12}
                paddingV={9}
                fontSize={12}
                fontWeight="700"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Match Details BottomSheet */}
      <BottomSheet visible={!!selectedMatch} onClose={() => setSelectedMatch(null)}>
        {selectedMatch ? (
          <View
            style={{
              padding: 24,
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                  {`${selectedMatch.person1} & ${selectedMatch.person2}`}
                </Text>
                <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>
                  Total Match: {selectedMatch.score}/36 ({selectedMatch.status})
                </Text>
              </View>
              <Pressable onPress={() => setSelectedMatch(null)} style={{ padding: 4 }}>
                <AppIcon name="close_rounded" color={colors.textMuted} size={22} />
              </Pressable>
            </View>

            <View style={{ height: 1, backgroundColor: colors.divider, marginBottom: 14 }} />

            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
              Ashtakoot Milan Breakdown
            </Text>

            {GUNA_MILAN_DETAILS.map((g) => (
              <View key={g.name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{g.name}</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>{`${g.score}/${g.max}`}</Text>
              </View>
            ))}

            <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceVariant }}>
              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>Manglik & Dosha Compatibility:</Text>
              <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 11, lineHeight: 16 }}>
                • No acute Nadi Dosha detected{'\n'}
                • Bhakoot compatibility is highly favorable for prosperity{'\n'}
                • Recommended to perform Vishnu-Shiva Puja before vivaha
              </Text>
            </View>

            <ElevatedButton
              label="Close"
              onPress={() => setSelectedMatch(null)}
              radius={14}
              paddingV={11}
              style={{ marginTop: 18 }}
            />
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

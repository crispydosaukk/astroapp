/**
 * Port of lib/presentation/profile_screens/match_reports_screen.dart
 * "New Match" + empty-state CTA → push(/match-kundli-screen).
 * SOURCE_INERT: "View Details", "Full Report".
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, LinearProgress, OutlinedButton } from '@/components/common';
import { Text } from '@/components/Text';
import { AppRoutes, pop, push } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { SOURCE_INERT } from '@/utils/sourceInert';

const REPORTS = [
  { person1: 'Priya Sharma', person2: 'Rahul Sharma', score: 32, status: 'Excellent', date: '15 Jan 2025', emoji1: '🔮', emoji2: '💫', color: '#81C784' },
  { person1: 'Priya Sharma', person2: 'Arjun Mehta', score: 24, status: 'Good', date: '10 Dec 2024', emoji1: '🔮', emoji2: '⭐', color: '#FFD700' },
  { person1: 'Priya Sharma', person2: 'Vikram Singh', score: 18, status: 'Average', date: '05 Nov 2024', emoji1: '🔮', emoji2: '🌟', color: '#FFB347' },
];

export default function MatchReportsScreen() {
  const reports = REPORTS;
  const newMatch = (
    <Pressable key="new" testID="matchReports.newMatch" onPress={() => push(AppRoutes.matchKundliScreen)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 40 }}>
      <AppIcon name="add_rounded" color={AppColors.goldAccent} size={18} />
      <Text style={{ marginLeft: 8, color: AppColors.goldAccent, fontSize: 13, fontWeight: '600' }}>New Match</Text>
    </Pressable>
  );
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="matchReports.screen">
      <AppBar title="Match Reports" onBack={pop} testIDPrefix="matchReports" actions={[newMatch]} />
      {reports.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} testID="matchReports.empty">
          <Text style={{ fontSize: 64 }}>💑</Text>
          <Text style={{ marginTop: 16, color: AppColors.textPrimary, fontSize: 18, fontWeight: '700' }}>No Match Reports Yet</Text>
          <Text style={{ marginTop: 8, color: AppColors.textMuted, fontSize: 13, textAlign: 'center' }}>{'Check compatibility with your partner\nusing Vedic Kundli matching'}</Text>
          <ElevatedButton testID="matchReports.matchNow" label="Match Kundli Now" onPress={() => push(AppRoutes.matchKundliScreen)} style={{ marginTop: 24 }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
          <LinearGradient colors={[withAlpha('#FF6B6B', 30), AppColors.surfaceDark]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: withAlpha('#FF6B6B', 80), flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24 }}>❤️</Text>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' }}>Kundli Matching</Text>
              <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>Traditional Vedic compatibility analysis using 36 Guna Milan</Text>
            </View>
          </LinearGradient>
          <View style={{ height: 20 }} />
          {reports.map((r, i) => (
            <View key={r.person2} testID={`matchReports.card.${i}`} style={{ marginBottom: 14, borderRadius: 20, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder }}>
              <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 60, height: 44 }}>
                  <View style={{ position: 'absolute', left: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: withAlpha(AppColors.primary, 40), borderWidth: 2, borderColor: AppColors.goldBorder, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{r.emoji1}</Text>
                  </View>
                  <View style={{ position: 'absolute', left: 18, width: 40, height: 40, borderRadius: 20, backgroundColor: AppColors.surfaceVariantDark, borderWidth: 2, borderColor: AppColors.goldBorder, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{r.emoji2}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' }}>{`${r.person1} & ${r.person2}`}</Text>
                  <Text style={{ marginTop: 4, color: AppColors.textMuted, fontSize: 11 }}>{r.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: r.color, fontSize: 22, fontWeight: '800' }}>{`${r.score}/36`}</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: withAlpha(r.color, 25) }}>
                    <Text style={{ color: r.color, fontSize: 10, fontWeight: '600' }}>{r.status}</Text>
                  </View>
                </View>
              </View>
              <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
                <LinearProgress value={r.score / 36} height={6} radius={4} color={r.color} backgroundColor={AppColors.surfaceVariantDark} />
              </View>
              <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, flexDirection: 'row' }}>
                <OutlinedButton testID={`matchReports.card.${i}.details`} label="View Details" onPress={SOURCE_INERT('matchReports.viewDetails')} color={AppColors.textSecondary} radius={10} paddingV={10} fontSize={12} fontWeight="500" style={{ flex: 1 }} />
                <View style={{ width: 10 }} />
                <ElevatedButton testID={`matchReports.card.${i}.fullReport`} label="Full Report" onPress={SOURCE_INERT('matchReports.fullReport')} radius={10} paddingV={10} paddingH={8} fontSize={12} fontWeight="500" style={{ flex: 1 }} />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

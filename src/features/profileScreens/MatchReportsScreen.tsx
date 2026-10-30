/**
 * Match Reports Screen
 * - Sign-in protected: Requires authentication to view saved compatibility reports
 * - Dynamically loads real 36-Guna Ashtakoot Match Reports from reportService
 * - Full Ashtakoot 8-Koota breakdown modal + PDF export/share
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, LinearProgress, OutlinedButton } from '@/components/common';
import { BottomSheet, showSnackBar } from '@/components/overlays';
import { Text } from '@/components/Text';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, pop, push } from '@/navigation/routes';
import {
  downloadOrShareReport,
  getUserMatchReports,
  KundliReportItem,
} from '@/services/reportService';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const DEFAULT_GUNA_DETAILS = [
  { name: 'Varna (Spiritual Ego)', score: 1, max: 1 },
  { name: 'Vashya (Mutual Attraction)', score: 2, max: 2 },
  { name: 'Tara (Destiny & Vitality)', score: 3, max: 3 },
  { name: 'Yoni (Biological Affinity)', score: 3, max: 4 },
  { name: 'Graha Maitri (Mental Harmony)', score: 5, max: 5 },
  { name: 'Gana (Temperament & Behavior)', score: 6, max: 6 },
  { name: 'Bhakoot (Emotional & Financial Growth)', score: 4, max: 7 },
  { name: 'Nadi (Genetic Vitality & Progeny)', score: 7, max: 8 },
];

export default function MatchReportsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const setPostLoginRedirect = useAuthStore((s) => s.setPostLoginRedirect);
  const isUserLoggedIn = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));

  const [reports, setReports] = useState<KundliReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<KundliReportItem | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isUserLoggedIn) {
        if (mounted) {
          setReports([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const list = await getUserMatchReports(authUser?.uid || authUser?.phone);
        if (mounted) setReports(list);
      } catch {
        if (mounted) setReports([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [isUserLoggedIn, authUser?.uid, authUser?.phone]);

  const handleDownload = async (rep: KundliReportItem) => {
    showSnackBar(`Preparing "${rep.title}.pdf"...`, colors.surfaceVariant);
    const shared = await downloadOrShareReport(rep);
    if (shared) {
      showSnackBar(`"${rep.title}" exported successfully!`, colors.surfaceVariant);
    }
  };

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

        {!isUserLoggedIn ? (
          <View
            style={{
              marginTop: 12,
              padding: 24,
              borderRadius: 24,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: withAlpha(colors.goldAccent, 60),
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: withAlpha(colors.goldAccent, 20),
                borderWidth: 1,
                borderColor: withAlpha(colors.goldAccent, 50),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="lock" color={colors.goldAccent} size={30} />
            </View>
            <Text style={{ marginTop: 16, color: colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
              Please Sign In to View Match Reports
            </Text>
            <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 12.5, lineHeight: 18, textAlign: 'center' }}>
              Sign in to access your saved 36-Guna Kundli compatibility reports and Ashtakoot breakdowns.
            </Text>
            <ElevatedButton
              label="Sign In to Your Account"
              icon="login"
              onPress={() => {
                setPostLoginRedirect({ route: '', popOnSuccess: true });
                push(AppRoutes.signInScreen);
              }}
              bg="#713B32"
              fg="#FFFFFF"
              radius={100}
              paddingV={13}
              paddingH={24}
              fontSize={14}
              fontWeight="700"
              style={{ marginTop: 20, width: '100%' }}
            />
          </View>
        ) : loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.goldAccent} />
            <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 13 }}>
              Loading your compatibility reports...
            </Text>
          </View>
        ) : reports.length === 0 ? (
          <View
            style={{
              marginTop: 12,
              padding: 28,
              borderRadius: 22,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 42 }}>💞</Text>
            <Text style={{ marginTop: 12, color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
              No Match Reports Generated Yet
            </Text>
            <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 12.5, textAlign: 'center', lineHeight: 18 }}>
              Enter birth details for both partners in the Match Kundli calculator to generate a 36-Guna Ashtakoot compatibility dossier.
            </Text>
            <ElevatedButton
              label="Match New Kundli ✨"
              onPress={() => push(AppRoutes.matchKundliScreen)}
              bg="#713B32"
              fg="#FFFFFF"
              radius={100}
              paddingV={12}
              paddingH={24}
              fontSize={13}
              fontWeight="700"
              style={{ marginTop: 18 }}
            />
          </View>
        ) : (
          reports.map((rep, i) => {
            const groomName = rep.details?.groomName || rep.reportData?.groom?.name || 'Partner 1';
            const brideName = rep.details?.brideName || rep.reportData?.bride?.name || 'Partner 2';
            const score = Number(rep.details?.score ?? rep.reportData?.score ?? 30);
            const status = score >= 28 ? 'Excellent' : score >= 18 ? 'Good' : 'Needs Remedies';
            const scoreColor = score >= 28 ? '#2D9E6B' : score >= 18 ? '#D4821A' : '#CF4444';

            return (
              <View
                key={rep.id}
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
                      <Text style={{ fontSize: 18 }}>👰</Text>
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
                      <Text style={{ fontSize: 18 }}>🤵</Text>
                    </View>
                  </View>

                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
                      {`${groomName} & ${brideName}`}
                    </Text>
                    <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 11 }}>{rep.date}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: scoreColor, fontSize: 22, fontWeight: '800' }}>{`${score}/36`}</Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: withAlpha(scoreColor, 25) }}>
                      <Text style={{ color: scoreColor, fontSize: 10, fontWeight: '700' }}>{status}</Text>
                    </View>
                  </View>
                </View>

                <View style={{ paddingHorizontal: 16, paddingBottom: 6 }}>
                  <LinearProgress value={score / 36} height={6} radius={4} color={scoreColor} backgroundColor={colors.surfaceVariant} />
                </View>

                <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, flexDirection: 'row' }}>
                  <OutlinedButton
                    testID={`matchReports.card.${i}.details`}
                    label="View Guna Milan"
                    onPress={() => setSelectedReport(rep)}
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
                    label="Share / Download"
                    onPress={() => handleDownload(rep)}
                    radius={12}
                    paddingV={9}
                    fontSize={12}
                    fontWeight="700"
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Match Details BottomSheet */}
      <BottomSheet visible={!!selectedReport} onClose={() => setSelectedReport(null)}>
        {selectedReport ? (
          <View
            style={{
              padding: 24,
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              maxHeight: 620,
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
                    {`${selectedReport.details?.groomName || 'Partner 1'} & ${selectedReport.details?.brideName || 'Partner 2'}`}
                  </Text>
                  <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                    Total Match: {selectedReport.details?.score ?? 30}/36 ({selectedReport.details?.verdict || 'Auspicious Match'})
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedReport(null)} style={{ padding: 4 }}>
                  <AppIcon name="close_rounded" color={colors.textMuted} size={22} />
                </Pressable>
              </View>

              {(selectedReport.details?.groomDob || selectedReport.details?.brideDob) && (
                <View style={{ marginBottom: 12, padding: 10, borderRadius: 12, backgroundColor: colors.surfaceVariant }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11.5 }}>
                    • {selectedReport.details?.groomName || 'Partner 1'}: {selectedReport.details?.groomDob || ''} ({selectedReport.details?.groomPob || ''})
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11.5, marginTop: 2 }}>
                    • {selectedReport.details?.brideName || 'Partner 2'}: {selectedReport.details?.brideDob || ''} ({selectedReport.details?.bridePob || ''})
                  </Text>
                </View>
              )}

              <View style={{ height: 1, backgroundColor: colors.divider, marginBottom: 14 }} />

              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
                Ashtakoot 8-Koota Breakdown
              </Text>

              {(selectedReport.details?.ashtakoot || DEFAULT_GUNA_DETAILS).map((g: any) => (
                <View key={g.name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1 }}>{g.name}</Text>
                  <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>{`${g.score}/${g.max}`}</Text>
                </View>
              ))}

              <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceVariant }}>
                <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>Prescribed Matrimonial Remedies:</Text>
                {(selectedReport.remediesPrescribed || [
                  'Perform Gauri-Shankar Puja before wedding muhurat',
                  'Jointly recite Vishnu Sahasranama on Thursdays',
                ]).map((rem, idx) => (
                  <Text key={idx} style={{ marginTop: 4, color: colors.textSecondary, fontSize: 11.5, lineHeight: 16 }}>
                    • {rem}
                  </Text>
                ))}
              </View>

              <View style={{ marginTop: 18, flexDirection: 'row', gap: 10 }}>
                <OutlinedButton
                  label="Close"
                  onPress={() => setSelectedReport(null)}
                  color={colors.textSecondary}
                  radius={14}
                  paddingV={11}
                  style={{ flex: 1 }}
                />
                <ElevatedButton
                  label="Export / Share PDF"
                  icon="share_outlined"
                  onPress={() => handleDownload(selectedReport)}
                  bg="#713B32"
                  fg="#FFFFFF"
                  radius={14}
                  paddingV={11}
                  style={{ flex: 1.3 }}
                />
              </View>
            </ScrollView>
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

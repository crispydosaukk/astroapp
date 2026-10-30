/**
 * Kundli & Service Reports Screen
 * Complete parity with AstroParihar web & mobile:
 * - Covers ALL Services, Remedies, Panchang, and Mahadasha Paid PDF Reports
 * - Sign-in validation: If user is not signed in, show sign-in prompt; direct reports are protected
 * - Real-time wallet balance verification & deduction
 * - Instant view & high-res download / share for all reports
 * - No spinning loop or stuck processing states
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { BottomSheet, showSnackBar } from '@/components/overlays';
import {
  ReportIntakeConfig,
  ServiceReportIntakeModal,
} from '@/components/ServiceReportIntakeModal';
import { TabBar, TabPager } from '@/components/Tabs';
import { Text } from '@/components/Text';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, pop, push } from '@/navigation/routes';
import {
  KundliReportItem,
  getUserReports,
  downloadOrShareReport,
} from '@/services/reportService';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const REPORT_LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी (Hindi)' },
  { id: 'te', label: 'తెలుగు (Telugu)' },
  { id: 'ta', label: 'தமிழ் (Tamil)' },
  { id: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { id: 'mr', label: 'मराठी (Marathi)' },
  { id: 'gu', label: 'ગુજરાતી (Gujarati)' },
];

const CATALOG = [
  // --- Remedies Reports ---
  {
    id: 'cat_rem_ashta',
    emoji: '🕉️',
    title: 'Ashta Parihar 48-Day Protocol Report',
    desc: 'Complete 8-direction Vedic remedial protocol: Mantra, Yantra, Homa, Devata Upasana, Gemstone, Rudraksha, Vastu, Dana',
    price: 499,
    priceDisplay: '₹499',
    pages: '40 pages (PDF)',
    color: '#713B32',
    category: 'remedies',
  },
  {
    id: 'cat_rem_lalkitab',
    emoji: '📖',
    title: 'Lal Kitab Customized Upaay Dossier',
    desc: 'Custom 43-day non-stop planetary karma adjustments, debt removal & protection remedies',
    price: 399,
    priceDisplay: '₹399',
    pages: '36 pages (PDF)',
    color: '#E65100',
    category: 'remedies',
  },
  {
    id: 'cat_rem_ishta',
    emoji: '✨',
    title: 'Personal Ishta Devata & Mantra Sadhana Report',
    desc: '12th from Karakamsa Navamsha analysis, exact Beej Mantras, Mala counts & Japa rules',
    price: 299,
    priceDisplay: '₹299',
    pages: '28 pages (PDF)',
    color: '#9370DB',
    category: 'remedies',
  },
  {
    id: 'cat_rem_vastu',
    emoji: '🏠',
    title: '16-Zone Vastu Parihar Architectural Report',
    desc: 'Auspicious directions, 16-zone spatial balance, non-demolition remedies & Yantras',
    price: 399,
    priceDisplay: '₹399',
    pages: '36 pages (PDF)',
    color: '#81C784',
    category: 'remedies',
  },

  // --- Services & Life Reports ---
  {
    id: 'cat_1',
    emoji: '📜',
    title: 'Comprehensive Life Kundli Report',
    desc: 'Complete birth chart analysis, 12 Bhavas, 10-year predictions & planetary remedies',
    price: 499,
    priceDisplay: '₹499',
    pages: '48 pages (PDF)',
    color: '#9370DB',
    category: 'services',
  },
  {
    id: 'cat_2',
    emoji: '💼',
    title: 'Career & Wealth Blueprint Report',
    desc: '10th House Karma, promotion timings, business vs job suitability & Dhana Yogas',
    price: 349,
    priceDisplay: '₹349',
    pages: '32 pages (PDF)',
    color: '#FFD700',
    category: 'services',
  },
  {
    id: 'cat_3',
    emoji: '❤️',
    title: 'Marriage & Love Compatibility Report',
    desc: '36 Guna Milan, 7th house aspects, spouse characteristics & Manglik remedies',
    price: 349,
    priceDisplay: '₹349',
    pages: '28 pages (PDF)',
    color: '#FF6B6B',
    category: 'services',
  },
  {
    id: 'cat_4',
    emoji: '🌟',
    title: 'Annual Dasha & Transit Report 2026-2027',
    desc: 'Month-by-month Antardasha planetary shifts and transit alignments',
    price: 249,
    priceDisplay: '₹249',
    pages: '20 pages (PDF)',
    color: '#4FC3F7',
    category: 'services',
  },
  {
    id: 'cat_5',
    emoji: '🏥',
    title: 'Health & Ayurvedic Dosha Report',
    desc: 'Vata-Pitta-Kapha balance, 6th house afflictions & Ayurvedic healing therapies',
    price: 299,
    priceDisplay: '₹299',
    pages: '24 pages (PDF)',
    color: '#81C784',
    category: 'services',
  },

  // --- Panchang & Muhurat Reports ---
  {
    id: 'cat_pan_almanac',
    emoji: '📅',
    title: 'Annual Shubh Muhurat & Timings Almanac',
    desc: 'Complete annual schedule for Vivah, Griha Pravesh, Vahan, Vyapar & Abhijit windows',
    price: 299,
    priceDisplay: '₹299',
    pages: '30 pages (PDF)',
    color: '#4FC3F7',
    category: 'panchang',
  },
  {
    id: 'cat_pan_monthly',
    emoji: '🌙',
    title: 'Monthly Panchang & Tithi Almanac Dossier',
    desc: 'Tithi, Nakshatra, Yoga, Karana, Choghadiya & Rahu Kaal precautions almanac',
    price: 199,
    priceDisplay: '₹199',
    pages: '25 pages (PDF)',
    color: '#FFB347',
    category: 'panchang',
  },

  // --- Mahadasha Paid PDF Dossiers ---
  {
    id: 'cat_rahu_stab',
    emoji: '🛡️',
    title: 'Rahu Mahadasha Stabilisation Guide',
    desc: 'Harmonize intense Rahu transit with exact mantras, diet rules & silver talisman (PDF Dossier)',
    price: 499,
    priceDisplay: '₹499',
    pages: '36 pages (PDF)',
    color: '#713B32',
    category: 'mahadasha',
  },
  {
    id: 'cat_rahu_surv',
    emoji: '🔥',
    title: 'Rahu Mahadasha Survival Guide',
    desc: 'Tactical survival & protective mantras for full 18-year Rahu cycle (PDF Dossier)',
    price: 999,
    priceDisplay: '₹999',
    pages: '48 pages (PDF)',
    color: '#E65100',
    category: 'mahadasha',
  },
  {
    id: 'cat_sani_stab',
    emoji: '🪐',
    title: 'Sani Mahadasha Stabilisation Guide',
    desc: 'Saturn discipline, endurance & remedies for Sade Sati / Dhayya (PDF Dossier)',
    price: 499,
    priceDisplay: '₹499',
    pages: '36 pages (PDF)',
    color: '#1A3D5C',
    category: 'mahadasha',
  },
  {
    id: 'cat_sani_surv',
    emoji: '⚡',
    title: 'Sani Mahadasha Survival Guide',
    desc: 'Navigating Saturn trials, karmic mastery & planetary harmony (PDF Dossier)',
    price: 999,
    priceDisplay: '₹999',
    pages: '52 pages (PDF)',
    color: '#4A148C',
    category: 'mahadasha',
  },
];

export function StatCard({ value, label, color, colors }: { value: string; label: string; color: string; colors: any }) {
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: withAlpha(color, colors.isLight ? 20 : 25),
        borderWidth: 1,
        borderColor: withAlpha(color, 60),
        alignItems: 'center',
      }}
    >
      <Text style={{ color, fontSize: 20, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

export function MiniChip({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ marginRight: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: withAlpha(color, 25) }}>
      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

export default function KundliReportsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const setPostLoginRedirect = useAuthStore((s) => s.setPostLoginRedirect);
  const isUserLoggedIn = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));

  const [tab, setTab] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [reports, setReports] = useState<KundliReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedReport, setSelectedReport] = useState<KundliReportItem | null>(null);
  const [intakeConfig, setIntakeConfig] = useState<ReportIntakeConfig | null>(null);

  const loadReports = async () => {
    if (!isUserLoggedIn) {
      setReports([]);
      setLoadingReports(false);
      return;
    }
    setLoadingReports(true);
    try {
      const list = await getUserReports(authUser?.uid || authUser?.phone);
      setReports(list);
    } catch {
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [isUserLoggedIn, authUser?.uid, authUser?.phone]);

  const handleBuyReport = (item: typeof CATALOG[0]) => {
    const lower = item.title.toLowerCase();
    const mode =
      item.id === 'cat_rem_ashta'
        ? 'parihara_plan'
        : item.id === 'cat_rem_vastu' || lower.includes('vastu')
        ? 'vastu'
        : item.category === 'remedies'
        ? 'remedy'
        : item.category === 'mahadasha'
        ? 'mahadasha'
        : 'service';

    setIntakeConfig({
      mode,
      title: item.title,
      subtitle: `${item.pages} • ${item.desc}`,
      price: item.price,
      serviceId: item.id,
      remedyName: item.title,
      category: item.category as any,
      defaultLanguage: selectedLanguage,
    });
  };

  const handleDownload = async (rep: KundliReportItem) => {
    showSnackBar(`Preparing "${rep.title}.pdf" (${rep.language || selectedLanguage})...`, colors.surfaceVariant);
    const shared = await downloadOrShareReport(rep);
    if (shared) {
      showSnackBar(`"${rep.title}" exported successfully!`, colors.surfaceVariant);
    }
  };

  const filteredCatalog = CATALOG.filter((c) => {
    if (categoryFilter === 'all') return true;
    return c.category === categoryFilter;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="kundliReports.screen">
      <AppBar
        title={t('profile.kundliReports', 'Kundli & Service Reports')}
        onBack={pop}
        testIDPrefix="kundliReports"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        bottom={
          <TabBar
            testIDPrefix="kundliReports.tab"
            tabs={['My Reports', 'Get Reports']}
            index={tab}
            onChange={setTab}
            indicatorStyle="underline"
            indicatorColor={colors.goldAccent}
            labelColor={colors.goldAccent}
            unselectedLabelColor={colors.textMuted}
            fontSize={13}
            fontWeight="700"
          />
        }
      />

      {/* Multi-Language Selector Bar */}
      <View
        style={{
          paddingVertical: 10,
          backgroundColor: colors.isLight ? '#FFFDF9' : colors.surfaceVariant,
          borderBottomWidth: 1,
          borderBottomColor: colors.cardBorder,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 6 }}>
          <AppIcon name="language" color={colors.goldAccent} size={15} />
          <Text style={{ marginLeft: 6, color: colors.textPrimary, fontSize: 11.5, fontWeight: '700' }}>
            Report Generation Language:
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {REPORT_LANGUAGES.map((lang) => {
            const isSel = selectedLanguage === lang.label;
            return (
              <Pressable
                key={lang.id}
                onPress={() => setSelectedLanguage(lang.label)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 16,
                  backgroundColor: isSel
                    ? colors.isLight
                      ? '#713B32'
                      : colors.goldAccent
                    : colors.surface,
                  borderWidth: 1,
                  borderColor: isSel
                    ? colors.isLight
                      ? '#713B32'
                      : colors.goldAccent
                    : colors.cardBorder,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isSel ? '800' : '500',
                    color: isSel
                      ? colors.isLight
                        ? '#FFFFFF'
                        : '#000000'
                      : colors.textSecondary,
                  }}
                >
                  {lang.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <TabPager index={tab} onChange={setTab}>
        {[
          /* Tab 0: My Reports */
          <ScrollView
            key="mine"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(150, insets.bottom + 90),
            }}
          >
            {/* If user is not authenticated, show sign-in prompt; direct reports are protected */}
            {!isUserLoggedIn ? (
              <View
                style={{
                  marginTop: 20,
                  padding: 24,
                  borderRadius: 24,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: withAlpha(colors.goldAccent, 60),
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: colors.isLight ? 0.05 : 0.2,
                  shadowRadius: 10,
                  elevation: 3,
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

                <Text
                  style={{
                    marginTop: 16,
                    color: colors.textPrimary,
                    fontSize: 18,
                    fontWeight: '800',
                    textAlign: 'center',
                  }}
                >
                  Please Sign In to View Your Reports
                </Text>

                <Text
                  style={{
                    marginTop: 8,
                    color: colors.textSecondary,
                    fontSize: 12.5,
                    lineHeight: 18,
                    textAlign: 'center',
                  }}
                >
                  Access all your personalized Vedic chart analysis, remedy reports, and unlocked Mahadasha guides in one place.
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
            ) : loadingReports ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.goldAccent} />
                <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 13 }}>
                  Loading your Vedic reports...
                </Text>
              </View>
            ) : reports.length === 0 ? (
              <View
                style={{
                  marginTop: 20,
                  padding: 28,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  alignItems: 'center',
                }}
              >
                <AppIcon name="description_outlined" color={colors.textMuted} size={48} />
                <Text style={{ marginTop: 12, color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
                  No Reports Found
                </Text>
                <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
                  You haven&apos;t generated any reports yet. Explore remedies, kundli matching, or browse our catalog below.
                </Text>
                <ElevatedButton
                  label="Explore Reports Catalog"
                  onPress={() => setTab(1)}
                  bg="#713B32"
                  fg="#FFFFFF"
                  radius={100}
                  paddingV={10}
                  paddingH={20}
                  fontSize={13}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <StatCard value={String(reports.length)} label="Total Reports" color="#9370DB" colors={colors} />
                  <StatCard value={String(reports.filter((r) => r.status === 'Ready').length)} label="Ready" color="#2D9E6B" colors={colors} />
                  <StatCard value={String(reports.filter((r) => r.status === 'Processing').length)} label="Processing" color="#D4821A" colors={colors} />
                </View>

                <View style={{ height: 18 }} />

                {reports.map((r) => (
                  <Pressable
                    key={r.id || r.title}
                    onPress={() => setSelectedReport(r)}
                    style={{
                      marginBottom: 14,
                      padding: 16,
                      borderRadius: 20,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOpacity: colors.isLight ? 0.04 : 0.2,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        backgroundColor: withAlpha(r.color, colors.isLight ? 25 : 30),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{r.emoji}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{r.title}</Text>
                      <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 11 }}>{r.subtitle}</Text>
                      <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        <MiniChip text={r.pages} color={colors.textMuted} />
                        {r.language && <MiniChip text={r.language} color={colors.goldAccent} />}
                        <MiniChip text={r.date} color={colors.textMuted} />
                        <MiniChip text="Ready" color="#2D9E6B" />
                      </View>
                    </View>

                    <View style={{ marginLeft: 8, flexDirection: 'row', gap: 6 }}>
                      {/* View Report Button */}
                      <Pressable
                        onPress={() => setSelectedReport(r)}
                        accessibilityLabel="View Report"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 25 : 35),
                          borderWidth: 1,
                          borderColor: withAlpha(colors.goldAccent, 60),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AppIcon name="visibility_outlined" color={colors.goldAccent} size={18} />
                      </Pressable>

                      {/* Download / Share Report Button */}
                      <Pressable
                        onPress={() => handleDownload(r)}
                        accessibilityLabel="Download Report"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: withAlpha(colors.textSecondary, colors.isLight ? 15 : 25),
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AppIcon name="download_outlined" color={colors.textPrimary} size={18} />
                      </Pressable>
                    </View>
                  </Pressable>
                ))}
              </>
            )}
          </ScrollView>,

          /* Tab 1: Get Reports */
          <ScrollView
            key="get"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(150, insets.bottom + 90),
            }}
          >
            {/* Category Filter for Catalog */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 14, gap: 8 }}
            >
              {[
                { id: 'all', label: 'All Reports' },
                { id: 'remedies', label: 'Remedies Reports' },
                { id: 'services', label: 'Services & Kundli' },
                { id: 'panchang', label: 'Panchang & Muhurat' },
                { id: 'mahadasha', label: 'Mahadasha PDFs' },
              ].map((f) => {
                const isSel = categoryFilter === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setCategoryFilter(f.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: isSel
                        ? colors.isLight
                          ? '#713B32'
                          : colors.goldAccent
                        : colors.surface,
                      borderWidth: 1,
                      borderColor: isSel
                        ? colors.isLight
                          ? '#713B32'
                          : colors.goldAccent
                        : colors.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: isSel ? '700' : '500',
                        color: isSel
                          ? colors.isLight
                            ? '#FFFFFF'
                            : '#000000'
                          : colors.textSecondary,
                      }}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {filteredCatalog.map((c) => (
              <View
                key={c.id}
                style={{
                  marginBottom: 14,
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: colors.isLight ? 0.04 : 0.2,
                  shadowRadius: 8,
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: withAlpha(c.color, colors.isLight ? 25 : 30),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{c.title}</Text>
                  <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 11, lineHeight: 15 }}>{c.desc}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>{c.pages}</Text>
                    <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: withAlpha(c.color, 20) }}>
                      <Text style={{ fontSize: 9.5, fontWeight: '700', color: c.color }}>{c.category.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ marginLeft: 10, alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.goldAccent, fontSize: 16, fontWeight: '800' }}>{c.priceDisplay}</Text>
                  <Pressable
                    onPress={() => handleBuyReport(c)}
                    style={{
                      marginTop: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 100,
                      backgroundColor: colors.isLight ? '#713B32' : colors.goldAccent,
                    }}
                  >
                    <Text style={{ color: colors.isLight ? '#FFFFFF' : '#000000', fontSize: 12, fontWeight: '700' }}>Buy</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>,
        ]}
      </TabPager>

      {/* Comprehensive Report Preview BottomSheet Modal */}
      <BottomSheet visible={!!selectedReport} onClose={() => setSelectedReport(null)} testID="kundliReports.detailSheet">
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 32 }}>{selectedReport.emoji}</Text>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>{selectedReport.title}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{selectedReport.subtitle}</Text>
                </View>
                <Pressable onPress={() => setSelectedReport(null)} style={{ padding: 4 }}>
                  <AppIcon name="close_rounded" color={colors.textMuted} size={22} />
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: withAlpha(colors.goldAccent, 25) }}>
                  <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                    Language: {selectedReport.language || selectedLanguage}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.surfaceVariant }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    {selectedReport.pages} • {selectedReport.size}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: withAlpha('#2D9E6B', 20) }}>
                  <Text style={{ color: '#2D9E6B', fontSize: 11, fontWeight: '700' }}>
                    Status: Ready
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 14 }} />

              {/* Birth / Property Coordinates Badge Row */}
              {(selectedReport.details?.dob || selectedReport.details?.pob || selectedReport.details?.propertyType) && (
                <View
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: withAlpha(colors.goldAccent, 14),
                    borderWidth: 1,
                    borderColor: withAlpha(colors.goldAccent, 45),
                  }}
                >
                  <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '800', marginBottom: 4 }}>
                    📋 BIRTH & CONSULTATION COORDINATES
                  </Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>
                    {selectedReport.details?.userName || authUser?.name || 'Seeker'}
                    {selectedReport.details?.dob ? ` • Born: ${selectedReport.details.dob}` : ''}
                    {selectedReport.details?.tob ? ` (${selectedReport.details.tob})` : ''}
                  </Text>
                  {selectedReport.details?.pob && (
                    <Text style={{ color: colors.textSecondary, fontSize: 11.5, marginTop: 2 }}>
                      📍 Location: {selectedReport.details.pob}
                    </Text>
                  )}
                  {selectedReport.details?.primaryConcern && (
                    <Text style={{ color: colors.textSecondary, fontSize: 11.5, marginTop: 2 }}>
                      🎯 Sankalpa / Focus: {selectedReport.details.primaryConcern}
                    </Text>
                  )}
                </View>
              )}

              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
                {selectedReport.summary}
              </Text>

              {/* Complete 8-Fold Parihara Plan Section (Website Parity) */}
              {Array.isArray(selectedReport.details?.eightFoldRemedies) && (
                <View style={{ marginTop: 14, gap: 8 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '800' }}>
                    🕉️ 8-Directional Ashta-Digbandhana Remedies:
                  </Text>
                  {selectedReport.details.eightFoldRemedies.map((rem: any, idx: number) => (
                    <View
                      key={idx}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: colors.surfaceVariant,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '800', flex: 1 }}>
                          {rem.title}
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 8,
                            backgroundColor: withAlpha(colors.goldAccent, 22),
                          }}
                        >
                          <Text style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '700' }}>
                            🧭 {rem.direction}
                          </Text>
                        </View>
                      </View>
                      {rem.deity && (
                        <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                          Deity: {rem.deity}
                        </Text>
                      )}
                      {rem.mantra && (
                        <Text style={{ color: colors.textPrimary, fontSize: 11.5, fontStyle: 'italic', marginTop: 4 }}>
                          {rem.mantra}
                        </Text>
                      )}
                      <Text style={{ color: colors.textSecondary, fontSize: 11.5, lineHeight: 16, marginTop: 4 }}>
                        {rem.prescription || rem.specificPrescription}
                      </Text>
                    </View>
                  ))}

                  {selectedReport.details?.sankalpaProtocol && (
                    <View
                      style={{
                        marginTop: 6,
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: withAlpha('#2D9E6B', 14),
                        borderWidth: 1,
                        borderColor: withAlpha('#2D9E6B', 50),
                      }}
                    >
                      <Text style={{ color: '#2D9E6B', fontSize: 12.5, fontWeight: '800', marginBottom: 4 }}>
                        🪔 48-Day Mandala Sankalpa Protocol:
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 11.5, lineHeight: 17 }}>
                        • Morning: {selectedReport.details.sankalpaProtocol.morningRoutine}{'\n'}
                        • Evening: {selectedReport.details.sankalpaProtocol.eveningRoutine}{'\n'}
                        • Rules: {selectedReport.details.sankalpaProtocol.dietaryRules}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Vastu Room-by-Room Spatial Audit Section (Website Parity) */}
              {Array.isArray(selectedReport.details?.roomAudits) && (
                <View style={{ marginTop: 14, gap: 8 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '800' }}>
                    🏠 Room-by-Room Vastu Spatial Audit:
                  </Text>
                  {selectedReport.details.roomAudits.map((rm: any, idx: number) => (
                    <View
                      key={idx}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: colors.surfaceVariant,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '800' }}>
                          {rm.room} ({rm.direction})
                        </Text>
                        <Text style={{ color: colors.goldAccent, fontSize: 10.5, fontWeight: '700' }}>
                          {rm.status}
                        </Text>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11.5, lineHeight: 16, marginTop: 4 }}>
                        {rm.remedy}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Astrological Analysis */}
              {selectedReport.astrologicalAnalysis && (
                <View style={{ marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.cardBorder }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
                    Cosmic Analysis & Ephemeris Insights:
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                    {selectedReport.astrologicalAnalysis}
                  </Text>
                </View>
              )}

              {/* Specific Remedy Details if Present */}
              {selectedReport.details?.mantra && (
                <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: withAlpha(colors.goldAccent, 15), borderWidth: 1, borderColor: withAlpha(colors.goldAccent, 40) }}>
                  <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '800', marginBottom: 2 }}>
                    Consecrated Vedic Mantra:
                  </Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', fontStyle: 'italic', lineHeight: 20 }}>
                    {selectedReport.details.mantra}
                  </Text>
                  {selectedReport.details.direction && (
                    <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 11 }}>
                      Direction: {selectedReport.details.direction} • Deity: {selectedReport.details.deity || 'Devata'}
                    </Text>
                  )}
                </View>
              )}

              {/* Materials Required & Precautions for Remedy Reports */}
              {Array.isArray(selectedReport.details?.materialsRequired) && (
                <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.cardBorder }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '800', marginBottom: 4 }}>
                    🪔 Sacred Materials Required (Puja Samagri):
                  </Text>
                  {selectedReport.details.materialsRequired.map((mat: string, idx: number) => (
                    <Text key={idx} style={{ color: colors.textSecondary, fontSize: 11.5, lineHeight: 17 }}>
                      • {mat}
                    </Text>
                  ))}
                </View>
              )}

              {/* Prescribed Directional Pariharam */}
              {selectedReport.remediesPrescribed && selectedReport.remediesPrescribed.length > 0 && (
                <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: withAlpha('#713B32', colors.isLight ? 12 : 25), borderWidth: 1, borderColor: withAlpha('#713B32', 40) }}>
                  <Text style={{ color: colors.isLight ? '#713B32' : colors.goldAccent, fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
                    Prescribed Directional Vedic Pariharam:
                  </Text>
                  {selectedReport.remediesPrescribed.map((rem, idx) => (
                    <Text key={idx} style={{ color: colors.textPrimary, fontSize: 12, lineHeight: 18, marginBottom: 4 }}>
                      • {rem}
                    </Text>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={{ marginTop: 20, flexDirection: 'row', gap: 10, paddingBottom: 16 }}>
                <OutlinedButton
                  label="Close"
                  onPress={() => setSelectedReport(null)}
                  color={colors.textSecondary}
                  radius={12}
                  paddingV={10}
                  style={{ flex: 1 }}
                />
                <ElevatedButton
                  label="Download / Share PDF"
                  icon="share_outlined"
                  onPress={() => {
                    handleDownload(selectedReport);
                  }}
                  bg="#713B32"
                  fg="#FFFFFF"
                  radius={12}
                  paddingV={10}
                  style={{ flex: 1.3 }}
                />
              </View>
            </ScrollView>
          </View>
        ) : null}
      </BottomSheet>

      <ServiceReportIntakeModal
        visible={!!intakeConfig}
        config={intakeConfig}
        onClose={() => setIntakeConfig(null)}
        onSuccess={async (newRep) => {
          setIntakeConfig(null);
          await loadReports();
          setTab(0);
          setSelectedReport(newRep);
        }}
      />
    </View>
  );
}

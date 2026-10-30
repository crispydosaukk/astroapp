import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { OutlinedField } from '@/components/fields';
import { BottomSheet, showSnackBar } from '@/components/overlays';
import { formatTimeOfDay, pickDate, pickTime } from '@/components/pickers';
import { Text } from '@/components/Text';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, push } from '@/navigation/routes';
import {
  generateCompletePariharaPlan,
  generateRemedyReport,
  generateServiceReport,
  generateVastuReport,
  KundliReportItem,
} from '@/services/reportService';
import { deductWalletBalance, getWalletBalance, subscribeWallet } from '@/services/walletService';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

const DRAFT_STORAGE_KEY = 'astroparihar_report_draft';

const REPORT_LANGUAGES = [
  'English',
  'हिंदी (Hindi)',
  'తెలుగు (Telugu)',
  'தமிழ் (Tamil)',
  'ಕನ್ನಡ (Kannada)',
  'मराठी (Marathi)',
  'ગુજરાતી (Gujarati)',
];

const LIFE_CONCERNS = [
  'Career, Job & Business Obstacles',
  'Wealth, Debt & Financial Stability',
  'Marriage, Relationships & Harmony',
  'Health, Vitality & Mental Peace',
  'Rahu-Ketu / Shani Dosha & Protection',
  'Complete 360° Life & Spiritual Alignment',
];

const PROPERTY_TYPES = [
  'Residential Flat / Apartment',
  'Independent House / Villa',
  'Office / Commercial Space',
  'Shop / Retail Showroom',
  'Plot / Under Construction',
];

const VASTU_DIRECTIONS_LIST = [
  'North (Kubera)',
  'North-East (Ishanya)',
  'East (Indra)',
  'South-East (Agni)',
  'South (Yama)',
  'South-West (Nirriti)',
  'West (Varuna)',
  'North-West (Vayu)',
];

const VASTU_CONCERNS = [
  'Complete Property Vastu Audit',
  'Financial & Wealth Blockages',
  'Health & Vitality Issues',
  'Family Peace & Relationship Harmony',
  'Career & Business Growth',
];

const ROOM_DIRS = [
  'North-East',
  'South-East',
  'South-West',
  'North-West',
  'North',
  'East',
  'South',
  'West',
  'Center',
];

const POPULAR_CITIES = ['New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];

export type ReportIntakeMode = 'remedy' | 'vastu' | 'parihara_plan' | 'service' | 'mahadasha';

export interface ReportIntakeConfig {
  mode: ReportIntakeMode;
  title: string;
  subtitle?: string;
  price: number;
  serviceId?: string;
  remedyName?: string;
  category?: 'services' | 'remedies' | 'panchang' | 'mahadasha';
  defaultLanguage?: string;
}

interface FormBodyProps {
  config: ReportIntakeConfig;
  onSuccess?: (report: KundliReportItem) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export function ServiceReportFormBody({ config, onSuccess, onCancel, isModal }: FormBodyProps) {
  const colors = useThemeColors();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const setPostLoginRedirect = useAuthStore((s) => s.setPostLoginRedirect);
  const isUserLoggedIn = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));

  const [name, setName] = useState(authUser?.name || '');
  const [gender, setGender] = useState(authUser?.gender || 'Male');
  const [dob, setDob] = useState(authUser?.dob || '');
  const [tob, setTob] = useState(authUser?.tob || '10:30 AM');
  const [pob, setPob] = useState(authUser?.pob || '');
  const [primaryConcern, setPrimaryConcern] = useState(
    config.mode === 'vastu' ? VASTU_CONCERNS[0] : LIFE_CONCERNS[5]
  );
  const [language, setLanguage] = useState(config.defaultLanguage || 'English');

  // Vastu specific fields
  const [propertyType, setPropertyType] = useState(PROPERTY_TYPES[0]);
  const [entranceDirection, setEntranceDirection] = useState(VASTU_DIRECTIONS_LIST[2]);
  const [kitchenDir, setKitchenDir] = useState('South-East');
  const [masterBedroomDir, setMasterBedroomDir] = useState('South-West');
  const [pujaRoomDir, setPujaRoomDir] = useState('North-East');
  const [toiletDir, setToiletDir] = useState('North-West');
  const [showRoomDetails, setShowRoomDetails] = useState(false);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Sync user profile or saved draft
  useEffect(() => {
    let mounted = true;
    async function hydrateForm() {
      try {
        const draftRaw = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
        const draft = draftRaw ? JSON.parse(draftRaw) : null;

        if (!mounted) return;
        if (authUser?.name) setName((prev) => prev || authUser.name || '');
        else if (draft?.name) setName((prev) => prev || draft.name);

        if (authUser?.gender) setGender((prev) => prev || authUser.gender || 'Male');
        else if (draft?.gender) setGender((prev) => prev || draft.gender);

        if (authUser?.dob) setDob((prev) => prev || authUser.dob || '');
        else if (draft?.dob) setDob((prev) => prev || draft.dob);

        if (authUser?.tob) setTob((prev) => prev || authUser.tob || '10:30 AM');
        else if (draft?.tob) setTob((prev) => prev || draft.tob);

        if (authUser?.pob) setPob((prev) => prev || authUser.pob || '');
        else if (draft?.pob) setPob((prev) => prev || draft.pob);

        if (draft?.propertyType && config.mode === 'vastu') setPropertyType(draft.propertyType);
        if (draft?.entranceDirection && config.mode === 'vastu') setEntranceDirection(draft.entranceDirection);
        if (draft?.primaryConcern) setPrimaryConcern(draft.primaryConcern);
      } catch {}
    }
    hydrateForm();
    return () => {
      mounted = false;
    };
  }, [authUser, config.mode]);

  // Fetch and subscribe to live wallet balance when logged in
  useEffect(() => {
    let mounted = true;
    if (!isUserLoggedIn) {
      setWalletBalance(0);
      return;
    }
    setLoadingWallet(true);
    getWalletBalance()
      .then((bal) => {
        if (mounted) setWalletBalance(bal);
      })
      .finally(() => {
        if (mounted) setLoadingWallet(false);
      });

    const unsub = subscribeWallet((newBal) => {
      if (mounted) setWalletBalance(newBal);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [isUserLoggedIn, authUser?.uid]);

  const handlePickDob = async () => {
    const picked = await pickDate({
      value: new Date(1995, 9, 15),
      minimumDate: new Date(1920, 0, 1),
      maximumDate: new Date(),
    });
    if (picked) {
      const formatted = picked.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      setDob(formatted);
    }
  };

  const handlePickTob = async () => {
    const picked = await pickTime({ value: new Date(2000, 0, 1, 10, 30) });
    if (picked) {
      setTob(formatTimeOfDay(picked));
    }
  };

  const saveDraft = async () => {
    try {
      await AsyncStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          name: name.trim(),
          gender,
          dob: dob.trim(),
          tob: tob.trim(),
          pob: pob.trim(),
          primaryConcern,
          propertyType,
          entranceDirection,
        })
      );
    } catch {}
  };

  const handleSignInRedirect = async () => {
    await saveDraft();
    setPostLoginRedirect({ route: '', popOnSuccess: true });
    if (onCancel) onCancel();
    showSnackBar('Please sign in to generate and save your personalised Vedic report', '#713B32');
    push(AppRoutes.signInScreen);
  };

  const handleRechargeRedirect = async () => {
    await saveDraft();
    if (onCancel) onCancel();
    push(AppRoutes.walletScreen);
  };

  const handleGenerate = async () => {
    if (!isUserLoggedIn) {
      await handleSignInRedirect();
      return;
    }

    if (!name.trim()) {
      showSnackBar('Please enter your full name', '#CF4444');
      return;
    }
    if (!dob.trim()) {
      showSnackBar('Please select or enter your Date of Birth', '#CF4444');
      return;
    }
    if (!pob.trim()) {
      showSnackBar(
        config.mode === 'vastu' ? 'Please enter the Property City / Location' : 'Please enter your Place of Birth',
        '#CF4444'
      );
      return;
    }

    setSubmitting(true);
    try {
      // 1. Verify live wallet balance if report has a price > 0
      const price = config.price || 0;
      let serverReportContent: string | undefined;
      let skipBackendSync = false;

      if (price > 0) {
        const currentBal = await getWalletBalance();
        setWalletBalance(currentBal);

        if (currentBal < price) {
          showSnackBar(
            `Insufficient wallet balance (Available: ₹${currentBal}, Required: ₹${price}). Redirecting to Wallet...`,
            '#D4821A'
          );
          setSubmitting(false);
          await handleRechargeRedirect();
          return;
        }

        // For Complete 8-Fold Parihara Plan, generateCompletePariharaPlan tries /api/parihara-plan/generate first
        // Wait: to guarantee wallet deduction across both web and mobile, let's deduct via deductWalletBalance
        const deductRes = await deductWalletBalance(price, `${config.title}`, undefined, undefined, {
          serviceId:
            config.serviceId ||
            (config.mode === 'vastu'
              ? 'svc-vastu'
              : config.mode === 'parihara_plan'
              ? 'svc-parihara-plan'
              : `svc-${(config.remedyName || config.title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
          serviceType: config.mode === 'mahadasha' ? 'guide' : 'report',
          details: {
            name: name.trim(),
            gender,
            dob: dob.trim(),
            time: tob.trim(),
            place: pob.trim(),
            primaryConcern,
            ...(config.mode === 'vastu'
              ? {
                  propertyType,
                  entranceDirection,
                  kitchenDir,
                  masterBedroomDir,
                  pujaRoomDir,
                  toiletDir,
                }
              : {}),
          },
        });

        if (!deductRes.success) {
          showSnackBar(deductRes.error || 'Wallet deduction failed. Please recharge your wallet.', '#CF4444');
          if (deductRes.isDepleted) {
            await handleRechargeRedirect();
          }
          setSubmitting(false);
          return;
        }

        setWalletBalance(deductRes.newBalance);
        if (deductRes.reportContent) {
          serverReportContent = deductRes.reportContent;
          skipBackendSync = true;
        }
      }

      // 2. Synthesize & save the report
      let generatedReport: KundliReportItem;

      if (config.mode === 'vastu') {
        generatedReport = await generateVastuReport({
          vastuDetails: {
            name: name.trim(),
            dob: dob.trim(),
            tob: tob.trim(),
            pob: pob.trim(),
            propertyType,
            entranceDirection,
            primaryConcern,
            kitchenDir,
            masterBedroomDir,
            pujaRoomDir,
            toiletDir,
          },
          language,
          price,
          serverReportContent,
          skipBackendSync,
        });
      } else if (config.mode === 'parihara_plan') {
        generatedReport = await generateCompletePariharaPlan({
          birthDetails: {
            name: name.trim(),
            gender,
            dob: dob.trim(),
            tob: tob.trim(),
            pob: pob.trim(),
            primaryConcern,
          },
          language,
          price,
        });
      } else if (config.mode === 'remedy') {
        generatedReport = await generateRemedyReport({
          remedyName: config.remedyName || config.title,
          language,
          customConcern: primaryConcern,
          birthDetails: {
            name: name.trim(),
            gender,
            dob: dob.trim(),
            tob: tob.trim(),
            pob: pob.trim(),
            primaryConcern,
          },
          price,
          serverReportContent,
          skipBackendSync,
        });
      } else {
        generatedReport = await generateServiceReport({
          title: config.title,
          category: config.category || (config.mode === 'mahadasha' ? 'mahadasha' : 'services'),
          price,
          language,
          birthDetails: {
            name: name.trim(),
            gender,
            dob: dob.trim(),
            tob: tob.trim(),
            pob: pob.trim(),
            primaryConcern,
          },
          serverReportContent,
          skipBackendSync,
        });
      }

      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY).catch(() => {});
      showSnackBar(`"${generatedReport.title}" generated & saved to My Reports!`, colors.surfaceVariant);

      if (onSuccess) {
        onSuccess(generatedReport);
      } else {
        if (onCancel) onCancel();
        push(AppRoutes.kundliReportsScreen);
      }
    } catch (err: any) {
      showSnackBar(err.message || 'Failed to generate report', '#CF4444');
    } finally {
      setSubmitting(false);
    }
  };

  const hasSufficientBalance = walletBalance >= config.price;

  return (
    <View>
      {/* Header & Price / Wallet Row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 16, marginRight: 6 }}>
              {config.mode === 'vastu' ? '🏠' : config.mode === 'parihara_plan' ? '🕉️' : '📜'}
            </Text>
            <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>
              {config.mode === 'vastu'
                ? 'VASTU SHASTRA SPATIAL AUDIT'
                : config.mode === 'parihara_plan'
                ? '8-FOLD ASHTA-DIGBANDHANA BLUEPRINT'
                : 'PERSONALISED VEDIC REPORT'}
            </Text>
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>{config.title}</Text>
          {config.subtitle ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{config.subtitle}</Text>
          ) : null}
        </View>

        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 18 : 28),
            borderWidth: 1,
            borderColor: colors.goldAccent,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '700' }}>FEE</Text>
          <Text style={{ color: colors.goldAccent, fontSize: 17, fontWeight: '900' }}>
            {config.price > 0 ? `₹${config.price}` : 'FREE'}
          </Text>
        </View>
      </View>

      {/* Live Wallet Balance / Sign-In Status Banner */}
      {!isUserLoggedIn ? (
        <View
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 14,
            backgroundColor: withAlpha('#713B32', colors.isLight ? 12 : 28),
            borderWidth: 1,
            borderColor: withAlpha(colors.goldAccent, 70),
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <AppIcon name="lock" color={colors.goldAccent} size={18} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '700' }}>
              Sign In Required to Generate Report
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>
              Fill in your details below — we will save your draft while you sign in.
            </Text>
          </View>
        </View>
      ) : config.price > 0 ? (
        <View
          style={{
            marginBottom: 14,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 14,
            backgroundColor: hasSufficientBalance
              ? withAlpha('#2D9E6B', colors.isLight ? 14 : 22)
              : withAlpha('#D4821A', colors.isLight ? 16 : 25),
            borderWidth: 1,
            borderColor: hasSufficientBalance ? withAlpha('#2D9E6B', 80) : withAlpha('#D4821A', 90),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <AppIcon
              name="account_balance_wallet"
              color={hasSufficientBalance ? '#2D9E6B' : '#D4821A'}
              size={18}
            />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '700' }}>
                {loadingWallet ? 'Checking Wallet...' : `Wallet Balance: ₹${walletBalance}`}
              </Text>
              <Text
                style={{
                  color: hasSufficientBalance ? '#2D9E6B' : '#D4821A',
                  fontSize: 11,
                  fontWeight: '600',
                }}
              >
                {hasSufficientBalance
                  ? `✓ Sufficient balance for ₹${config.price} deduction`
                  : `Need ₹${Math.max(0, config.price - walletBalance)} more to unlock this report`}
              </Text>
            </View>
          </View>

          {!hasSufficientBalance && (
            <Pressable
              onPress={handleRechargeRedirect}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 100,
                backgroundColor: '#D4821A',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' }}>+ Recharge</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {/* Vastu Specific Property Fields */}
      {config.mode === 'vastu' && (
        <View style={{ marginBottom: 14, gap: 12 }}>
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
              1. Property Type *
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {PROPERTY_TYPES.map((pt) => {
                const sel = propertyType === pt;
                return (
                  <Pressable
                    key={pt}
                    onPress={() => setPropertyType(pt)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      backgroundColor: sel
                        ? colors.isLight
                          ? '#713B32'
                          : colors.goldAccent
                        : colors.surfaceVariant,
                      borderWidth: 1,
                      borderColor: sel ? colors.goldAccent : colors.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: sel ? '800' : '600',
                        color: sel ? (colors.isLight ? '#FFFFFF' : '#080D1A') : colors.textPrimary,
                      }}
                    >
                      {pt}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
              2. Main Entrance Facing Direction (Simhadwara) *
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {VASTU_DIRECTIONS_LIST.map((dir) => {
                const sel = entranceDirection === dir;
                return (
                  <Pressable
                    key={dir}
                    onPress={() => setEntranceDirection(dir)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 10,
                      backgroundColor: sel
                        ? colors.isLight
                          ? '#713B32'
                          : colors.goldAccent
                        : colors.surfaceVariant,
                      borderWidth: 1,
                      borderColor: sel ? colors.goldAccent : colors.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: sel ? '800' : '600',
                        color: sel ? (colors.isLight ? '#FFFFFF' : '#080D1A') : colors.textPrimary,
                      }}
                    >
                      🧭 {dir}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Optional Room Placement Toggle */}
          <Pressable
            onPress={() => setShowRoomDetails((prev) => !prev)}
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: colors.surfaceVariant,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>
              {showRoomDetails ? '▼ Hide Room-by-Room Placements' : '▶ Specify Kitchen, Bedroom, Puja & Toilet Zones (Optional)'}
            </Text>
            <AppIcon
              name={showRoomDetails ? 'keyboard_arrow_up_rounded' : 'keyboard_arrow_down_rounded'}
              color={colors.goldAccent}
              size={18}
            />
          </Pressable>

          {showRoomDetails && (
            <View style={{ padding: 12, borderRadius: 14, backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.cardBorder, gap: 10 }}>
              {[
                { label: 'Kitchen Zone', val: kitchenDir, set: setKitchenDir },
                { label: 'Master Bedroom Zone', val: masterBedroomDir, set: setMasterBedroomDir },
                { label: 'Puja / Mandir Zone', val: pujaRoomDir, set: setPujaRoomDir },
                { label: 'Toilet / Bath Zone', val: toiletDir, set: setToiletDir },
              ].map((rm) => (
                <View key={rm.label}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                    {rm.label}: <Text style={{ color: colors.goldAccent }}>{rm.val}</Text>
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {ROOM_DIRS.map((rd) => {
                      const active = rm.val === rd;
                      return (
                        <Pressable
                          key={rd}
                          onPress={() => rm.set(rd)}
                          style={{
                            paddingHorizontal: 9,
                            paddingVertical: 5,
                            borderRadius: 8,
                            backgroundColor: active ? colors.goldAccent : colors.surface,
                            borderWidth: 1,
                            borderColor: active ? colors.goldAccent : colors.cardBorder,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10.5,
                              fontWeight: active ? '800' : '500',
                              color: active ? '#080D1A' : colors.textSecondary,
                            }}
                          >
                            {rd}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Birth Details Intake Fields */}
      <View style={{ gap: 10 }}>
        <OutlinedField
          testID="reportIntake.name"
          label={config.mode === 'vastu' ? 'Property Owner Full Name *' : 'Full Name *'}
          icon="person_outline"
          value={name}
          onChangeText={setName}
        />

        {config.mode === 'parihara_plan' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['Male', 'Female', 'Other'] as const).map((g) => {
              const sel = gender === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 12,
                    backgroundColor: sel
                      ? colors.isLight
                        ? '#713B32'
                        : colors.goldAccent
                      : colors.surfaceVariant,
                    borderWidth: 1,
                    borderColor: sel ? colors.goldAccent : colors.cardBorder,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: sel ? '800' : '600',
                      color: sel ? (colors.isLight ? '#FFFFFF' : '#080D1A') : colors.textPrimary,
                    }}
                  >
                    {g}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* DOB & Time of Birth Pickers */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            testID="reportIntake.dob"
            onPress={handlePickDob}
            style={{
              flex: 1,
              minHeight: 50,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: colors.surfaceVariant,
              borderWidth: 1,
              borderColor: dob ? colors.goldAccent : colors.cardBorder,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <AppIcon name="calendar_today_outlined" color={colors.goldAccent} size={17} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 10 }}>Date of Birth *</Text>
              <Text style={{ color: dob ? colors.textPrimary : colors.textMuted, fontSize: 13, fontWeight: '700' }}>
                {dob || 'Select Date'}
              </Text>
            </View>
          </Pressable>

          <Pressable
            testID="reportIntake.tob"
            onPress={handlePickTob}
            style={{
              flex: 1,
              minHeight: 50,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: colors.surfaceVariant,
              borderWidth: 1,
              borderColor: tob ? colors.goldAccent : colors.cardBorder,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <AppIcon name="access_time_outlined" color={colors.goldAccent} size={17} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 10 }}>Time of Birth *</Text>
              <Text style={{ color: tob ? colors.textPrimary : colors.textMuted, fontSize: 13, fontWeight: '700' }}>
                {tob || 'Select Time'}
              </Text>
            </View>
          </Pressable>
        </View>

        <OutlinedField
          testID="reportIntake.pob"
          label={config.mode === 'vastu' ? 'Property City / Location *' : 'Place of Birth (City, State) *'}
          icon="location_on_outlined"
          value={pob}
          onChangeText={setPob}
        />

        {/* Quick City Chips if empty */}
        {!pob.trim() && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {POPULAR_CITIES.map((city) => (
              <Pressable
                key={city}
                onPress={() => setPob(`${city}, India`)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 100,
                  backgroundColor: colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>📍 {city}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Primary Concern Selector */}
        <View style={{ marginTop: 2 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '700', marginBottom: 6 }}>
            {config.mode === 'vastu' ? 'Primary Vastu Concern:' : 'Primary Life Focus / Sankalpa:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(config.mode === 'vastu' ? VASTU_CONCERNS : LIFE_CONCERNS).map((c) => {
              const sel = primaryConcern === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setPrimaryConcern(c)}
                  style={{
                    paddingHorizontal: 11,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: sel
                      ? colors.isLight
                        ? '#713B32'
                        : colors.goldAccent
                      : colors.surfaceVariant,
                    borderWidth: 1,
                    borderColor: sel ? colors.goldAccent : colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: sel ? '800' : '500',
                      color: sel ? (colors.isLight ? '#FFFFFF' : '#080D1A') : colors.textSecondary,
                    }}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Report Language Selector */}
        <View style={{ marginTop: 2 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '700', marginBottom: 6 }}>
            Report Language:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {REPORT_LANGUAGES.map((lang) => {
              const sel = language === lang;
              return (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={{
                    paddingHorizontal: 11,
                    paddingVertical: 5,
                    borderRadius: 100,
                    backgroundColor: sel
                      ? colors.isLight
                        ? '#713B32'
                        : colors.goldAccent
                      : colors.surfaceVariant,
                    borderWidth: 1,
                    borderColor: sel ? colors.goldAccent : colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: sel ? '800' : '500',
                      color: sel ? (colors.isLight ? '#FFFFFF' : '#080D1A') : colors.textSecondary,
                    }}
                  >
                    {lang}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Primary Action Button */}
      <View style={{ marginTop: 18, flexDirection: 'row', gap: 10 }}>
        {isModal && onCancel ? (
          <OutlinedButton
            label="Cancel"
            onPress={onCancel}
            color={colors.textSecondary}
            borderColor={colors.cardBorder}
            radius={100}
            paddingV={13}
            style={{ flex: 0.8 }}
          />
        ) : null}

        <View style={{ flex: 1.8 }}>
          {!isUserLoggedIn ? (
            <ElevatedButton
              testID="reportIntake.signInToContinue"
              label="🔒 Sign In to Continue →"
              onPress={handleSignInRedirect}
              bg="#713B32"
              fg="#FFFFFF"
              radius={100}
              paddingV={14}
              fontSize={14}
              fontWeight="800"
            />
          ) : config.price > 0 && !hasSufficientBalance ? (
            <ElevatedButton
              testID="reportIntake.rechargeToContinue"
              label={`⚡ Recharge Wallet (₹${config.price})`}
              onPress={handleRechargeRedirect}
              bg="#D4821A"
              fg="#FFFFFF"
              radius={100}
              paddingV={14}
              fontSize={14}
              fontWeight="800"
            />
          ) : (
            <ElevatedButton
              testID="reportIntake.submit"
              label={
                submitting
                  ? 'Synthesizing Vedic Report...'
                  : config.price > 0
                  ? `✨ Generate Report • Pay ₹${config.price}`
                  : '✨ Generate Free Vedic Report'
              }
              disabled={submitting}
              onPress={handleGenerate}
              bg="#713B32"
              fg="#FFFFFF"
              radius={100}
              paddingV={14}
              fontSize={14}
              fontWeight="800"
            />
          )}
        </View>
      </View>

      {submitting && (
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.goldAccent} />
          <Text style={{ marginLeft: 8, color: colors.textMuted, fontSize: 11.5 }}>
            Calculating Nirayana planetary ephemeris & directional pariharam...
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Inline Card version of the Service/Remedy/Vastu Report Form (matches #get-report section on the website)
 */
export function InlineServiceReportCard({
  config,
  onSuccess,
}: {
  config: ReportIntakeConfig;
  onSuccess?: (report: KundliReportItem) => void;
}) {
  const colors = useThemeColors();
  return (
    <LinearGradient
      colors={
        colors.isLight
          ? ['#FFFDF9', '#F8F2E8']
          : [withAlpha(colors.goldAccent, 18), colors.surface]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        padding: 18,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: colors.goldAccent,
        shadowColor: '#000',
        shadowOpacity: colors.isLight ? 0.06 : 0.25,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      <ServiceReportFormBody config={config} onSuccess={onSuccess} isModal={false} />
    </LinearGradient>
  );
}

/**
 * BottomSheet Modal version of the Service/Remedy/Vastu/Parihara Plan Intake Form
 */
export function ServiceReportIntakeModal({
  visible,
  config,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  config: ReportIntakeConfig | null;
  onClose: () => void;
  onSuccess?: (report: KundliReportItem) => void;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  if (!config) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose} testID="serviceReportIntake.modal">
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: Math.max(20, insets.bottom + 12),
          backgroundColor: colors.surface,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          maxHeight: 680,
        }}
      >
        <View
          style={{
            alignSelf: 'center',
            width: 42,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.textMuted,
            marginBottom: 14,
          }}
        />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ServiceReportFormBody
            config={config}
            onCancel={onClose}
            onSuccess={(rep) => {
              onClose();
              if (onSuccess) onSuccess(rep);
              else push(AppRoutes.kundliReportsScreen);
            }}
            isModal
          />
        </ScrollView>
      </View>
    </BottomSheet>
  );
}


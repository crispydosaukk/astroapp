/**
 * Astrologer OTP Login Screen — 1:1 mobile port of website `/astrologer-login`
 * (`src/app/astrologer-login/components/AstrologerAuthScreen.tsx`).
 *
 * Complete Flow:
 * 1. Enter registered mobile number -> calls `/api/astrologer/auth/send-otp`.
 * 2. If `registered === false` (404): displays "Account Not Found — You are not a registered astrologer"
 *    card with "Apply to Join Panel" (navigates to 5-step `/apply` screen) and "Contact Admin" buttons.
 * 3. If `registered === true && approved === false` (403): displays "Application Pending Approval"
 *    amber status banner with application status badge, 24–48h review notice, and "Contact Admin".
 * 4. If registered & approved: transitions to 4-digit OTP verification step with 30s resend timer.
 * 5. Calls `/api/astrologer/auth/verify-otp` -> shows "Namaste, {Name} Ji! 🙏" welcome modal ->
 *    persists `astro_verified_session` and navigates to `AstrologerDashboardScreen`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { BottomSheet, Dialog, SheetContainer, showSnackBar } from '@/components/overlays';
import { lh, Text, TextInput } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import { AppRoutes, go, pop, push, useExtra } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { AppLanguage, useLanguageStore } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const LANG_CODE_MAP: Record<AppLanguage, string> = {
  English: 'EN',
  Hindi: 'HI',
  Telugu: 'TE',
  Tamil: 'TA',
  Kannada: 'KN',
  Malayalam: 'ML',
};

const PORTAL_LANGUAGE_OPTIONS: Array<{ code: AppLanguage; label: string }> = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'हिन्दी (Hindi)' },
  { code: 'Telugu', label: 'తెలుగు (Telugu)' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)' },
  { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'Malayalam', label: 'മലയാളം (Malayalam)' },
];

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
];

export const ASTRO_SESSION_KEY = 'astro_verified_session';
export const LOCAL_APPLICATIONS_KEY = 'astroparihar_local_astrologer_applications';

type ErrorType = 'not_registered' | 'pending_approval' | 'rejected' | 'general' | null;

export default function AstrologerLoginScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const extra = useExtra<{ phone?: string }>();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [phone, setPhone] = useState(extra?.phone ? extra.phone.replace(/\D/g, '').slice(-10) : '');
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [applicationStatus, setApplicationStatus] = useState('');
  const [timer, setTimer] = useState(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [astrologerName, setAstrologerName] = useState('Acharya');
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const globalLanguage = useLanguageStore((s) => s.selectedLanguage);
  const setGlobalLanguage = useLanguageStore((s) => s.setLanguage);

  const otpRefs = [
    useRef<RNTextInput>(null),
    useRef<RNTextInput>(null),
    useRef<RNTextInput>(null),
    useRef<RNTextInput>(null),
  ];

  // Countdown timer for OTP resend
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [timer]);

  const cleanDigits = phone.replace(/\D/g, '');
  const fullPhoneNumber = `${selectedCountry.code}${cleanDigits}`;

  const checkLocalApplications = async (digits: string) => {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_APPLICATIONS_KEY);
      if (!raw) return null;
      const list = JSON.parse(raw) as Array<Record<string, any>>;
      const last10 = digits.slice(-10);
      return list.find((item) => {
        const itemDigits = String(item.phone || '').replace(/\D/g, '').slice(-10);
        return itemDigits === last10;
      }) || null;
    } catch {
      return null;
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setErrorType(null);

    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit registered mobile number.');
      setErrorType('general');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.astrologerSendOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhoneNumber }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStep('otp');
        setOtp(['', '', '', '']);
        setTimer(30);
        showSnackBar(
          data.isTest
            ? 'OTP sent to your registered mobile (Test OTP: 1234)'
            : 'Verification OTP sent to your registered mobile!'
        );
        setTimeout(() => otpRefs[0].current?.focus(), 150);
      } else if (data.registered === false || res.status === 404) {
        // Also check if user just submitted an application on this device
        const localApp = await checkLocalApplications(cleanDigits);
        if (localApp) {
          setErrorType('pending_approval');
          setApplicationStatus(localApp.status || 'Under Review');
          setError(
            'Your application is currently under review by our Vedic board. You will be notified once approved.'
          );
        } else {
          setErrorType('not_registered');
          setError(data.error || 'Mobile number is not registered as an astrologer on AstroParihar.');
        }
      } else if (data.registered === true && data.approved === false) {
        const dStatus = String(data.status || '').toLowerCase();
        if (dStatus.includes('reject') || dStatus.includes('decline')) {
          setErrorType('rejected');
          setApplicationStatus('Rejected');
          setError(data.error || 'Your application has been declined by the administrative committee. Please contact admin support.');
        } else {
          setErrorType('pending_approval');
          setApplicationStatus(data.status || 'Under Review');
          setError(data.error || 'Your application is currently under review by our team.');
        }
      } else {
        setErrorType('general');
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      console.warn('[AstrologerLogin] send-otp network fallback:', err?.message);
      const localApp = await checkLocalApplications(cleanDigits);
      if (localApp) {
        const lStatus = String(localApp.status || '').toLowerCase();
        if (lStatus.includes('reject') || lStatus.includes('decline')) {
          setErrorType('rejected');
          setApplicationStatus('Rejected');
          setError('Your application has been declined by the administrative committee. Please contact admin support.');
        } else {
          setErrorType('pending_approval');
          setApplicationStatus(localApp.status || 'Under Review');
          setError('Your application is currently under review by our team. You will be able to log in once approved.');
        }
      } else {
        setErrorType('not_registered');
        setError('Mobile number is not registered as an astrologer on AstroParihar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      // Handle paste of full 4-digit OTP
      const chars = digitsOnly.slice(0, 4).split('');
      const next = [...otp];
      chars.forEach((ch, idx) => {
        if (index + idx < 4) next[index + idx] = ch;
      });
      setOtp(next);
      const focusIdx = Math.min(3, index + chars.length);
      otpRefs[focusIdx].current?.focus();
      return;
    }

    const next = [...otp];
    next[index] = digitsOnly;
    setOtp(next);
    if (digitsOnly && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setErrorType(null);
    const code = otp.join('');
    if (code.length < 4) {
      setError('Please enter the complete 4-digit OTP.');
      setErrorType('general');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.astrologerVerifyOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhoneNumber, otp: code }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const name = data.astrologer?.name || 'Acharya';
        setAstrologerName(name);

        const sessionPayload = {
          id: data.astrologer?.id || `astro_${cleanDigits}`,
          name,
          phone: data.astrologer?.phone || fullPhoneNumber,
          email: data.astrologer?.email || '',
          specialisation: data.astrologer?.specialisation || 'Vedic Astrology, Kundali, Prashna',
          experience: data.astrologer?.experience || '10+ Years',
          languages: data.astrologer?.languages || ['English', 'Hindi', 'Sanskrit'],
          rating: data.astrologer?.rating || 4.9,
          consultations: data.astrologer?.consultations || 128,
          isOnline: data.astrologer?.isOnline ?? true,
          showOnWebsite: data.astrologer?.showOnWebsite ?? false,
          status: data.astrologer?.status || 'Probation',
          bio:
            data.astrologer?.bio ||
            'Traditional Vedic Jyotish Acharya specialising in Parashari Kundali analysis and Sattvic Parihar remedies.',
          verifiedAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(ASTRO_SESSION_KEY, JSON.stringify(sessionPayload));
        setShowSuccessPopup(true);

        setTimeout(() => {
          setShowSuccessPopup(false);
          go(AppRoutes.astrologerDashboardScreen);
        }, 1600);
      } else {
        setErrorType('general');
        setError(data.error || 'Invalid OTP. Please check and try again.');
      }
    } catch {
      setErrorType('general');
      setError('Verification failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const openApplyPortal = () => {
    push(AppRoutes.astrologerApplyScreen, { phone: cleanDigits });
  };

  const openContactAdmin = () => {
    Linking.openURL('mailto:astropariharuk@gmail.com?subject=Astrologer%20Portal%20Support').catch(() => {
      showSnackBar('Admin Email: astropariharuk@gmail.com');
    });
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="astrologerLogin.screen"
    >
      <StatusBar style={colors.isLight ? 'dark' : 'light'} />
      <AppBar
        title="Astrologer Portal"
        onBack={pop}
        testIDPrefix="astrologerLogin.appBar"
        actions={[
          <Pressable
            key="lang"
            testID="astrologerLogin.languageBtn"
            onPress={() => setShowLanguageSheet(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 100,
              borderWidth: 1,
              marginRight: 8,
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.cardBorder,
            }}
          >
            <AppIcon name="translate" size={14} color={colors.goldAccent} />
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 11.5,
                fontWeight: '700',
                marginLeft: 4,
              }}
            >
              {LANG_CODE_MAP[globalLanguage] || 'EN'}
            </Text>
            <AppIcon name="arrow_drop_down_rounded" size={16} color={colors.goldAccent} />
          </Pressable>,
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingTop: 16,
            paddingBottom: insets.bottom + 28,
            flexGrow: 1,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Auth Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Card Header */}
            <View style={{ alignItems: 'center', marginBottom: 22 }}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: withAlpha(AppColors.primary, colors.isLight ? 18 : 50),
                    borderColor: withAlpha(colors.goldAccent, 85),
                  },
                ]}
              >
                <AppIcon name="auto_awesome" size={22} color={colors.goldAccent} />
              </View>
              <Text
                style={{
                  color: colors.goldAccent,
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginTop: 12,
                }}
              >
                {step === 'phone' ? 'Welcome to Astrologer Portal' : 'OTP Verification'}
              </Text>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 22,
                  fontWeight: '800',
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                {step === 'phone' ? 'Sign In for Astrologers' : 'Enter Verification OTP'}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 6,
                  ...lh(13, 1.45),
                }}
              >
                {step === 'phone'
                  ? 'Enter your registered mobile number to receive a 4-digit verification code.'
                  : `Verification code sent to ${fullPhoneNumber}`}
              </Text>
            </View>

            {step === 'phone' ? (
              /* ==================== STEP 1: MOBILE NUMBER ==================== */
              <>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 11,
                    fontWeight: '800',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Registered Mobile Number
                </Text>

                <View
                  style={[
                    styles.inputRow,
                    {
                      borderColor: colors.cardBorder,
                      backgroundColor: colors.surfaceVariant,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => setShowCountryModal(!showCountryModal)}
                    style={[
                      styles.countrySelector,
                      {
                        borderRightColor: colors.cardBorder,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 16 }}>{selectedCountry.flag}</Text>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 14,
                        fontWeight: '700',
                        marginHorizontal: 4,
                      }}
                    >
                      {selectedCountry.code}
                    </Text>
                    <AppIcon name="arrow_drop_down_rounded" color={colors.goldAccent} size={18} />
                  </Pressable>

                  <TextInput
                    testID="astrologerLogin.phoneInput"
                    value={phone}
                    onChangeText={(txt) => {
                      setPhone(txt.replace(/\D/g, '').slice(0, 10));
                      if (error) {
                        setError('');
                        setErrorType(null);
                      }
                    }}
                    placeholder="98765 43210"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={[styles.phoneInput, { color: colors.textPrimary }]}
                  />
                </View>

                {/* Country Code Dropdown */}
                {showCountryModal && (
                  <View
                    style={[
                      styles.countryDropdown,
                      { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                    ]}
                  >
                    <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                      {COUNTRY_CODES.map((item) => (
                        <Pressable
                          key={item.code}
                          onPress={() => {
                            setSelectedCountry(item);
                            setShowCountryModal(false);
                          }}
                          style={[styles.countryOption, { borderBottomColor: colors.cardBorder }]}
                        >
                          <Text style={{ fontSize: 16 }}>{item.flag}</Text>
                          <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1, marginLeft: 8 }}>
                            {item.country}
                          </Text>
                          <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>
                            {item.code}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* ==================== ERROR / STATUS BANNERS ==================== */}
                {error && errorType === 'not_registered' ? (
                  <View
                    testID="astrologerLogin.notRegisteredBanner"
                    style={[
                      styles.statusCard,
                      {
                        backgroundColor: colors.isLight ? '#FEF2F2' : 'rgba(207, 68, 68, 0.12)',
                        borderColor: colors.isLight ? '#FECACA' : 'rgba(207, 68, 68, 0.4)',
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View
                        style={[
                          styles.statusIconBox,
                          {
                            backgroundColor: colors.isLight ? '#FEE2E2' : 'rgba(207, 68, 68, 0.22)',
                          },
                        ]}
                      >
                        <AppIcon name="error_outline" size={20} color="#DC2626" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={{
                            color: colors.isLight ? '#991B1B' : '#FCA5A5',
                            fontSize: 14,
                            fontWeight: '800',
                          }}
                        >
                          Account Not Found — You are not a registered astrologer
                        </Text>
                        <Text
                          style={{
                            color: colors.isLight ? '#B91C1C' : '#FECACA',
                            marginTop: 4,
                            ...lh(12.5, 1.45),
                          }}
                        >
                          {error}
                        </Text>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                          <Pressable
                            testID="astrologerLogin.applyNowButton"
                            onPress={openApplyPortal}
                            style={[
                              styles.bannerPrimaryBtn,
                              { backgroundColor: AppColors.primary },
                            ]}
                          >
                            <AppIcon name="how_to_reg" size={15} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '700', marginLeft: 6 }}>
                              Apply to Join Panel
                            </Text>
                          </Pressable>

                          <Pressable
                            testID="astrologerLogin.contactAdminButton"
                            onPress={openContactAdmin}
                            style={[
                              styles.bannerSecondaryBtn,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.isLight ? '#FCA5A5' : 'rgba(252,165,165,0.4)',
                              },
                            ]}
                          >
                            <AppIcon
                              name="mail_outline"
                              size={15}
                              color={colors.isLight ? '#991B1B' : '#FCA5A5'}
                            />
                            <Text
                              style={{
                                color: colors.isLight ? '#991B1B' : '#FCA5A5',
                                fontSize: 12.5,
                                fontWeight: '700',
                                marginLeft: 6,
                              }}
                            >
                              Contact Admin
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : null}

                {error && errorType === 'pending_approval' ? (
                  <View
                    testID="astrologerLogin.pendingApprovalBanner"
                    style={[
                      styles.statusCard,
                      {
                        backgroundColor: colors.isLight ? '#FFFBEB' : 'rgba(212, 130, 26, 0.14)',
                        borderColor: colors.isLight ? '#FDE68A' : 'rgba(212, 130, 26, 0.45)',
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View
                        style={[
                          styles.statusIconBox,
                          {
                            backgroundColor: colors.isLight ? '#FEF3C7' : 'rgba(212, 130, 26, 0.25)',
                          },
                        ]}
                      >
                        <AppIcon name="schedule" size={20} color="#D97706" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.isLight ? '#92400E' : '#FCD34D',
                              fontSize: 14,
                              fontWeight: '800',
                            }}
                          >
                            Application Pending Approval
                          </Text>
                          {applicationStatus ? (
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 100,
                                backgroundColor: colors.isLight ? '#FDE68A' : 'rgba(252,211,77,0.2)',
                              }}
                            >
                              <Text
                                style={{
                                  color: colors.isLight ? '#78350F' : '#FDE68A',
                                  fontSize: 10,
                                  fontWeight: '800',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {`Status: ${applicationStatus}`}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <Text
                          style={{
                            color: colors.isLight ? '#92400E' : '#FDE68A',
                            marginTop: 6,
                            ...lh(12.5, 1.45),
                          }}
                        >
                          {error}
                        </Text>
                        <Text
                          style={{
                            color: colors.isLight ? '#B45309' : 'rgba(253,230,138,0.8)',
                            marginTop: 6,
                            ...lh(11.5, 1.4),
                          }}
                        >
                          Our Vedic panel typically reviews applications within 24–48 hours. Once approved, you can log in directly using this mobile number.
                        </Text>

                        <View style={{ flexDirection: 'row', marginTop: 12 }}>
                          <Pressable
                            onPress={openContactAdmin}
                            style={[
                              styles.bannerSecondaryBtn,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.isLight ? '#FCD34D' : 'rgba(252,211,77,0.4)',
                              },
                            ]}
                          >
                            <AppIcon
                              name="mail_outline"
                              size={15}
                              color={colors.isLight ? '#92400E' : '#FCD34D'}
                            />
                            <Text
                              style={{
                                color: colors.isLight ? '#92400E' : '#FCD34D',
                                fontSize: 12.5,
                                fontWeight: '700',
                                marginLeft: 6,
                              }}
                            >
                              Contact Admin
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : null}

                {error && errorType === 'rejected' ? (
                  <View
                    testID="astrologerLogin.rejectedBanner"
                    style={[
                      styles.statusCard,
                      {
                        backgroundColor: colors.isLight ? '#FEF2F2' : 'rgba(220, 38, 38, 0.15)',
                        borderColor: colors.isLight ? '#FCA5A5' : 'rgba(220, 38, 38, 0.5)',
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View
                        style={[
                          styles.statusIconBox,
                          {
                            backgroundColor: colors.isLight ? '#FEE2E2' : 'rgba(220, 38, 38, 0.25)',
                          },
                        ]}
                      >
                        <AppIcon name="cancel" size={20} color="#DC2626" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={{
                            color: colors.isLight ? '#991B1B' : '#FCA5A5',
                            fontSize: 14,
                            fontWeight: '800',
                          }}
                        >
                          Application Rejected
                        </Text>
                        <Text
                          style={{
                            color: colors.isLight ? '#B91C1C' : '#FECACA',
                            marginTop: 4,
                            ...lh(12.5, 1.45),
                          }}
                        >
                          {error}
                        </Text>
                        <Text
                          style={{
                            color: colors.isLight ? '#991B1B' : 'rgba(252, 165, 165, 0.8)',
                            marginTop: 6,
                            ...lh(11.5, 1.4),
                          }}
                        >
                          Your astrologer application was reviewed and declined by the administrative committee. If you feel this was in error, please contact admin support.
                        </Text>

                        <View style={{ flexDirection: 'row', marginTop: 12 }}>
                          <Pressable
                            onPress={openContactAdmin}
                            style={[
                              styles.bannerSecondaryBtn,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.isLight ? '#FCA5A5' : 'rgba(252, 165, 165, 0.4)',
                              },
                            ]}
                          >
                            <AppIcon
                              name="mail_outline"
                              size={15}
                              color={colors.isLight ? '#991B1B' : '#FCA5A5'}
                            />
                            <Text
                              style={{
                                color: colors.isLight ? '#991B1B' : '#FCA5A5',
                                fontSize: 12.5,
                                fontWeight: '700',
                                marginLeft: 6,
                              }}
                            >
                              Contact Admin Support
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : null}

                {error && errorType === 'general' ? (
                  <View
                    style={[
                      styles.generalErrorBox,
                      {
                        backgroundColor: colors.isLight ? '#FEF2F2' : 'rgba(207, 68, 68, 0.14)',
                        borderColor: colors.isLight ? '#FECACA' : 'rgba(207, 68, 68, 0.4)',
                      },
                    ]}
                  >
                    <AppIcon name="error_outline" size={16} color="#DC2626" />
                    <Text
                      style={{
                        color: colors.isLight ? '#B91C1C' : '#FCA5A5',
                        fontSize: 12.5,
                        fontWeight: '600',
                        marginLeft: 8,
                        flex: 1,
                      }}
                    >
                      {error}
                    </Text>
                  </View>
                ) : null}

                <ElevatedButton
                  testID="astrologerLogin.sendOtpButton"
                  label={loading ? 'Checking & Sending OTP...' : 'Send Verification OTP'}
                  onPress={handleSendOtp}
                  disabled={loading || cleanDigits.length < 10}
                  loading={loading}
                  icon="verified_user"
                  style={{ marginTop: 20 }}
                  paddingV={16}
                  fontSize={15}
                  fontWeight="700"
                />

                {/* Footer Link to 5-Step Onboarding Application */}
                <View
                  style={[
                    styles.footerDivider,
                    { borderTopColor: colors.divider },
                  ]}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                    Not an onboarded astrologer yet?
                  </Text>
                  <Pressable
                    testID="astrologerLogin.footerApplyLink"
                    onPress={openApplyPortal}
                    style={[
                      styles.applyOutlineBtn,
                      {
                        borderColor: withAlpha(colors.goldAccent, 120),
                        backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 18 : 28),
                      },
                    ]}
                  >
                    <AppIcon name="school" size={16} color={colors.goldAccent} />
                    <Text
                      style={{
                        color: colors.isLight ? AppColors.primary : colors.goldAccent,
                        fontSize: 13.5,
                        fontWeight: '800',
                        marginLeft: 8,
                      }}
                    >
                      Apply to Join Astrologer Panel →
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              /* ==================== STEP 2: 4-DIGIT OTP VERIFICATION ==================== */
              <>
                <View style={styles.otpBoxesRow}>
                  {otp.map((digit, i) => (
                    <RNTextInput
                      key={i}
                      ref={otpRefs[i]}
                      testID={`astrologerLogin.otpInput.${i}`}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(i, v)}
                      onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                      keyboardType="number-pad"
                      maxLength={4}
                      selectTextOnFocus
                      style={[
                        styles.otpCell,
                        {
                          backgroundColor: colors.surfaceVariant,
                          borderColor: digit ? colors.goldAccent : colors.cardBorder,
                          color: colors.textPrimary,
                        },
                      ]}
                    />
                  ))}
                </View>

                {error ? (
                  <View
                    style={[
                      styles.generalErrorBox,
                      {
                        backgroundColor: colors.isLight ? '#FEF2F2' : 'rgba(207, 68, 68, 0.14)',
                        borderColor: colors.isLight ? '#FECACA' : 'rgba(207, 68, 68, 0.4)',
                        marginTop: 14,
                      },
                    ]}
                  >
                    <AppIcon name="error_outline" size={16} color="#DC2626" />
                    <Text
                      style={{
                        color: colors.isLight ? '#B91C1C' : '#FCA5A5',
                        fontSize: 12.5,
                        fontWeight: '600',
                        marginLeft: 8,
                        flex: 1,
                      }}
                    >
                      {error}
                    </Text>
                  </View>
                ) : null}

                {/* Resend OTP Controls */}
                <View style={{ alignItems: 'center', marginTop: 16 }}>
                  {timer > 0 ? (
                    <Text style={{ color: colors.textMuted, fontSize: 12.5 }}>
                      Resend OTP in{' '}
                      <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{timer}s</Text>
                    </Text>
                  ) : (
                    <Pressable onPress={handleSendOtp} disabled={loading}>
                      <Text
                        style={{
                          color: colors.goldAccent,
                          fontSize: 13,
                          fontWeight: '800',
                          textDecorationLine: 'underline',
                        }}
                      >
                        Resend Verification OTP
                      </Text>
                    </Pressable>
                  )}
                </View>

                <ElevatedButton
                  testID="astrologerLogin.verifyOtpButton"
                  label={loading ? 'Verifying...' : 'Verify & Enter Portal'}
                  onPress={handleVerifyOtp}
                  disabled={loading || otp.join('').length < 4}
                  loading={loading}
                  icon="login"
                  style={{ marginTop: 22 }}
                  paddingV={16}
                  fontSize={15}
                  fontWeight="700"
                />

                <Pressable
                  onPress={() => {
                    setStep('phone');
                    setOtp(['', '', '', '']);
                    setError('');
                    setErrorType(null);
                  }}
                  style={{ marginTop: 16, alignSelf: 'center', paddingVertical: 6 }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                    ← Edit mobile number
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Namaste Success Verification Modal */}
      <Dialog
        visible={showSuccessPopup}
        onClose={() => {}}
        barrierDismissible={false}
        testID="astrologerLogin.successDialog"
      >
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: 'rgba(45, 158, 107, 0.16)',
              borderWidth: 2,
              borderColor: AppColors.success,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <AppIcon name="check_circle" size={38} color={AppColors.success} />
          </View>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 20,
              fontWeight: '800',
              textAlign: 'center',
            }}
          >
            {`Namaste, ${astrologerName} Ji! 🙏`}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13.5,
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            OTP Verified Successfully. Entering your Astrologer Portal...
          </Text>
        </View>
      </Dialog>

      {/* Language Selector Bottom Sheet */}
      <BottomSheet
        visible={showLanguageSheet}
        onClose={() => setShowLanguageSheet(false)}
      >
        <SheetContainer style={{ padding: 20 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 12 }}>
            Select Language
          </Text>
          {PORTAL_LANGUAGE_OPTIONS.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => {
                setGlobalLanguage(lang.code);
                setShowLanguageSheet(false);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 13,
                borderBottomWidth: 1,
                borderBottomColor: colors.divider,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontWeight: '700', flex: 1 }}>
                {lang.label}
              </Text>
              {globalLanguage === lang.code ? (
                <AppIcon name="check_circle" size={20} color={colors.goldAccent} />
              ) : null}
            </Pressable>
          ))}
        </SheetContainer>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 14,
    letterSpacing: 0.8,
  },
  countryDropdown: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  statusCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bannerSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  generalErrorBox: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerDivider: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  applyOutlineBtn: {
    marginTop: 10,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  otpCell: {
    width: 58,
    height: 62,
    borderRadius: 16,
    borderWidth: 1.5,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
});


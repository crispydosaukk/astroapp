/**
 * Customer Sign In Screen (Phone + OTP Verification)
 * Connected to same Firebase database & APIs as the website (astroparihar).
 * - Existing User: Direct login to Home Dashboard with saved profile.
 * - New User: Seamless transition to Birth Profile Setup ("Who is this profile for?").
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { showSnackBar } from '@/components/overlays';
import { lh, Text, TextInput } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, go, pop, push } from '@/navigation/routes';
import { argb } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';

const API_BASE = API_ENDPOINTS.auth;

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+7', country: 'Russia / Kazakhstan', flag: '🇷🇺' },
];

export default function SignInScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const setUser = useAuthStore((s) => s.setUser);
  const setPendingAuth = useAuthStore((s) => s.setPendingAuth);

  const navigateAfterLogin = () => {
    const redirect = useAuthStore.getState().postLoginRedirect;
    if (redirect) {
      useAuthStore.getState().setPostLoginRedirect(null);
      if (redirect.popOnSuccess) {
        pop();
        return;
      }
      if (redirect.route) {
        go(AppRoutes.homeDashboardScreen);
        setTimeout(() => push(redirect.route, redirect.extra), 80);
        return;
      }
    }
    go(AppRoutes.homeDashboardScreen);
  };

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Timer for OTP resend countdown
  useEffect(() => {
    if (step !== 2) return;
    setCountdown(30);
    setCanResend(false);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  const fullPhoneNumber = `${selectedCountry.code}${phone.replace(/\D/g, '')}`;

  const openTerms = () => {
    push(AppRoutes.termsScreen);
  };

  const openPrivacy = () => {
    push(AppRoutes.privacyPolicyScreen);
  };

  const handleSendOTP = async () => {
    const rawNumber = phone.replace(/\D/g, '');
    if (rawNumber.length < 8) {
      showSnackBar('Please enter a valid mobile number', '#CF4444');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhoneNumber }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStep(2);
        showSnackBar(data.isTest ? 'OTP sent (Dev OTP: 1234)' : 'OTP sent successfully to your mobile!');
      } else {
        showSnackBar(data.error || 'Failed to send OTP. Please check number.', '#CF4444');
      }
    } catch (err: any) {
      // Fallback in case of local network error
      console.warn('Send OTP network error:', err.message);
      setStep(2);
      showSnackBar('Entered offline verification mode (Dev OTP: 1234)');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.trim().length < 4) {
      showSnackBar('Please enter the 4 or 6-digit OTP', '#CF4444');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhoneNumber, otp: otp.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const cleanPhone = fullPhoneNumber.replace(/\D/g, '');
        const localProfileRaw =
          (await AsyncStorage.getItem(`astroparihar_user_birth_details_${cleanPhone}`)) ||
          (data.uid ? await AsyncStorage.getItem(`astroparihar_user_birth_details_${data.uid}`) : null);
        const localProfile = localProfileRaw ? JSON.parse(localProfileRaw) : null;

        if (data.isNewUser && !localProfile?.name) {
          // Genuinely new user with no profile on backend or device
          setPendingAuth({
            uid: data.uid,
            phone: data.phone || fullPhoneNumber,
            isNewUser: true,
            token: data.token,
          });
          showSnackBar('Mobile verified! Set up your cosmic birth profile.');
          go(AppRoutes.birthProfileSetupScreen);
        } else {
          // Existing user (found in backend or saved on device)
          const mergedUser = {
            uid: data.uid || localProfile?.uid || `phone_${cleanPhone}`,
            phone: data.phone || fullPhoneNumber,
            ...(localProfile || {}),
            ...(data.user || {}),
          };
          await setUser(mergedUser, data.token || `session_${mergedUser.uid}`);
          showSnackBar(`Welcome back, ${mergedUser.name || 'Seeker'}!`);
          navigateAfterLogin();
        }
      } else {
        showSnackBar(data.error || 'Invalid OTP code. Try again.', '#CF4444');
      }
    } catch (err: any) {
      console.warn('Verify OTP fallback:', err.message);
      // Fallback for offline/test verification (1234 or 9999)
      if (otp === '1234' || otp === '9999') {
        const cleanDigits = phone.replace(/\D/g, '');
        const fallbackUid = `phone_${cleanDigits}`;
        const localProfileRaw =
          (await AsyncStorage.getItem(`astroparihar_user_birth_details_${cleanDigits}`)) ||
          (await AsyncStorage.getItem(`astroparihar_user_birth_details_${fallbackUid}`));

        if (localProfileRaw) {
          const parsed = JSON.parse(localProfileRaw);
          await setUser(parsed, `session_${fallbackUid}`);
          showSnackBar(`Welcome back, ${parsed.name || 'Seeker'}!`);
          navigateAfterLogin();
        } else {
          setPendingAuth({
            uid: fallbackUid,
            phone: fullPhoneNumber,
            isNewUser: true,
            token: `session_${fallbackUid}`,
          });
          showSnackBar('Mobile verified! Set up your cosmic birth profile.');
          go(AppRoutes.birthProfileSetupScreen);
        }
      } else {
        showSnackBar('Verification error. Please try again.', '#CF4444');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: colors.background }]} testID="signIn.screen">
      <StatusBar style={colors.isLight ? 'dark' : 'light'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: insets.bottom + 24,
            flexGrow: 1,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Header */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{ width: Math.min(width * 0.7, 260), height: Math.min(width * 0.7, 260) * 0.5 }}>
              <Image
                source={require('@/../assets/images/app_logo.png')}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
                accessibilityLabel="AstroParihar Logo"
              />
            </View>
          </View>

          {/* Card Container */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            {step === 1 ? (
              /* Step 1: Mobile Number Entry */
              <>
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '800', ...lh(22, 1.2) }}>
                    Sign In or Register
                  </Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 6, ...lh(13, 1.4) }}>
                    Enter your mobile number to receive a secure SMS verification code.
                  </Text>
                </View>

                {/* Country Code & Phone Input */}
                <View style={[styles.inputRow, { borderColor: colors.cardBorder, backgroundColor: colors.surfaceVariant }]}>
                  <Pressable
                    onPress={() => setShowCountryModal(!showCountryModal)}
                    style={[styles.countrySelector, { borderRightColor: colors.cardBorder, backgroundColor: colors.surface }]}
                  >
                    <Text style={{ fontSize: 16 }}>{selectedCountry.flag}</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginHorizontal: 4 }}>
                      {selectedCountry.code}
                    </Text>
                    <AppIcon name="arrow_drop_down_rounded" color={colors.goldAccent} size={18} />
                  </Pressable>

                  <TextInput
                    testID="signIn.phoneInput"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter mobile number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={14}
                    style={[styles.phoneInput, { color: colors.textPrimary }]}
                  />
                </View>

                {/* Country Code Dropdown */}
                {showCountryModal && (
                  <View style={[styles.countryDropdown, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.cardBorder,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <AppIcon name="search" color={colors.goldAccent} size={16} />
                      <TextInput
                        value={countrySearch}
                        onChangeText={setCountrySearch}
                        placeholder="Search country or code..."
                        placeholderTextColor={colors.textMuted}
                        style={{
                          flex: 1,
                          marginLeft: 8,
                          color: colors.textPrimary,
                          fontSize: 13,
                          paddingVertical: 4,
                        }}
                      />
                      {countrySearch ? (
                        <Pressable onPress={() => setCountrySearch('')}>
                          <AppIcon name="close" color={colors.textMuted} size={14} />
                        </Pressable>
                      ) : null}
                    </View>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {COUNTRY_CODES.filter((item) => {
                        if (!countrySearch.trim()) return true;
                        const q = countrySearch.trim().toLowerCase();
                        return (
                          item.country.toLowerCase().includes(q) ||
                          item.code.toLowerCase().includes(q)
                        );
                      }).map((item) => (
                        <Pressable
                          key={item.code + item.country}
                          onPress={() => {
                            setSelectedCountry(item);
                            setShowCountryModal(false);
                            setCountrySearch('');
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

                <ElevatedButton
                  testID="signIn.sendOtpButton"
                  label={loading ? 'Sending Code...' : 'Get Verification Code'}
                  onPress={handleSendOTP}
                  disabled={loading}
                  style={{ marginTop: 22 }}
                  paddingV={16}
                  fontSize={15}
                  fontWeight="700"
                />

                {/* Continue as Guest option */}
                <Pressable
                  testID="signIn.guestButton"
                  onPress={() => {
                    showSnackBar('Exploring AstroParihar as Guest');
                    go(AppRoutes.homeDashboardScreen);
                  }}
                  style={{
                    marginTop: 14,
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    backgroundColor: colors.isLight ? '#F5F2EB' : 'rgba(255,255,255,0.05)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
                    Continue as Guest →
                  </Text>
                </Pressable>

                {/* Astrologer Portal Divider & Sign In Button */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 18,
                    marginBottom: 14,
                  }}
                >
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 10.5,
                      fontWeight: '800',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      marginHorizontal: 10,
                    }}
                  >
                    Astrologer Partner Portal
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
                </View>

                <Pressable
                  testID="signIn.astrologerLoginButton"
                  onPress={() => push(AppRoutes.astrologerLoginScreen, phone ? { phone } : undefined)}
                  style={{
                    paddingVertical: 13,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: colors.goldAccent,
                    backgroundColor: colors.isLight
                      ? 'rgba(201, 168, 76, 0.12)'
                      : 'rgba(201, 168, 76, 0.14)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name="auto_awesome" size={17} color={colors.goldAccent} />
                  <Text
                    style={{
                      color: colors.isLight ? '#713B32' : colors.goldAccent,
                      fontSize: 14,
                      fontWeight: '800',
                      marginLeft: 8,
                    }}
                  >
                    Astrologer Sign In
                  </Text>
                  <AppIcon
                    name="arrow_forward_ios_rounded"
                    size={13}
                    color={colors.isLight ? '#713B32' : colors.goldAccent}
                    style={{ marginLeft: 6 }}
                  />
                </Pressable>

                <Pressable
                  testID="signIn.astrologerApplyLink"
                  onPress={() => push(AppRoutes.astrologerApplyScreen, phone ? { phone } : undefined)}
                  style={{
                    marginTop: 10,
                    paddingVertical: 4,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                    Not a registered astrologer yet?{' '}
                    <Text
                      style={{
                        color: colors.goldAccent,
                        fontWeight: '800',
                        textDecorationLine: 'underline',
                      }}
                    >
                      Apply to Join Panel →
                    </Text>
                  </Text>
                </Pressable>

                <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 16, ...lh(11, 1.4) }}>
                  By continuing, you agree to AstroParihar&apos;s{' '}
                  <Text
                    testID="signIn.termsLink"
                    onPress={openTerms}
                    style={{ color: colors.goldAccent, fontWeight: '700', textDecorationLine: 'underline' }}
                  >
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text
                    testID="signIn.privacyLink"
                    onPress={openPrivacy}
                    style={{ color: colors.goldAccent, fontWeight: '700', textDecorationLine: 'underline' }}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </>
            ) : (
              /* Step 2: OTP Verification */
              <>
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '800', ...lh(22, 1.2) }}>
                    Verify Code
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                      Code sent to <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{fullPhoneNumber}</Text>
                    </Text>
                    <Pressable onPress={() => setStep(1)} style={{ marginLeft: 8 }}>
                      <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' }}>
                        Edit
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* OTP Input Field */}
                <View style={[styles.otpBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.goldAccent }]}>
                  <TextInput
                    testID="signIn.otpInput"
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="• • • •"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    style={[styles.otpInput, { color: colors.textPrimary }]}
                  />
                </View>

                {/* Resend Controls */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {canResend ? "Didn't receive code?" : `Resend in ${countdown}s`}
                  </Text>
                  {canResend && (
                    <Pressable onPress={handleSendOTP} disabled={loading}>
                      <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>Resend OTP</Text>
                    </Pressable>
                  )}
                </View>

                <ElevatedButton
                  testID="signIn.verifyOtpButton"
                  label={loading ? 'Verifying...' : 'Verify & Continue'}
                  onPress={handleVerifyOTP}
                  disabled={loading}
                  style={{ marginTop: 22 }}
                  paddingV={16}
                  fontSize={15}
                  fontWeight="700"
                />

                <Pressable
                  onPress={() => setStep(1)}
                  style={{ marginTop: 14, alignSelf: 'center', padding: 4 }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Use different phone number</Text>
                </Pressable>

                <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 16, ...lh(11, 1.4) }}>
                  By continuing, you agree to AstroParihar&apos;s{' '}
                  <Text
                    testID="signIn.otpTermsLink"
                    onPress={openTerms}
                    style={{ color: colors.goldAccent, fontWeight: '700', textDecorationLine: 'underline' }}
                  >
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text
                    testID="signIn.otpPrivacyLink"
                    onPress={openPrivacy}
                    style={{ color: colors.goldAccent, fontWeight: '700', textDecorationLine: 'underline' }}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080D1A',
  },
  card: {
    backgroundColor: argb('12FFFFFF'),
    borderRadius: 24,
    borderWidth: 1,
    borderColor: argb('26C9A84C'),
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: argb('14000000'),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: argb('33C9A84C'),
    overflow: 'hidden',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: argb('26C9A84C'),
    backgroundColor: argb('14FFFFFF'),
  },
  phoneInput: {
    flex: 1,
    color: '#F0EAD6',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  countryDropdown: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#121A2E',
    borderWidth: 1,
    borderColor: argb('33C9A84C'),
    overflow: 'hidden',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: argb('14FFFFFF'),
  },
  otpBox: {
    backgroundColor: argb('14000000'),
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C9A84C',
    paddingVertical: 8,
  },
  otpInput: {
    color: '#F0EAD6',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 10,
    paddingVertical: 10,
  },
});

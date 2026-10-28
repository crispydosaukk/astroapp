/**
 * Port of lib/presentation/profile_screen/profile_screen.dart
 * Completely dynamic:
 * - Dynamic Devotee Profile (Name, Phone/Email, Zodiac, Moon sign, Nakshatra)
 * - Live Wallet Balance from getWalletBalance() and subscribeWallet()
 * - Dynamic Consultation & Report counts
 * - Interactive Edit Profile BottomSheet (persists to AsyncStorage)
 * - Global language translations across all sections
 * - Dynamic themes (Light Vedic & Dark Cosmic) with high-contrast text
 * - Functional Sign Out with session cleanup & route reset
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton, OutlinedButton } from '@/components/common';
import { BottomSheet, Dialog, showSnackBar } from '@/components/overlays';
import { Text, TextInput } from '@/components/Text';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, go, push } from '@/navigation/routes';
import { fetchCalculatedKundli } from '@/services/astrologyService';
import { getWalletBalance, subscribeWallet } from '@/services/walletService';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors, useThemeStore } from '@/theme/themeStore';

type MenuItem = { icon: string; labelKey: string; defaultLabel: string; route: string; color: string; id: string; value?: string };

const MY_ASTROLOGY: MenuItem[] = [
  { icon: 'auto_stories', labelKey: 'profile.myKundli', defaultLabel: 'My Kundli', route: AppRoutes.myKundliScreen, color: '#9370DB', id: 'myKundli' },
  { icon: 'auto_awesome', labelKey: 'profile.myRemedies', defaultLabel: 'My Remedies (अष्ट परिहार)', route: AppRoutes.remediesScreen, color: '#C9A84C', id: 'myRemedies' },
  { icon: 'person_outline_rounded', labelKey: 'profile.birthProfiles', defaultLabel: 'Birth Profiles', route: AppRoutes.birthProfilesScreen, color: '#4FC3F7', id: 'birthProfiles' },
  { icon: 'description_outlined', labelKey: 'profile.kundliReports', defaultLabel: 'Kundli & Service Reports', route: AppRoutes.kundliReportsScreen, color: '#FFD700', id: 'kundliReports' },
  { icon: 'favorite_border', labelKey: 'profile.matchReports', defaultLabel: 'Match Reports', route: AppRoutes.matchReportsScreen, color: '#FF6B6B', id: 'matchReports' },
  { icon: 'calendar_today_outlined', labelKey: 'profile.panchangReports', defaultLabel: 'Panchang & Muhurat', route: AppRoutes.panchangScreen, color: '#4FC3F7', id: 'panchangReports' },
  { icon: 'star_outline', labelKey: 'profile.savedAstrologers', defaultLabel: 'Saved Astrologers', route: AppRoutes.savedAstrologersScreen, color: '#FFB347', id: 'savedAstrologers' },
  { icon: 'history', labelKey: 'profile.consultationHistory', defaultLabel: 'Consultation History', route: AppRoutes.consultationHistoryScreen, color: '#81C784', id: 'consultationHistory' },
];

const MY_ACCOUNT: MenuItem[] = [
  { icon: 'account_balance_wallet_outlined', labelKey: 'profile.wallet', defaultLabel: 'Wallet', route: AppRoutes.walletScreen, color: '#FFD700', id: 'wallet' },
  { icon: 'receipt_long_outlined', labelKey: 'profile.transactions', defaultLabel: 'Transactions', route: AppRoutes.walletScreen, color: '#4FC3F7', id: 'transactions' },
  { icon: 'credit_card_outlined', labelKey: 'profile.paymentMethods', defaultLabel: 'Payment Methods', route: AppRoutes.walletScreen, color: '#81C784', id: 'paymentMethods' },
  { icon: 'notifications_outlined', labelKey: 'profile.notifications', defaultLabel: 'Notifications', route: AppRoutes.notificationsScreen, color: '#FF6B6B', id: 'notifications' },
];

const SUPPORT: MenuItem[] = [
  { icon: 'help_outline_rounded', labelKey: 'profile.helpCentre', defaultLabel: 'Help Centre', route: AppRoutes.helpCentreScreen, color: '#4FC3F7', id: 'helpCentre' },
  { icon: 'support_agent_outlined', labelKey: 'profile.contactSupport', defaultLabel: 'Contact Support', route: AppRoutes.contactSupportScreen, color: '#81C784', id: 'contactSupport' },
  { icon: 'quiz_outlined', labelKey: 'profile.faqs', defaultLabel: 'FAQs', route: AppRoutes.helpCentreScreen, color: '#FFD700', id: 'faqs' },
  { icon: 'gavel_outlined', labelKey: 'profile.terms', defaultLabel: 'Terms of Service', route: AppRoutes.termsScreen, color: '#FF6B6B', id: 'terms' },
  { icon: 'policy_outlined', labelKey: 'profile.privacyPolicy', defaultLabel: 'Privacy Policy', route: AppRoutes.privacyPolicyScreen, color: '#9370DB', id: 'privacyPolicy' },
];

function ProfileStat({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function AstroStat({ symbol, value, label, colors }: { symbol: string; value: string; label: string; colors: any }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 22 }}>{symbol}</Text>
      <Text style={{ marginTop: 4, color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export function MenuSection({
  title,
  items,
  idPrefix,
  colors,
}: {
  title: string;
  items: MenuItem[];
  idPrefix: string;
  colors: any;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
      <Text
        style={{
          marginLeft: 4,
          marginBottom: 10,
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          overflow: 'hidden',
        }}
      >
        {items.map((it, i) => (
          <View key={it.id}>
            <Pressable
              testID={`${idPrefix}.${it.id}`}
              onPress={() => push(it.route)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: withAlpha(it.color, colors.isLight ? 25 : 30),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name={it.icon} color={it.color} size={19} />
              </View>
              <Text
                style={{
                  marginLeft: 14,
                  flex: 1,
                  color: colors.textPrimary,
                  fontSize: 14,
                  fontWeight: '600',
                }}
              >
                {t(it.labelKey, it.defaultLabel)}
              </Text>
              {it.value ? (
                <Text
                  style={{
                    marginRight: 8,
                    color: colors.accent,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {it.value}
                </Text>
              ) : null}
              <AppIcon name="chevron_right_rounded" color={colors.textMuted} size={20} />
            </Pressable>
            {i < items.length - 1 ? (
              <View style={{ height: 1, marginLeft: 68, marginRight: 16, backgroundColor: colors.divider }} />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function getZodiacSymbol(signName: string): string {
  const map: Record<string, string> = {
    Aries: '♈', Mesha: '♈',
    Taurus: '♉', Vrishabha: '♉',
    Gemini: '♊', Mithuna: '♊',
    Cancer: '♋', Karka: '♋',
    Leo: '♌', Simha: '♌',
    Virgo: '♍', Kanya: '♍',
    Libra: '♎', Tula: '♎',
    Scorpio: '♏', Vrischika: '♏',
    Sagittarius: '♐', Dhanu: '♐',
    Capricorn: '♑', Makara: '♑',
    Aquarius: '♒', Kumbha: '♒',
    Pisces: '♓', Meena: '♓',
  };
  return map[signName] || '✨';
}

export default function ProfileScreen() {
  const colors = useThemeColors();
  const selectedTheme = useThemeStore((s) => s.selectedTheme);
  const insets = useSafeAreaInsets();
  const { t, selectedLanguage } = useTranslation();
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const updateUserProfile = useAuthStore((s) => s.updateUserProfile);

  const isAuth = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));
  const currentUserName = isAuth && authUser?.name?.trim() ? authUser.name.trim() : (isAuth && authUser?.phone ? authUser.phone : 'Guest');

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [reportCount, setReportCount] = useState(4);
  const [consultationCount, setConsultationCount] = useState(2);
  const [profileData, setProfileData] = useState({
    name: currentUserName,
    email: isAuth ? (authUser?.phone ? `${authUser.phone}` : authUser?.email || 'Registered User') : 'Sign in to sync your profile',
    dob: authUser?.dob || (isAuth ? 'Not specified' : 'Sign in to view'),
    tob: authUser?.tob || (isAuth ? 'Not specified' : 'Sign in to view'),
    pob: authUser?.pob || (isAuth ? 'Not specified' : 'Sign in to view'),
    zodiac: authUser?.zodiac || 'Scorpio',
    zodiacSymbol: getZodiacSymbol(authUser?.zodiac || 'Scorpio'),
    moonSign: authUser?.moonSign || 'Cancer',
    moonSymbol: getZodiacSymbol(authUser?.moonSign || 'Cancer'),
    nakshatra: authUser?.nakshatra || 'Pushya',
  });

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editTob, setEditTob] = useState('');
  const [editPob, setEditPob] = useState('');

  const loadUserData = async () => {
    try {
      const isUserLoggedIn = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));
      if (!isUserLoggedIn) {
        setProfileData({
          name: 'Guest',
          email: 'Sign in to sync your profile',
          dob: 'Sign in to view',
          tob: 'Sign in to view',
          pob: 'Sign in to view',
          zodiac: 'Aries',
          zodiacSymbol: '♈',
          moonSign: 'Taurus',
          moonSymbol: '♉',
          nakshatra: 'Ashwini',
        });
        return;
      }

      // Read user-scoped storage to prevent cross-account profile leakage
      const cleanPhone = authUser?.phone ? authUser.phone.replace(/\D/g, '') : null;
      const userKey = authUser?.uid ? `astroparihar_user_birth_details_${authUser.uid}` : null;
      const phoneKey = cleanPhone ? `astroparihar_user_birth_details_${cleanPhone}` : null;
      let storedDetails: any = null;

      if (userKey) {
        const raw = await AsyncStorage.getItem(userKey);
        if (raw) storedDetails = JSON.parse(raw);
      }
      if (!storedDetails && phoneKey) {
        const raw = await AsyncStorage.getItem(phoneKey);
        if (raw) storedDetails = JSON.parse(raw);
      }
      if (!storedDetails) {
        const raw = await AsyncStorage.getItem('astroparihar_user_birth_details');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!parsed.uid || parsed.uid === authUser?.uid || (parsed.phone && parsed.phone === authUser?.phone)) {
            storedDetails = parsed;
          }
        }
      }

      const baseName = authUser?.name?.trim() || storedDetails?.name?.trim() || authUser?.phone || 'Seeker';
      const baseEmail = authUser?.phone || authUser?.email || storedDetails?.email || 'Registered User';
      const baseDob = authUser?.dob || storedDetails?.dob || '';
      const baseTob = authUser?.tob || storedDetails?.tob || '';
      const basePob = authUser?.pob || storedDetails?.pob || '';
      const baseGender = authUser?.gender || storedDetails?.gender || 'Male';

      let zodiac = authUser?.zodiac || storedDetails?.zodiac || 'Scorpio';
      let zodiacSymbol = getZodiacSymbol(zodiac);
      let moonSign = authUser?.moonSign || storedDetails?.moonSign || 'Cancer';
      let moonSymbol = getZodiacSymbol(moonSign);
      let nakshatra = authUser?.nakshatra || storedDetails?.nakshatra || 'Pushya';

      // Fetch dynamic kundli calculations to get real zodiac, rashi, and nakshatra if DOB is provided
      if (baseDob) {
        try {
          const chart = await fetchCalculatedKundli({
            dob: baseDob,
            tob: baseTob || '12:00 PM',
            pob: basePob || 'Delhi, India',
            name: baseName,
            gender: baseGender,
          });
          if (chart) {
            if (chart.ascendant?.sign) {
              zodiac = chart.ascendant.sign;
              zodiacSymbol = getZodiacSymbol(chart.ascendant.sign);
            }
            if (chart.moonSign) {
              moonSign = chart.moonSign;
              moonSymbol = getZodiacSymbol(chart.moonSign);
            }
            if (chart.nakshatra) {
              nakshatra = chart.nakshatra;
            }
          }
        } catch {}
      }

      setProfileData({
        name: baseName,
        email: baseEmail,
        dob: baseDob || 'Not specified',
        tob: baseTob || 'Not specified',
        pob: basePob || 'Not specified',
        zodiac,
        zodiacSymbol,
        moonSign,
        moonSymbol,
        nakshatra,
      });

      // Load dynamic report & consultation counts
      try {
        const storedReports = await AsyncStorage.getItem('astroparihar_kundli_reports');
        if (storedReports) {
          const parsed = JSON.parse(storedReports);
          if (Array.isArray(parsed)) setReportCount(parsed.length);
        }
      } catch {}

      try {
        const storedHist = await AsyncStorage.getItem('astroparihar_consultation_history');
        if (storedHist) {
          const parsed = JSON.parse(storedHist);
          if (Array.isArray(parsed)) setConsultationCount(parsed.length);
        }
      } catch {}
    } catch {}
  };

  useEffect(() => {
    loadUserData();
    getWalletBalance().then(setWalletBalance);
    const unsub = subscribeWallet(setWalletBalance);
    return () => unsub();
  }, [authUser, isAuthenticated]);

  const openEditModal = () => {
    setEditName(profileData.name !== 'Guest' && profileData.name !== 'Seeker' ? profileData.name : (authUser?.name || ''));
    setEditEmail(profileData.email !== 'Sign in to sync your profile' ? profileData.email : (authUser?.phone || ''));
    setEditDob(profileData.dob !== 'Not specified' && profileData.dob !== 'Sign in to view' ? profileData.dob : (authUser?.dob || ''));
    setEditTob(profileData.tob !== 'Not specified' && profileData.tob !== 'Sign in to view' ? profileData.tob : (authUser?.tob || ''));
    setEditPob(profileData.pob !== 'Not specified' && profileData.pob !== 'Sign in to view' ? profileData.pob : (authUser?.pob || ''));
    setEditSheetOpen(true);
  };

  const saveProfileEdits = async () => {
    const updated = {
      name: editName.trim() || profileData.name,
      email: editEmail.trim() || profileData.email,
      dob: editDob.trim() || (profileData.dob !== 'Not specified' ? profileData.dob : ''),
      tob: editTob.trim() || (profileData.tob !== 'Not specified' ? profileData.tob : ''),
      pob: editPob.trim() || (profileData.pob !== 'Not specified' ? profileData.pob : ''),
    };

    // Update in-memory authUser, persistent storage, and user-scoped storage
    await updateUserProfile(updated);

    setProfileData((prev) => ({
      ...prev,
      ...updated,
    }));
    setEditSheetOpen(false);
    showSnackBar('Profile details saved successfully!', colors.surfaceVariant);
    loadUserData();
  };

  const handleConfirmSignOut = async () => {
    setSignOutOpen(false);
    await logout();
    setProfileData({
      name: 'Guest',
      email: 'Sign in to sync your profile',
      dob: 'Sign in to view',
      tob: 'Sign in to view',
      pob: 'Sign in to view',
      zodiac: 'Aries',
      zodiacSymbol: '♈',
      moonSign: 'Taurus',
      moonSymbol: '♉',
      nakshatra: 'Ashwini',
    });
    showSnackBar('Signed out safely', colors.surfaceVariant);
    go(AppRoutes.initial);
  };

  const handleSignOutPress = () => {
    Alert.alert(
      t('profile.signOut', 'Sign Out'),
      t('profile.signOutConfirm', 'Are you sure you want to sign out? Your astrological charts will remain securely saved.'),
      [
        {
          text: t('profile.cancel', 'Cancel'),
          style: 'cancel',
          onPress: () => setSignOutOpen(false),
        },
        {
          text: t('profile.signOut', 'Sign Out'),
          style: 'destructive',
          onPress: handleConfirmSignOut,
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="profile.screen">
      <AppBar
        title={t('profile.title', 'Profile')}
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        actions={[
          {
            icon: isAuth ? 'edit_note_rounded' : 'login_rounded',
            color: colors.goldAccent,
            onPress: isAuth ? openEditModal : () => go(AppRoutes.signInScreen),
            testID: isAuth ? 'profile.settings' : 'profile.appBarSignIn',
          },
        ]}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(160, insets.bottom + 110) }}>
        {/* User Card - Single Solid Background */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 16,
            padding: 20,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            backgroundColor: colors.surface,
            alignItems: 'center',
          }}
        >
          <Pressable onPress={isAuth ? openEditModal : () => go(AppRoutes.signInScreen)} style={{ position: 'relative' }}>
            <View
              style={{
                width: 82,
                height: 82,
                borderRadius: 41,
                borderWidth: 2,
                borderColor: colors.goldAccent,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceVariant,
              }}
            >
              <Text style={{ fontSize: isAuth ? 32 : 36, color: colors.goldAccent, fontWeight: '800' }}>
                {isAuth ? (profileData.name[0] || 'U').toUpperCase() : '👤'}
              </Text>
            </View>
            {isAuth && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.goldAccent,
                  borderWidth: 2,
                  borderColor: colors.background,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="edit_rounded" color="#080D1A" size={14} />
              </View>
            )}
          </Pressable>

          <Pressable onPress={isAuth ? openEditModal : () => go(AppRoutes.signInScreen)}>
            <Text style={{ marginTop: 12, color: colors.textPrimary, fontSize: 21, fontWeight: '800' }}>
              {profileData.name}
            </Text>
          </Pressable>
          {isAuth ? (
            <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 13 }}>
              {profileData.email}
            </Text>
          ) : (
            <Pressable
              onPress={() => go(AppRoutes.signInScreen)}
              style={{
                marginTop: 8,
                paddingHorizontal: 16,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 25),
                borderWidth: 1.5,
                borderColor: colors.goldAccent,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <AppIcon name="login_rounded" size={15} color={colors.goldAccent} />
              <Text style={{ marginLeft: 6, color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>
                Sign In / Register
              </Text>
            </Pressable>
          )}

          {/* Quick Stats */}
          <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => push(isAuth ? AppRoutes.consultationHistoryScreen : AppRoutes.signInScreen)}>
              <ProfileStat label={t('profile.consultations', 'Consultations')} value={isAuth ? String(consultationCount) : '0'} colors={colors} />
            </Pressable>
            <View style={{ height: 30, width: 1, marginHorizontal: 20, backgroundColor: colors.divider }} />
            <Pressable onPress={() => push(isAuth ? AppRoutes.kundliReportsScreen : AppRoutes.signInScreen)}>
              <ProfileStat label={t('profile.reports', 'Reports')} value={isAuth ? String(reportCount) : '0'} colors={colors} />
            </Pressable>
            <View style={{ height: 30, width: 1, marginHorizontal: 20, backgroundColor: colors.divider }} />
            <Pressable onPress={() => push(isAuth ? AppRoutes.walletScreen : AppRoutes.signInScreen)}>
              <ProfileStat label={t('profile.wallet', 'Wallet')} value={isAuth ? `₹${walletBalance}` : '₹0'} colors={colors} />
            </Pressable>
          </View>

          {/* Account status badge */}
          <Pressable
            testID="profile.premium"
            onPress={isAuth ? undefined : () => go(AppRoutes.signInScreen)}
            style={{
              marginTop: 18,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 25 : 18),
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ fontSize: 14 }}>{isAuth ? '⭐' : '✦'}</Text>
            <Text style={{ marginLeft: 6, color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>
              {isAuth ? t('profile.premium', 'AstroParihar Member') : 'Guest Explorer • Tap to Sign In'}
            </Text>
          </Pressable>
        </View>

        {/* Astro Stats Summary */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
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
          <AstroStat
            symbol={profileData.zodiacSymbol}
            value={profileData.zodiac}
            label={t('profile.zodiac', 'Zodiac')}
            colors={colors}
          />
          <View style={{ width: 1, height: 44, backgroundColor: colors.divider }} />
          <AstroStat
            symbol={profileData.moonSymbol}
            value={profileData.moonSign}
            label={t('profile.moonSign', 'Moon Sign')}
            colors={colors}
          />
          <View style={{ width: 1, height: 44, backgroundColor: colors.divider }} />
          <AstroStat
            symbol="⭐"
            value={profileData.nakshatra}
            label={t('profile.nakshatra', 'Nakshatra')}
            colors={colors}
          />
        </View>

        {/* Menu Sections */}
        <MenuSection
          title={t('profile.myAstrology', 'MY ASTROLOGY')}
          items={MY_ASTROLOGY}
          idPrefix="profile.menu"
          colors={colors}
        />
        <MenuSection
          title={t('profile.myAccount', 'MY ACCOUNT')}
          items={MY_ACCOUNT}
          idPrefix="profile.menu"
          colors={colors}
        />
        <MenuSection
          title={t('profile.preferences', 'PREFERENCES')}
          items={[
            { icon: 'language_outlined', labelKey: 'profile.language', defaultLabel: 'Language', route: AppRoutes.languageScreen, color: '#9370DB', id: 'language', value: selectedLanguage },
            { icon: 'dark_mode_outlined', labelKey: 'profile.theme', defaultLabel: 'Theme', route: AppRoutes.themeScreen, color: '#4FC3F7', id: 'theme', value: selectedTheme },
            { icon: 'tune_outlined', labelKey: 'profile.notificationSettings', defaultLabel: 'Notification Settings', route: AppRoutes.notificationSettingsScreen, color: '#FFB347', id: 'notificationSettings' },
            { icon: 'lock_outline_rounded', labelKey: 'profile.privacy', defaultLabel: 'Privacy', route: AppRoutes.privacyScreen, color: '#81C784', id: 'privacy' },
            { icon: 'security_outlined', labelKey: 'profile.security', defaultLabel: 'Security', route: AppRoutes.securityScreen, color: '#FF6B6B', id: 'security' },
          ]}
          idPrefix="profile.menu"
          colors={colors}
        />
        <MenuSection
          title={t('profile.support', 'SUPPORT')}
          items={SUPPORT}
          idPrefix="profile.menu"
          colors={colors}
        />

        {/* Sign Out or Sign In Button */}
        {isAuth ? (
          <Pressable
            testID="profile.signOut"
            onPress={handleSignOutPress}
            style={{
              marginHorizontal: 20,
              marginTop: 8,
              marginBottom: 16,
              paddingVertical: 14,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#CF4444',
              backgroundColor: withAlpha('#CF4444', colors.isLight ? 12 : 20),
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <AppIcon name="logout_rounded" size={19} color="#CF4444" />
            <Text style={{ marginLeft: 8, color: '#CF4444', fontSize: 15, fontWeight: '700' }}>
              {t('profile.signOut', 'Sign Out')}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            testID="profile.signIn"
            onPress={() => go(AppRoutes.signInScreen)}
            style={{
              marginHorizontal: 20,
              marginTop: 8,
              marginBottom: 16,
              paddingVertical: 14,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.goldAccent,
              backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 16 : 22),
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <AppIcon name="login_rounded" size={19} color={colors.goldAccent} />
            <Text style={{ marginLeft: 8, color: colors.goldAccent, fontSize: 15, fontWeight: '700' }}>
              Sign In / Register
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Edit Profile Sheet */}
      <BottomSheet visible={editSheetOpen} onClose={() => setEditSheetOpen(false)} testID="profile.editSheet">
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>
              {t('profile.editProfile', 'Edit Profile')}
            </Text>
            <Pressable onPress={() => setEditSheetOpen(false)} style={{ padding: 4 }}>
              <AppIcon name="close_rounded" color={colors.textMuted} size={22} />
            </Pressable>
          </View>

          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>Full Name</Text>
          <TextInput
            value={editName}
            onChangeText={setEditName}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surfaceVariant,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              fontSize: 14,
              marginBottom: 12,
            }}
          />

          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>Phone / Email</Text>
          <TextInput
            value={editEmail}
            onChangeText={setEditEmail}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surfaceVariant,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              fontSize: 14,
              marginBottom: 12,
            }}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>Birth Date</Text>
              <TextInput
                value={editDob}
                onChangeText={setEditDob}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  fontSize: 14,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>Birth Time</Text>
              <TextInput
                value={editTob}
                onChangeText={setEditTob}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  fontSize: 14,
                }}
              />
            </View>
          </View>

          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>Birth Place</Text>
          <TextInput
            value={editPob}
            onChangeText={setEditPob}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surfaceVariant,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              fontSize: 14,
              marginBottom: 20,
            }}
          />

          <ElevatedButton
            label={t('profile.saveProfile', 'Save Profile')}
            onPress={saveProfileEdits}
            radius={14}
            paddingV={12}
          />
        </View>
      </BottomSheet>

      {/* Sign Out Confirmation Dialog */}
      <Dialog
        visible={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        style={{
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          backgroundColor: colors.surface,
          padding: 24,
        }}
        testID="profile.signOutDialog"
      >
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '700' }}>
          {t('profile.signOut', 'Sign Out')}
        </Text>
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
          {t('profile.signOutConfirm', 'Are you sure you want to sign out? Your astrological charts will remain securely saved.')}
        </Text>

        <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
          <OutlinedButton
            testID="profile.signOutDialog.cancel"
            label={t('profile.cancel', 'Cancel')}
            onPress={() => setSignOutOpen(false)}
            color={colors.textSecondary}
            radius={12}
            paddingV={8}
            paddingH={16}
          />
          <ElevatedButton
            testID="profile.signOutDialog.confirm"
            label={t('profile.signOut', 'Sign Out')}
            onPress={handleConfirmSignOut}
            bg="#CF4444"
            fg="#FFFFFF"
            radius={12}
            paddingV={8}
            paddingH={18}
          />
        </View>
      </Dialog>
    </View>
  );
}

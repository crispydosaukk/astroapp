/**
 * Devotee Profile Screen
 * - 100% Dynamic Engine connected to Admin Dashboard (API: /api/app-dynamic/profile).
 * - Every single bit (devotee badge, quick stats, VIP banner, astrology menus, account options,
 *   preferences, support helpline, app version & Sanskrit tagline) is completely dynamic.
 * - Instant offline caching via AsyncStorage with seamless live sync on screen mount and pull-to-refresh.
 * - Unified professional Vedic theme with high-contrast text and zero visual clutter.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ElevatedButton } from '@/components/common';
import { BottomSheet, showSnackBar } from '@/components/overlays';
import { Text, TextInput } from '@/components/Text';
import { API_ENDPOINTS } from '@/config/api';
import { useAuthStore } from '@/features/auth/authStore';
import { AppRoutes, go, push } from '@/navigation/routes';
import { fetchCalculatedKundli } from '@/services/astrologyService';
import { getWalletBalance, subscribeWallet } from '@/services/walletService';
import { withAlpha } from '@/theme/colors';
import { AppLanguage, useLanguageStore, useTranslation } from '@/theme/languageStore';
import { useThemeColors, useThemeStore } from '@/theme/themeStore';

const STORAGE_PROFILE_CONFIG_KEY = 'astroparihar_app_profile_config_v2';

const APP_LANGUAGES: { name: AppLanguage; nativeName: string }[] = [
  { name: 'Telugu', nativeName: 'తెలుగు' },
  { name: 'Hindi', nativeName: 'हिन्दी' },
  { name: 'Tamil', nativeName: 'தமிழ்' },
  { name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { name: 'Malayalam', nativeName: 'മലയാളം' },
  { name: 'English', nativeName: 'English' },
];


export interface DynamicProfileMenuItem {
  id: string;
  order: number;
  labelKey?: string;
  defaultLabel: string;
  subtitle?: string;
  icon: string;
  route: string;
  action?: string;
  badge?: string;
  badgeColor?: string;
  active: boolean;
  value?: string;
}

export interface DynamicProfileSection {
  id: string;
  order: number;
  title: string;
  labelKey?: string;
  active: boolean;
  items: DynamicProfileMenuItem[];
}

export interface DynamicProfileConfig {
  headerTitle: string;
  welcomeGuestText: string;
  guestSubtitle: string;
  guestSignInButtonText?: string;
  defaultMemberBadge: string;

  // Quick Stats
  showWalletStat: boolean;
  walletStatLabel?: string;
  showConsultationStat: boolean;
  consultationStatLabel?: string;
  showReportsStat: boolean;
  reportsStatLabel?: string;

  // Astrological Signs Trio
  showAstroTrio?: boolean;
  zodiacStatLabel?: string;
  defaultZodiac: string;
  moonSignStatLabel?: string;
  defaultMoonSign: string;
  nakshatraStatLabel?: string;
  defaultNakshatra: string;

  // VIP Gold Promo Banner
  vipEnabled: boolean;
  vipBadge: string;
  vipTitle: string;
  vipSubtitle: string;
  vipCtaText: string;
  vipCtaRoute: string;
  vipEmoji?: string;

  // Support Care Card
  showSupportCard?: boolean;
  supportCardTitle?: string;
  supportPhone: string;
  supportPhoneLabel?: string;
  supportEmail: string;
  helplineHoursPrefix?: string;
  helplineHours: string;

  // Sign In / Out
  signOutButtonText?: string;
  signOutConfirmTitle?: string;
  signOutConfirmMessage?: string;
  cancelButtonText?: string;

  // Edit Profile Sheet
  editProfileTitle?: string;
  editNameLabel?: string;
  editPhoneOrEmailLabel?: string;
  editDobLabel?: string;
  editTobLabel?: string;
  editPobLabel?: string;
  editSaveButtonText?: string;

  // Footer & Sanskrit
  appVersionText: string;
  sanskritTagline: string;

  // Menu Sections & Items
  sections: DynamicProfileSection[];
  updatedAt?: string;
}

export const DEFAULT_PROFILE_CONFIG: DynamicProfileConfig = {
  headerTitle: 'Profile',
  welcomeGuestText: 'Guest Explorer • Tap to Sign In',
  guestSubtitle: 'Sign in to sync your profile, birth charts & consultations',
  guestSignInButtonText: 'Sign In / Register',
  defaultMemberBadge: 'AstroParihar Member',

  showWalletStat: true,
  walletStatLabel: 'Wallet',
  showConsultationStat: true,
  consultationStatLabel: 'Consultations',
  showReportsStat: true,
  reportsStatLabel: 'Reports',

  showAstroTrio: true,
  zodiacStatLabel: 'Zodiac',
  defaultZodiac: 'Scorpio',
  moonSignStatLabel: 'Moon Sign',
  defaultMoonSign: 'Cancer',
  nakshatraStatLabel: 'Nakshatra',
  defaultNakshatra: 'Pushya',

  vipEnabled: true,
  vipBadge: 'ASTROPARIHAR GOLD',
  vipTitle: 'Unlock Sacred Kundli & Infinite Wisdom',
  vipSubtitle: 'Unlimited Kundli matching, detailed Mahadasha PDF reports, and 24/7 AI consultations.',
  vipCtaText: 'Upgrade to Gold Seeker',
  vipCtaRoute: '/wallet-screen',
  vipEmoji: '👑',

  showSupportCard: true,
  supportCardTitle: 'Spiritual Care & Help Desk',
  supportPhone: '+91 98765 43210',
  supportPhoneLabel: 'Helpline',
  supportEmail: 'support@astroparihar.com',
  helplineHoursPrefix: 'Helpline: ',
  helplineHours: 'Mon - Sun: 8:00 AM – 11:00 PM IST',

  signOutButtonText: 'Sign Out',
  signOutConfirmTitle: 'Sign Out',
  signOutConfirmMessage: 'Are you sure you want to sign out? Your astrological charts will remain securely saved.',
  cancelButtonText: 'Cancel',

  editProfileTitle: 'Edit Profile Details',
  editNameLabel: 'Full Name',
  editPhoneOrEmailLabel: 'Phone / Email',
  editDobLabel: 'Date of Birth (DD/MM/YYYY)',
  editTobLabel: 'Time of Birth (e.g. 10:30 AM)',
  editPobLabel: 'Place of Birth (City, State)',
  editSaveButtonText: 'Save Profile Details',

  appVersionText: 'AstroParihar v2.4.0 • Sacred Vedic Wisdom',
  sanskritTagline: '॥ लोकाः समस्ताः सुखिनो भवन्तु ॥',

  sections: [
    {
      id: 'my-astrology',
      order: 1,
      title: 'MY ASTROLOGY',
      labelKey: 'profile.myAstrology',
      active: true,
      items: [
        { id: 'myKundli', order: 1, labelKey: 'profile.myKundli', defaultLabel: 'My Kundli', subtitle: 'Your detailed birth chart & planetary positions', icon: 'auto_stories', route: AppRoutes.myKundliScreen, active: true },
        { id: 'myRemedies', order: 2, labelKey: 'profile.myRemedies', defaultLabel: 'My Remedies (अष्ट परिहार)', subtitle: 'Personalised 8-directional remedial remedies', icon: 'auto_awesome', route: AppRoutes.remediesScreen, badge: '8 in 1', active: true },
        { id: 'birthProfiles', order: 3, labelKey: 'profile.birthProfiles', defaultLabel: 'Birth Profiles', subtitle: 'Family, partner & seeker kundli profiles', icon: 'person_outline_rounded', route: AppRoutes.birthProfilesScreen, active: true },
        { id: 'kundliReports', order: 4, labelKey: 'profile.kundliReports', defaultLabel: 'Kundli & Service Reports', subtitle: 'Saved astrology predictions & PDF reports', icon: 'description_outlined', route: AppRoutes.kundliReportsScreen, active: true },
        { id: 'matchReports', order: 5, labelKey: 'profile.matchReports', defaultLabel: 'Match Reports', subtitle: '36 Guna Ashtakoot matrimonial reports', icon: 'favorite_border', route: AppRoutes.matchReportsScreen, active: true },
        { id: 'panchangReports', order: 6, labelKey: 'profile.panchangReports', defaultLabel: 'Panchang & Muhurat', subtitle: 'Daily Vedic almanac, tithi & auspicious timings', icon: 'calendar_today_outlined', route: AppRoutes.panchangScreen, active: true },
        { id: 'savedAstrologers', order: 7, labelKey: 'profile.savedAstrologers', defaultLabel: 'Saved Astrologers', subtitle: 'Your favorite verified Vedic consultants', icon: 'star_outline', route: AppRoutes.savedAstrologersScreen, active: true },
        { id: 'consultationHistory', order: 8, labelKey: 'profile.consultationHistory', defaultLabel: 'Consultation History', subtitle: 'Past audio, video & AI chat recordings', icon: 'history', route: AppRoutes.consultationHistoryScreen, active: true },
      ],
    },
    {
      id: 'my-account',
      order: 2,
      title: 'MY ACCOUNT & BILLING',
      labelKey: 'profile.myAccount',
      active: true,
      items: [
        { id: 'wallet', order: 1, labelKey: 'profile.wallet', defaultLabel: 'Wallet', subtitle: 'View balance, add funds & recharge offers', icon: 'account_balance_wallet_outlined', route: AppRoutes.walletScreen, active: true },
        { id: 'transactions', order: 2, labelKey: 'profile.transactions', defaultLabel: 'Transactions', subtitle: 'Detailed billing history & payment receipts', icon: 'receipt_long_outlined', route: AppRoutes.walletScreen, active: true },
        { id: 'paymentMethods', order: 3, labelKey: 'profile.paymentMethods', defaultLabel: 'Payment Methods', subtitle: 'UPI, Cards, Netbanking & Saved options', icon: 'credit_card_outlined', route: AppRoutes.walletScreen, active: true },
        { id: 'notifications', order: 4, labelKey: 'profile.notifications', defaultLabel: 'Notifications', subtitle: 'Daily horoscopes, muhurat & chat alerts', icon: 'notifications_outlined', route: AppRoutes.notificationsScreen, active: true },
      ],
    },
    {
      id: 'preferences',
      order: 3,
      title: 'PREFERENCES',
      labelKey: 'profile.preferences',
      active: true,
      items: [
        { id: 'language', order: 1, labelKey: 'profile.language', defaultLabel: 'Language', subtitle: 'Choose Telugu, Hindi, English, Tamil, etc.', icon: 'translate', route: AppRoutes.languageScreen, action: 'languageModal', active: true },
        { id: 'theme', order: 2, labelKey: 'profile.theme', defaultLabel: 'Theme', subtitle: 'Switch between Light Vedic and Dark Cosmic', icon: 'palette_outlined', route: AppRoutes.themeScreen, action: 'themeToggle', active: true },
        { id: 'notificationSettings', order: 3, labelKey: 'profile.notificationSettings', defaultLabel: 'Notification Settings', subtitle: 'Manage reminders, panchang & astro alerts', icon: 'tune_outlined', route: AppRoutes.notificationSettingsScreen, active: true },
        { id: 'privacy', order: 4, labelKey: 'profile.privacy', defaultLabel: 'Privacy', subtitle: 'Manage your birth chart & account privacy', icon: 'lock_outline_rounded', route: AppRoutes.privacyScreen, active: true },
        { id: 'security', order: 5, labelKey: 'profile.security', defaultLabel: 'Security', subtitle: 'Biometric lock, PIN & authentication', icon: 'security_outlined', route: AppRoutes.securityScreen, active: true },
      ],
    },
    {
      id: 'support',
      order: 4,
      title: 'SUPPORT & LEGAL',
      labelKey: 'profile.support',
      active: true,
      items: [
        { id: 'helpCentre', order: 1, labelKey: 'profile.helpCentre', defaultLabel: 'Help Centre', subtitle: 'Guides, tutorials and knowledge base', icon: 'help_outline_rounded', route: AppRoutes.helpCentreScreen, active: true },
        { id: 'contactSupport', order: 2, labelKey: 'profile.contactSupport', defaultLabel: 'Contact Support', subtitle: 'Reach our spiritual care team 24/7', icon: 'support_agent_outlined', route: AppRoutes.contactSupportScreen, active: true },
        { id: 'faqs', order: 3, labelKey: 'profile.faqs', defaultLabel: 'FAQs', subtitle: 'Frequently asked astrological questions', icon: 'quiz_outlined', route: AppRoutes.helpCentreScreen, active: true },
        { id: 'terms', order: 4, labelKey: 'profile.terms', defaultLabel: 'Terms of Service', subtitle: 'Platform usage rules and spiritual disclaimers', icon: 'gavel_outlined', route: AppRoutes.termsScreen, active: true },
        { id: 'privacyPolicy', order: 5, labelKey: 'profile.privacyPolicy', defaultLabel: 'Privacy Policy', subtitle: 'Birth data privacy and security measures', icon: 'policy_outlined', route: AppRoutes.privacyPolicyScreen, active: true },
      ],
    },
  ],
};

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

function ProfileStat({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

function AstroStat({
  symbol,
  value,
  label,
  colors,
}: {
  symbol: string;
  value: string;
  label: string;
  colors: any;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.isLight ? '#FAF5E8' : 'rgba(201,168,76,0.12)',
          borderWidth: 1,
          borderColor: colors.isLight ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 22, textAlign: 'center' }}>{symbol}</Text>
      </View>
      <Text
        numberOfLines={2}
        style={{
          color: colors.textPrimary,
          fontSize: 13,
          fontWeight: '700',
          textAlign: 'center',
          lineHeight: 18,
          minHeight: 36,
          paddingHorizontal: 2,
        }}
      >
        {value}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '600',
          textAlign: 'center',
          marginTop: 4,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useThemeColors();
  const selectedTheme = useThemeStore((s) => s.selectedTheme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const insets = useSafeAreaInsets();
  const { t, selectedLanguage } = useTranslation();
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const updateUserProfile = useAuthStore((s) => s.updateUserProfile);

  const isAuth = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));
  const currentUserName =
    isAuth && authUser?.name?.trim() ? authUser.name.trim() : isAuth && authUser?.phone ? authUser.phone : 'Guest';

  // Dynamic configuration from Admin Dashboard
  const [config, setConfig] = useState<DynamicProfileConfig>(DEFAULT_PROFILE_CONFIG);
  const [refreshing, setRefreshing] = useState(false);

  // User state
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [reportCount, setReportCount] = useState(4);
  const [consultationCount, setConsultationCount] = useState(2);

  const [profileData, setProfileData] = useState({
    name: currentUserName,
    email: isAuth
      ? authUser?.phone
        ? `${authUser.phone}`
        : authUser?.email || 'Registered User'
      : 'Sign in to sync your profile',
    dob: authUser?.dob || (isAuth ? 'Not specified' : 'Sign in to view'),
    tob: authUser?.tob || (isAuth ? 'Not specified' : 'Sign in to view'),
    pob: authUser?.pob || (isAuth ? 'Not specified' : 'Sign in to view'),
    zodiac: authUser?.zodiac || config.defaultZodiac,
    zodiacSymbol: getZodiacSymbol(authUser?.zodiac || config.defaultZodiac),
    moonSign: authUser?.moonSign || config.defaultMoonSign,
    moonSymbol: getZodiacSymbol(authUser?.moonSign || config.defaultMoonSign),
    nakshatra: authUser?.nakshatra || config.defaultNakshatra,
  });

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editTob, setEditTob] = useState('');
  const [editPob, setEditPob] = useState('');

  // 1. Fetch live dynamic profile configuration from Admin Dashboard API
  const fetchDynamicProfileConfig = async () => {
    try {
      // First load from local storage
      const cached = await AsyncStorage.getItem(STORAGE_PROFILE_CONFIG_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.sections)) {
            setConfig((prev) => ({ ...prev, ...parsed }));
          }
        } catch {}
      }

      // Fetch live from server
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(API_ENDPOINTS.profile, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          setConfig({ ...DEFAULT_PROFILE_CONFIG, ...data.config });
          await AsyncStorage.setItem(STORAGE_PROFILE_CONFIG_KEY, JSON.stringify(data.config));
        }
      }
    } catch {
      // Offline fallback already loaded from cache or default
    }
  };

  const loadUserData = async () => {
    try {
      const isUserLoggedIn = Boolean(isAuthenticated && authUser && (authUser.uid || authUser.phone));
      if (!isUserLoggedIn) {
        setProfileData({
          name: config.welcomeGuestText.split('•')[0].trim() || 'Guest',
          email: config.guestSubtitle,
          dob: 'Sign in to view',
          tob: 'Sign in to view',
          pob: 'Sign in to view',
          zodiac: config.defaultZodiac,
          zodiacSymbol: getZodiacSymbol(config.defaultZodiac),
          moonSign: config.defaultMoonSign,
          moonSymbol: getZodiacSymbol(config.defaultMoonSign),
          nakshatra: config.defaultNakshatra,
        });
        return;
      }

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

      let zodiac = authUser?.zodiac || storedDetails?.zodiac || config.defaultZodiac;
      let zodiacSymbol = getZodiacSymbol(zodiac);
      let moonSign = authUser?.moonSign || storedDetails?.moonSign || config.defaultMoonSign;
      let moonSymbol = getZodiacSymbol(moonSign);
      let nakshatra = authUser?.nakshatra || storedDetails?.nakshatra || config.defaultNakshatra;

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
    fetchDynamicProfileConfig();
    loadUserData();
    getWalletBalance().then(setWalletBalance);
    const unsub = subscribeWallet(setWalletBalance);
    return () => unsub();
  }, [authUser, isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDynamicProfileConfig(), loadUserData(), getWalletBalance().then(setWalletBalance)]);
    setRefreshing(false);
  };

  const openEditModal = () => {
    setEditName(profileData.name !== 'Guest' && profileData.name !== 'Seeker' ? profileData.name : authUser?.name || '');
    setEditEmail(profileData.email !== 'Sign in to sync your profile' ? profileData.email : authUser?.phone || '');
    setEditDob(profileData.dob !== 'Not specified' && profileData.dob !== 'Sign in to view' ? profileData.dob : authUser?.dob || '');
    setEditTob(profileData.tob !== 'Not specified' && profileData.tob !== 'Sign in to view' ? profileData.tob : authUser?.tob || '');
    setEditPob(profileData.pob !== 'Not specified' && profileData.pob !== 'Sign in to view' ? profileData.pob : authUser?.pob || '');
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
    await logout();
    setProfileData({
      name: 'Guest',
      email: config.guestSubtitle,
      dob: 'Sign in to view',
      tob: 'Sign in to view',
      pob: 'Sign in to view',
      zodiac: config.defaultZodiac,
      zodiacSymbol: getZodiacSymbol(config.defaultZodiac),
      moonSign: config.defaultMoonSign,
      moonSymbol: getZodiacSymbol(config.defaultMoonSign),
      nakshatra: config.defaultNakshatra,
    });
    showSnackBar('Signed out safely', colors.surfaceVariant);
    go(AppRoutes.initial);
  };

  const handleSignOutPress = () => {
    Alert.alert(
      config.signOutConfirmTitle || t('profile.signOut', 'Sign Out'),
      config.signOutConfirmMessage || t('profile.signOutConfirm', 'Are you sure you want to sign out? Your astrological charts will remain securely saved.'),
      [
        { text: config.cancelButtonText || t('profile.cancel', 'Cancel'), style: 'cancel' },
        { text: config.signOutButtonText || t('profile.signOut', 'Sign Out'), style: 'destructive', onPress: handleConfirmSignOut },
      ],
      { cancelable: true }
    );
  };

  const handleMenuItemPress = (it: DynamicProfileMenuItem) => {
    if (it.action === 'languageModal') {
      setLanguageModalOpen(true);
      return;
    }
    if (it.action === 'themeToggle') {
      const nextTheme = selectedTheme === 'Light Vedic' ? 'Dark Cosmic' : 'Light Vedic';
      setTheme(nextTheme);
      showSnackBar(`Theme switched to ${nextTheme}`);
      return;
    }
    if (it.route) {
      push(it.route);
    }
  };

  // Resolve dynamic localized label
  const resolveLabel = (labelKey?: string, defaultLabel?: string) => {
    if (defaultLabel) return defaultLabel;
    if (labelKey) return t(labelKey, defaultLabel || '');
    return '';
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="profile.screen">
      <AppBar
        title={config.headerTitle || t('profile.title', 'Profile')}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(160, insets.bottom + 110) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.goldAccent]}
            tintColor={colors.goldAccent}
          />
        }
      >
        {/* User Card - Dynamic Devotee Profile Header */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 16,
            padding: 20,
            borderRadius: 24,
            borderWidth: 1.2,
            borderColor: colors.cardBorder,
            backgroundColor: colors.surface,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: colors.isLight ? 0.04 : 0.2,
            shadowRadius: 8,
            elevation: 2,
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
                backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 15 : 22),
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

          <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
            {profileData.email}
          </Text>

          {!isAuth && (
            <Pressable
              onPress={() => go(AppRoutes.signInScreen)}
              style={{
                marginTop: 10,
                paddingHorizontal: 16,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 25),
                borderWidth: 1.2,
                borderColor: colors.goldAccent,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <AppIcon name="login_rounded" size={15} color={colors.goldAccent} />
              <Text style={{ marginLeft: 6, color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>
                {config.guestSignInButtonText || 'Sign In / Register'}
              </Text>
            </Pressable>
          )}

          {/* Quick Stats: Dynamic Visibility & Labels */}
          {(config.showConsultationStat || config.showReportsStat || config.showWalletStat) && (
            <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center' }}>
              {config.showConsultationStat && (
                <Pressable onPress={() => push(isAuth ? AppRoutes.consultationHistoryScreen : AppRoutes.signInScreen)}>
                  <ProfileStat
                    label={config.consultationStatLabel || t('profile.consultations', 'Consultations')}
                    value={isAuth ? String(consultationCount) : '0'}
                    colors={colors}
                  />
                </Pressable>
              )}

              {config.showConsultationStat && config.showReportsStat && (
                <View style={{ height: 30, width: 1, marginHorizontal: 20, backgroundColor: colors.divider }} />
              )}

              {config.showReportsStat && (
                <Pressable onPress={() => push(isAuth ? AppRoutes.kundliReportsScreen : AppRoutes.signInScreen)}>
                  <ProfileStat
                    label={config.reportsStatLabel || t('profile.reports', 'Reports')}
                    value={isAuth ? String(reportCount) : '0'}
                    colors={colors}
                  />
                </Pressable>
              )}

              {config.showReportsStat && config.showWalletStat && (
                <View style={{ height: 30, width: 1, marginHorizontal: 20, backgroundColor: colors.divider }} />
              )}

              {config.showWalletStat && (
                <Pressable onPress={() => push(isAuth ? AppRoutes.walletScreen : AppRoutes.signInScreen)}>
                  <ProfileStat
                    label={config.walletStatLabel || t('profile.wallet', 'Wallet')}
                    value={isAuth ? `₹${walletBalance}` : '₹0'}
                    colors={colors}
                  />
                </Pressable>
              )}
            </View>
          )}

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
              backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 25),
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ fontSize: 14 }}>{isAuth ? '⭐' : '✦'}</Text>
            <Text style={{ marginLeft: 6, color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>
              {isAuth
                ? (config.defaultMemberBadge || t('profile.premium', 'AstroParihar Member'))
                : (config.welcomeGuestText || 'Guest Explorer • Tap to Sign In')}
            </Text>
          </Pressable>
        </View>

        {/* Dynamic Astro Kundli Trio */}
        {config.showAstroTrio !== false && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 16,
              paddingVertical: 18,
              paddingHorizontal: 12,
              borderRadius: 22,
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: colors.isLight ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.22)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: colors.isLight ? '#C9A84C' : '#000',
              shadowOpacity: colors.isLight ? 0.08 : 0.2,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <AstroStat
              symbol={profileData.zodiacSymbol}
              value={profileData.zodiac}
              label={config.zodiacStatLabel || t('profile.zodiac', 'Zodiac')}
              colors={colors}
            />
            <View style={{ width: 1, height: 64, backgroundColor: colors.isLight ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.2)', marginHorizontal: 2 }} />
            <AstroStat
              symbol={profileData.moonSymbol}
              value={profileData.moonSign}
              label={config.moonSignStatLabel || t('profile.moonSign', 'Moon Sign')}
              colors={colors}
            />
            <View style={{ width: 1, height: 64, backgroundColor: colors.isLight ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.2)', marginHorizontal: 2 }} />
            <AstroStat
              symbol="⭐"
              value={profileData.nakshatra}
              label={config.nakshatraStatLabel || t('profile.nakshatra', 'Nakshatra')}
              colors={colors}
            />
          </View>
        )}

        {/* Dynamic VIP Gold Member Promo Banner */}
        {config.vipEnabled && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 16,
              padding: 18,
              borderRadius: 22,
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: colors.goldAccent,
              shadowColor: colors.goldAccent,
              shadowOpacity: 0.16,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  backgroundColor: withAlpha(colors.goldAccent, 25),
                  borderWidth: 1,
                  borderColor: withAlpha(colors.goldAccent, 70),
                }}
              >
                <Text style={{ color: colors.goldAccent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
                  {config.vipBadge || 'ASTROPARIHAR GOLD'}
                </Text>
              </View>
              <Text style={{ fontSize: 18 }}>{config.vipEmoji || '👑'}</Text>
            </View>

            <Text style={{ marginTop: 8, color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
              {config.vipTitle || 'Unlock Sacred Kundli & Infinite Wisdom'}
            </Text>
            <Text style={{ marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
              {config.vipSubtitle ||
                'Unlimited Kundli matching, detailed Mahadasha PDF reports, and 24/7 AI consultations.'}
            </Text>

            <Pressable
              onPress={() => push(config.vipCtaRoute || AppRoutes.walletScreen)}
              style={{
                marginTop: 12,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: '#713B32',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
                {config.vipCtaText || 'Upgrade to Gold Seeker'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Dynamic Menu Sections from Admin Dashboard */}
        {config.sections
          ?.filter((sec) => sec.active !== false)
          ?.sort((a, b) => (a.order || 0) - (b.order || 0))
          ?.map((section) => {
            const activeItems = section.items
              ?.filter((it) => it.active !== false)
              ?.sort((a, b) => (a.order || 0) - (b.order || 0));

            if (!activeItems || activeItems.length === 0) return null;

            return (
              <View key={section.id} style={{ marginHorizontal: 20, marginBottom: 16 }}>
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
                  {section.title || resolveLabel(section.labelKey, section.title)}
                </Text>

                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    borderWidth: 1.2,
                    borderColor: colors.cardBorder,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOpacity: colors.isLight ? 0.03 : 0.15,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  {activeItems.map((it, i) => {
                    let trailingValue: string | undefined = it.value;
                    if (it.action === 'languageModal') trailingValue = selectedLanguage;
                    if (it.action === 'themeToggle')
                      trailingValue = selectedTheme === 'Light Vedic' ? 'Light' : 'Dark';

                    const itemDisplayLabel = it.defaultLabel || resolveLabel(it.labelKey, it.defaultLabel);

                    return (
                      <View key={it.id}>
                        <Pressable
                          testID={`profile.menu.${it.id}`}
                          onPress={() => handleMenuItemPress(it)}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            backgroundColor: pressed ? withAlpha(colors.goldAccent, 10) : 'transparent',
                          })}
                        >
                          <View
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 12,
                              backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 16 : 24),
                              borderWidth: 1,
                              borderColor: withAlpha(colors.goldAccent, colors.isLight ? 35 : 55),
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <AppIcon name={it.icon} color={colors.goldAccent} size={19} />
                          </View>

                          <View style={{ marginLeft: 14, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                                {itemDisplayLabel}
                              </Text>
                              {it.badge && (
                                <View
                                  style={{
                                    marginLeft: 8,
                                    paddingHorizontal: 6,
                                    paddingVertical: 1.5,
                                    borderRadius: 6,
                                    backgroundColor: withAlpha(colors.goldAccent, 25),
                                    borderWidth: 1,
                                    borderColor: withAlpha(colors.goldAccent, 70),
                                  }}
                                >
                                  <Text style={{ color: colors.goldAccent, fontSize: 9.5, fontWeight: '700' }}>
                                    {it.badge}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {it.subtitle ? (
                              <Text numberOfLines={1} style={{ marginTop: 2, color: colors.textMuted, fontSize: 11 }}>
                                {it.subtitle}
                              </Text>
                            ) : null}
                          </View>

                          {trailingValue ? (
                            <Text
                              style={{
                                marginRight: 8,
                                color: colors.goldAccent,
                                fontSize: 12,
                                fontWeight: '700',
                              }}
                            >
                              {trailingValue}
                            </Text>
                          ) : null}

                          <AppIcon name="chevron_right_rounded" color={colors.textMuted} size={20} />
                        </Pressable>
                        {i < activeItems.length - 1 ? (
                          <View style={{ height: 1, marginLeft: 68, marginRight: 16, backgroundColor: colors.divider }} />
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

        {/* Dynamic Support Care Info Card */}
        {config.showSupportCard !== false && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 16,
              padding: 16,
              borderRadius: 18,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontWeight: '700', marginBottom: 6 }}>
              {config.supportCardTitle || 'Spiritual Care & Help Desk'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <Pressable
                onPress={() => Linking.openURL(`tel:${config.supportPhone || '+919876543210'}`)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <AppIcon name="call" size={14} color={colors.goldAccent} />
                <Text style={{ marginLeft: 6, color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  {config.supportPhone || '+91 98765 43210'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => Linking.openURL(`mailto:${config.supportEmail || 'support@astroparihar.com'}`)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <AppIcon name="mail_outline" size={14} color={colors.goldAccent} />
                <Text style={{ marginLeft: 6, color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  {config.supportEmail || 'support@astroparihar.com'}
                </Text>
              </Pressable>
            </View>
            <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: 11 }}>
              {`${config.helplineHoursPrefix || 'Helpline: '}${config.helplineHours || 'Mon - Sun: 8:00 AM – 11:00 PM IST'}`}
            </Text>
          </View>
        )}

        {/* Sign Out or Sign In Button */}
        {isAuth ? (
          <Pressable
            testID="profile.signOut"
            onPress={handleSignOutPress}
            style={{
              marginHorizontal: 20,
              marginTop: 4,
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
              {config.signOutButtonText || t('profile.signOut', 'Sign Out')}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            testID="profile.signIn"
            onPress={() => go(AppRoutes.signInScreen)}
            style={{
              marginHorizontal: 20,
              marginTop: 4,
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
              {config.guestSignInButtonText || 'Sign In / Register'}
            </Text>
          </Pressable>
        )}

        {/* Dynamic App Version & Sanskrit Tagline Footer */}
        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
          <Text style={{ color: colors.goldAccent, fontSize: 13, fontWeight: '700' }}>
            {config.sanskritTagline || '॥ लोकाः समस्ताः सुखिनो भवन्तु ॥'}
          </Text>
          <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 11.5 }}>
            {config.appVersionText || 'AstroParihar v2.4.0 • Sacred Vedic Wisdom'}
          </Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalOpen(false)}
      >
        <Pressable
          onPress={() => setLanguageModalOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 24,
              backgroundColor: colors.isLight ? '#FFFDF9' : '#0D1B2A',
              borderWidth: 1.5,
              borderColor: colors.goldAccent,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800' }}>
                Select Language
              </Text>
              <Pressable onPress={() => setLanguageModalOpen(false)} style={{ padding: 4 }}>
                <AppIcon name="close" color={colors.textSecondary} size={18} />
              </Pressable>
            </View>

            <View style={{ gap: 8 }}>
              {APP_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.name;
                return (
                  <Pressable
                    key={lang.name}
                    onPress={() => {
                      setLanguage(lang.name as AppLanguage);
                      setLanguageModalOpen(false);
                      showSnackBar(`Language updated to ${lang.nativeName}`);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: isSelected
                        ? withAlpha(colors.goldAccent, colors.isLight ? 20 : 30)
                        : colors.surfaceVariant,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.goldAccent : colors.cardBorder,
                    }}
                  >
                    <View>
                      <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
                        {lang.nativeName}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                        {lang.name}
                      </Text>
                    </View>
                    {isSelected && <AppIcon name="check_circle" color={colors.goldAccent} size={18} />}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Profile Sheet - 100% Dynamic Labels */}
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
              {config.editProfileTitle || t('profile.editProfile', 'Edit Profile Details')}
            </Text>
            <Pressable onPress={() => setEditSheetOpen(false)} style={{ padding: 4 }}>
              <AppIcon name="close_rounded" color={colors.textMuted} size={22} />
            </Pressable>
          </View>

          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
            {config.editNameLabel || 'Full Name'}
          </Text>
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

          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
            {config.editPhoneOrEmailLabel || 'Phone / Email'}
          </Text>
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
              <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
                {config.editDobLabel || 'Date of Birth'}
              </Text>
              <TextInput
                value={editDob}
                onChangeText={setEditDob}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
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
              <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
                {config.editTobLabel || 'Time of Birth'}
              </Text>
              <TextInput
                value={editTob}
                onChangeText={setEditTob}
                placeholder="HH:MM AM/PM"
                placeholderTextColor={colors.textMuted}
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

          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
            {config.editPobLabel || 'Place of Birth'}
          </Text>
          <TextInput
            value={editPob}
            onChangeText={setEditPob}
            placeholder="City, State, Country"
            placeholderTextColor={colors.textMuted}
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
            label={config.editSaveButtonText || 'Save Profile Details'}
            onPress={saveProfileEdits}
            bg="#713B32"
            fg="#FFFFFF"
            radius={14}
            paddingV={13}
            fontSize={14}
            fontWeight="700"
          />
        </View>
      </BottomSheet>
    </View>
  );
}

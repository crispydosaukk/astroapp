/**
 * Port of lib/presentation/profile_screen/profile_screen.dart
 * Settings icon = SOURCE_INERT. Sign Out → AlertDialog → go('/') (splash).
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { Dialog } from '@/components/overlays';
import { Text } from '@/components/Text';
import { AppRoutes, go, push } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { SOURCE_INERT } from '@/utils/sourceInert';

type Item = { icon: string; label: string; route: string; color: string; id: string };

const MY_ASTROLOGY: Item[] = [
  { icon: 'auto_stories', label: 'My Kundli', route: AppRoutes.myKundliScreen, color: '#9370DB', id: 'myKundli' },
  { icon: 'person_outline_rounded', label: 'Birth Profiles', route: AppRoutes.birthProfilesScreen, color: '#4FC3F7', id: 'birthProfiles' },
  { icon: 'description_outlined', label: 'Kundli Reports', route: AppRoutes.kundliReportsScreen, color: '#FFD700', id: 'kundliReports' },
  { icon: 'favorite_border', label: 'Match Reports', route: AppRoutes.matchReportsScreen, color: '#FF6B6B', id: 'matchReports' },
  { icon: 'star_outline', label: 'Saved Astrologers', route: AppRoutes.savedAstrologersScreen, color: '#FFB347', id: 'savedAstrologers' },
  { icon: 'history', label: 'Consultation History', route: AppRoutes.consultationHistoryScreen, color: '#81C784', id: 'consultationHistory' },
];
const MY_ACCOUNT: Item[] = [
  { icon: 'account_balance_wallet_outlined', label: 'Wallet', route: AppRoutes.walletScreen, color: '#FFD700', id: 'wallet' },
  { icon: 'receipt_long_outlined', label: 'Transactions', route: AppRoutes.walletScreen, color: '#4FC3F7', id: 'transactions' },
  { icon: 'credit_card_outlined', label: 'Payment Methods', route: AppRoutes.walletScreen, color: '#81C784', id: 'paymentMethods' },
  { icon: 'notifications_outlined', label: 'Notifications', route: AppRoutes.notificationsScreen, color: '#FF6B6B', id: 'notifications' },
];
const PREFERENCES: Item[] = [
  { icon: 'language_outlined', label: 'Language', route: AppRoutes.languageScreen, color: '#9370DB', id: 'language' },
  { icon: 'dark_mode_outlined', label: 'Theme', route: AppRoutes.themeScreen, color: '#4FC3F7', id: 'theme' },
  { icon: 'tune_outlined', label: 'Notification Settings', route: AppRoutes.notificationSettingsScreen, color: '#FFB347', id: 'notificationSettings' },
  { icon: 'lock_outline_rounded', label: 'Privacy', route: AppRoutes.privacyScreen, color: '#81C784', id: 'privacy' },
  { icon: 'security_outlined', label: 'Security', route: AppRoutes.securityScreen, color: '#FF6B6B', id: 'security' },
];
const SUPPORT: Item[] = [
  { icon: 'help_outline_rounded', label: 'Help Centre', route: AppRoutes.helpCentreScreen, color: '#4FC3F7', id: 'helpCentre' },
  { icon: 'support_agent_outlined', label: 'Contact Support', route: AppRoutes.contactSupportScreen, color: '#81C784', id: 'contactSupport' },
  { icon: 'quiz_outlined', label: 'FAQs', route: AppRoutes.helpCentreScreen, color: '#FFD700', id: 'faqs' },
  { icon: 'gavel_outlined', label: 'Terms of Service', route: AppRoutes.termsScreen, color: '#FF6B6B', id: 'terms' },
  { icon: 'policy_outlined', label: 'Privacy Policy', route: AppRoutes.privacyPolicyScreen, color: '#9370DB', id: 'privacyPolicy' },
];

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: AppColors.textMuted, fontSize: 11 }}>{label}</Text>
    </View>
  );
}
const StatDivider = () => <View style={{ height: 30, width: 1, marginHorizontal: 20, backgroundColor: AppColors.goldBorder }} />;

function AstroStat({ symbol, value, label }: { symbol: string; value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{symbol}</Text>
      <Text style={{ marginTop: 4, color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>{value}</Text>
      <Text style={{ color: AppColors.textMuted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export function MenuSection({ title, items, idPrefix }: { title: string; items: Item[]; idPrefix: string }) {
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
      <Text style={{ marginLeft: 4, marginBottom: 10, color: AppColors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>{title}</Text>
      <View style={{ backgroundColor: AppColors.surfaceDark, borderRadius: 18, borderWidth: 1, borderColor: AppColors.goldBorder, overflow: 'hidden' }}>
        {items.map((it, i) => (
          <View key={it.id}>
            <Pressable testID={`${idPrefix}.${it.id}`} onPress={() => push(it.route)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: withAlpha(it.color, 30), alignItems: 'center', justifyContent: 'center' }}>
                <AppIcon name={it.icon} color={it.color} size={18} />
              </View>
              <Text style={{ marginLeft: 12, flex: 1, color: AppColors.textPrimary, fontSize: 14, fontWeight: '500' }}>{it.label}</Text>
              <AppIcon name="chevron_right_rounded" color={AppColors.textMuted} size={20} />
            </Pressable>
            {i < items.length - 1 ? <View style={{ height: 1, marginLeft: 64, marginRight: 16, backgroundColor: '#1E2A40' }} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const [signOutOpen, setSignOutOpen] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="profile.screen">
      <AppBar title="Profile" actions={[{ icon: 'settings_outlined', color: AppColors.goldAccent, onPress: SOURCE_INERT('profile.settings'), testID: 'profile.settings' }]} />
      <ScrollView>
        <LinearGradient
          colors={[withAlpha(AppColors.primary, 80), AppColors.surfaceVariantDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ marginHorizontal: 20, marginTop: 8, marginBottom: 16, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: AppColors.goldBorder, alignItems: 'center' }}
        >
          <View>
            <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: AppColors.goldAccent, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              <LinearGradient colors={[AppColors.primary, AppColors.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <Text style={{ fontSize: 32 }}>🔮</Text>
            </View>
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: AppColors.goldAccent, borderWidth: 2, borderColor: AppColors.backgroundDark, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon name="edit_rounded" color={AppColors.backgroundDark} size={14} />
            </View>
          </View>
          <Text style={{ marginTop: 12, color: AppColors.textPrimary, fontSize: 20, fontWeight: '700' }}>Priya Sharma</Text>
          <Text style={{ color: AppColors.textMuted, fontSize: 13 }}>priya.sharma@astroparihar.com</Text>
          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
            <ProfileStat label="Consultations" value="12" />
            <StatDivider />
            <ProfileStat label="Reports" value="5" />
            <StatDivider />
            <ProfileStat label="Wallet" value="₹450" />
          </View>
          <View testID="profile.premium" style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: withAlpha(AppColors.goldAccent, 20), borderWidth: 1, borderColor: AppColors.goldBorder }}>
            <Text style={{ fontSize: 14 }}>⭐</Text>
            <Text style={{ marginLeft: 6, color: AppColors.goldAccent, fontSize: 13, fontWeight: '600' }}>AstroParihar Premium</Text>
          </View>
        </LinearGradient>

        <View style={{ marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 20, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
          <AstroStat symbol="♈" value="Aries" label="Zodiac" />
          <View style={{ width: 1, height: 50, backgroundColor: AppColors.goldBorder }} />
          <AstroStat symbol="♋" value="Cancer" label="Moon Sign" />
          <View style={{ width: 1, height: 50, backgroundColor: AppColors.goldBorder }} />
          <AstroStat symbol="⭐" value="Pushya" label="Nakshatra" />
        </View>

        <MenuSection title="MY ASTROLOGY" items={MY_ASTROLOGY} idPrefix="profile.menu" />
        <MenuSection title="MY ACCOUNT" items={MY_ACCOUNT} idPrefix="profile.menu" />
        <MenuSection title="PREFERENCES" items={PREFERENCES} idPrefix="profile.menu" />
        <MenuSection title="SUPPORT" items={SUPPORT} idPrefix="profile.menu" />

        <Pressable
          testID="profile.signOut"
          onPress={() => setSignOutOpen(true)}
          style={{ marginHorizontal: 20, marginBottom: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: withAlpha(AppColors.error, 80), flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
        >
          <AppIcon name="logout_rounded" size={18} color={AppColors.error} />
          <Text style={{ marginLeft: 8, color: AppColors.error, fontSize: 14, fontWeight: '600' }}>Sign Out</Text>
        </Pressable>
        <View style={{ height: 100 }} />
      </ScrollView>

      <Dialog visible={signOutOpen} onClose={() => setSignOutOpen(false)} style={{ borderRadius: 20, borderWidth: 0 }} testID="profile.signOutDialog">
        <Text style={{ color: AppColors.textPrimary, fontSize: 22 }}>Sign Out</Text>
        <Text style={{ marginTop: 16, color: AppColors.textSecondary, fontSize: 14 }}>Are you sure you want to sign out?</Text>
        <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable testID="profile.signOutDialog.cancel" onPress={() => setSignOutOpen(false)} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: AppColors.textMuted, fontSize: 14, fontWeight: '500' }}>Cancel</Text>
          </Pressable>
          <Pressable
            testID="profile.signOutDialog.confirm"
            onPress={() => { setSignOutOpen(false); go(AppRoutes.initial); }}
            style={{ marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: AppColors.error, fontSize: 14, fontWeight: '500' }}>Sign Out</Text>
          </Pressable>
        </View>
      </Dialog>
    </View>
  );
}

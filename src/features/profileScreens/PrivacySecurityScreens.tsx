/**
 * Port of lib/presentation/profile_screens/privacy_security_screens.dart (PrivacyScreen + SecurityScreen).
 * Privacy: 6 local toggles; Privacy Policy / Terms links push.
 * Security: score ring reacts to 2FA (65 → 100); 3 toggles.
 * SOURCE_INERT: Download My Data, Delete My Account, Change Password/Phone/Email, Revoke.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ProgressRing } from '@/components/common';
import { Text } from '@/components/Text';
import { IconBadge, ListTile, SettingsCard, SwitchTile, TileDivider } from '@/components/tiles';
import { AppRoutes, pop, push } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';
import { SOURCE_INERT } from '@/utils/sourceInert';

const H = ({ children }: { children: string }) => <Text style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>{children}</Text>;

export function PrivacyScreen() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    'Profile Visibility': true, 'Show Online Status': true, 'Allow Astrologers to View Birth Chart': true,
    'Personalised Recommendations': true, 'Analytics & Improvement': false, 'Marketing Communications': false,
  });
  const keys = Object.keys(settings);
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="privacy.screen">
      <AppBar title="Privacy" onBack={pop} testIDPrefix="privacy" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 20 }}>
        <LinearGradient colors={[withAlpha('#81C784', 30), AppColors.surfaceDark]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: withAlpha('#81C784', 80), flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 28 }}>🔒</Text>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' }}>Your Privacy Matters</Text>
            <Text style={{ marginTop: 3, color: AppColors.textMuted, fontSize: 11 }}>AstroParihar keeps your birth data and consultations completely private and secure.</Text>
          </View>
        </LinearGradient>
        <View>
          <H>Privacy Controls</H>
          <SettingsCard>
            {keys.map((k, i) => (
              <View key={k}>
                <SwitchTile testID={`privacy.toggle.${i}`} title={k} value={settings[k]} onChange={(v) => setSettings((s) => ({ ...s, [k]: v }))} />
                {i < keys.length - 1 ? <TileDivider indent={16} endIndent={16} /> : null}
              </View>
            ))}
          </SettingsCard>
        </View>
        <View>
          <H>Your Data</H>
          <SettingsCard>
            <ListTile testID="privacy.downloadData" leading={<IconBadge icon="download_outlined" color={AppColors.goldAccent} />} title="Download My Data" titleColor={AppColors.goldAccent} titleWeight="600" subtitle="Get a copy of all your data" trailing="chevron" onPress={SOURCE_INERT('privacy.downloadData')} />
            <TileDivider />
            <ListTile testID="privacy.deleteAccount" leading={<IconBadge icon="delete_outline_rounded" color={AppColors.error} />} title="Delete My Account" titleColor={AppColors.error} titleWeight="600" subtitle="Permanently remove your account" trailing="chevron" onPress={SOURCE_INERT('privacy.deleteAccount')} />
          </SettingsCard>
        </View>
        <SettingsCard>
          <ListTile testID="privacy.policyLink" leading={<AppIcon name="policy_outlined" color={AppColors.goldAccent} size={20} />} title="Privacy Policy" trailing="chevron" onPress={() => push(AppRoutes.privacyPolicyScreen)} />
          <TileDivider />
          <ListTile testID="privacy.termsLink" leading={<AppIcon name="gavel_outlined" color={AppColors.goldAccent} size={20} />} title="Terms of Service" trailing="chevron" onPress={() => push(AppRoutes.termsScreen)} />
        </SettingsCard>
      </ScrollView>
    </View>
  );
}

export function SecurityScreen() {
  const [bio, setBio] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [alerts, setAlerts] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="security.screen">
      <AppBar title="Security" onBack={pop} testIDPrefix="security" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 20 }}>
        <LinearGradient colors={[withAlpha(AppColors.primary, 80), AppColors.surfaceVariantDark]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ padding: 20, borderRadius: 20, borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
          <ProgressRing value={twoFactor ? 1 : 0.65} size={64} strokeWidth={6} color={twoFactor ? AppColors.success : AppColors.warning} backgroundColor={AppColors.surfaceVariantDark}>
            <Text style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: '800' }}>{twoFactor ? '100' : '65'}</Text>
          </ProgressRing>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ color: AppColors.textPrimary, fontSize: 16, fontWeight: '700' }}>{twoFactor ? 'Excellent Security' : 'Good Security'}</Text>
            <Text style={{ marginTop: 4, color: AppColors.textMuted, fontSize: 12 }}>{twoFactor ? 'Your account is fully protected' : 'Enable 2FA to improve security'}</Text>
          </View>
        </LinearGradient>
        <View>
          <H>Authentication</H>
          <SettingsCard>
            <SwitchTile testID="security.biometric" title="Biometric Login" subtitle="Use fingerprint or face ID" value={bio} onChange={setBio} secondary={<IconBadge icon="fingerprint_rounded" color={AppColors.goldAccent} size={22} />} />
            <TileDivider indent={16} endIndent={16} />
            <SwitchTile testID="security.twoFactor" title="Two-Factor Authentication" subtitle="Extra security via OTP" value={twoFactor} onChange={setTwoFactor} secondary={<IconBadge icon="security_outlined" color="#4FC3F7" size={22} />} />
            <TileDivider indent={16} endIndent={16} />
            <SwitchTile testID="security.loginAlerts" title="Login Alerts" subtitle="Get notified of new sign-ins" value={alerts} onChange={setAlerts} secondary={<IconBadge icon="notifications_active_outlined" color="#81C784" size={22} />} />
          </SettingsCard>
        </View>
        <View>
          <H>Account</H>
          <SettingsCard>
            <ListTile testID="security.changePassword" leading={<IconBadge icon="lock_outline_rounded" color={AppColors.goldAccent} />} title="Change Password" subtitle="Update your account password" trailing="chevron" onPress={SOURCE_INERT('security.changePassword')} />
            <TileDivider />
            <ListTile testID="security.changePhone" leading={<IconBadge icon="phone_outlined" color="#4FC3F7" />} title="Change Phone Number" subtitle="Update linked mobile number" trailing="chevron" onPress={SOURCE_INERT('security.changePhone')} />
            <TileDivider />
            <ListTile testID="security.changeEmail" leading={<IconBadge icon="email_outlined" color="#81C784" />} title="Change Email" subtitle="Update linked email address" trailing="chevron" onPress={SOURCE_INERT('security.changeEmail')} />
          </SettingsCard>
        </View>
        <View>
          <H>Active Sessions</H>
          <SettingsCard>
            {([['📱', 'iPhone 14 Pro', 'Mumbai, India • Current', true], ['💻', 'Chrome Browser', 'Mumbai, India • 2 days ago', false]] as const).map(([e, d, info, cur], i) => (
              <View key={d}>
                {i > 0 ? <TileDivider /> : null}
                <ListTile
                  leading={<View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: AppColors.surfaceVariantDark, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 18 }}>{e}</Text></View>}
                  titleNode={
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' }}>{d}</Text>
                      {cur ? (
                        <View style={{ marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: withAlpha(AppColors.success, 25) }}>
                          <Text style={{ color: AppColors.success, fontSize: 9, fontWeight: '600' }}>Current</Text>
                        </View>
                      ) : null}
                    </View>
                  }
                  subtitle={info}
                  trailing={cur ? null : (
                    <Pressable testID="security.revoke" onPress={SOURCE_INERT('security.revoke')}>
                      <Text style={{ color: AppColors.error, fontSize: 12 }}>Revoke</Text>
                    </Pressable>
                  )}
                />
              </View>
            ))}
          </SettingsCard>
        </View>
      </ScrollView>
    </View>
  );
}

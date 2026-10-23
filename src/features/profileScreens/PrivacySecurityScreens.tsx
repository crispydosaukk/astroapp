/**
 * Port of lib/presentation/profile_screens/privacy_security_screens.dart (PrivacyScreen + SecurityScreen).
 * Dynamic theme support for Light Vedic & Dark Cosmic.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { ProgressRing } from '@/components/common';
import { showSnackBar } from '@/components/overlays';
import { Text } from '@/components/Text';
import { IconBadge, ListTile, SettingsCard, SwitchTile, TileDivider } from '@/components/tiles';
import { AppRoutes, pop, push } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const H = ({ children }: { children: string }) => {
  const colors = useThemeColors();
  return <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>{children}</Text>;
};

export function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Record<string, boolean>>({
    'Profile Visibility': true,
    'Show Online Status': true,
    'Allow Astrologers to View Birth Chart': true,
    'Personalised Recommendations': true,
    'Analytics & Improvement': false,
    'Marketing Communications': false,
  });
  const keys = Object.keys(settings);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="privacy.screen">
      <AppBar
        title={t('profile.privacy', 'Privacy')}
        onBack={pop}
        testIDPrefix="privacy"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90), gap: 20 }}>
        <LinearGradient
          colors={[withAlpha('#2D9E6B', colors.isLight ? 20 : 30), colors.surface]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: withAlpha('#2D9E6B', 80),
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 28 }}>🔒</Text>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>Your Privacy Matters</Text>
            <Text style={{ marginTop: 3, color: colors.textMuted, fontSize: 11, lineHeight: 16 }}>
              AstroParihar keeps your birth coordinates and consultations completely encrypted and private.
            </Text>
          </View>
        </LinearGradient>

        <View>
          <H>Privacy Controls</H>
          <SettingsCard>
            {keys.map((k, i) => (
              <View key={k}>
                <SwitchTile
                  testID={`privacy.toggle.${i}`}
                  title={k}
                  value={settings[k]}
                  onChange={(v) => {
                    setSettings((s) => ({ ...s, [k]: v }));
                    showSnackBar(`${k} ${v ? 'enabled' : 'disabled'}`, colors.surfaceVariant);
                  }}
                />
                {i < keys.length - 1 ? <TileDivider indent={16} endIndent={16} /> : null}
              </View>
            ))}
          </SettingsCard>
        </View>

        <View>
          <H>Your Data</H>
          <SettingsCard>
            <ListTile
              testID="privacy.downloadData"
              leading={<IconBadge icon="download_outlined" color={colors.goldAccent} />}
              title="Download My Astrological Data"
              titleColor={colors.goldAccent}
              titleWeight="600"
              subtitle="Get an encrypted copy of all saved charts and reports"
              trailing="chevron"
              onPress={() => showSnackBar('Preparing your data archive... Link will be sent via email.', colors.surfaceVariant)}
            />
            <TileDivider />
            <ListTile
              testID="privacy.deleteAccount"
              leading={<IconBadge icon="delete_outline_rounded" color="#CF4444" />}
              title="Delete My Account"
              titleColor="#CF4444"
              titleWeight="600"
              subtitle="Permanently remove your account and all data"
              trailing="chevron"
              onPress={() => showSnackBar('Account deletion requires contacting support for verification', '#CF4444')}
            />
          </SettingsCard>
        </View>

        <SettingsCard>
          <ListTile
            testID="privacy.policyLink"
            leading={<AppIcon name="policy_outlined" color={colors.goldAccent} size={20} />}
            title="Privacy Policy"
            trailing="chevron"
            onPress={() => push(AppRoutes.privacyPolicyScreen)}
          />
          <TileDivider />
          <ListTile
            testID="privacy.termsLink"
            leading={<AppIcon name="gavel_outlined" color={colors.goldAccent} size={20} />}
            title="Terms of Service"
            trailing="chevron"
            onPress={() => push(AppRoutes.termsScreen)}
          />
        </SettingsCard>
      </ScrollView>
    </View>
  );
}

export function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [bio, setBio] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [alerts, setAlerts] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="security.screen">
      <AppBar
        title={t('profile.security', 'Security')}
        onBack={pop}
        testIDPrefix="security"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90), gap: 20 }}>
        <LinearGradient
          colors={
            colors.isLight
              ? ['#FFF9F0', '#F2E9DE']
              : [withAlpha(colors.goldAccent, 25), colors.surfaceVariant]
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            padding: 20,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <ProgressRing
            value={twoFactor ? 1 : 0.65}
            size={64}
            strokeWidth={6}
            color={twoFactor ? '#2D9E6B' : '#D4821A'}
            backgroundColor={colors.surfaceVariant}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
              {twoFactor ? '100' : '65'}
            </Text>
          </ProgressRing>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
              {twoFactor ? 'Excellent Security' : 'Good Security'}
            </Text>
            <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: 12 }}>
              {twoFactor ? 'Your account is fully protected' : 'Enable 2FA to achieve 100% protection'}
            </Text>
          </View>
        </LinearGradient>

        <View>
          <H>Authentication</H>
          <SettingsCard>
            <SwitchTile
              testID="security.biometric"
              title="Biometric Login"
              subtitle="Use fingerprint or Face ID"
              value={bio}
              onChange={(v) => {
                setBio(v);
                showSnackBar(`Biometric login ${v ? 'activated' : 'deactivated'}`, colors.surfaceVariant);
              }}
              secondary={<IconBadge icon="fingerprint_rounded" color={colors.goldAccent} size={22} />}
            />
            <TileDivider indent={16} endIndent={16} />
            <SwitchTile
              testID="security.twoFactor"
              title="Two-Factor Authentication"
              subtitle="Extra security via SMS/WhatsApp OTP"
              value={twoFactor}
              onChange={(v) => {
                setTwoFactor(v);
                showSnackBar(`2FA ${v ? 'enabled! Security score is now 100%' : 'disabled'}`, colors.surfaceVariant);
              }}
              secondary={<IconBadge icon="security_outlined" color="#4FC3F7" size={22} />}
            />
            <TileDivider indent={16} endIndent={16} />
            <SwitchTile
              testID="security.loginAlerts"
              title="Login Alerts"
              subtitle="Get notified of new logins"
              value={alerts}
              onChange={setAlerts}
              secondary={<IconBadge icon="notifications_active_outlined" color="#2D9E6B" size={22} />}
            />
          </SettingsCard>
        </View>

        <View>
          <H>Account Credentials</H>
          <SettingsCard>
            <ListTile
              testID="security.changePassword"
              leading={<IconBadge icon="lock_outline_rounded" color={colors.goldAccent} />}
              title="Change Password"
              subtitle="Update your master passcode"
              trailing="chevron"
              onPress={() => showSnackBar('Passcode reset link sent to registered mobile', colors.surfaceVariant)}
            />
            <TileDivider />
            <ListTile
              testID="security.changePhone"
              leading={<IconBadge icon="phone_outlined" color="#4FC3F7" />}
              title="Change Mobile Number"
              subtitle="Update linked OTP number"
              trailing="chevron"
              onPress={() => showSnackBar('Verification OTP will be required on new phone number', colors.surfaceVariant)}
            />
          </SettingsCard>
        </View>

        <View>
          <H>Active Sessions</H>
          <SettingsCard>
            {([['📱', 'Primary Mobile App', 'Current Active Device', true], ['💻', 'Web Astro Dashboard', 'Active 2h ago', false]] as const).map(([e, d, info, cur], i) => (
              <View key={d}>
                {i > 0 ? <TileDivider /> : null}
                <ListTile
                  leading={
                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 18 }}>{e}</Text>
                    </View>
                  }
                  titleNode={
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{d}</Text>
                      {cur ? (
                        <View style={{ marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: withAlpha('#2D9E6B', 25) }}>
                          <Text style={{ color: '#2D9E6B', fontSize: 10, fontWeight: '700' }}>Current</Text>
                        </View>
                      ) : null}
                    </View>
                  }
                  subtitle={info}
                  trailing={cur ? null : (
                    <Pressable
                      testID="security.revoke"
                      onPress={() => showSnackBar('Web session logged out', colors.surfaceVariant)}
                    >
                      <Text style={{ color: '#CF4444', fontSize: 12, fontWeight: '600' }}>Revoke</Text>
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

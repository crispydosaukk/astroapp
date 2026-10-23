/**
 * Port of lib/presentation/profile_screens/notifications_screen.dart
 * NotificationsScreen & NotificationSettingsScreen.
 * Dynamic theme support for Light Vedic & Dark Cosmic.
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { Switch } from '@/components/common';
import { TabBar, TabPager } from '@/components/Tabs';
import { Text } from '@/components/Text';
import { pop } from '@/navigation/routes';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const INITIAL = [
  { emoji: '🌟', title: 'Your Daily Horoscope is Ready', body: 'Today brings positive energy for career decisions with auspicious planetary aspects.', time: '8:00 AM', type: 'Daily', read: false, color: '#9370DB' },
  { emoji: '💬', title: 'Pandit Radhey Shyam replied', body: 'Your consultation summary is now available. Tap to view the detailed notes.', time: 'Yesterday', type: 'Consultation', read: false, color: '#4FC3F7' },
  { emoji: '📜', title: 'Your Kundli Report is Ready', body: 'Your Comprehensive Life Report has been generated. Download it now.', time: '2 days ago', type: 'Report', read: true, color: '#FFD700' },
  { emoji: '🪐', title: 'Saturn Transit Alert', body: 'Saturn transit creates favorable alignments for 10th and 11th houses.', time: '3 days ago', type: 'Planetary', read: true, color: '#FF6B6B' },
  { emoji: '🎁', title: 'Special Offer: 30% Off Reports', body: 'Get 30% off on all Kundli reports this week. Use code ASTRO30.', time: '5 days ago', type: 'Offer', read: true, color: '#81C784' },
  { emoji: '🔮', title: 'New Remedy Recommendation', body: 'Based on your current Dasha, we recommend a specific Rudraksha.', time: '1 week ago', type: 'Remedy', read: true, color: '#FFB347' },
];

const SETTINGS: Record<string, boolean> = {
  'Daily Horoscope': true, 'Planetary Alerts': true, 'Consultation Reminders': true, 'Report Ready': true, 'Astrologer Messages': true,
  'Offers & Promotions': false, 'Remedy Reminders': true, 'Panchang Updates': false, 'New Astrologers': false, 'Wallet Updates': true,
};

export function NotificationSettingsContent() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(SETTINGS);
  const keys = Object.keys(settings);

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}>
      <View
        style={{
          padding: 14,
          borderRadius: 16,
          backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 15),
          borderWidth: 1,
          borderColor: colors.cardBorder,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 20 }}>🔔</Text>
        <Text style={{ marginLeft: 10, flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
          Manage what notifications you receive from AstroParihar
        </Text>
      </View>
      <View style={{ marginTop: 20, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}>
        {keys.map((k, i) => (
          <View key={k}>
            <Pressable onPress={() => setSettings((s) => ({ ...s, [k]: !s[k] }))} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 56 }}>
              <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{k}</Text>
              <Switch testID={`notificationSettings.${k.replace(/[^A-Za-z]/g, '')}`} value={settings[k]} onValueChange={(v) => setSettings((s) => ({ ...s, [k]: v }))} />
            </Pressable>
            {i < keys.length - 1 ? <View style={{ height: 1, marginHorizontal: 16, backgroundColor: colors.divider }} /> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function NotificationSettingsScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="notificationSettings.screen">
      <AppBar
        title={t('profile.notificationSettings', 'Notification Settings')}
        onBack={pop}
        testIDPrefix="notificationSettings"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
      />
      <NotificationSettingsContent />
    </View>
  );
}

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState(INITIAL);

  const markAllRead = () => setItems((is) => is.map((x) => ({ ...x, read: true })));
  const unreadCount = items.filter((x) => !x.read).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="notifications.screen">
      <AppBar
        title={t('profile.notifications', 'Notifications')}
        onBack={pop}
        testIDPrefix="notifications"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        actions={[
          <Pressable key="all" testID="notifications.markAllRead" onPress={markAllRead} style={{ paddingHorizontal: 12, height: 40, justifyContent: 'center' }}>
            <Text style={{ color: colors.goldAccent, fontSize: 12, fontWeight: '700' }}>Mark all read</Text>
          </Pressable>,
        ]}
        bottom={
          <TabBar
            testIDPrefix="notifications.tab"
            tabs={['Inbox', 'Settings']}
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
      <TabPager index={tab} onChange={setTab}>
        {[
          <ScrollView key="inbox" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(150, insets.bottom + 90) }}>
            {unreadCount > 0 ? (
              <View
                style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 15),
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16 }}>✨</Text>
                <Text style={{ marginLeft: 8, color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
                  {`You have ${unreadCount} unread notifications`}
                </Text>
              </View>
            ) : null}

            {items.map((it, i) => (
              <Pressable
                key={i}
                onPress={() => setItems((all) => all.map((x, idx) => (idx === i ? { ...x, read: true } : x)))}
                style={{
                  marginBottom: 12,
                  padding: 16,
                  borderRadius: 18,
                  backgroundColor: it.read ? colors.surface : withAlpha(colors.goldAccent, colors.isLight ? 12 : 20),
                  borderWidth: 1,
                  borderColor: it.read ? colors.cardBorder : colors.goldAccent,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: withAlpha(it.color, colors.isLight ? 20 : 25),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{it.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: it.read ? '600' : '700' }}>
                    {it.title}
                  </Text>
                  <Text style={{ marginTop: 3, color: colors.textMuted, fontSize: 12, lineHeight: 16 }}>
                    {it.body}
                  </Text>
                  <Text style={{ marginTop: 6, color: colors.textMuted, fontSize: 10 }}>{it.time}</Text>
                </View>
                {!it.read ? (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.goldAccent, marginTop: 4 }} />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>,
          <NotificationSettingsContent key="settings" />,
        ]}
      </TabPager>
    </View>
  );
}

/**
 * Port of lib/presentation/profile_screens/notifications_screen.dart
 * (NotificationsScreen + NotificationSettingsContent + NotificationSettingsScreen)
 * - tap item → marks read; "Mark all read"; unread banner count
 * - Settings tab / standalone settings screen: 10 local switches (not persisted, same as source)
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppBar } from '@/components/AppBar';
import { Switch } from '@/components/common';
import { TabBar, TabPager } from '@/components/Tabs';
import { Text } from '@/components/Text';
import { pop } from '@/navigation/routes';
import { AppColors, withAlpha } from '@/theme/colors';

const INITIAL = [
  { emoji: '🌟', title: 'Your Daily Horoscope is Ready', body: 'Aries: Today brings positive energy for career decisions. Venus in your 10th house...', time: '8:00 AM', type: 'Daily', read: false, color: '#9370DB' },
  { emoji: '💬', title: 'Pandit Radhey Shyam replied', body: 'Your consultation summary is now available. Tap to view the detailed notes.', time: 'Yesterday', type: 'Consultation', read: false, color: '#4FC3F7' },
  { emoji: '📜', title: 'Your Kundli Report is Ready', body: 'Your Comprehensive Life Report has been generated. Download it now.', time: '2 days ago', type: 'Report', read: true, color: '#FFD700' },
  { emoji: '🪐', title: 'Saturn Transit Alert', body: 'Saturn moves into Aquarius on Jan 17. This affects your 11th house significantly.', time: '3 days ago', type: 'Planetary', read: true, color: '#FF6B6B' },
  { emoji: '🎁', title: 'Special Offer: 30% Off Reports', body: 'Get 30% off on all Kundli reports this week. Use code ASTRO30.', time: '5 days ago', type: 'Offer', read: true, color: '#81C784' },
  { emoji: '🔮', title: 'New Remedy Recommendation', body: 'Based on your current Dasha, we recommend a specific Rudraksha. View details.', time: '1 week ago', type: 'Remedy', read: true, color: '#FFB347' },
];

const SETTINGS: Record<string, boolean> = {
  'Daily Horoscope': true, 'Planetary Alerts': true, 'Consultation Reminders': true, 'Report Ready': true, 'Astrologer Messages': true,
  'Offers & Promotions': false, 'Remedy Reminders': true, 'Panchang Updates': false, 'New Astrologers': false, 'Wallet Updates': true,
};

export function NotificationSettingsContent() {
  const [settings, setSettings] = useState(SETTINGS);
  const keys = Object.keys(settings);
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
      <View style={{ padding: 14, borderRadius: 14, backgroundColor: withAlpha(AppColors.goldAccent, 15), borderWidth: 1, borderColor: AppColors.goldBorder, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 20 }}>🔔</Text>
        <Text style={{ marginLeft: 10, flex: 1, color: AppColors.textSecondary, fontSize: 12 }}>Manage what notifications you receive from AstroParihar</Text>
      </View>
      <View style={{ marginTop: 20, borderRadius: 18, backgroundColor: AppColors.surfaceDark, borderWidth: 1, borderColor: AppColors.goldBorder }}>
        {keys.map((k, i) => (
          <View key={k}>
            <Pressable onPress={() => setSettings((s) => ({ ...s, [k]: !s[k] }))} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 56 }}>
              <Text style={{ flex: 1, color: AppColors.textPrimary, fontSize: 14, fontWeight: '500' }}>{k}</Text>
              <Switch testID={`notificationSettings.${k.replace(/[^A-Za-z]/g, '')}`} value={settings[k]} onValueChange={(v) => setSettings((s) => ({ ...s, [k]: v }))} />
            </Pressable>
            {i < keys.length - 1 ? <View style={{ height: 1, marginHorizontal: 16, backgroundColor: '#1E2A40' }} /> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function NotificationSettingsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="notificationSettings.screen">
      <AppBar title="Notification Settings" onBack={pop} testIDPrefix="notificationSettings" />
      <NotificationSettingsContent />
    </View>
  );
}

export default function NotificationsScreen() {
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState(INITIAL);
  const unread = items.filter((n) => !n.read).length;
  const markAll = (
    <Pressable key="mark" testID="notifications.markAllRead" onPress={() => setItems((l) => l.map((n) => ({ ...n, read: true })))} style={{ paddingHorizontal: 12, height: 40, justifyContent: 'center' }}>
      <Text style={{ color: AppColors.goldAccent, fontSize: 12 }}>Mark all read</Text>
    </Pressable>
  );
  return (
    <View style={{ flex: 1, backgroundColor: AppColors.backgroundDark }} testID="notifications.screen">
      <AppBar
        title="Notifications"
        onBack={pop}
        testIDPrefix="notifications"
        actions={[markAll]}
        bottom={<TabBar testIDPrefix="notifications.tab" tabs={['All', 'Settings']} index={tab} onChange={setTab} indicatorStyle="underline" indicatorColor={AppColors.goldAccent} labelColor={AppColors.goldAccent} unselectedLabelColor={AppColors.textMuted} fontSize={13} fontWeight="600" />}
      />
      <TabPager index={tab} onChange={setTab}>
        {[
          <ScrollView key="all" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
            {unread > 0 ? (
              <View testID="notifications.unreadBanner" style={{ marginBottom: 16, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: withAlpha(AppColors.goldAccent, 15), borderWidth: 1, borderColor: AppColors.goldBorder }}>
                <Text style={{ color: AppColors.goldAccent, fontSize: 12, fontWeight: '600' }}>{`${unread} unread notifications`}</Text>
              </View>
            ) : null}
            {items.map((n, i) => (
              <Pressable
                key={n.title}
                testID={`notifications.item.${i}`}
                onPress={() => setItems((l) => l.map((x, j) => (j === i ? { ...x, read: true } : x)))}
                style={{ marginBottom: 10, padding: 14, borderRadius: 16, flexDirection: 'row', backgroundColor: n.read ? AppColors.surfaceDark : withAlpha(AppColors.primary, 20), borderWidth: 1, borderColor: n.read ? AppColors.goldBorder : withAlpha(AppColors.primary, 80) }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: withAlpha(n.color, 25), alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{n.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ flex: 1, color: AppColors.textPrimary, fontSize: 13, fontWeight: n.read ? '500' : '700' }}>{n.title}</Text>
                    {!n.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: AppColors.primary }} /> : null}
                  </View>
                  <Text numberOfLines={2} style={{ marginTop: 3, color: AppColors.textMuted, fontSize: 11 }}>{n.body}</Text>
                  <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: withAlpha(n.color, 20) }}>
                      <Text style={{ color: n.color, fontSize: 9, fontWeight: '600' }}>{n.type}</Text>
                    </View>
                    <Text style={{ marginLeft: 8, color: AppColors.textMuted, fontSize: 10 }}>{n.time}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>,
          <NotificationSettingsContent key="settings" />,
        ]}
      </TabPager>
    </View>
  );
}

/**
 * NotificationsScreen & NotificationSettingsScreen
 * Complete dynamic notification center + push preferences synced with AstroParihar backend.
 * Supports Light Vedic & Dark Cosmic themes seamlessly.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/AppBar';
import { AppIcon } from '@/components/AppIcon';
import { AppImage } from '@/components/AppImage';
import { ElevatedButton } from '@/components/common';
import { showSnackBar } from '@/components/overlays';
import { lh, Text } from '@/components/Text';
import { IconBadge, SettingsCard, SwitchTile, TileDivider } from '@/components/tiles';
import { AppRoutes, pop, push } from '@/navigation/routes';
import {
  AppNotificationItem,
  DEFAULT_NOTIFICATION_CATEGORIES,
  DynamicNotificationCategoryMeta,
  NotificationCategory,
  useNotificationStore,
} from '@/services/notificationStore';
import { withAlpha } from '@/theme/colors';
import { useTranslation } from '@/theme/languageStore';
import { useThemeColors } from '@/theme/themeStore';

const CATEGORY_ICON_MAP: Record<string, string> = {
  horoscope: 'auto_awesome',
  panchang: 'calendar_today_outlined',
  consultation: 'chat_bubble_outline_rounded',
  offers: 'local_offer_outlined',
  remedies: 'spa_outlined',
  system: 'shield_outlined',
};

function resolveCategoryMeta(
  catId: NotificationCategory,
  categories: DynamicNotificationCategoryMeta[]
): { label: string; emoji: string; color: string; icon: string; description: string } {
  const found =
    categories.find((c) => c.id === catId) ||
    DEFAULT_NOTIFICATION_CATEGORIES.find((c) => c.id === catId);

  if (found) {
    return {
      label: found.label,
      emoji: found.emoji || '🔔',
      color: found.color || '#C9A84C',
      icon: CATEGORY_ICON_MAP[found.id] || 'notifications_outlined',
      description: found.description || `Receive ${found.label} updates & alerts`,
    };
  }

  const prettyLabel = catId
    ? catId
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase())
    : 'Updates';
  return {
    label: prettyLabel,
    emoji: '🔔',
    color: '#C9A84C',
    icon: 'notifications_outlined',
    description: `Receive ${prettyLabel} alerts`,
  };
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  if (isNaN(diff) || diff < 60_000) return 'Just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return '';
  }
}

const SectionHeading = ({ children }: { children: string }) => {
  const colors = useThemeColors();
  return (
    <Text
      style={{
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 10,
        marginLeft: 2,
      }}
    >
      {children}
    </Text>
  );
};

export function NotificationsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const notifications = useNotificationStore((s) => s.notifications);
  const categories = useNotificationStore((s) => s.categories);
  const settingsScreen = useNotificationStore((s) => s.settingsScreen);
  const readIds = useNotificationStore((s) => s.readIds);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const loading = useNotificationStore((s) => s.loading);
  const permissionStatus = useNotificationStore((s) => s.permissionStatus);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const checkPermission = useNotificationStore((s) => s.checkPermission);
  const requestAndRegisterPushToken = useNotificationStore((s) => s.requestAndRegisterPushToken);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filterTabs = useMemo(() => {
    const base: { id: string; label: string }[] = [
      { id: 'all', label: 'All' },
      { id: 'unread', label: 'Unread' },
    ];
    const seen = new Set(['all', 'unread']);
    for (const cat of categories) {
      if (cat.active === false) continue;
      if (!seen.has(cat.id)) {
        seen.add(cat.id);
        base.push({ id: cat.id, label: cat.label });
      }
    }
    for (const item of notifications) {
      if (item.category && !seen.has(item.category)) {
        seen.add(item.category);
        const meta = resolveCategoryMeta(item.category, categories);
        base.push({ id: item.category, label: meta.label });
      }
    }
    return base;
  }, [categories, notifications]);

  useEffect(() => {
    checkPermission();
    fetchNotifications();
  }, [checkPermission, fetchNotifications]);

  const readSet = useMemo(() => new Set(readIds), [readIds]);

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return !readSet.has(item.id);
      return item.category === activeFilter;
    });
  }, [notifications, activeFilter, readSet]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleEnablePush = async () => {
    if (permissionStatus === 'denied') {
      Linking.openSettings().catch(() => {});
      return;
    }
    const ok = await requestAndRegisterPushToken(true);
    if (ok) {
      showSnackBar('Push notifications enabled successfully!', '#2D9E6B');
    } else {
      showSnackBar('Enable notifications in device settings to receive live alerts.', colors.surfaceVariant);
    }
  };

  const handleCardPress = async (item: AppNotificationItem) => {
    await markAsRead(item.id);
    if (item.actionRoute && item.actionRoute !== AppRoutes.notificationsScreen) {
      push(item.actionRoute);
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      'Clear All Notifications?',
      'This will remove all current notifications from your inbox.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            showSnackBar('Notifications cleared', colors.surfaceVariant);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="notifications.screen">
      <AppBar
        title={settingsScreen.inboxScreenTitle || t('profile.notifications', 'Notifications')}
        onBack={pop}
        testIDPrefix="notifications"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
        actions={[
          <View key="notif-actions" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {unreadCount > 0 ? (
              <Pressable
                testID="notifications.markAllRead"
                onPress={async () => {
                  await markAllAsRead();
                  showSnackBar('All notifications marked as read', colors.surfaceVariant);
                }}
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 20 : 25),
                  borderWidth: 1,
                  borderColor: withAlpha(colors.goldAccent, 60),
                }}
              >
                <Text style={{ color: colors.goldAccent, fontSize: 11, fontWeight: '700' }}>
                  Read All
                </Text>
              </Pressable>
            ) : null}
            {notifications.length > 0 ? (
              <Pressable
                testID="notifications.clearTop"
                onPress={handleClearAll}
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: withAlpha('#CF4444', colors.isLight ? 14 : 24),
                  borderWidth: 1,
                  borderColor: withAlpha('#CF4444', 65),
                }}
              >
                <Text style={{ color: '#CF4444', fontSize: 11, fontWeight: '700' }}>
                  Clear
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              testID="notifications.settingsBtn"
              onPress={() => push(AppRoutes.notificationSettingsScreen)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
              accessibilityLabel="Notification Settings"
            >
              <AppIcon name="tune_outlined" color={colors.goldAccent} size={18} />
            </Pressable>
          </View>,
        ]}
      />

      {/* Filter Pills */}
      <View style={{ paddingVertical: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {filterTabs.map((tab) => {
            const active = activeFilter === tab.id;
            const showCount = tab.id === 'unread' && unreadCount > 0;
            return (
              <Pressable
                key={tab.id}
                testID={`notifications.filter.${tab.id}`}
                onPress={() => setActiveFilter(tab.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: active ? colors.goldAccent : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.goldAccent : colors.cardBorder,
                }}
              >
                <Text
                  style={{
                    color: active ? '#FFFFFF' : colors.textSecondary,
                    fontSize: 12,
                    fontWeight: active ? '700' : '600',
                  }}
                >
                  {tab.label}
                </Text>
                {showCount ? (
                  <View
                    style={{
                      marginLeft: 6,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      paddingHorizontal: 5,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: active ? 'rgba(255,255,255,0.28)' : '#CF4444',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                      {unreadCount}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 6,
          paddingBottom: Math.max(120, insets.bottom + 80),
          gap: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.goldAccent}
          />
        }
      >
        {/* Push Permission Prompt Banner */}
        {Platform.OS !== 'web' && permissionStatus !== 'granted' ? (
          <LinearGradient
            colors={
              colors.isLight
                ? ['#FFF9F0', '#F4EAD8']
                : [withAlpha(colors.goldAccent, 28), colors.surfaceVariant]
            }
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: withAlpha(colors.goldAccent, 70),
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: withAlpha(colors.goldAccent, 30),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="notifications_active_outlined" color={colors.goldAccent} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                {settingsScreen.enablePushBannerTitle}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                {settingsScreen.enablePushBannerSubtitle}
              </Text>
            </View>
            <Pressable
              testID="notifications.enablePush"
              onPress={handleEnablePush}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: colors.goldAccent,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                {permissionStatus === 'denied' ? 'Settings' : 'Enable'}
              </Text>
            </Pressable>
          </LinearGradient>
        ) : null}

        {/* Loading State */}
        {loading && notifications.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 10 }}>
            <ActivityIndicator size="large" color={colors.goldAccent} />
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              Syncing celestial alerts...
            </Text>
          </View>
        ) : null}

        {/* Empty State */}
        {!loading && filtered.length === 0 ? (
          <View
            testID="notifications.empty"
            style={{
              marginTop: 24,
              padding: 28,
              borderRadius: 20,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: withAlpha(colors.goldAccent, 22),
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <AppIcon name="notifications_none_rounded" color={colors.goldAccent} size={30} />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
              {activeFilter === 'unread'
                ? settingsScreen.emptyUnreadTitle
                : settingsScreen.emptyAllTitle}
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 12,
                textAlign: 'center',
                marginTop: 6,
                lineHeight: 18,
              }}
            >
              {activeFilter === 'unread'
                ? settingsScreen.emptyUnreadSubtitle
                : settingsScreen.emptyAllSubtitle}
            </Text>
          </View>
        ) : null}

        {/* Notification Cards */}
        {filtered.map((item) => {
          const isUnread = !readSet.has(item.id);
          const meta = resolveCategoryMeta(item.category, categories);

          return (
            <Pressable
              key={item.id}
              testID={`notifications.card.${item.id}`}
              onPress={() => handleCardPress(item)}
              style={({ pressed }) => ({
                padding: 14,
                borderRadius: 18,
                backgroundColor: isUnread
                  ? colors.isLight
                    ? '#FFFDF8'
                    : withAlpha(colors.goldAccent, 14)
                  : colors.surface,
                borderWidth: isUnread ? 1.5 : 1,
                borderColor: isUnread ? withAlpha(colors.goldAccent, 110) : colors.cardBorder,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: withAlpha(meta.color, colors.isLight ? 20 : 28),
                    borderWidth: 1,
                    borderColor: withAlpha(meta.color, 65),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <View
                        style={{
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: withAlpha(meta.color, 20),
                        }}
                      >
                        <Text style={{ color: meta.color, fontSize: 10, fontWeight: '700' }}>
                          {meta.label}
                        </Text>
                      </View>
                      {isUnread ? (
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 4,
                            backgroundColor: colors.goldAccent,
                          }}
                        />
                      ) : null}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                      <Pressable
                        testID={`notifications.delete.${item.id}`}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          deleteNotification(item.id);
                        }}
                        hitSlop={8}
                      >
                        <AppIcon name="close_rounded" color={colors.textMuted} size={16} />
                      </Pressable>
                    </View>
                  </View>

                  <Text
                    style={{
                      marginTop: 6,
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: isUnread ? '800' : '600',
                      lineHeight: 20,
                    }}
                  >
                    {item.title}
                  </Text>

                  {item.subtitle ? (
                    <Text
                      style={{
                        marginTop: 2,
                        color: colors.goldAccent,
                        fontSize: 11.5,
                        fontWeight: '700',
                      }}
                    >
                      {item.subtitle}
                    </Text>
                  ) : null}

                  <Text
                    style={{
                      marginTop: 4,
                      color: colors.textSecondary,
                      ...lh(12.5, 1.48),
                    }}
                  >
                    {item.body}
                  </Text>

                  {item.imageUrl ? (
                    <View
                      style={{
                        marginTop: 10,
                        borderRadius: 12,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      <AppImage
                        uri={item.imageUrl}
                        width="100%"
                        height={132}
                        fit="cover"
                        semanticLabel={item.title}
                      />
                    </View>
                  ) : null}

                  <View
                    style={{
                      marginTop: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {item.actionRoute && item.actionRoute !== AppRoutes.notificationsScreen ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: colors.goldAccent, fontSize: 11.5, fontWeight: '700' }}>
                          {item.ctaText || 'Tap to view details'}
                        </Text>
                        <AppIcon name="chevron_right_rounded" color={colors.goldAccent} size={15} />
                      </View>
                    ) : (
                      <View />
                    )}

                    <Pressable
                      testID={`notifications.clearItem.${item.id}`}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        deleteNotification(item.id);
                      }}
                      hitSlop={8}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        backgroundColor: colors.surfaceVariant,
                      }}
                    >
                      <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '600' }}>
                        Clear
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Footer Clear All action */}
        {notifications.length > 0 ? (
          <Pressable
            testID="notifications.clearAll"
            onPress={handleClearAll}
            style={{
              marginTop: 8,
              paddingVertical: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              backgroundColor: colors.surface,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 12.5, fontWeight: '600' }}>
              Clear All Notifications
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

export function NotificationSettingsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const preferences = useNotificationStore((s) => s.preferences);
  const categories = useNotificationStore((s) => s.categories);
  const settingsScreen = useNotificationStore((s) => s.settingsScreen);
  const permissionStatus = useNotificationStore((s) => s.permissionStatus);
  const expoPushToken = useNotificationStore((s) => s.expoPushToken);
  const nativePushToken = useNotificationStore((s) => s.nativePushToken);
  const checkPermission = useNotificationStore((s) => s.checkPermission);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const requestAndRegisterPushToken = useNotificationStore((s) => s.requestAndRegisterPushToken);
  const updatePreference = useNotificationStore((s) => s.updatePreference);
  const sendTestLocalNotification = useNotificationStore((s) => s.sendTestLocalNotification);

  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkPermission();
    fetchNotifications();
  }, [checkPermission, fetchNotifications]);

  const handleToggle = async (
    key: string,
    value: boolean,
    label: string
  ) => {
    await updatePreference(key, value);
    showSnackBar(`${label} ${value ? 'enabled' : 'disabled'}`, colors.surfaceVariant);
  };

  const handlePermissionPress = async () => {
    if (permissionStatus === 'denied') {
      Linking.openSettings().catch(() => {});
      return;
    }
    const ok = await requestAndRegisterPushToken(true);
    if (ok) {
      showSnackBar('Push notifications activated on this device!', '#2D9E6B');
    } else {
      showSnackBar('Please allow notifications in system settings.', colors.surfaceVariant);
    }
  };

  const handleTestNotification = async (delaySeconds = 0) => {
    setTesting(true);
    const ok = await sendTestLocalNotification(delaySeconds);
    setTesting(false);
    if (ok) {
      showSnackBar(
        delaySeconds > 0
          ? `Lock your screen now! Test alert arrives in ${delaySeconds} seconds.`
          : 'Test notification delivered!',
        '#2D9E6B'
      );
    } else {
      showSnackBar(
        Platform.OS === 'web'
          ? 'Local push banners work on iOS & Android devices.'
          : 'Enable notification permissions first to test.',
        colors.surfaceVariant
      );
    }
  };

  const pushEnabled = permissionStatus === 'granted';
  const visibleCategories = useMemo(
    () => categories.filter((c) => c.active !== false),
    [categories]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="notificationSettings.screen">
      <AppBar
        title={
          settingsScreen.settingsScreenTitle ||
          t('profile.notificationSettings', 'Notification Settings')
        }
        onBack={pop}
        testIDPrefix="notificationSettings"
        backgroundColor={colors.background}
        backColor={colors.textPrimary}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Math.max(150, insets.bottom + 90),
          gap: 20,
        }}
      >
        {/* System Permission Status Card */}
        <LinearGradient
          colors={
            pushEnabled
              ? [withAlpha('#2D9E6B', colors.isLight ? 20 : 30), colors.surface]
              : [withAlpha(colors.goldAccent, colors.isLight ? 24 : 30), colors.surface]
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: pushEnabled ? withAlpha('#2D9E6B', 80) : withAlpha(colors.goldAccent, 85),
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: pushEnabled
                ? withAlpha('#2D9E6B', 28)
                : withAlpha(colors.goldAccent, 28),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon
              name={pushEnabled ? 'notifications_active_rounded' : 'notifications_off_outlined'}
              color={pushEnabled ? '#2D9E6B' : colors.goldAccent}
              size={24}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
              {pushEnabled ? settingsScreen.statusActiveTitle : settingsScreen.statusOffTitle}
            </Text>
            <Text style={{ marginTop: 3, color: colors.textMuted, fontSize: 11.5, lineHeight: 16 }}>
              {pushEnabled
                ? expoPushToken || nativePushToken
                  ? settingsScreen.statusActiveSubtitle
                  : settingsScreen.statusGrantedFallbackSubtitle
                : settingsScreen.statusOffSubtitle}
            </Text>
          </View>
          {!pushEnabled && Platform.OS !== 'web' ? (
            <Pressable
              testID="notificationSettings.enableSystem"
              onPress={handlePermissionPress}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: colors.goldAccent,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' }}>
                {permissionStatus === 'denied' ? 'Settings' : 'Allow'}
              </Text>
            </Pressable>
          ) : null}
        </LinearGradient>

        {/* Master Switch */}
        <View>
          <SectionHeading>{settingsScreen.masterSectionHeading}</SectionHeading>
          <SettingsCard>
            <SwitchTile
              testID="notificationSettings.master"
              title={settingsScreen.masterToggleTitle}
              subtitle={settingsScreen.masterToggleSubtitle}
              value={preferences.enabled}
              onChange={(v) => handleToggle('enabled', v, settingsScreen.masterToggleTitle)}
              secondary={<IconBadge icon="notifications_outlined" color={colors.goldAccent} size={20} />}
            />
          </SettingsCard>
        </View>

        {/* Astrological Alert Categories (Dynamic from Admin Panel) */}
        <View style={{ opacity: preferences.enabled ? 1 : 0.55 }}>
          <SectionHeading>{settingsScreen.categoriesSectionHeading}</SectionHeading>
          <SettingsCard>
            {visibleCategories.map((cat, idx) => {
              const meta = resolveCategoryMeta(cat.id, categories);
              const isEnabled =
                preferences[cat.id] !== undefined
                  ? Boolean(preferences[cat.id])
                  : cat.defaultEnabled !== false;
              return (
                <React.Fragment key={cat.id}>
                  {idx > 0 ? <TileDivider indent={16} endIndent={16} /> : null}
                  <SwitchTile
                    testID={`notificationSettings.${cat.id}`}
                    title={meta.label}
                    subtitle={meta.description}
                    value={isEnabled}
                    onChange={(v) => handleToggle(cat.id, v, `${meta.label} alerts`)}
                    secondary={
                      CATEGORY_ICON_MAP[cat.id] ? (
                        <IconBadge icon={meta.icon as any} color={meta.color} size={20} />
                      ) : (
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: withAlpha(meta.color, colors.isLight ? 20 : 28),
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 17 }}>{meta.emoji}</Text>
                        </View>
                      )
                    }
                  />
                </React.Fragment>
              );
            })}
          </SettingsCard>
        </View>

        {/* Sound & Quiet Hours */}
        <View>
          <SectionHeading>{settingsScreen.deliverySectionHeading}</SectionHeading>
          <SettingsCard>
            <SwitchTile
              testID="notificationSettings.sound"
              title={settingsScreen.soundTitle}
              subtitle={settingsScreen.soundSubtitle}
              value={preferences.sound}
              onChange={(v) => handleToggle('sound', v, settingsScreen.soundTitle)}
              secondary={<IconBadge icon="volume_up_outlined" color={colors.goldAccent} size={20} />}
            />
            <TileDivider indent={16} endIndent={16} />
            <SwitchTile
              testID="notificationSettings.vibration"
              title={settingsScreen.vibrationTitle}
              subtitle={settingsScreen.vibrationSubtitle}
              value={preferences.vibration}
              onChange={(v) => handleToggle('vibration', v, settingsScreen.vibrationTitle)}
              secondary={<IconBadge icon="vibration" color="#4FC3F7" size={20} />}
            />
            <TileDivider indent={16} endIndent={16} />
            <SwitchTile
              testID="notificationSettings.quietHours"
              title={settingsScreen.quietHoursTitle}
              subtitle={settingsScreen.quietHoursSubtitle}
              value={preferences.quietHoursEnabled}
              onChange={(v) => handleToggle('quietHoursEnabled', v, settingsScreen.quietHoursTitle)}
              secondary={<IconBadge icon="bedtime_outlined" color="#9370DB" size={20} />}
            />
          </SettingsCard>
        </View>

        {/* Test Notification Buttons */}
        {settingsScreen.showTestButtons ? (
          <View style={{ gap: 10 }}>
            <ElevatedButton
              testID="notificationSettings.sendTest"
              label={testing ? 'Sending Test Alert...' : settingsScreen.instantTestButtonLabel}
              onPress={() => handleTestNotification(0)}
              disabled={testing}
              radius={14}
              paddingV={15}
              fontSize={14}
              fontWeight="700"
            />
            <Pressable
              testID="notificationSettings.sendLockScreenTest"
              onPress={() => handleTestNotification(5)}
              disabled={testing}
              style={{
                paddingVertical: 13,
                borderRadius: 14,
                borderWidth: 1.2,
                borderColor: withAlpha(colors.goldAccent, 95),
                backgroundColor: withAlpha(colors.goldAccent, colors.isLight ? 16 : 22),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.goldAccent, fontSize: 13.5, fontWeight: '700' }}>
                {settingsScreen.lockScreenTestButtonLabel}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { API_ENDPOINTS } from '@/config/api';
import { useAuthStore } from '@/features/auth/authStore';

export type NotificationCategory = string;

export interface DynamicNotificationCategoryMeta {
  id: string;
  label: string;
  emoji: string;
  color: string;
  description?: string;
}

export const DEFAULT_NOTIFICATION_CATEGORIES: DynamicNotificationCategoryMeta[] = [
  {
    id: 'horoscope',
    label: 'Horoscope',
    emoji: '✨',
    color: '#9370DB',
    description: 'Morning Rashi forecasts & planetary transits',
  },
  {
    id: 'panchang',
    label: 'Panchang',
    emoji: '🪔',
    color: '#E69F00',
    description: 'Daily Tithi, Abhijit Muhurat & Rahu Kaal',
  },
  {
    id: 'consultation',
    label: 'Consultations',
    emoji: '📞',
    color: '#4FC3F7',
    description: 'Astrologer availability, call & chat reminders',
  },
  {
    id: 'offers',
    label: 'Offers',
    emoji: '🎁',
    color: '#2D9E6B',
    description: 'Recharge bonuses, festive discounts & receipts',
  },
  {
    id: 'remedies',
    label: 'Remedies',
    emoji: '🕉️',
    color: '#E86A58',
    description: 'Ashta Parihar reminders & Kundli PDF updates',
  },
  {
    id: 'system',
    label: 'Updates',
    emoji: '🔔',
    color: '#C9A84C',
    description: 'Important platform & account notices',
  },
];

export interface AppNotificationItem {
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  ctaText?: string;
  deliveryMode?: 'push_and_inapp' | 'push_only' | 'inapp_only';
  category: NotificationCategory;
  audience: 'all' | 'specific';
  imageUrl?: string;
  actionRoute?: string;
  priority: 'normal' | 'high';
  createdAt: string;
  createdAtMs: number;
}

export interface UserNotificationPreferences {
  enabled: boolean;
  horoscope: boolean;
  panchang: boolean;
  consultation: boolean;
  offers: boolean;
  remedies: boolean;
  system: boolean;
  sound: boolean;
  vibration: boolean;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  [key: string]: boolean | string | undefined;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: UserNotificationPreferences = {
  enabled: true,
  horoscope: true,
  panchang: true,
  consultation: true,
  offers: true,
  remedies: true,
  system: true,
  sound: true,
  vibration: true,
  quietHoursEnabled: false,
  quietStart: '22:00',
  quietEnd: '07:00',
};

const STORAGE_NOTIFS_KEY = 'astroparihar_notifications_cache_v1';
const STORAGE_READ_KEY = 'astroparihar_notifications_read_ids_v1';
const STORAGE_DEL_KEY = 'astroparihar_notifications_deleted_ids_v1';
const STORAGE_PREFS_KEY = 'astroparihar_notifications_prefs_v1';
const STORAGE_TOKEN_KEY = 'astroparihar_push_token_v1';
const STORAGE_CATS_KEY = 'astroparihar_notifications_categories_v1';

let handlerConfigured = false;

export function configureForegroundNotificationHandler() {
  if (handlerConfigured || Platform.OS === 'web') return;
  handlerConfigured = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        const prefs = useNotificationStore.getState().preferences;
        return {
          shouldShowAlert: prefs.enabled,
          shouldShowBanner: prefs.enabled,
          shouldShowList: prefs.enabled,
          shouldPlaySound: prefs.enabled && prefs.sound,
          shouldSetBadge: prefs.enabled,
        };
      },
    });
  } catch (err) {
    console.warn('[notifications] Failed setting notification handler:', err);
  }
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('astroparihar_default', {
      name: 'AstroParihar Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 200, 250],
      lightColor: '#C9A84C',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  } catch (err) {
    console.warn('[notifications] Android channel setup failed:', err);
  }
}

function syncAppBadge(count: number) {
  if (Platform.OS === 'web') return;
  Notifications.setBadgeCountAsync(Math.max(0, count)).catch(() => {});
}

interface NotificationStoreState {
  notifications: AppNotificationItem[];
  categories: DynamicNotificationCategoryMeta[];
  readIds: string[];
  deletedIds: string[];
  unreadCount: number;
  preferences: UserNotificationPreferences;
  permissionStatus: 'granted' | 'denied' | 'undetermined' | 'unsupported';
  expoPushToken: string | null;
  nativePushToken: string | null;
  loading: boolean;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  checkPermission: () => Promise<'granted' | 'denied' | 'undetermined' | 'unsupported'>;
  requestAndRegisterPushToken: (interactive?: boolean) => Promise<boolean>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  updatePreference: (key: string, value: boolean | string) => Promise<void>;
  sendTestLocalNotification: (delaySeconds?: number) => Promise<boolean>;
}

function computeUnread(items: AppNotificationItem[], readIds: string[]): number {
  const readSet = new Set(readIds);
  return items.reduce((acc, item) => (readSet.has(item.id) ? acc : acc + 1), 0);
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  categories: DEFAULT_NOTIFICATION_CATEGORIES,
  readIds: [],
  deletedIds: [],
  unreadCount: 0,
  preferences: DEFAULT_NOTIFICATION_PREFERENCES,
  permissionStatus: Platform.OS === 'web' ? 'unsupported' : 'undetermined',
  expoPushToken: null,
  nativePushToken: null,
  loading: false,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const [rawNotifs, rawRead, rawDel, rawPrefs, rawToken, rawCats] = await Promise.all([
        AsyncStorage.getItem(STORAGE_NOTIFS_KEY),
        AsyncStorage.getItem(STORAGE_READ_KEY),
        AsyncStorage.getItem(STORAGE_DEL_KEY),
        AsyncStorage.getItem(STORAGE_PREFS_KEY),
        AsyncStorage.getItem(STORAGE_TOKEN_KEY),
        AsyncStorage.getItem(STORAGE_CATS_KEY),
      ]);

      const readIds: string[] = rawRead ? JSON.parse(rawRead) : [];
      const deletedIds: string[] = rawDel ? JSON.parse(rawDel) : [];
      const delSet = new Set(deletedIds);
      const cachedNotifs: AppNotificationItem[] = rawNotifs
        ? (JSON.parse(rawNotifs) as AppNotificationItem[]).filter((n) => !delSet.has(n.id))
        : [];
      const prefs: UserNotificationPreferences = rawPrefs
        ? { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(rawPrefs) }
        : DEFAULT_NOTIFICATION_PREFERENCES;
      const parsedCats: DynamicNotificationCategoryMeta[] = rawCats
        ? JSON.parse(rawCats)
        : DEFAULT_NOTIFICATION_CATEGORIES;

      const unreadCount = computeUnread(cachedNotifs, readIds);
      set({
        notifications: cachedNotifs,
        categories:
          Array.isArray(parsedCats) && parsedCats.length > 0
            ? parsedCats
            : DEFAULT_NOTIFICATION_CATEGORIES,
        readIds,
        deletedIds,
        unreadCount,
        preferences: prefs,
        expoPushToken: rawToken || null,
        hydrated: true,
      });
      syncAppBadge(unreadCount);
    } catch {
      set({ hydrated: true });
    }
  },

  checkPermission: async () => {
    if (Platform.OS === 'web') {
      set({ permissionStatus: 'unsupported' });
      return 'unsupported';
    }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const mapped =
        status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
      set({ permissionStatus: mapped });
      return mapped;
    } catch {
      return get().permissionStatus;
    }
  },

  requestAndRegisterPushToken: async (interactive = true) => {
    if (Platform.OS === 'web') {
      set({ permissionStatus: 'unsupported' });
      return false;
    }

    configureForegroundNotificationHandler();
    await ensureAndroidChannel();

    try {
      let { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted' && interactive) {
        const asked = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        status = asked.status;
      }

      const mapped =
        status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
      set({ permissionStatus: mapped });

      if (status !== 'granted') return false;

      let expoPushToken = '';
      let nativeToken = '';

      if (Device.isDevice) {
        // 1. Obtain Expo Push Token (works with Expo Push Service -> APNs & FCM)
        try {
          const projectId =
            (Constants.expoConfig?.extra as any)?.eas?.projectId ||
            (Constants as any)?.easConfig?.projectId;
          const tokenResp = projectId
            ? await Notifications.getExpoPushTokenAsync({ projectId })
            : await Notifications.getExpoPushTokenAsync();
          expoPushToken = tokenResp?.data || '';
        } catch (err) {
          console.warn('[notifications] getExpoPushTokenAsync unavailable:', err);
        }

        // 2. Obtain Native Device Push Token (FCM on Android, APNs on iOS)
        try {
          const devToken = await Notifications.getDevicePushTokenAsync();
          if (typeof devToken?.data === 'string') {
            nativeToken = devToken.data;
          }
        } catch (err) {
          console.warn('[notifications] getDevicePushTokenAsync unavailable:', err);
        }
      }

      if (expoPushToken) {
        await AsyncStorage.setItem(STORAGE_TOKEN_KEY, expoPushToken).catch(() => {});
      }
      set({
        expoPushToken: expoPushToken || get().expoPushToken,
        nativePushToken: nativeToken || get().nativePushToken,
      });

      // Register with backend if we got any token
      const finalExpo = expoPushToken || get().expoPushToken || '';
      const finalNative = nativeToken || get().nativePushToken || '';
      if (finalExpo || finalNative) {
        const authUser = useAuthStore.getState().user;
        fetch(API_ENDPOINTS.registerPushToken, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: authUser?.uid || undefined,
            phone: authUser?.phone || undefined,
            name: authUser?.name || undefined,
            expoPushToken: finalExpo || undefined,
            nativeToken: finalNative || undefined,
            platform: Platform.OS === 'android' ? 'android' : 'ios',
            deviceName: Device.modelName || Device.deviceName || Platform.OS,
          }),
        }).catch(() => {});
      }

      return true;
    } catch (err) {
      console.warn('[notifications] Push registration error:', err);
      return false;
    }
  },

  fetchNotifications: async () => {
    await get().hydrate();
    set({ loading: true });

    try {
      const authUser = useAuthStore.getState().user;
      const params = new URLSearchParams();
      if (authUser?.uid) params.set('uid', authUser.uid);
      if (authUser?.phone) params.set('phone', authUser.phone);
      const url = params.toString()
        ? `${API_ENDPOINTS.notifications}?${params.toString()}`
        : API_ENDPOINTS.notifications;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          const mergedRead = Array.from(
            new Set([...get().readIds, ...(Array.isArray(data.readIds) ? data.readIds : [])])
          );
          const mergedDel = Array.from(
            new Set([...get().deletedIds, ...(Array.isArray(data.deletedIds) ? data.deletedIds : [])])
          );
          const delSet = new Set(mergedDel);

          const liveItems = (data.notifications as AppNotificationItem[]).filter(
            (n) => !delSet.has(n.id)
          );
          const unreadCount = computeUnread(liveItems, mergedRead);

          const nextPrefs =
            data.preferences && typeof data.preferences === 'object'
              ? { ...get().preferences, ...data.preferences }
              : get().preferences;

          const nextCategories: DynamicNotificationCategoryMeta[] =
            Array.isArray(data.categories) && data.categories.length > 0
              ? data.categories
                  .filter((c: any) => c && typeof c.id === 'string' && typeof c.label === 'string')
                  .map((c: any) => ({
                    id: String(c.id),
                    label: String(c.label),
                    emoji: String(c.emoji || '🔔'),
                    color: String(c.color || '#C9A84C'),
                    description: typeof c.description === 'string' ? c.description : '',
                  }))
              : get().categories;

          set({
            notifications: liveItems,
            categories: nextCategories,
            readIds: mergedRead,
            deletedIds: mergedDel,
            unreadCount,
            preferences: nextPrefs,
            loading: false,
          });
          syncAppBadge(unreadCount);

          await Promise.all([
            AsyncStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(liveItems)),
            AsyncStorage.setItem(STORAGE_CATS_KEY, JSON.stringify(nextCategories)),
            AsyncStorage.setItem(STORAGE_READ_KEY, JSON.stringify(mergedRead)),
            AsyncStorage.setItem(STORAGE_DEL_KEY, JSON.stringify(mergedDel)),
            AsyncStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(nextPrefs)),
          ]).catch(() => {});
          return;
        }
      }
    } catch {
      // Keep offline cached list seamlessly
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    const prevRead = get().readIds;
    if (prevRead.includes(id)) return;
    const nextRead = [...prevRead, id];
    const unreadCount = computeUnread(get().notifications, nextRead);
    set({ readIds: nextRead, unreadCount });
    syncAppBadge(unreadCount);
    await AsyncStorage.setItem(STORAGE_READ_KEY, JSON.stringify(nextRead)).catch(() => {});

    const uid = useAuthStore.getState().user?.uid;
    if (uid) {
      fetch(API_ENDPOINTS.notifications, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, action: 'markRead', notificationId: id }),
      }).catch(() => {});
    }
  },

  markAllAsRead: async () => {
    const allIds = get().notifications.map((n) => n.id);
    const nextRead = Array.from(new Set([...get().readIds, ...allIds]));
    set({ readIds: nextRead, unreadCount: 0 });
    syncAppBadge(0);
    await AsyncStorage.setItem(STORAGE_READ_KEY, JSON.stringify(nextRead)).catch(() => {});

    const uid = useAuthStore.getState().user?.uid;
    if (uid && allIds.length > 0) {
      fetch(API_ENDPOINTS.notifications, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, action: 'markAllRead', notificationIds: allIds }),
      }).catch(() => {});
    }
  },

  deleteNotification: async (id: string) => {
    const nextItems = get().notifications.filter((n) => n.id !== id);
    const nextDel = Array.from(new Set([...get().deletedIds, id]));
    const nextRead = Array.from(new Set([...get().readIds, id]));
    const unreadCount = computeUnread(nextItems, nextRead);

    set({ notifications: nextItems, deletedIds: nextDel, readIds: nextRead, unreadCount });
    syncAppBadge(unreadCount);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(nextItems)),
      AsyncStorage.setItem(STORAGE_DEL_KEY, JSON.stringify(nextDel)),
      AsyncStorage.setItem(STORAGE_READ_KEY, JSON.stringify(nextRead)),
    ]).catch(() => {});

    const uid = useAuthStore.getState().user?.uid;
    if (uid) {
      fetch(API_ENDPOINTS.notifications, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, action: 'delete', notificationId: id }),
      }).catch(() => {});
    }
  },

  clearAll: async () => {
    const allIds = get().notifications.map((n) => n.id);
    const nextDel = Array.from(new Set([...get().deletedIds, ...allIds]));
    const nextRead = Array.from(new Set([...get().readIds, ...allIds]));
    set({ notifications: [], deletedIds: nextDel, readIds: nextRead, unreadCount: 0 });
    syncAppBadge(0);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify([])),
      AsyncStorage.setItem(STORAGE_DEL_KEY, JSON.stringify(nextDel)),
      AsyncStorage.setItem(STORAGE_READ_KEY, JSON.stringify(nextRead)),
    ]).catch(() => {});

    const uid = useAuthStore.getState().user?.uid;
    if (uid && allIds.length > 0) {
      fetch(API_ENDPOINTS.notifications, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, action: 'clearAll', notificationIds: allIds }),
      }).catch(() => {});
    }
  },

  updatePreference: async (key, value) => {
    const nextPrefs = { ...get().preferences, [key]: value };
    set({ preferences: nextPrefs });
    await AsyncStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(nextPrefs)).catch(() => {});

    const uid = useAuthStore.getState().user?.uid;
    if (uid) {
      fetch(API_ENDPOINTS.notificationPreferences, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, preferences: nextPrefs }),
      }).catch(() => {});
    }
  },

  sendTestLocalNotification: async (delaySeconds = 0) => {
    if (Platform.OS === 'web') return false;
    const granted = await get().requestAndRegisterPushToken(true);
    if (!granted) return false;

    try {
      await ensureAndroidChannel();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✨ AstroParihar Lock-Screen Alert',
          subtitle: 'Live Vedic Push Notifications Active',
          body: 'Your daily horoscope, auspicious Muhurat & AstroParihar offers will appear right here!',
          sound: get().preferences.sound ? 'default' : undefined,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { actionRoute: '/notifications-screen' },
        },
        trigger:
          delaySeconds > 0
            ? {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: delaySeconds,
                channelId: 'astroparihar_default',
              }
            : null,
      });
      return true;
    } catch (err) {
      console.warn('[notifications] scheduleNotificationAsync failed:', err);
      return false;
    }
  },
}));

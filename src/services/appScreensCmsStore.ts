/**
 * Master Zustand Store for 100% Dynamic Mobile App Screens CMS.
 * - Instant 0ms hydration from AsyncStorage cache (`astroparihar_all_screens_cms_v1`)
 * - Background live sync from `/api/app-dynamic/screens-config` on boot, foreground resume, and pull-to-refresh
 * - Deep-merges onto `DEFAULT_APP_SCREENS_CMS` so no screen or field can ever be blank or crash offline.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { API_ENDPOINTS } from '@/config/api';
import {
  AppScreensCmsConfig,
  DEFAULT_APP_SCREENS_CMS,
  mergeAppScreensCms,
} from '@/services/appScreensCmsDefaults';

export { DEFAULT_APP_SCREENS_CMS, mergeAppScreensCms };
export type { AppScreensCmsConfig };

const STORAGE_KEY = 'astroparihar_all_screens_cms_v1';

interface AppScreensCmsState {
  config: AppScreensCmsConfig;
  hydrated: boolean;
  loading: boolean;
  lastFetchedAt: number;
  hydrate: () => Promise<void>;
  fetchConfig: (force?: boolean) => Promise<AppScreensCmsConfig>;
}

let inFlightPromise: Promise<AppScreensCmsConfig> | null = null;

/**
 * Helper to fill `{key}` placeholders in CMS templates safely.
 */
export function fillCmsTemplate(template: string, vars: Record<string, string | number>): string {
  let out = template || '';
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return out;
}

export const useAppScreensCmsStore = create<AppScreensCmsState>((set, get) => ({
  config: DEFAULT_APP_SCREENS_CMS,
  hydrated: false,
  loading: false,
  lastFetchedAt: 0,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<AppScreensCmsConfig>;
        set({ config: mergeAppScreensCms(parsed), hydrated: true });
        return;
      }
    } catch {
      // ignore corrupted cache
    }
    set({ hydrated: true });
  },

  fetchConfig: async (force = false) => {
    const now = Date.now();
    if (!force && now - get().lastFetchedAt < 15_000) {
      return get().config;
    }
    if (inFlightPromise && !force) {
      return inFlightPromise;
    }

    inFlightPromise = (async () => {
      set({ loading: true });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      try {
        const url = force
          ? `${API_ENDPOINTS.screensConfig}?t=${Date.now()}`
          : API_ENDPOINTS.screensConfig;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json.config) {
            const merged = mergeAppScreensCms(json.config);
            set({ config: merged, lastFetchedAt: Date.now(), loading: false });
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
            return merged;
          }
        }
      } catch {
        clearTimeout(timeout);
      }
      set({ loading: false });
      return get().config;
    })();

    try {
      return await inFlightPromise;
    } finally {
      inFlightPromise = null;
    }
  },
}));

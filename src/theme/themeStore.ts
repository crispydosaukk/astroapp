/** Port of lib/core/theme_provider.dart — persisted theme + accent (SharedPreferences → AsyncStorage). */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ThemeName = 'Dark Cosmic' | 'Midnight Blue' | 'Sacred Dark' | 'Light Vedic';
export type AccentName =
  | 'Sacred Gold' | 'Cosmic Purple' | 'Divine Red' | 'Celestial Blue' | 'Emerald' | 'Saffron';

const THEME_KEY = 'selected_theme';
const ACCENT_KEY = 'selected_accent';

interface ThemeState {
  selectedTheme: ThemeName;
  selectedAccent: AccentName;
  hydrated: boolean;
  load: () => Promise<void>;
  setTheme: (t: ThemeName) => Promise<void>;
  setAccent: (a: AccentName) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  selectedTheme: 'Dark Cosmic',
  selectedAccent: 'Sacred Gold',
  hydrated: false,
  load: async () => {
    try {
      const [t, a] = await Promise.all([AsyncStorage.getItem(THEME_KEY), AsyncStorage.getItem(ACCENT_KEY)]);
      set({
        selectedTheme: (t as ThemeName | null) ?? 'Dark Cosmic',
        selectedAccent: (a as AccentName | null) ?? 'Sacred Gold',
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
  setTheme: async (t) => {
    set({ selectedTheme: t });
    try { await AsyncStorage.setItem(THEME_KEY, t); } catch {}
  },
  setAccent: async (a) => {
    set({ selectedAccent: a });
    try { await AsyncStorage.setItem(ACCENT_KEY, a); } catch {}
  },
}));

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  isLight: boolean;
}

const ACCENTS: Record<AccentName, string> = {
  'Sacred Gold': '#C9A84C',
  'Cosmic Purple': '#9370DB',
  'Divine Red': '#8B1A1A',
  'Celestial Blue': '#4FC3F7',
  Emerald: '#2D9E6B',
  Saffron: '#FFB347',
};

export function resolveThemeColors(theme: ThemeName, accent: AccentName): ThemeColors {
  const isLight = theme === 'Light Vedic';
  const pick = (mb: string, sd: string, lv: string, dc: string) =>
    theme === 'Midnight Blue' ? mb : theme === 'Sacred Dark' ? sd : isLight ? lv : dc;
  return {
    background: pick('#050A1E', '#120508', '#F8F4EE', '#080D1A'),
    surface: pick('#0A1230', '#1A0810', '#FFFFFF', '#0D1B2A'),
    surfaceVariant: pick('#162040', '#2A1020', '#F0EAE0', '#1A2640'),
    textPrimary: isLight ? '#1A1A2E' : '#F0EAD6',
    textSecondary: isLight ? '#555577' : '#A0A8C0',
    textMuted: isLight ? '#888899' : '#6B7A99',
    accent: ACCENTS[accent] ?? '#C9A84C',
    isLight,
  };
}

/** ThemeProviderScope.of(context) equivalent. */
export function useThemeColors(): ThemeColors {
  const theme = useThemeStore((s) => s.selectedTheme);
  const accent = useThemeStore((s) => s.selectedAccent);
  return resolveThemeColors(theme, accent);
}

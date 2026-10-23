import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ThemeName = 'Dark Cosmic' | 'Light Vedic';
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
      const validTheme: ThemeName = (t === 'Light Vedic' || t === 'Dark Cosmic') ? t : 'Dark Cosmic';
      set({
        selectedTheme: validTheme,
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
  cardBorder: string;
  cardGlass: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
  accent: string;
  goldAccent: string;
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
  return {
    background: isLight ? '#FAF9F6' : '#080D1A',
    surface: isLight ? '#FFFFFF' : '#0D1B2A',
    surfaceVariant: isLight ? '#F5F2EB' : '#1A2640',
    cardBorder: isLight ? 'rgba(201,168,76,0.28)' : 'rgba(201,168,76,0.18)',
    cardGlass: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.06)',
    textPrimary: isLight ? '#1A1A2E' : '#F0EAD6',
    textSecondary: isLight ? '#383852' : '#A0A8C0',
    textMuted: isLight ? '#666680' : '#7E8BA8',
    divider: isLight ? '#EAE5DB' : '#1E2A40',
    accent: ACCENTS[accent] ?? '#C9A84C',
    goldAccent: '#C9A84C',
    isLight,
  };
}

/** ThemeProviderScope.of(context) equivalent. */
export function useThemeColors(): ThemeColors {
  const theme = useThemeStore((s) => s.selectedTheme);
  const accent = useThemeStore((s) => s.selectedAccent);
  return resolveThemeColors(theme, accent);
}
